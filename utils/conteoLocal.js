import * as SQLite from 'expo-sqlite';

export const TAM_LOTE = 200; // registros por documento al sincronizar

let dbPromesa = null;
let cola = Promise.resolve();
let deviceIdCache = null;
const ultimoSeq = {}; // "jornadaId|aforadorId" -> último número de registro usado

function abrir() {
  if (!dbPromesa) {
    dbPromesa = (async () => {
      const db = await SQLite.openDatabaseAsync('aplipae_conteos.db');
      await db.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS registros (
          jornada_id TEXT NOT NULL,
          aforador_id TEXT NOT NULL,
          seq INTEGER NOT NULL,
          trayectoria_id TEXT NOT NULL,
          tipo TEXT NOT NULL,
          salida TEXT NOT NULL,
          ts INTEGER NOT NULL,
          anulado INTEGER NOT NULL DEFAULT 0,
          sincronizado INTEGER NOT NULL DEFAULT 0,
          PRIMARY KEY (jornada_id, aforador_id, seq)
        );
        CREATE TABLE IF NOT EXISTS sesiones (
          jornada_id TEXT NOT NULL,
          aforador_id TEXT NOT NULL,
          entrada TEXT NOT NULL,
          inicio INTEGER NOT NULL,
          lat REAL,
          lng REAL,
          precision_m REAL,
          ubicacion_verificada INTEGER NOT NULL DEFAULT 0,
          sincronizado INTEGER NOT NULL DEFAULT 0,
          PRIMARY KEY (jornada_id, aforador_id, entrada)
        );
        CREATE TABLE IF NOT EXISTS ajustes (
          clave TEXT PRIMARY KEY,
          valor TEXT NOT NULL
        );
      `);
      return db;
    })().catch((error) => {
      dbPromesa = null;
      throw error;
    });
  }
  return dbPromesa;
}

// Las operaciones se ejecutan una tras otra y en el mismo orden en que se pidieron
function enCola(tarea) {
  const resultado = cola.then(tarea);
  cola = resultado.catch(() => {});
  return resultado;
}

const claveSeq = (jornadaId, aforadorId) => `${jornadaId}|${aforadorId}`;
const marcas = (lista) => lista.map(() => '?').join(',');

// Identifica este teléfono: junto con el número de registro evita duplicados al sincronizar
export function getDeviceId() {
  return enCola(async () => {
    if (deviceIdCache) return deviceIdCache;
    const db = await abrir();
    const fila = await db.getFirstAsync('SELECT valor FROM ajustes WHERE clave = ?', ['deviceId']);
    if (fila) {
      deviceIdCache = fila.valor;
      return deviceIdCache;
    }
    const nuevo = 'd' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    await db.runAsync('INSERT OR REPLACE INTO ajustes (clave, valor) VALUES (?, ?)', ['deviceId', nuevo]);
    deviceIdCache = nuevo;
    return nuevo;
  });
}

/* ---------- Sesiones (inicio del conteo y ubicación) ---------- */

export function getSesion(jornadaId, aforadorId, entrada) {
  return enCola(async () => {
    const db = await abrir();
    const fila = await db.getFirstAsync(
      'SELECT * FROM sesiones WHERE jornada_id = ? AND aforador_id = ? AND entrada = ?',
      [jornadaId, aforadorId, entrada]
    );
    return fila ?? null;
  });
}

export function guardarSesion({ jornadaId, aforadorId, entrada, lat, lng, precision, verificada }) {
  return enCola(async () => {
    const db = await abrir();
    await db.runAsync(
      `INSERT OR REPLACE INTO sesiones
        (jornada_id, aforador_id, entrada, inicio, lat, lng, precision_m, ubicacion_verificada, sincronizado)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [jornadaId, aforadorId, entrada, Date.now(), lat ?? null, lng ?? null, precision ?? null, verificada ? 1 : 0]
    );
  });
}

/* ---------- Conteo ---------- */

async function leerUltimo(db, jornadaId, aforadorId, trayectoriaIds) {
  const fila = await db.getFirstAsync(
    `SELECT seq, tipo, salida, ts FROM registros
     WHERE jornada_id = ? AND aforador_id = ? AND anulado = 0
       AND trayectoria_id IN (${marcas(trayectoriaIds)})
     ORDER BY seq DESC LIMIT 1`,
    [jornadaId, aforadorId, ...trayectoriaIds]
  );
  return fila ?? null;
}

// Carga lo ya contado de estas trayectorias y deja listo el número del siguiente registro
export function cargarEstado(jornadaId, aforadorId, trayectoriaIds) {
  return enCola(async () => {
    const db = await abrir();
    const k = claveSeq(jornadaId, aforadorId);
    const maximo = await db.getFirstAsync(
      'SELECT COALESCE(MAX(seq), 0) AS m FROM registros WHERE jornada_id = ? AND aforador_id = ?',
      [jornadaId, aforadorId]
    );
    ultimoSeq[k] = Math.max(ultimoSeq[k] ?? 0, maximo?.m ?? 0);

    const filas = await db.getAllAsync(
      `SELECT tipo, salida, COUNT(*) AS n FROM registros
       WHERE jornada_id = ? AND aforador_id = ? AND anulado = 0
         AND trayectoria_id IN (${marcas(trayectoriaIds)})
       GROUP BY tipo, salida`,
      [jornadaId, aforadorId, ...trayectoriaIds]
    );
    const conteos = {};
    filas.forEach((f) => {
      conteos[`${f.tipo}|${f.salida}`] = f.n;
    });

    return { conteos, ultimo: await leerUltimo(db, jornadaId, aforadorId, trayectoriaIds) };
  });
}

// Registra un vehículo. El número se asigna en el acto, así dos toques seguidos nunca lo repiten;
// el guardado en la base ocurre enseguida, en orden.
export function registrar({ jornadaId, aforadorId, trayectoriaId, tipo, salida, ts }) {
  const k = claveSeq(jornadaId, aforadorId);
  if (ultimoSeq[k] === undefined) throw new Error('El conteo aún no se ha cargado.');
  const seq = ultimoSeq[k] + 1;
  ultimoSeq[k] = seq;

  const guardado = enCola(async () => {
    const db = await abrir();
    await db.runAsync(
      `INSERT INTO registros (jornada_id, aforador_id, seq, trayectoria_id, tipo, salida, ts)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [jornadaId, aforadorId, seq, trayectoriaId, tipo, salida, ts]
    );
  });

  return { seq, guardado };
}

// Deshacer: el registro no se borra, se marca como anulado (queda para trazabilidad)
export function anularUltimo({ jornadaId, aforadorId, trayectoriaIds }) {
  return enCola(async () => {
    const db = await abrir();
    const fila = await leerUltimo(db, jornadaId, aforadorId, trayectoriaIds);
    if (!fila) return null;
    await db.runAsync(
      'UPDATE registros SET anulado = 1, sincronizado = 0 WHERE jornada_id = ? AND aforador_id = ? AND seq = ?',
      [jornadaId, aforadorId, fila.seq]
    );
    return { anulado: fila, ultimo: await leerUltimo(db, jornadaId, aforadorId, trayectoriaIds) };
  });
}

/* ---------- Pendientes por enviar ---------- */

export function contarPendientes(jornadaId, aforadorId) {
  return enCola(async () => {
    const db = await abrir();
    const r = await db.getFirstAsync(
      'SELECT COUNT(*) AS n FROM registros WHERE jornada_id = ? AND aforador_id = ? AND sincronizado = 0',
      [jornadaId, aforadorId]
    );
    const s = await db.getFirstAsync(
      'SELECT COUNT(*) AS n FROM sesiones WHERE jornada_id = ? AND aforador_id = ? AND sincronizado = 0',
      [jornadaId, aforadorId]
    );
    return (r?.n ?? 0) + (s?.n ?? 0);
  });
}

export function contarPendientesAforador(aforadorId) {
  return enCola(async () => {
    const db = await abrir();
    const r = await db.getFirstAsync(
      'SELECT COUNT(*) AS n FROM registros WHERE aforador_id = ? AND sincronizado = 0',
      [aforadorId]
    );
    const s = await db.getFirstAsync(
      'SELECT COUNT(*) AS n FROM sesiones WHERE aforador_id = ? AND sincronizado = 0',
      [aforadorId]
    );
    return (r?.n ?? 0) + (s?.n ?? 0);
  });
}

export function jornadasConPendientes(aforadorId) {
  return enCola(async () => {
    const db = await abrir();
    const filas = await db.getAllAsync(
      `SELECT jornada_id FROM registros WHERE aforador_id = ? AND sincronizado = 0
       UNION
       SELECT jornada_id FROM sesiones WHERE aforador_id = ? AND sincronizado = 0`,
      [aforadorId, aforadorId]
    );
    return filas.map((f) => f.jornada_id);
  });
}

export function lotesPendientes(jornadaId, aforadorId) {
  return enCola(async () => {
    const db = await abrir();
    const filas = await db.getAllAsync(
      `SELECT DISTINCT ((seq - 1) / ${TAM_LOTE}) AS bloque FROM registros
       WHERE jornada_id = ? AND aforador_id = ? AND sincronizado = 0
       ORDER BY bloque`,
      [jornadaId, aforadorId]
    );
    return filas.map((f) => f.bloque);
  });
}

// Lee el lote completo (no solo lo pendiente) para que el documento en la nube quede completo
export function leerLote(jornadaId, aforadorId, bloque) {
  return enCola(async () => {
    const db = await abrir();
    return db.getAllAsync(
      `SELECT seq, trayectoria_id, tipo, salida, ts, anulado FROM registros
       WHERE jornada_id = ? AND aforador_id = ? AND seq BETWEEN ? AND ?
       ORDER BY seq`,
      [jornadaId, aforadorId, bloque * TAM_LOTE + 1, (bloque + 1) * TAM_LOTE]
    );
  });
}

// Marca como enviado solo lo que iba en la copia subida: si algo cambió durante el envío, sigue pendiente
export function marcarLoteSincronizado(jornadaId, aforadorId, filas) {
  return enCola(async () => {
    if (filas.length === 0) return;
    const db = await abrir();
    const minSeq = Math.min(...filas.map((f) => f.seq));
    const maxSeq = Math.max(...filas.map((f) => f.seq));
    const anuladas = filas.filter((f) => f.anulado === 1).map((f) => f.seq);

    await db.runAsync(
      `UPDATE registros SET sincronizado = 1
       WHERE jornada_id = ? AND aforador_id = ? AND seq BETWEEN ? AND ? AND anulado = 0`,
      [jornadaId, aforadorId, minSeq, maxSeq]
    );
    if (anuladas.length > 0) {
      await db.runAsync(
        `UPDATE registros SET sincronizado = 1
         WHERE jornada_id = ? AND aforador_id = ? AND seq IN (${marcas(anuladas)})`,
        [jornadaId, aforadorId, ...anuladas]
      );
    }
  });
}

export function sesionesPendientes(jornadaId, aforadorId) {
  return enCola(async () => {
    const db = await abrir();
    return db.getAllAsync(
      'SELECT * FROM sesiones WHERE jornada_id = ? AND aforador_id = ? AND sincronizado = 0',
      [jornadaId, aforadorId]
    );
  });
}

export function marcarSesionSincronizada(jornadaId, aforadorId, entrada, inicio) {
  return enCola(async () => {
    const db = await abrir();
    await db.runAsync(
      `UPDATE sesiones SET sincronizado = 1
       WHERE jornada_id = ? AND aforador_id = ? AND entrada = ? AND inicio = ?`,
      [jornadaId, aforadorId, entrada, inicio]
    );
  });
}