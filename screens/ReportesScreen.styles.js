import { StyleSheet } from 'react-native';
import { colors, spacing, radius, typography } from '../styles/theme';

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  buscador: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.sm, paddingHorizontal: spacing.sm, marginBottom: spacing.md,
  },
  buscadorInput: { flex: 1, paddingVertical: spacing.sm, fontSize: 15, color: colors.text },
  ayuda: { fontSize: 12, color: colors.textMuted, marginBottom: spacing.md },
  tarjeta: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1,
    borderColor: colors.border, padding: spacing.md, marginBottom: spacing.sm,
  },
  nombre: { ...typography.label, color: colors.text },
  contexto: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  direccion: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
  vacio: { textAlign: 'center', color: colors.textMuted, marginTop: 40 },
});