import { collection, addDoc, getDocs, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export async function crearZonaAforo({ nombre, descripcion }) {
  const docRef = await addDoc(collection(db, 'zonasAforo'), {
    nombre,
    descripcion: descripcion || '',
    fechaCreacion: serverTimestamp(),
  });
  return { id: docRef.id };
}

export async function getZonasAforo() {
  const q = query(collection(db, 'zonasAforo'), orderBy('fechaCreacion', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}