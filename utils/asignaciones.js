import { collection, addDoc, getDocs, query, where, deleteDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { getTrayectoriaPorId } from './trayectorias';
import { getInterseccionPorId } from './intersecciones';
import { getJornadaPorId, estadoJornada } from './jornadas';

export async function getAsignacionesDeJornada(jornadaId) {
  const q = query(collection(db, 'asignaciones'), where('jornadaId', '==', jornadaId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// Asignaciones de cualquier jornada que usan alguna de estas trayectorias
export async function getAsignacionesDeTrayectorias(trayectoriaIds) {
  if (trayectoriaIds.length === 0) return [];
  const bloques = [];
  for (let i = 0; i < trayectoriaIds.length; i += 10) {
    bloques.push(trayectoriaIds.slice(i, i + 10));
  }
  const resultados = await Promise.all(
    bloques.map(async (bloque) => {
      const q = query(collection(db, 'asignaciones'), where('trayectoriaId', 'in', bloque));
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    })
  );
  return resultados.flat();
}

export async function asignarAforador({ jornadaId, trayectoriaId, aforadorId, tiposAsignados }) {
  const docRef = await addDoc(collection(db, 'asignaciones'), {
    jornadaId,
    trayectoriaId,
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

// El nuevo aforador hereda los tipos de vehículo de la asignación (RN-3)
export async function reasignarAforador(asignacion, nuevoAforadorId) {
  await addDoc(collection(db, 'historialAsignaciones'), {
    asignacionId: asignacion.id,
    jornadaId: asignacion.jornadaId,
    trayectoriaId: asignacion.trayectoriaId,
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
      if (!asig.trayectoriaId) return null; // asignaciones del modelo anterior (por movimiento)

      const jornada = await getJornadaPorId(asig.jornadaId);
      if (!jornada?.fechaInicio?.toDate) return null;
      if (estadoJornada(jornada) === 'cerrada') return null;

      const trayectoria = await getTrayectoriaPorId(asig.trayectoriaId);
      if (!trayectoria) return null;

      const interseccion = await getInterseccionPorId(trayectoria.interseccionId);
      if (!interseccion) return null;

      return { asignacionId: asig.id, asignacion: asig, jornada, trayectoria, interseccion };
    })
  );

  return tareas
    .filter(Boolean)
    .sort((a, b) => a.jornada.fechaInicio.toMillis() - b.jornada.fechaInicio.toMillis());
}