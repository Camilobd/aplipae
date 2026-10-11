export function formatoFecha(d) {
  return d.toLocaleDateString('es-CO', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatoHora(d) {
  return d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
}

export function formatoRango(inicio, fin) {
  const mismoDia = inicio.toDateString() === fin.toDateString();
  return mismoDia
    ? `${formatoFecha(inicio)} · ${formatoHora(inicio)} – ${formatoHora(fin)}`
    : `${formatoFecha(inicio)} ${formatoHora(inicio)} → ${formatoFecha(fin)} ${formatoHora(fin)}`;
}

export function formatoDuracion(minutos) {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  if (h > 0) return m ? `${h} h ${m} min` : `${h} h`;
  return `${m} min`;
}