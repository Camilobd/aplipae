import { collection, addDoc, query, where, getDocs, serverTimestamp, doc, updateDoc, orderBy } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { enviarPinPorCorreo } from './email';

function generarPin() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function crearAforador({ nombre, cedula, email }) {
  const pin = generarPin();

  const docRef = await addDoc(collection(db, 'aforadores'), {
    nombre,
    cedula,
    email,
    pin,
    activo: true,
    fechaCreacion: serverTimestamp(),
  });

  await enviarPinPorCorreo(email, nombre, pin);

  return { id: docRef.id, pin };
}

export async function buscarAforadorPorPin(pin) {
  const q = query(
    collection(db, 'aforadores'),
    where('pin', '==', pin),
    where('activo', '==', true)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() };
}

export async function getAforadores() {
  const q = query(collection(db, 'aforadores'), orderBy('fechaCreacion', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function actualizarAforador(id, datos) {
  await updateDoc(doc(db, 'aforadores', id), datos);
}

export async function desactivarAforador(id) {
  await updateDoc(doc(db, 'aforadores', id), { activo: false });
}

export async function reactivarAforador(id) {
  await updateDoc(doc(db, 'aforadores', id), { activo: true });
}