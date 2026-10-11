import { collection, addDoc, getDocs, query, where, deleteDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { getMovimientoPorId } from './movimientos';
import { getAccesoPorId } from './accesos';
import { getInterseccionPorId } from './intersecciones';
import { getJornadaPorId, estadoJornada } from './jornadas';

export async function getAsignacionesDeJornada(jornadaId) {
  const q = query(collection(db, 'asignaciones'), where('jornadaId', '==', jornadaId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function asignarAforador({ jornadaId, movimientoId, aforadorId, tiposAsignados }) {
  const docRef = await addDoc(collection(db, 'asignaciones'), {
    jornadaId,
    movimientoId,
    aforadorId,
    tiposAsignados: tiposAsignados ?? [],
    fechaAsignacion: new Date().toISOString(),
  });
  return { id: docRef.id };
}

export async function actualizarAsignacion(id, datos) {
  await updateDoc(doc(db, 'asignaciones', id), datos);
}

export async function quitarAsignacion(id) {
  await deleteDoc(doc(db, 'asignaciones', id));
}

// El nuevo aforador hereda los tipos de vehículo de la asignación
export async function reasignarAforador(asignacion, nuevoAforadorId) {
  await addDoc(collection(db, 'historialAsignaciones'), {
    asignacionId: asignacion.id,
    jornadaId: asignacion.jornadaId,
    movimientoId: asignacion.movimientoId,
    aforadorAnteriorId: asignacion.aforadorId,
    aforadorNuevoId: nuevoAforadorId,
    tiposAsignados: asignacion.tiposAsignados ?? [],
    fecha: new Date().toISOString(),
  });
  await updateDoc(doc(db, 'asignaciones', asignacion.id), { aforadorId: nuevoAforadorId });
}

export async function getMisTareas(aforadorId) {
  const q = query(collection(db, 'asignaciones'), where('aforadorId', '==', aforadorId));
  const snap = await getDocs(q);
  const asignaciones = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  const tareas = await Promise.all(
    asignaciones.map(async (asig) => {
      const jornada = await getJornadaPorId(asig.jornadaId);
      if (!jornada?.fechaInicio?.toDate) return null; // jornadas del modelo anterior
      if (estadoJornada(jornada) === 'cerrada') return null;

      const movimiento = await getMovimientoPorId(asig.movimientoId);
      if (!movimiento) return null;

      const acceso = await getAccesoPorId(movimiento.accesoId);
      if (!acceso) return null;

      const interseccion = await getInterseccionPorId(acceso.interseccionId);
      if (!interseccion) return null;

      return { asignacionId: asig.id, asignacion: asig, jornada, movimiento, acceso, interseccion };
    })
  );

  return tareas
    .filter(Boolean)
    .sort((a, b) => a.jornada.fechaInicio.toMillis() - b.jornada.fechaInicio.toMillis());
}