import { collection, doc, getDocs, query, setDoc, where, Timestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { formatoRango } from './fechas';
import { nombreAcceso, salidasDe, textoSalidas, tituloTrayectoria } from '../constants/rilsa';

const escapar = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

// Resume lo que el aforador recibió. Si cambia el horario, las trayectorias, las salidas
// o los tipos, la huella cambia y la app sabe que hay que avisarle de nuevo.
export function huellaDe(jornada, tareas) {
  const ini = jornada.fechaInicio?.toMillis?.() ?? 0;
  const fin = jornada.fechaFin?.toMillis?.() ?? 0;
  const partes = tareas
    .map(
      (t) =>
        `${t.trayectoria.id}:${t.trayectoria.origenCodigo}>${salidasDe(t.trayectoria).join('.')}:${[...t.tipos]
          .sort()
          .join(',')}`
    )
    .sort();
  return [ini, fin, ...partes].join('|');
}

export async function getNotificacionesDeJornada(jornadaId) {
  const q = query(collection(db, 'notificaciones'), where('jornadaId', '==', jornadaId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function registrarNotificacion(jornadaId, aforadorId, huella) {
  await setDoc(doc(db, 'notificaciones', `${jornadaId}__${aforadorId}`), {
    jornadaId,
    aforadorId,
    huella,
    enviadoEn: Timestamp.now(),
  });
}

export function textoRango(jornada) {
  return formatoRango(jornada.fechaInicio.toDate(), jornada.fechaFin.toDate());
}

export function armarDetalleHtml({ interseccion, jornada, tareas, catalogo }) {
  const nombreTipo = (codigo) => {
    const t = catalogo.find((x) => x.codigo === codigo);
    return t ? `${t.nombre} (${t.codigo})` : codigo;
  };

  const mapa =
    interseccion.latitude != null && interseccion.longitude != null
      ? `<br><b>Ubicación:</b> <a href="https://www.google.com/maps?q=${interseccion.latitude},${interseccion.longitude}">Ver en el mapa</a>`
      : '';

  const items = tareas
    .map(
      ({ trayectoria, tipos }) =>
        `<li style="margin-bottom:10px"><b>${escapar(tituloTrayectoria(trayectoria))}:</b> entra por ${escapar(
          nombreAcceso(trayectoria.origenCodigo)
        )} y sale por ${escapar(textoSalidas(trayectoria))}<br><i>Vehículos que cuentas:</i> ${escapar(
          tipos.length ? tipos.map(nombreTipo).join(', ') : 'sin tipos definidos'
        )}</li>`
    )
    .join('');

  return (
    `<p><b>Intersección:</b> ${escapar(interseccion.nombre)}` +
    `<br><b>Dirección:</b> ${escapar(interseccion.direccion)}` +
    mapa +
    `<br><b>Fecha y hora:</b> ${escapar(textoRango(jornada))}</p>` +
    `<p><b>Tus trayectorias:</b></p><ul>${items}</ul>`
  );
}