import { StyleSheet } from 'react-native';
import { colors, spacing, radius, typography } from '../styles/theme';

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  subtitulo: { fontSize: 13, color: colors.textMuted, marginBottom: spacing.md },
  chipsFila: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  chip: {
    paddingVertical: spacing.xs, paddingHorizontal: spacing.md,
    borderRadius: radius.pill, borderWidth: 1.5, borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActivo: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipTexto: { fontWeight: '600', color: colors.text },
  chipTextoActivo: { color: colors.surface },
  tarjetaAcceso: {
    backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1,
    borderColor: colors.border, padding: spacing.md, marginBottom: spacing.md,
  },
  tarjetaTitulo: { ...typography.label, color: colors.primary, marginBottom: spacing.sm },
  movFila: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  movTexto: { color: colors.text, fontSize: 14 },
  movCodigo: { color: colors.textMuted, fontSize: 12 },
  botonGuardar: { marginTop: spacing.lg },
});