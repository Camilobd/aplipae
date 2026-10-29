import { StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../styles/theme';
import { formStyles } from '../styles/formPatterns';

export const styles = {
  ...formStyles,
  contenido: { flexGrow: 1, justifyContent: 'center', padding: spacing.lg },
  titulo: {
    ...typography.title,
    fontSize: 22,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  ayuda: { fontSize: 13, color: colors.textMuted, textAlign: 'center', marginBottom: spacing.lg },
  inputPin: StyleSheet.flatten([
    formStyles.input,
    { padding: spacing.md, fontSize: 24, textAlign: 'center', letterSpacing: 8 },
  ]),
};