import { collection, addDoc, getDocs, query, where, doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export async function getAccesos(interseccionId) {
  const q = query(collection(db, 'accesos'), where('interseccionId', '==', interseccionId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function crearAcceso({ interseccionId, orientacion, codigo }) {
  const docRef = await addDoc(collection(db, 'accesos'), { interseccionId, orientacion, codigo });
  return { id: docRef.id };
}

export async function eliminarAcceso(id) {
  await deleteDoc(doc(db, 'accesos', id));
}

export async function getAccesoPorId(id) {
  const snap = await getDoc(doc(db, 'accesos', id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}