import { collection, addDoc, getDocs, query, where, orderBy, serverTimestamp } from 'firebase/firestore';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export async function crearCorredor({ zonaAforoId, nombre, descripcion }) {
  const docRef = await addDoc(collection(db, 'corredores'), {
    zonaAforoId,
    nombre,
    descripcion: descripcion || '',
    fechaCreacion: serverTimestamp(),
  });
  return { id: docRef.id };
}

export async function getCorredores(zonaAforoId) {
  const q = query(
    collection(db, 'corredores'),
    where('zonaAforoId', '==', zonaAforoId),
    orderBy('fechaCreacion', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function actualizarCorredor(id, datos) {
  await updateDoc(doc(db, 'corredores', id), datos);
}

export async function corredorTieneIntersecciones(corredorId) {
  const q = query(collection(db, 'intersecciones'), where('corredorId', '==', corredorId));
  const snap = await getDocs(q);
  return !snap.empty;
}

export async function eliminarCorredor(id) {
  await deleteDoc(doc(db, 'corredores', id));
}