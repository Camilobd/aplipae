import { StyleSheet } from 'react-native';
import { listStyles } from '../styles/listPatterns';

const especificos = StyleSheet.create({
  filaInactiva: { opacity: 0.5 },
  estado: { fontSize: 11, marginTop: 2, fontWeight: '600' },
});

export const styles = {
  ...listStyles,
  ...especificos,
  correo: listStyles.descripcion,
  // Aquí la fila es horizontal (datos a la izquierda, acciones a la derecha)
  fila: StyleSheet.flatten([listStyles.fila, listStyles.filaConAcciones]),
};