import { StyleSheet } from 'react-native';
import { colors, spacing, radius, typography } from '../styles/theme';

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  saludo: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 4 },
  subtitulo: { fontSize: 13, color: colors.textMuted, marginBottom: spacing.lg },
  tarjeta: {
    backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1,
    borderColor: colors.border, padding: spacing.md, marginBottom: spacing.md,
  },
  interseccionNombre: { ...typography.label, fontSize: 16, color: colors.primary },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  filaTexto: { fontSize: 13, color: colors.text },
  codigo: {
    backgroundColor: colors.accent + '22', color: colors.accent, fontSize: 11, fontWeight: '700',
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.sm, overflow: 'hidden',
  },
  fecha: { fontSize: 11, color: colors.textMuted, marginTop: 8 },
  vacio: { textAlign: 'center', color: colors.textMuted, marginTop: 60 },
});