import { StyleSheet } from 'react-native';
import { colors, spacing, radius, typography } from '../styles/theme';

export const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 60 },
  centrado: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: colors.background, padding: spacing.lg,
  },
  tarjetaEstado: {
    backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1,
    borderColor: colors.border, padding: spacing.lg, alignItems: 'center', marginBottom: spacing.lg,
  },
  estadoTexto: { ...typography.label, fontSize: 16, marginTop: spacing.sm },
  fechaTexto: { fontSize: 12, color: colors.textMuted, marginTop: 4, textAlign: 'center' },
  aviso: { textAlign: 'center', color: colors.textMuted, marginBottom: spacing.md },
  botonPrincipal: {
    backgroundColor: colors.accent, paddingVertical: spacing.md,
    borderRadius: radius.md, alignItems: 'center', marginBottom: spacing.md,
  },
  botonPrincipalTexto: { color: colors.surface, fontWeight: '700', fontSize: 15 },
  botonSecundario: {
    backgroundColor: colors.primary, paddingVertical: spacing.md,
    borderRadius: radius.md, alignItems: 'center', marginBottom: spacing.md,
  },
  botonSecundarioTexto: { color: colors.surface, fontWeight: '700', fontSize: 15 },
  botonNeutro: {
    borderWidth: 1.5, borderColor: colors.primary, paddingVertical: spacing.md,
    borderRadius: radius.md, alignItems: 'center', marginBottom: spacing.md,
  },
  botonNeutroTexto: { color: colors.primary, fontWeight: '700', fontSize: 15 },
  botonPeligro: {
    borderWidth: 1.5, borderColor: colors.danger, paddingVertical: spacing.md,
    borderRadius: radius.md, alignItems: 'center', marginBottom: spacing.md,
  },
  botonPeligroTexto: { color: colors.danger, fontWeight: '700', fontSize: 15 },
});