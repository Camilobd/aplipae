import { StyleSheet } from 'react-native';
import { colors, spacing, radius, typography } from './theme';

// Patrón "lista": Aforadores, Zonas de aforo, Corredores, Intersecciones
export const listStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },

  // Buscador
  buscador: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  buscadorInput: { flex: 1, paddingVertical: spacing.sm, fontSize: 15, color: colors.text },

  // Botón "Nuevo ..."
  botonNuevo: {
    flexDirection: 'row',
    backgroundColor: colors.accent,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  botonNuevoTexto: { color: colors.surface, fontWeight: '700' },

  // Tarjeta / fila
  fila: {
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  filaConAcciones: { flexDirection: 'row', alignItems: 'center' },
  nombre: { ...typography.label, color: colors.text },
  descripcion: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  vacio: { textAlign: 'center', color: colors.textMuted, marginTop: 40 },

  // Botones editar / borrar
  acciones: { flexDirection: 'row', gap: spacing.sm },
  botonAccion: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// Patrón "modal de crear/editar"
export const modalStyles = StyleSheet.create({
  modalFondo: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCaja: {
    width: '85%',
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.lg,
  },
  modalTitulo: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.accent,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    fontSize: 14,
  },
});