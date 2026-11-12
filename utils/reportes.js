import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { getJornadasDeInterseccion, estadoJornada } from './jornadas';
import { getTrayectoriasDeInterseccion } from './trayectorias';
import { getAsignacionesDeJornada } from './asignaciones';
import { getAforadores } from './aforadores';
import { getTiposVehiculo } from './tiposVehiculo';
import { formatoRango } from './fechas';
import { decimal } from './csv';
import {
  nombreAcceso, ordenarCodigos, ordenarTrayectorias, salidasDe, tituloTrayectoria,
} from '../constants/rilsa';

const dos = (n) => String(n).padStart(2, '0');
export const fechaIso = (ms) => {
  const d = new Date(ms);
  return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;
};
export const horaIso = (ms) => {
  const d = new Date(ms);
  return `${dos(d.getHours())}:${dos(d.getMinutes())}:${dos(d.getSeconds())}`;
};
const fechaHoraIso = (ms) => (ms ? `${fechaIso(ms)} ${horaIso(ms)}` : '');

/* ---------- Lista de intersecciones ---------- */

export async function getInterseccionesParaReporte() {
  const [inter, corr, zonas] = await Promise.all([
    getDocs(collection(db, 'intersecciones')),
    getDocs(collection(db, 'corredores')),
    getDocs(collection(db, 'zonasAforo')),
  ]);
  const corredores = {};
  corr.docs.forEach((d) => { corredores[d.id] = d.data(); });
  const zonasPorId = {};
  zonas.docs.forEach((d) => { zonasPorId[d.id] = d.data(); });

  return inter.docs
    .map((d) => {
      const data = d.data();
      const c = corredores[data.corredorId];
      const z = c ? zonasPorId[c.zonaAforoId] : null;
      return { id: d.id, ...data, corredorNombre: c?.nombre ?? '—', zonaNombre: z?.nombre ?? '—' };
    })
    .sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
}

/* ---------- Carga de datos de una intersección ---------- */

export async function cargarDatosReporte(interseccionId) {
  const [jornadasTodas, trayectorias, aforadores, catalogo] = await Promise.all([
    getJornadasDeInterseccion(interseccionId),
    getTrayectoriasDeInterseccion(interseccionId),
    getAforadores(),
    getTiposVehiculo(),
  ]);
  // Las jornadas del modelo anterior no tienen horario y no se incluyen
  const jornadas = jornadasTodas.filter((j) => j.fechaInicio?.toDate && j.fechaFin?.toDate);

  const porJornada = await Promise.all(
    jornadas.map(async (j) => {
      const [asigs, conteosSnap, sesionesSnap] = await Promise.all([
        getAsignacionesDeJornada(j.id),
        getDocs(query(collection(db, 'conteos'), where('jornadaId', '==', j.id))),
        getDocs(query(collection(db, 'sesionesConteo'), where('jornadaId', '==', j.id))),
      ]);
      return {
        asigs,
        conteosDocs: conteosSnap.docs.map((d) => d.data()),
        sesiones: sesionesSnap.docs.map((d) => d.data()),
      };
    })
  );

  const asignaciones = [];
  const sesiones = [];
  const registros = [];
  const ultimaSync = {}; // "jornadaId|aforadorId" -> milisegundos
  const vistos = new Set();

  porJornada.forEach(({ asigs, conteosDocs, sesiones: ses }) => {
    asigs.forEach((a) => asignaciones.push(a));
    ses.forEach((s) => sesiones.push(s));
    conteosDocs.forEach((doc) => {
      const claveSync = `${doc.jornadaId}|${doc.aforadorId}`;
      const sync = doc.actualizadoEn?.toMillis?.() ?? 0;
      if (sync > (ultimaSync[claveSync] ?? 0)) ultimaSync[claveSync] = sync;

      (doc.registros || []).forEach((r) => {
        // Un registro se identifica por jornada, aforador, teléfono y número: así no se cuenta dos veces
        const clave = `${doc.jornadaId}|${doc.aforadorId}|${doc.deviceId}|${r.q}`;
        if (vistos.has(clave)) return;
        vistos.add(clave);
        registros.push({
          jornadaId: doc.jornadaId,
          aforadorId: doc.aforadorId,
          trayectoriaId: r.y,
          tipo: r.k,
          salida: r.s,
          ts: r.t,
          anulado: r.x === 1,
        });
      });
    });
  });

  return { jornadas, trayectorias, aforadores, catalogo, asignaciones, sesiones, registros, ultimaSync };
}

/* ---------- Filtros ---------- */

const inicioDelDia = (f) => new Date(f.getFullYear(), f.getMonth(), f.getDate(), 0, 0, 0, 0).getTime();
const finDelDia = (f) => new Date(f.getFullYear(), f.getMonth(), f.getDate(), 23, 59, 59, 999).getTime();

// filtros: { jornadaIds: [..]|null, fechaDesde: Date|null, fechaHasta: Date|null, horaDesde: minutos|null, horaHasta: minutos|null }
export function filtrarRegistros(registros, filtros) {
  const { jornadaIds, fechaDesde, fechaHasta, horaDesde, horaHasta } = filtros;
  const ini = fechaDesde ? inicioDelDia(fechaDesde) : null;
  const fin = fechaHasta ? finDelDia(fechaHasta) : null;
  const desde = horaDesde ?? 0;
  const hasta = horaHasta ?? 1440;
  const hayHoras = (horaDesde !== null || horaHasta !== null) && desde !== hasta;

  return registros.filter((r) => {
    if (jornadaIds && !jornadaIds.includes(r.jornadaId)) return false;
    if (ini !== null && r.ts < ini) return false;
    if (fin !== null && r.ts > fin) return false;
    if (hayHoras) {
      const d = new Date(r.ts);
      const m = d.getHours() * 60 + d.getMinutes();
      if (desde < hasta) {
        if (m < desde || m >= hasta) return false;
      } else if (!(m >= desde || m < hasta)) {
        return false; // franja que cruza la medianoche
      }
    }
    return true;
  });
}

/* ---------- Cálculo del reporte ---------- */

export function calcularReporte(datos, filtros) {
  const { jornadas, trayectorias, aforadores, catalogo, asignaciones, registros, sesiones, ultimaSync } = datos;

  const idsSel = filtros.jornadaIds && filtros.jornadaIds.length > 0 ? filtros.jornadaIds : jornadas.map((j) => j.id);
  const jornadasSel = jornadas.filter((j) => idsSel.includes(j.id));

  const trayPorId = {};
  trayectorias.forEach((t) => { trayPorId[t.id] = t; });
  const tipoPorCodigo = {};
  catalogo.forEach((t) => { tipoPorCodigo[t.codigo] = t; });
  const ordenTipos = catalogo.map((t) => t.codigo);
  const idxTipo = (c) => {
    const i = ordenTipos.indexOf(c);
    return i === -1 ? 999 : i;
  };
  const nombreTipo = (c) => tipoPorCodigo[c]?.nombre ?? c;
  const grupoTipo = (c) => tipoPorCodigo[c]?.grupo ?? 'Otros';
  const nombreAf = (id) => aforadores.find((a) => a.id === id)?.nombre ?? 'Aforador eliminado';
  const jornadaPorId = {};
  jornadas.forEach((j) => { jornadaPorId[j.id] = j; });
  const textoJornada = (id) => {
    const j = jornadaPorId[id];
    return j ? formatoRango(j.fechaInicio.toDate(), j.fechaFin.toDate()) : id;
  };

  const deSeleccion = registros.filter((r) => idsSel.includes(r.jornadaId));
  const delFiltro = filtrarRegistros(registros, { ...filtros, jornadaIds: idsSel });
  const validos = delFiltro.filter((r) => !r.anulado).sort((a, b) => a.ts - b.ts);
  const anulados = delFiltro.length - validos.length;
  const total = validos.length;

  // Por tipo
  const cuentaTipo = {};
  validos.forEach((r) => { cuentaTipo[r.tipo] = (cuentaTipo[r.tipo] || 0) + 1; });
  const porTipo = Object.keys(cuentaTipo)
    .sort((a, b) => idxTipo(a) - idxTipo(b))
    .map((codigo) => ({
      codigo,
      nombre: nombreTipo(codigo),
      grupo: grupoTipo(codigo),
      total: cuentaTipo[codigo],
      pct: total ? (cuentaTipo[codigo] * 100) / total : 0,
    }));

  // Por trayectoria: tipo × salida
  const acum = {};
  validos.forEach((r) => {
    if (!acum[r.trayectoriaId]) acum[r.trayectoriaId] = { total: 0, celdas: {} };
    acum[r.trayectoriaId].total += 1;
    const k = `${r.tipo}|${r.salida}`;
    acum[r.trayectoriaId].celdas[k] = (acum[r.trayectoriaId].celdas[k] || 0) + 1;
  });

  const armarTrayectoria = (id, t) => {
    const a = acum[id] || { total: 0, celdas: {} };
    const tiposVistos = new Set();
    const salidasVistas = new Set(t ? salidasDe(t) : []);
    Object.keys(a.celdas).forEach((k) => {
      const [tipo, salida] = k.split('|');
      tiposVistos.add(tipo);
      salidasVistas.add(salida);
    });
    const salidas = ordenarCodigos([...salidasVistas]);
    const tipos = [...tiposVistos].sort((x, y) => idxTipo(x) - idxTipo(y));
    const filas = tipos.map((tipo) => {
      const porSalida = {};
      let subtotal = 0;
      salidas.forEach((s) => {
        const n = a.celdas[`${tipo}|${s}`] || 0;
        porSalida[s] = n;
        subtotal += n;
      });
      return { codigo: tipo, nombre: nombreTipo(tipo), porSalida, total: subtotal };
    });
    const totalesSalida = {};
    salidas.forEach((s) => {
      totalesSalida[s] = filas.reduce((acc, f) => acc + f.porSalida[s], 0);
    });
    return {
      id,
      titulo: t ? tituloTrayectoria(t) : 'Trayectoria eliminada',
      entrada: t?.origenCodigo ?? '?',
      total: a.total,
      salidas,
      filas,
      totalesSalida,
    };
  };

  const porTrayectoria = ordenarTrayectorias(trayectorias).map((t) => armarTrayectoria(t.id, t));
  Object.keys(acum)
    .filter((id) => !trayPorId[id])
    .forEach((id) => porTrayectoria.push(armarTrayectoria(id, null)));

  // Matriz origen → destino
  const celdasM = {};
  const entradasSet = new Set(trayectorias.map((t) => t.origenCodigo));
  const salidasSet = new Set();
  trayectorias.forEach((t) => salidasDe(t).forEach((s) => salidasSet.add(s)));
  validos.forEach((r) => {
    const origen = trayPorId[r.trayectoriaId]?.origenCodigo ?? '?';
    entradasSet.add(origen);
    salidasSet.add(r.salida);
    const k = `${origen}|${r.salida}`;
    celdasM[k] = (celdasM[k] || 0) + 1;
  });
  const entradasM = ordenarCodigos([...entradasSet]);
  const salidasM = ordenarCodigos([...salidasSet]);
  const totalesFila = {};
  const totalesColumna = {};
  entradasM.forEach((o) => {
    totalesFila[o] = salidasM.reduce((acc, s) => acc + (celdasM[`${o}|${s}`] || 0), 0);
  });
  salidasM.forEach((s) => {
    totalesColumna[s] = entradasM.reduce((acc, o) => acc + (celdasM[`${o}|${s}`] || 0), 0);
  });

  // Por jornada
  const cuentaJornada = {};
  validos.forEach((r) => { cuentaJornada[r.jornadaId] = (cuentaJornada[r.jornadaId] || 0) + 1; });
  const porJornada = jornadasSel.map((j) => ({
    id: j.id,
    texto: textoJornada(j.id),
    total: cuentaJornada[j.id] || 0,
  }));

  // Aforadores (con nombre)
  const cuentaAf = {};
  validos.forEach((r) => {
    const k = `${r.jornadaId}|${r.aforadorId}`;
    cuentaAf[k] = (cuentaAf[k] || 0) + 1;
  });
  const anuladosAf = {};
  delFiltro.forEach((r) => {
    if (!r.anulado) return;
    const k = `${r.jornadaId}|${r.aforadorId}`;
    anuladosAf[k] = (anuladosAf[k] || 0) + 1;
  });
  const claves = new Set();
  asignaciones
    .filter((a) => idsSel.includes(a.jornadaId))
    .forEach((a) => claves.add(`${a.jornadaId}|${a.aforadorId}`));
  delFiltro.forEach((r) => claves.add(`${r.jornadaId}|${r.aforadorId}`));
  sesiones
    .filter((s) => idsSel.includes(s.jornadaId))
    .forEach((s) => claves.add(`${s.jornadaId}|${s.aforadorId}`));

  const filasAforadores = [...claves]
    .map((k) => {
      const [jornadaId, aforadorId] = k.split('|');
      const entradas = ordenarCodigos([
        ...new Set(
          asignaciones
            .filter((a) => a.jornadaId === jornadaId && a.aforadorId === aforadorId)
            .map((a) => trayPorId[a.trayectoriaId]?.origenCodigo)
            .filter(Boolean)
        ),
      ]);
      const ses = sesiones.filter((s) => s.jornadaId === jornadaId && s.aforadorId === aforadorId);
      let ubicacion = '—';
      if (ses.length > 0) {
        const verificadas = ses.filter((s) => s.ubicacionVerificada).length;
        ubicacion = verificadas === ses.length ? 'Verificada' : verificadas === 0 ? 'Sin verificar' : 'Parcial';
      }
      return {
        clave: k,
        jornadaId,
        jornadaTexto: textoJornada(jornadaId),
        aforadorId,
        nombre: nombreAf(aforadorId),
        entradas,
        registros: cuentaAf[k] || 0,
        anulados: anuladosAf[k] || 0,
        inicio: ses.length > 0 ? Math.min(...ses.map((s) => s.inicio)) : null,
        ubicacion,
        ultimaSync: ultimaSync[k] || null,
      };
    })
    .sort((a, b) => a.nombre.localeCompare(b.nombre) || a.jornadaTexto.localeCompare(b.jornadaTexto));

  // Control de calidad
  const conDatos = new Set();
  registros.forEach((r) => {
    if (!r.anulado) conDatos.add(`${r.jornadaId}|${r.aforadorId}|${r.trayectoriaId}`);
  });
  const sinDatos = asignaciones
    .filter(
      (a) =>
        idsSel.includes(a.jornadaId) &&
        a.trayectoriaId &&
        !conDatos.has(`${a.jornadaId}|${a.aforadorId}|${a.trayectoriaId}`)
    )
    .map((a) => {
      const t = trayPorId[a.trayectoriaId];
      return `${nombreAf(a.aforadorId)} — ${t ? tituloTrayectoria(t) : 'Trayectoria eliminada'} (${textoJornada(a.jornadaId)})`;
    });

  const TOLERANCIA = 5 * 60000;
  const fueraDeFranja = deSeleccion.filter((r) => {
    if (r.anulado) return false;
    const j = jornadaPorId[r.jornadaId];
    return j && (r.ts < j.fechaInicio.toMillis() - TOLERANCIA || r.ts > j.fechaFin.toMillis() + TOLERANCIA);
  }).length;

  const parcial = jornadasSel.some((j) => estadoJornada(j) !== 'cerrada');

  const tiempos = deSeleccion.map((r) => r.ts);
  const rangoDatos = tiempos.length > 0 ? { desde: Math.min(...tiempos), hasta: Math.max(...tiempos) } : null;

  // Detalle para el CSV
  const detalle = validos.map((r) => {
    const t = trayPorId[r.trayectoriaId];
    return {
      ts: r.ts,
      jornada: textoJornada(r.jornadaId),
      aforador: nombreAf(r.aforadorId),
      trayectoria: t ? `T${t.numero}` : 'eliminada',
      entrada: t?.origenCodigo ?? '?',
      salida: r.salida,
      tipo: r.tipo,
      tipoNombre: nombreTipo(r.tipo),
      grupo: grupoTipo(r.tipo),
    };
  });

  return {
    total,
    anulados,
    aforadoresParticipantes: new Set(validos.map((r) => r.aforadorId)).size,
    jornadasIncluidas: jornadasSel.length,
    porTipo,
    porTrayectoria,
    matriz: { entradas: entradasM, salidas: salidasM, celdas: celdasM, totalesFila, totalesColumna },
    porJornada,
    aforadores: filasAforadores,
    calidad: { sinDatos, fueraDeFranja, parcial },
    rangoDatos,
    detalle,
  };
}

/* ---------- Armado de los CSV (respetan los filtros activos) ---------- */

export function csvDetalle(reporte) {
  const filas = [
    ['Fecha', 'Hora', 'Jornada', 'Aforador', 'Trayectoria', 'Entrada', 'Salida', 'Tipo (código)', 'Tipo', 'Categoría'],
  ];
  reporte.detalle.forEach((d) => {
    filas.push([
      fechaIso(d.ts), horaIso(d.ts), d.jornada, d.aforador, d.trayectoria,
      d.entrada, d.salida, d.tipo, d.tipoNombre, d.grupo,
    ]);
  });
  return filas;
}

export function csvPorTipo(reporte) {
  const filas = [['Tipo (código)', 'Tipo', 'Categoría', 'Total', 'Porcentaje']];
  reporte.porTipo.forEach((t) => {
    filas.push([t.codigo, t.nombre, t.grupo, t.total, decimal(t.pct)]);
  });
  filas.push(['', 'Total', '', reporte.total, reporte.total ? decimal(100) : decimal(0)]);
  return filas;
}

export function csvPorTrayectoria(reporte) {
  const filas = [['Trayectoria', 'Entrada', 'Salida', 'Tipo (código)', 'Tipo', 'Total']];
  reporte.porTrayectoria.forEach((t) => {
    t.filas.forEach((f) => {
      t.salidas.forEach((s) => {
        if (f.porSalida[s] > 0) filas.push([t.titulo, t.entrada, s, f.codigo, f.nombre, f.porSalida[s]]);
      });
    });
  });
  return filas;
}

export function csvMatriz(reporte) {
  const { entradas, salidas, celdas, totalesFila, totalesColumna } = reporte.matriz;
  const etiqueta = (c) => (c === '?' ? '?' : `${nombreAcceso(c)} (${c})`);
  const filas = [['Entrada \\ Salida', ...salidas.map(etiqueta), 'Total']];
  entradas.forEach((o) => {
    filas.push([etiqueta(o), ...salidas.map((s) => celdas[`${o}|${s}`] || 0), totalesFila[o]]);
  });
  filas.push(['Total', ...salidas.map((s) => totalesColumna[s]), reporte.total]);
  return filas;
}

export function csvAforadores(reporte) {
  const filas = [
    ['Jornada', 'Aforador', 'Entradas', 'Registros', 'Anulados', 'Inicio del conteo', 'Ubicación', 'Última sincronización'],
  ];
  reporte.aforadores.forEach((a) => {
    filas.push([
      a.jornadaTexto, a.nombre, a.entradas.join(' '), a.registros, a.anulados,
      fechaHoraIso(a.inicio), a.ubicacion, fechaHoraIso(a.ultimaSync),
    ]);
  });
  return filas;
}