import { StyleSheet } from 'react-native';
import { colors, spacing, radius, typography } from '../styles/theme';

export const styles = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: colors.background },
  centrado: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: colors.background, padding: spacing.lg,
  },
  textoCentro: { color: colors.textMuted, textAlign: 'center', fontSize: 14, marginTop: spacing.sm },

  // Pantalla de inicio
  tituloInicio: { ...typography.label, fontSize: 20, color: colors.primary, marginTop: spacing.md, textAlign: 'center' },
  textoInicio: { fontSize: 14, color: colors.text, marginTop: 4, textAlign: 'center' },
  trayItem: { fontSize: 13, color: colors.text, marginTop: 6, textAlign: 'center' },
  notaInicio: {
    fontSize: 12, color: colors.textMuted, textAlign: 'center',
    marginTop: spacing.lg, marginBottom: spacing.lg,
  },
  botonIniciar: {
    backgroundColor: colors.accent, paddingVertical: spacing.md, paddingHorizontal: spacing.xl,
    borderRadius: radius.md,
  },
  botonIniciarTexto: { color: colors.surface, fontWeight: '800', fontSize: 16 },

  // Cabecera del conteo
  cabecera: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
  },
  titulo: { ...typography.label, fontSize: 15, color: colors.primary },
  subtituloCab: { fontSize: 12, color: colors.text, marginTop: 1 },
  tiempo: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
  badgeSync: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingVertical: 5, paddingHorizontal: 10, borderRadius: radius.pill,
  },
  badgeSyncTexto: { fontSize: 11, fontWeight: '700' },

  resumen: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
  },
  total: { fontSize: 34, fontWeight: '800', color: colors.primary },
  totalEtiqueta: { fontSize: 11, color: colors.textMuted },
  salidasLinea: { flex: 1, fontSize: 12, color: colors.text },
  avisoUbicacion: {
    fontSize: 11, color: '#8A5A12', backgroundColor: '#B7791F22', fontWeight: '600',
    paddingVertical: 4, paddingHorizontal: spacing.md,
  },
  bannerFin: {
    backgroundColor: colors.textMuted, paddingVertical: spacing.sm, paddingHorizontal: spacing.md,
  },
  bannerFinTexto: { color: colors.surface, fontSize: 12, fontWeight: '700', textAlign: 'center' },

  // Botones de tipo
  scroll: { flex: 1 },
  scrollContenido: { padding: spacing.md, paddingBottom: spacing.xl },
  grupoTitulo: {
    fontSize: 11, fontWeight: '700', color: colors.textMuted,
    textTransform: 'uppercase', marginTop: spacing.sm, marginBottom: 6,
  },
  grilla: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  botonTipo: {
    width: '48%', minHeight: 92, backgroundColor: colors.surface,
    borderRadius: radius.md, borderWidth: 2, borderColor: colors.primary,
    padding: spacing.sm, justifyContent: 'space-between',
  },
  botonTipoBloqueado: { opacity: 0.4 },
  tipoCodigo: { fontSize: 11, fontWeight: '800', color: colors.accent },
  tipoNombre: { fontSize: 14, fontWeight: '700', color: colors.text },
  tipoConteo: { fontSize: 24, fontWeight: '800', color: colors.primary, alignSelf: 'flex-end' },

  // Pie: deshacer
  pie: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border, padding: spacing.md,
  },
  botonDeshacer: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 2, borderColor: colors.danger, borderRadius: radius.md,
    paddingVertical: spacing.sm, paddingHorizontal: spacing.md,
  },
  botonDeshacerDeshabilitado: { opacity: 0.35 },
  botonDeshacerTexto: { color: colors.danger, fontWeight: '800', fontSize: 14 },
  ultimoTexto: { flex: 1, fontSize: 12, color: colors.textMuted },

  // Selector de salida
  capa: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'flex-end' },
  fondoCapa: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.45)' },
  panelSalida: {
    maxHeight: '80%', backgroundColor: colors.surface,
    borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: spacing.lg,
  },
  panelTitulo: { ...typography.label, fontSize: 16, color: colors.primary, textAlign: 'center' },
  panelSub: { fontSize: 13, color: colors.textMuted, textAlign: 'center', marginBottom: spacing.md },
  botonSalida: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    minHeight: 64, backgroundColor: colors.accent, borderRadius: radius.md,
    paddingHorizontal: spacing.md, marginBottom: spacing.sm,
  },
  salidaNombre: { color: colors.surface, fontSize: 17, fontWeight: '800', flex: 1 },
  salidaConteo: { color: colors.surface, fontSize: 20, fontWeight: '800' },
  cancelar: {
    textAlign: 'center', color: colors.textMuted, fontWeight: '700',
    paddingVertical: spacing.md, fontSize: 14,
  },
});