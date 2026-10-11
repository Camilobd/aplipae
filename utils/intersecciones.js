import { collection, addDoc, getDocs, query, where, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';

// Distancia aproximada en metros entre 2 coordenadas (fórmula haversine)
function distanciaMetros(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const rad = (x) => (x * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLon = rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function getIntersecciones(corredorId) {
  const q = query(
    collection(db, 'intersecciones'),
    where('corredorId', '==', corredorId),
    orderBy('fechaCreacion', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function buscarInterseccionCercana(corredorId, latitude, longitude, radioMetros = 50) {
  if (latitude == null || longitude == null) return null;
  const existentes = await getIntersecciones(corredorId);
  return existentes.find(
    (i) =>
      i.latitude != null &&
      i.longitude != null &&
      distanciaMetros(latitude, longitude, i.latitude, i.longitude) <= radioMetros
  ) || null;
}

export async function nombreDuplicado(corredorId, nombre) {
  const existentes = await getIntersecciones(corredorId);
  return existentes.some((i) => i.nombre.trim().toLowerCase() === nombre.trim().toLowerCase());
}

export async function crearInterseccion({ corredorId, nombre, direccion, latitude, longitude }) {
  const docRef = await addDoc(collection(db, 'intersecciones'), {
    corredorId,
    nombre,
    direccion,
    latitude: latitude ?? null,
    longitude: longitude ?? null,
    caracterizada: false, // se marcará true cuando tenga accesos/movimientos/tipología (HU-02b/HU-04)
    fechaCreacion: serverTimestamp(),
  });
  return { id: docRef.id };
}

export async function actualizarInterseccion(id, datos) {
  const { doc, updateDoc } = await import('firebase/firestore');
  await updateDoc(doc(db, 'intersecciones', id), datos);
}

export async function eliminarInterseccion(id) {
  const { doc, deleteDoc } = await import('firebase/firestore');
  await deleteDoc(doc(db, 'intersecciones', id));
}

export async function getInterseccionPorId(id) {
  const { getDoc, doc } = await import('firebase/firestore');
  const snap = await getDoc(doc(db, 'intersecciones', id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}