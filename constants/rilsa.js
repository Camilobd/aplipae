// Codificación de accesos adaptada al entorno colombiano (referencia RILSA).
// Los mismos 8 puntos se usan para entradas y para salidas.

export const ACCESOS = [
  { nombre: 'Norte', codigo: 'N' },
  { nombre: 'Noreste', codigo: 'NE' },
  { nombre: 'Este', codigo: 'E' },
  { nombre: 'Sureste', codigo: 'SE' },
  { nombre: 'Sur', codigo: 'S' },
  { nombre: 'Suroeste', codigo: 'SO' },
  { nombre: 'Oeste', codigo: 'O' },
  { nombre: 'Noroeste', codigo: 'NO' },
];

export function nombreAcceso(codigo) {
  return ACCESOS.find((a) => a.codigo === codigo)?.nombre ?? codigo;
}

// Posición del acceso en la lista, para ordenar entradas, salidas y trayectorias
export function ordenAcceso(codigo) {
  const i = ACCESOS.findIndex((a) => a.codigo === codigo);
  return i === -1 ? 99 : i;
}

export function ordenarCodigos(codigos) {
  return [...codigos].sort((a, b) => ordenAcceso(a) - ordenAcceso(b));
}

// Una trayectoria tiene una entrada (origenCodigo) y una o varias salidas (destinosCodigos)
export function salidasDe(t) {
  if (Array.isArray(t?.destinosCodigos)) return ordenarCodigos(t.destinosCodigos);
  return t?.destinoCodigo ? [t.destinoCodigo] : []; // registros de una versión anterior
}

export function ordenarTrayectorias(lista) {
  return [...lista].sort(
    (a, b) =>
      ordenAcceso(a.origenCodigo) - ordenAcceso(b.origenCodigo) || (a.numero ?? 0) - (b.numero ?? 0)
  );
}

export function tituloTrayectoria(t) {
  return `Trayectoria ${t.numero ?? '?'}`;
}

// Ej.: "Sur, Noreste"
export function textoSalidas(t) {
  return salidasDe(t).map(nombreAcceso).join(', ');
}

// Ej.: "N → S, NE"
export function codigoTrayectoria(t) {
  return `${t.origenCodigo} → ${salidasDe(t).join(', ')}`;
}

// Entrar y salir por el mismo acceso es un retorno (U)
export function tieneRetorno(t) {
  return salidasDe(t).includes(t.origenCodigo);
}