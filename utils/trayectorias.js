import {
  collection, addDoc, getDocs, getDoc, query, where, doc, updateDoc, deleteDoc,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';

export async function getTrayectoriasDeInterseccion(interseccionId) {
  const q = query(collection(db, 'trayectorias'), where('interseccionId', '==', interseccionId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getTrayectoriaPorId(id) {
  const snap = await getDoc(doc(db, 'trayectorias', id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// Una trayectoria: una entrada y una o varias salidas. El número es fijo dentro de la intersección.
export async function crearTrayectoria({ interseccionId, origenCodigo, destinosCodigos }) {
  const existentes = await getTrayectoriasDeInterseccion(interseccionId);
  const numero = existentes.reduce((max, t) => Math.max(max, t.numero ?? 0), 0) + 1;
  const docRef = await addDoc(collection(db, 'trayectorias'), {
    interseccionId,
    origenCodigo,
    destinosCodigos,
    numero,
  });
  return { id: docRef.id, numero };
}

export async function actualizarTrayectoria(id, { destinosCodigos }) {
  await updateDoc(doc(db, 'trayectorias', id), { destinosCodigos });
}

export async function eliminarTrayectoria(id) {
  await deleteDoc(doc(db, 'trayectorias', id));
}