import { collection, addDoc, getDocs, doc, updateDoc, query } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const CATALOGO_BASE = [
  { codigo: 'L', nombre: 'Automóviles', grupo: 'Liviano' },
  { codigo: 'M', nombre: 'Motos', grupo: 'Liviano' },
  { codigo: 'BIC', nombre: 'Bicicletas', grupo: 'Liviano' },
  { codigo: 'C', nombre: 'Colectivos', grupo: 'Público' },
  { codigo: 'BT', nombre: 'Buseta/Busetón', grupo: 'Público' },
  { codigo: 'B', nombre: 'Buses', grupo: 'Público' },
  { codigo: 'ESP', nombre: 'Vehículos servicio especial (placa blanca)', grupo: 'Público' },
  { codigo: 'INT', nombre: 'Transporte Intermunicipal', grupo: 'Público' },
  { codigo: 'C2P', nombre: 'Camiones de 2 ejes pequeño', grupo: 'Camión' },
  { codigo: 'C2G', nombre: 'Camiones de 2 ejes grande', grupo: 'Camión' },
  { codigo: 'C3', nombre: 'Camiones de 3 ejes', grupo: 'Camión' },
  { codigo: 'C4', nombre: 'Camiones de 4 ejes', grupo: 'Camión' },
  { codigo: 'C5', nombre: 'Camiones de 5 ejes', grupo: 'Camión' },
  { codigo: 'C6', nombre: 'Camiones de 6 ejes', grupo: 'Camión' },
  { codigo: '>C6', nombre: 'Camiones de más de 6 ejes', grupo: 'Camión' },
  { codigo: 'OTR', nombre: 'Otros / no identificado', grupo: 'Otros' }, // RN-4: obligatorio, siempre activo
];

// Crea el catálogo una sola vez, la primera vez que alguien entra a la pantalla
export async function asegurarCatalogoBase() {
  const snap = await getDocs(collection(db, 'tiposVehiculo'));
  if (!snap.empty) return;
  await Promise.all(
    CATALOGO_BASE.map((t) => addDoc(collection(db, 'tiposVehiculo'), { ...t, activo: true }))
  );
}

const ORDEN_GRUPO = { Liviano: 0, Público: 1, Camión: 2, Otros: 3 };

export async function getTiposVehiculo() {
  await asegurarCatalogoBase();
  const snap = await getDocs(query(collection(db, 'tiposVehiculo')));
  const lista = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return lista.sort(
    (a, b) => (ORDEN_GRUPO[a.grupo] ?? 9) - (ORDEN_GRUPO[b.grupo] ?? 9) || a.codigo.localeCompare(b.codigo)
  );
}

export async function toggleActivoTipo(id, activo) {
  await updateDoc(doc(db, 'tiposVehiculo', id), { activo });
}