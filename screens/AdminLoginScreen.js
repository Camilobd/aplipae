import { useState } from 'react';
import { View, Text, TextInput, Button, Alert, ActivityIndicator } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { styles } from './AdminLoginScreen.styles';
import { colors } from '../styles/theme';
import { KeyboardAvoidingView, Platform } from 'react-native';


export default function AdminLoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);

  const ingresar = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Falta información', 'Ingresa correo y contraseña.');
      return;
    }

    setCargando(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      navigation.replace('AdminHome');
    } catch (error) {
      Alert.alert('Error', 'Correo o contraseña incorrectos.');
    } finally {
      setCargando(false);

    }
  };

  return (

    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.container}>
        <Text style={styles.titulo}>Acceso Administrador</Text>

        <Text style={styles.label}>Correo</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.label}>Contraseña</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <View style={styles.botonWrapper}>
          {cargando ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <Button title="Ingresar" onPress={ingresar} color={colors.primary} />
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}