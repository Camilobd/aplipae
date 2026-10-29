import { useCallback } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { styles } from './RoleSelectScreen.styles';
import { colors } from '../styles/theme';

export default function RoleSelectScreen({ navigation }) {
  // Cada vez que se vuelve al inicio se cierra cualquier sesión previa:
  // un aforador nunca hereda la sesión de un administrador.
  useFocusEffect(
    useCallback(() => {
      signOut(auth).catch(() => {});
    }, [])
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.botonAdmin} onPress={() => navigation.navigate('AdminLogin')}>
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

      <TouchableOpacity style={styles.botonAforador} onPress={() => navigation.navigate('PinLogin')}>
        <Ionicons name="person-outline" size={20} color={colors.surface} />
        <Text style={styles.botonAforadorTexto}>Ingresar como Aforador</Text>
      </TouchableOpacity>
    </View>
  );
}