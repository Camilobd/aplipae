import { StyleSheet } from 'react-native';
import { colors, spacing, radius, typography } from '../styles/theme';

export const styles = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: colors.background },
  centrado: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: colors.background, padding: spacing.lg,
  },
  textoCentro: { color: colors.textMuted, textAlign: 'center', fontSize: 14, marginTop: spacing.sm },
  contenido: { padding: spacing.lg, paddingBottom: spacing.xl },

  titulo: { ...typography.label, fontSize: 18, color: colors.primary },
  sub: { fontSize: 12, color: colors.textMuted, marginTop: 2, marginBottom: spacing.md },

  tarjeta: {
    backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1,
    borderColor: colors.border, padding: spacing.md, marginBottom: spacing.md,
  },
  tarjetaTitulo: { ...typography.label, fontSize: 15, color: colors.primary },
  seccionTitulo: { ...typography.label, fontSize: 15, color: colors.primary, marginBottom: spacing.sm },
  subtitulo: { fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 4 },
  leyenda: { fontSize: 11, color: colors.textMuted, marginTop: 6, marginBottom: spacing.sm },

  // Filtros
  filtrosCab: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  link: { color: colors.accent, fontWeight: '700', fontSize: 13 },
  etiqueta: { fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', marginBottom: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: spacing.md },
  chip: {
    paddingVertical: 5, paddingHorizontal: 10, borderRadius: radius.pill,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
  },
  chipActivo: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipTexto: { fontSize: 12, color: colors.text, fontWeight: '600' },
  chipTextoActivo: { color: colors.surface },
  fila2: { flexDirection: 'row', gap: spacing.sm },
  columna: { flex: 1 },
  ayuda: { fontSize: 11, color: colors.textMuted, marginTop: 2 },

  // Avisos
  aviso: {
    flexDirection: 'row', gap: 8, alignItems: 'flex-start',
    backgroundColor: '#B7791F22', borderRadius: radius.md, padding: spacing.sm, marginBottom: spacing.sm,
  },
  avisoTexto: { flex: 1, fontSize: 12, color: '#8A5A12', fontWeight: '600' },

  // Resumen
  resumenFila: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  resumenCard: {
    flex: 1, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1,
    borderColor: colors.border, padding: spacing.sm, alignItems: 'center',
  },
  resumenNum: { fontSize: 22, fontWeight: '800', color: colors.primary },
  resumenEtiqueta: { fontSize: 10, color: colors.textMuted, marginTop: 2, textAlign: 'center' },

  // Por tipo
  filaTipo: { marginBottom: spacing.sm },
  filaTipoCab: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tipoNombre: { flex: 1, fontSize: 13, color: colors.text },
  tipoNumero: { fontSize: 14, fontWeight: '800', color: colors.primary, minWidth: 44, textAlign: 'right' },
  tipoPct: { fontSize: 12, color: colors.textMuted, width: 54, textAlign: 'right' },
  barraFondo: { height: 6, backgroundColor: colors.border, borderRadius: 3, marginTop: 4, overflow: 'hidden' },
  barra: { height: 6, borderRadius: 3 },

  vacio: { textAlign: 'center', color: colors.textMuted, paddingVertical: spacing.lg },
  obs: { fontSize: 12, color: colors.text, marginTop: 4 },
  obsOk: { fontSize: 12, color: '#2E8B57', fontWeight: '600' },

  // Exportar
  pie: { backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border, padding: spacing.md },
  botonExportar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.accent, borderRadius: radius.md, paddingVertical: spacing.md,
  },
  botonExportarTexto: { color: colors.surface, fontWeight: '800', fontSize: 15 },
  modalFondo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalCaja: {
    backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: spacing.lg,
  },
  modalTitulo: { ...typography.label, fontSize: 16, color: colors.primary, textAlign: 'center' },
  modalSub: { fontSize: 12, color: colors.textMuted, textAlign: 'center', marginBottom: spacing.sm },
  opcion: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingVertical: spacing.sm + 2, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  opcionTitulo: { fontSize: 14, fontWeight: '700', color: colors.text },
  opcionDesc: { fontSize: 12, color: colors.textMuted },
  cerrar: { textAlign: 'center', color: colors.textMuted, fontWeight: '700', paddingVertical: spacing.md },
});