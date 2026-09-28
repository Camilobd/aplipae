import { View, Text } from 'react-native';
import { colors } from '../styles/theme';

export default function ReportesScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
      <Text style={{ color: colors.textMuted }}>Próximamente: Reportes</Text>
    </View>
  );
}