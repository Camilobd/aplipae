import { StyleSheet } from 'react-native';
import { colors, spacing } from '../styles/theme';

export const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 60 },
  intro: { fontSize: 13, color: colors.textMuted, marginBottom: spacing.lg },
  duracion: { fontSize: 13, color: colors.primary, fontWeight: '600', marginBottom: spacing.xs },
  nota: { fontSize: 12, color: colors.textMuted, marginBottom: spacing.lg },
});