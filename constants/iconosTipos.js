// Un ícono por tipo de vehículo (MaterialCommunityIcons). Para cambiar uno, edita su línea.
export const ICONOS_TIPO = {
  L: 'car',
  M: 'motorbike',
  BIC: 'bike',
  C: 'van-passenger',
  BT: 'bus-side',
  B: 'bus',
  ESP: 'bus-school',
  INT: 'bus-articulated-front',
  C2P: 'truck-delivery',
  C2G: 'truck',
  C3: 'truck-flatbed',
  C4: 'dump-truck',
  C5: 'truck-cargo-container',
  C6: 'truck-trailer',
  '>C6': 'truck-trailer',
  OTR: 'help-circle-outline',
};

export const COLORES_GRUPO = {
  Liviano: '#2F80ED',
  'Público': '#2E8B57',
  'Camión': '#B7791F',
  Otros: '#6B7A80',
};

export function iconoDeTipo(codigo) {
  return ICONOS_TIPO[codigo] ?? 'help-circle-outline';
}

export function colorDeGrupo(grupo) {
  return COLORES_GRUPO[grupo] ?? '#1F5F7A';
}