import { StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../styles/theme';
import { formStyles } from '../styles/formPatterns';

const especificos = StyleSheet.create({
  titulo: {
    ...typography.title,
    fontSize: 22,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
});

export const styles = {
  ...formStyles,
  ...especificos,
  container: StyleSheet.flatten([formStyles.container, { justifyContent: 'center' }]),
};