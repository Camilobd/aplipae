import { StyleSheet } from 'react-native';
import { spacing } from '../styles/theme';
import { formStyles } from '../styles/formPatterns';

export const styles = {
  ...formStyles,
  container: StyleSheet.flatten([formStyles.container, { justifyContent: 'center' }]),
  label: StyleSheet.flatten([
    formStyles.label,
    { marginTop: 0, marginBottom: spacing.sm, textAlign: 'center' },
  ]),
  input: StyleSheet.flatten([
    formStyles.input,
    { padding: spacing.md, fontSize: 24, textAlign: 'center', letterSpacing: 8 },
  ]),
};