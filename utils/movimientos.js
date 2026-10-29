import {
  collection, addDoc, getDocs, getDoc, query, where, updateDoc, doc, deleteField,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';

// Una maniobra puede salir por varios accesos: cada par movimiento → destino es una trayectoria.
// Compatibilidad: los movimientos guardados antes tenían un solo "destinoCodigo".
export function destinosDe(mov) {
  if (Array.isArray(mov?.destinosCodigos)) return mov.destinosCodigos;
  return mov?.destinoCodigo ? [mov.destinoCodigo] : [];
}

export async function getMovimientosDeAccesos(accesoIds) {
  if (accesoIds.length === 0) return [];
  // Firestore permite máximo 10 valores por consulta "in"
  const bloques = [];
  for (let i = 0; i < accesoIds.length; i += 10) {
    bloques.push(accesoIds.slice(i, i + 10));
  }
  const resultados = await Promise.all(
    bloques.map(async (bloque) => {
      const q = query(collection(db, 'movimientos'), where('accesoId', 'in', bloque));
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    })
  );
  return resultados.flat();
}

export async function crearMovimiento({ accesoId, tipo, nombre, codigo, activo, destinosCodigos }) {
  const docRef = await addDoc(collection(db, 'movimientos'), {
    accesoId,
    tipo,
    nombre,
    codigo,
    activo,
    destinosCodigos: destinosCodigos ?? [], // códigos de los accesos por los que sale
  });
  return { id: docRef.id };
}

export async function actualizarMovimiento(id, datos) {
  const cambios = { ...datos };
  if (datos.destinosCodigos) cambios.destinoCodigo = deleteField(); // limpia el campo del modelo anterior
  await updateDoc(doc(db, 'movimientos', id), cambios);
}

export async function getMovimientoPorId(id) {
  const snap = await getDoc(doc(db, 'movimientos', id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}