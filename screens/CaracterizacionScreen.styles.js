import { StyleSheet } from 'react-native';
import { colors, spacing, radius, typography } from '../styles/theme';

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  subtitulo: { fontSize: 13, color: colors.textMuted, marginBottom: spacing.md },

  botonNuevo: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs,
    backgroundColor: colors.accent, paddingVertical: spacing.md,
    borderRadius: radius.md, marginBottom: spacing.lg,
  },
  botonNuevoTexto: { color: colors.surface, fontWeight: '700', fontSize: 15 },

  tarjeta: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1,
    borderColor: colors.border, padding: spacing.md, marginBottom: spacing.sm,
  },
  numeroTexto: {
    fontSize: 11, color: colors.accent, fontWeight: '800',
    textTransform: 'uppercase', marginBottom: 2,
  },
  entradaTitulo: { ...typography.label, fontSize: 15, color: colors.primary },
  salidasEtiqueta: {
    fontSize: 11, color: colors.textMuted, fontWeight: '700',
    textTransform: 'uppercase', marginTop: spacing.xs,
  },
  salidasTexto: { fontSize: 13, color: colors.text, marginTop: 2 },
  acciones: { flexDirection: 'row', gap: spacing.sm },
  botonAccion: {
    width: 34, height: 34, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center',
  },

  vacio: { textAlign: 'center', color: colors.textMuted, marginTop: 40, padding: spacing.lg },
  resumen: { fontSize: 13, color: colors.primary, fontWeight: '600', marginTop: spacing.sm },

  modalFondo: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center',
  },
  modalCaja: {
    width: '92%', maxHeight: '90%', backgroundColor: colors.primary,
    borderRadius: radius.md, padding: spacing.lg,
  },
  modalTitulo: {
    color: colors.surface, fontSize: 16, fontWeight: '700',
    marginBottom: spacing.xs, textAlign: 'center',
  },
  modalSubtitulo: { color: '#dceef5', fontSize: 12, marginBottom: spacing.md, textAlign: 'center' },

  seccionCabecera: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: spacing.sm, marginBottom: 6,
  },
  seccionLabel: { color: '#dceef5', fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  accionLink: {
    color: colors.surface, fontSize: 11, fontWeight: '700', textDecorationLine: 'underline',
  },
  entradaFija: { color: colors.surface, fontSize: 15, fontWeight: '700', marginBottom: spacing.sm },
  chipsFila: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: spacing.sm },
  chip: {
    paddingVertical: 5, paddingHorizontal: 10, borderRadius: radius.pill,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)',
  },
  chipActivo: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipDeshabilitado: { opacity: 0.35 },
  chipTexto: { color: colors.surface, fontSize: 12, fontWeight: '600' },
  ayuda: { color: '#dceef5', fontSize: 11, fontStyle: 'italic', marginBottom: spacing.sm },
  cuenta: { color: colors.surface, fontSize: 12, fontWeight: '700', marginTop: spacing.xs },
});