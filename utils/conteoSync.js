import NetInfo from '@react-native-community/netinfo';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { asegurarSesion } from './sesion';
import { conTiempo } from './promesas';
import * as local from './conteoLocal';

const TIEMPO_ENVIO = 15000;

export async function hayInternet() {
  try {
    const estado = await NetInfo.fetch();
    return !!estado.isConnected && estado.isInternetReachable !== false;
  } catch (error) {
    return false;
  }
}

let ocupado = false;

// Sube lo pendiente de una jornada. Cada lote es un documento con id fijo: reenviarlo no duplica nada.
export async function sincronizar(jornadaId, aforadorId) {
  if (ocupado) return { estado: 'ocupado' };
  ocupado = true;
  try {
    if (!(await hayInternet())) {
      return { estado: 'sin_conexion', pendientes: await local.contarPendientes(jornadaId, aforadorId) };
    }

    await conTiempo(asegurarSesion(), TIEMPO_ENVIO);
    const deviceId = await local.getDeviceId();

    const sesiones = await local.sesionesPendientes(jornadaId, aforadorId);
    for (const s of sesiones) {
      await conTiempo(
        setDoc(doc(db, 'sesionesConteo', `${jornadaId}__${aforadorId}__${s.entrada}__${deviceId}`), {
          jornadaId,
          aforadorId,
          entrada: s.entrada,
          deviceId,
          inicio: s.inicio,
          lat: s.lat,
          lng: s.lng,
          precisionM: s.precision_m,
          ubicacionVerificada: s.ubicacion_verificada === 1,
          actualizadoEn: Timestamp.now(),
        }),
        TIEMPO_ENVIO
      );
      await local.marcarSesionSincronizada(jornadaId, aforadorId, s.entrada, s.inicio);
    }

    const lotes = await local.lotesPendientes(jornadaId, aforadorId);
    for (const bloque of lotes) {
      const filas = await local.leerLote(jornadaId, aforadorId, bloque);
      if (filas.length === 0) continue;
      await conTiempo(
        setDoc(doc(db, 'conteos', `${jornadaId}__${aforadorId}__${deviceId}__${bloque}`), {
          jornadaId,
          aforadorId,
          deviceId,
          bloque,
          registros: filas.map((f) => ({
            q: f.seq, // número de registro
            y: f.trayectoria_id,
            k: f.tipo,
            s: f.salida,
            t: f.ts, // hora del toque (milisegundos)
            x: f.anulado, // 1 = anulado con "Deshacer"
          })),
          actualizadoEn: Timestamp.now(),
        }),
        TIEMPO_ENVIO
      );
      await local.marcarLoteSincronizado(jornadaId, aforadorId, filas);
    }

    return { estado: 'ok', pendientes: await local.contarPendientes(jornadaId, aforadorId) };
  } catch (error) {
    let pendientes = 0;
    try {
      pendientes = await local.contarPendientes(jornadaId, aforadorId);
    } catch (e) {}
    return { estado: 'error', mensaje: error.message, pendientes };
  } finally {
    ocupado = false;
  }
}

// Sube lo pendiente de todas las jornadas de este aforador
export async function sincronizarTodo(aforadorId) {
  const jornadas = await local.jornadasConPendientes(aforadorId);
  let error = null;
  for (const jornadaId of jornadas) {
    const r = await sincronizar(jornadaId, aforadorId);
    if (r.estado === 'error') error = r.mensaje;
    if (r.estado === 'sin_conexion') break;
  }
  return { error };
}