import { StyleSheet } from 'react-native';
import { colors, spacing, radius, typography } from '../styles/theme';

export const styles = StyleSheet.create({
  contenedor: { marginBottom: spacing.md },
  label: { ...typography.label, color: colors.text, marginBottom: spacing.xs },
  fila: { flexDirection: 'row', gap: spacing.sm },
  boton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.sm,
  },
  botonTexto: { color: colors.text, fontSize: 14 },
});