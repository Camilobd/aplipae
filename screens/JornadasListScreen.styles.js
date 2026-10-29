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
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  tarjetaFila: { flexDirection: 'row', alignItems: 'center', padding: spacing.md },
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

  pie: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  pieTexto: { flex: 1, fontSize: 12, fontWeight: '600' },
  botonAsignar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
  },
  botonAsignarTexto: { color: colors.surface, fontSize: 12, fontWeight: '700' },

  vacio: { textAlign: 'center', color: colors.textMuted, marginTop: 40 },
  ayudaVacio: { textAlign: 'center', color: colors.textMuted, fontSize: 12, marginTop: 6 },
});