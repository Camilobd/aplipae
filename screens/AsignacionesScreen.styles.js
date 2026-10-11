import { StyleSheet } from 'react-native';
import { colors, spacing, radius, typography } from '../styles/theme';

export const styles = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 60 },
  subtitulo: { fontSize: 13, color: colors.textMuted, marginBottom: spacing.md },
  vacio: { textAlign: 'center', color: colors.textMuted, marginTop: 30, padding: spacing.lg },

  tarjetaAcceso: {
    backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1,
    borderColor: colors.border, padding: spacing.md, marginBottom: spacing.md,
  },
  tarjetaTitulo: { ...typography.label, color: colors.primary, marginBottom: spacing.sm },
  movFila: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border,
  },
  movInfo: { flex: 1, marginRight: spacing.sm },
  movTexto: { color: colors.text, fontSize: 14, fontWeight: '600' },
  movCodigo: { color: colors.textMuted, fontSize: 11 },
  asigFila: { marginTop: 6 },
  asigNombre: { fontSize: 12, fontWeight: '700', color: colors.primary },
  asigDetalle: { fontSize: 11, color: colors.textMuted },
  advertencia: { fontSize: 11, color: '#B7791F', marginTop: 6, fontWeight: '600' },
  sinAforador: { fontSize: 11, color: colors.textMuted, fontStyle: 'italic', marginTop: 4 },
  botonAsignar: { width: 34, height: 34, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },

  modalFondo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalCaja: { width: '94%', maxHeight: '90%', backgroundColor: colors.primary, borderRadius: radius.md, padding: spacing.lg },
  modalTitulo: { color: colors.surface, fontSize: 16, fontWeight: '700', marginBottom: spacing.xs, textAlign: 'center' },
  modalSubtitulo: { color: '#dceef5', fontSize: 12, marginBottom: spacing.md, textAlign: 'center' },
  botonNuevoAforador: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, marginBottom: spacing.md,
  },
  botonNuevoAforadorTexto: { color: colors.surface, fontWeight: '700', fontSize: 13 },

  aforadorBloque: {
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.15)', paddingVertical: spacing.sm,
  },
  aforadorFila: { flexDirection: 'row', alignItems: 'center' },
  checkbox: {
    width: 22, height: 22, borderRadius: 5, borderWidth: 2, borderColor: colors.surface,
    marginRight: spacing.sm, alignItems: 'center', justifyContent: 'center',
  },
  checkboxMarcado: { backgroundColor: colors.accent, borderColor: colors.accent },
  aforadorNombre: { color: colors.surface, fontSize: 14, flex: 1 },

  panel: {
    backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: radius.sm,
    padding: spacing.sm, marginTop: spacing.sm,
  },
  panelTitulo: {
    color: '#dceef5', fontSize: 11, fontWeight: '700', marginBottom: 4,
    marginTop: 4, textTransform: 'uppercase',
  },
  ayudaPanel: { color: '#dceef5', fontSize: 11, fontStyle: 'italic', marginBottom: 4 },

  grupoCabecera: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: spacing.sm, marginBottom: 2,
  },
  grupoTitulo: { color: '#dceef5', fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  grupoAccion: { color: colors.surface, fontSize: 11, fontWeight: '700', textDecorationLine: 'underline' },
  tipoFila: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 6,
    paddingHorizontal: 6, borderRadius: radius.sm,
  },
  tipoFilaActiva: { backgroundColor: 'rgba(255,255,255,0.12)' },
  tipoCheck: {
    width: 18, height: 18, borderRadius: 4, borderWidth: 2, borderColor: colors.surface,
    marginRight: spacing.sm, alignItems: 'center', justifyContent: 'center',
  },
  tipoCheckActivo: { backgroundColor: colors.accent, borderColor: colors.accent },
  tipoCodigo: { color: colors.surface, fontSize: 11, fontWeight: '800', width: 38 },
  tipoNombre: { color: colors.surface, fontSize: 13, flex: 1 },
  tipoNombreTomado: { opacity: 0.55 },
  tipoDueno: { color: '#F6AD55', fontSize: 11, fontWeight: '700', marginLeft: spacing.xs },

  chipsFila: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    paddingVertical: 4, paddingHorizontal: 10, borderRadius: radius.pill,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)',
  },
  chipActivo: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipTexto: { color: colors.surface, fontSize: 12, fontWeight: '600' },
  ayuda: { color: '#dceef5', fontSize: 11, marginTop: 6, fontStyle: 'italic' },

  avisoModal: {
    backgroundColor: 'rgba(246,173,85,0.25)', borderRadius: radius.sm,
    padding: spacing.sm, marginTop: spacing.sm,
  },
  avisoModalTexto: { color: colors.surface, fontSize: 12 },
  vacioModal: { color: '#dceef5', fontSize: 12, fontStyle: 'italic', marginVertical: spacing.sm },
});