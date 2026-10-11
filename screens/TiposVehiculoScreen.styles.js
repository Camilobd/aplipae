import { StyleSheet } from 'react-native';
import { colors, spacing, radius, typography } from '../styles/theme';

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  grupoTitulo: { ...typography.label, fontSize: 13, color: colors.primary, marginTop: spacing.md, marginBottom: spacing.xs, textTransform: 'uppercase' },
  fila: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.surface, borderRadius: radius.sm, borderWidth: 1,
    borderColor: colors.border, padding: spacing.sm, marginBottom: 6,
  },
  filaInactiva: { opacity: 0.5 },
  codigo: {
    backgroundColor: colors.primary + '22', color: colors.primary, fontSize: 11, fontWeight: '700',
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.sm, marginRight: spacing.sm, overflow: 'hidden',
  },
  nombre: { flex: 1, fontSize: 13, color: colors.text },
  fijo: { fontSize: 11, color: colors.textMuted, fontStyle: 'italic' },
});