import { StyleSheet } from 'react-native';
import { colors, spacing, radius } from '../styles/theme';
import { listStyles, modalStyles } from '../styles/listPatterns';

const especificos = StyleSheet.create({
  filaTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  fecha: { fontSize: 11, color: colors.textMuted, marginTop: 4 },
  badge: { paddingVertical: 3, paddingHorizontal: 8, borderRadius: radius.pill },
  badgeTexto: { fontSize: 10, fontWeight: '700' },
  botonIr: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingVertical: 8,
    borderRadius: radius.sm,
    marginTop: spacing.sm,
  },
  botonIrTexto: { color: colors.surface, fontWeight: '700', fontSize: 12 },
  gpsBox: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: radius.sm,
    padding: spacing.sm,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  gpsTexto: { color: colors.surface, fontSize: 12, marginBottom: spacing.xs, textAlign: 'center' },
});

export const styles = {
  ...listStyles,
  ...modalStyles,
  ...especificos,
  direccion: listStyles.descripcion,
  // Ajustes sobre los patrones compartidos
  modalCaja: StyleSheet.flatten([modalStyles.modalCaja, { width: '88%', maxHeight: '85%' }]),
  acciones: StyleSheet.flatten([listStyles.acciones, { marginTop: spacing.sm }]),
};