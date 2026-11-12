import {
  collection, addDoc, query, where, getDocs, getDoc, serverTimestamp, doc, updateDoc, orderBy,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { enviarPinPorCorreo } from './email';

export function normalizarCorreo(email) {
  return (email || '').trim().toLowerCase();
}

function generarPin() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function getAforadores() {
  const q = query(collection(db, 'aforadores'), orderBy('fechaCreacion', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// El correo identifica al aforador: no puede repetirse (HU-16, CA1). No distingue mayúsculas.
export async function correoEnUso(email, excluirId = null) {
  const objetivo = normalizarCorreo(email);
  const lista = await getAforadores();
  return lista.some((a) => a.id !== excluirId && normalizarCorreo(a.email) === objetivo);
}

export async function crearAforador({ nombre, cedula, email }) {
  const correo = normalizarCorreo(email);
  if (await correoEnUso(correo)) {
    throw new Error('Ya existe un aforador registrado con ese correo.');
  }

  const pin = generarPin();
  const docRef = await addDoc(collection(db, 'aforadores'), {
    nombre,
    cedula,
    email: correo,
    pin,
    activo: true,
    fechaCreacion: serverTimestamp(),
  });

  // Si el correo falla, el aforador queda registrado y el administrador entrega el PIN a mano
  try {
    await enviarPinPorCorreo(correo, nombre, pin);
    return { id: docRef.id, pin, correoEnviado: true };
  } catch (error) {
    return { id: docRef.id, pin, correoEnviado: false, errorCorreo: error.message };
  }
}

// El ingreso exige el correo y el PIN del mismo aforador, y que esté activo
export async function buscarAforadorPorCorreoYPin(email, pin) {
  const correo = normalizarCorreo(email);
  const q = query(
    collection(db, 'aforadores'),
    where('pin', '==', pin),
    where('activo', '==', true)
  );
  const snap = await getDocs(q);
  const encontrado = snap.docs.find((d) => normalizarCorreo(d.data().email) === correo);
  return encontrado ? { id: encontrado.id, ...encontrado.data() } : null;
}

export async function actualizarAforador(id, datos) {
  const cambios = { ...datos };
  if (cambios.email) cambios.email = normalizarCorreo(cambios.email);
  await updateDoc(doc(db, 'aforadores', id), cambios);
}

export async function desactivarAforador(id) {
  await updateDoc(doc(db, 'aforadores', id), { activo: false });
}

export async function reactivarAforador(id) {
  await updateDoc(doc(db, 'aforadores', id), { activo: true });
}

// Envía el PIN actual al correo registrado. Lee los datos frescos de la nube.
// Si el correo falla, devuelve el PIN para entregarlo a mano (HU-25, CA3).
export async function reenviarPin(aforador) {
  const snap = await getDoc(doc(db, 'aforadores', aforador.id));
  if (!snap.exists()) throw new Error('El aforador ya no existe.');
  const { pin, email, nombre } = snap.data();
  try {
    await enviarPinPorCorreo(email, nombre, pin);
    return { pin, correoEnviado: true };
  } catch (error) {
    return { pin, correoEnviado: false, errorCorreo: error.message };
  }
}

// Genera un PIN nuevo: el anterior deja de funcionar en el acto (HU-24 CA3, HU-25 CA4)
export async function generarNuevoPin(aforador) {
  const snap = await getDoc(doc(db, 'aforadores', aforador.id));
  if (!snap.exists()) throw new Error('El aforador ya no existe.');
  const { pin: anterior, email, nombre } = snap.data();

  let pin = generarPin();
  while (pin === anterior) pin = generarPin();

  await updateDoc(doc(db, 'aforadores', aforador.id), { pin, pinActualizadoEn: serverTimestamp() });

  try {
    await enviarPinPorCorreo(email, nombre, pin);
    return { pin, correoEnviado: true };
  } catch (error) {
    return { pin, correoEnviado: false, errorCorreo: error.message };
  }
}