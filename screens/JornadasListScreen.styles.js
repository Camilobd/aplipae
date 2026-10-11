import { StyleSheet } from 'react-native';
import { colors, spacing, radius, typography } from '../styles/theme';

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  botonNuevo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.accent,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.lg,
  },
  botonNuevoTexto: { color: colors.surface, fontWeight: '700', fontSize: 15 },
  tarjeta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  barraEstado: { width: 4, alignSelf: 'stretch', borderRadius: 2, marginRight: spacing.md },
  info: { flex: 1 },
  fecha: { ...typography.label, fontSize: 15, color: colors.text },
  horas: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
  },
  badgeTexto: { fontSize: 10, fontWeight: '700' },
  vacio: { textAlign: 'center', color: colors.textMuted, marginTop: 40 },
});