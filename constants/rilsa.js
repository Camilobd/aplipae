// Codificación RILSA adaptada al entorno colombiano — confirmada por el equipo del proyecto.

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

export const TIPOS_MOVIMIENTO = [
  { tipo: 'frente', nombre: 'Frente', codigoMov: 'F' },
  { tipo: 'izquierda', nombre: 'Izquierda', codigoMov: 'I' },
  { tipo: 'derecha', nombre: 'Derecha', codigoMov: 'D' },
  { tipo: 'retorno', nombre: 'U', codigoMov: 'U' },
];

export function codigoMovimiento(codigoAcceso, codigoMov) {
  return `${codigoAcceso}${codigoMov}`;
}