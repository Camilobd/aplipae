import { StyleSheet } from 'react-native';
import { colors, spacing, radius, typography } from '../styles/theme';

export const styles = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: colors.background },
  centrado: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  cabecera: { padding: spacing.lg, paddingBottom: spacing.sm },
  titulo: { ...typography.label, fontSize: 16, color: colors.primary },
  rango: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  ayuda: { fontSize: 12, color: colors.textMuted, marginTop: spacing.sm },
  lista: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },

  tarjeta: {
    flexDirection: 'row', alignItems: 'flex-start', backgroundColor: colors.surface,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    padding: spacing.md, marginBottom: spacing.sm,
  },
  tarjetaInactiva: { opacity: 0.5 },
  checkbox: {
    width: 22, height: 22, borderRadius: 5, borderWidth: 2, borderColor: colors.primary,
    marginRight: spacing.md, marginTop: 2, alignItems: 'center', justifyContent: 'center',
  },
  checkboxMarcado: { backgroundColor: colors.primary },
  info: { flex: 1 },
  nombre: { ...typography.label, color: colors.text },
  correo: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  detalle: { fontSize: 12, color: colors.text, marginTop: 4 },
  badge: { alignSelf: 'flex-start', paddingVertical: 3, paddingHorizontal: 8, borderRadius: radius.pill, marginTop: 6 },
  badgeTexto: { fontSize: 10, fontWeight: '700' },

  pie: { padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface },
  progreso: { fontSize: 12, color: colors.primary, fontWeight: '600', textAlign: 'center', marginBottom: spacing.sm },
  botonEnviar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs,
    backgroundColor: colors.accent, paddingVertical: spacing.md, borderRadius: radius.md,
  },
  botonEnviarDeshabilitado: { opacity: 0.45 },
  botonEnviarTexto: { color: colors.surface, fontWeight: '700', fontSize: 15 },
  vacio: { textAlign: 'center', color: colors.textMuted, marginTop: 40, padding: spacing.lg },
});