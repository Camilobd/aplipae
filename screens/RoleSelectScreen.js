import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './RoleSelectScreen.styles';
import { colors } from '../styles/theme';

export default function RoleSelectScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.botonAdmin}
        onPress={() => navigation.navigate('AdminLogin')}
      >
        <Ionicons name="settings-outline" size={16} color={colors.primary} />
        <Text style={styles.botonAdminTexto}>Admin</Text>
      </TouchableOpacity>

      <View style={styles.centro}>
        <View style={styles.logoCirculo}>
          <Ionicons name="analytics-outline" size={64} color={colors.surface} />
        </View>
        <Text style={styles.nombreApp}>APLIPAE</Text>
        <Text style={styles.subtitulo}>
          Procesamiento y levantamiento de{'\n'}patrones de aforo en intersecciones
        </Text>
      </View>

      <TouchableOpacity
        style={styles.botonAforador}
        onPress={() => navigation.navigate('PinLogin')}
      >
        <Ionicons name="person-outline" size={20} color={colors.surface} />
        <Text style={styles.botonAforadorTexto}>Ingresar como Aforador</Text>
      </TouchableOpacity>
    </View>
  );
}