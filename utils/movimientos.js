import { collection, addDoc, getDocs, query, where, updateDoc, deleteDoc, writeBatch, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';



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

export async function crearMovimiento({ accesoId, tipo, nombre, codigo, activo }) {
  const docRef = await addDoc(collection(db, 'movimientos'), { accesoId, tipo, nombre, codigo, activo });
  return { id: docRef.id };
}

export async function actualizarMovimiento(id, datos) {
  await updateDoc(doc(db, 'movimientos', id), datos);
}


export async function getMovimientoPorId(id) {
  const snap = await getDoc(doc(db, 'movimientos', id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

