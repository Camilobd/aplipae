import {
  collection, addDoc, getDocs, getDoc, query, where, doc, updateDoc, deleteDoc, Timestamp,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';

// Estado calculado a partir del horario. Las jornadas del modelo anterior (campo "estado") se respetan.
export function estadoJornada(j, ahora = new Date()) {
  if (!j) return null;
  if (j.fechaInicio?.toDate && j.fechaFin?.toDate) {
    if (ahora < j.fechaInicio.toDate()) return 'programada';
    if (ahora < j.fechaFin.toDate()) return 'activa';
    return 'cerrada';
  }
  return j.estado === 'activa' ? 'activa' : 'cerrada';
}

export async function getJornadaPorId(id) {
  const snap = await getDoc(doc(db, 'jornadas', id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function getJornadasDeInterseccion(interseccionId) {
  const q = query(collection(db, 'jornadas'), where('interseccionId', '==', interseccionId));
  const snap = await getDocs(q);
  const lista = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const millis = (j) => j.fechaInicio?.toMillis?.() ?? 0;
  return lista.sort((a, b) => millis(b) - millis(a));
}

async function validarSolape(interseccionId, inicio, fin, excluirId) {
  const jornadas = await getJornadasDeInterseccion(interseccionId);
  const choque = jornadas.find((j) => {
    if (j.id === excluirId || !j.fechaInicio?.toDate || !j.fechaFin?.toDate) return false;
    return inicio < j.fechaFin.toDate() && fin > j.fechaInicio.toDate();
  });
  if (choque) throw new Error('El horario se cruza con otra jornada de esta intersección.');
}

export async function planificarJornada({ interseccionId, inicio, fin, tiposSeleccionados }) {
  if (fin <= inicio) throw new Error('La hora de fin debe ser posterior a la de inicio.');
  await validarSolape(interseccionId, inicio, fin, null);
  const docRef = await addDoc(collection(db, 'jornadas'), {
    interseccionId,
    fechaInicio: Timestamp.fromDate(inicio),
    fechaFin: Timestamp.fromDate(fin),
    tiposSeleccionados: tiposSeleccionados ?? null, // null = todos los tipos activos del catálogo
    fechaCreacion: Timestamp.now(),
  });
  return { id: docRef.id };
}

export async function actualizarHorarioJornada(jornada, inicio, fin) {
  if (fin <= inicio) throw new Error('La hora de fin debe ser posterior a la de inicio.');
  await validarSolape(jornada.interseccionId, inicio, fin, jornada.id);
  await updateDoc(doc(db, 'jornadas', jornada.id), {
    fechaInicio: Timestamp.fromDate(inicio),
    fechaFin: Timestamp.fromDate(fin),
  });
}

export async function abrirJornadaAhora(jornada) {
  await actualizarHorarioJornada(jornada, new Date(), jornada.fechaFin.toDate());
}

export async function cerrarJornadaAhora(jornada) {
  await updateDoc(doc(db, 'jornadas', jornada.id), { fechaFin: Timestamp.fromDate(new Date()) });
}

export async function extenderJornada(jornada, minutos) {
  const nuevoFin = new Date(jornada.fechaFin.toDate().getTime() + minutos * 60000);
  await actualizarHorarioJornada(jornada, jornada.fechaInicio.toDate(), nuevoFin);
}

export async function actualizarTiposJornada(jornadaId, codigosTipos) {
  await updateDoc(doc(db, 'jornadas', jornadaId), { tiposSeleccionados: codigosTipos });
}

export async function eliminarJornada(id) {
  await deleteDoc(doc(db, 'jornadas', id));
}