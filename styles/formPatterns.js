import { StyleSheet } from 'react-native';
import { colors, spacing, radius, typography } from './theme';

// Patrón "formulario a pantalla completa"
export const formStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  label: {
    ...typography.label,
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.sm,
    fontSize: 16,
    color: colors.text,
  },
  botonWrapper: { marginTop: spacing.lg },
});