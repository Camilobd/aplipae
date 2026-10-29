import { useState } from 'react';
import {
  View, Text, TextInput, Button, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { buscarAforadorPorCorreoYPin, normalizarCorreo } from '../utils/aforadores';
import { asegurarSesion } from '../utils/sesion';
import { styles } from './PinLoginScreen.styles';
import { colors } from '../styles/theme';

export default function PinLoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [cargando, setCargando] = useState(false);

  const ingresar = async () => {
    const correo = normalizarCorreo(email);
    if (!correo.includes('@')) {
      Alert.alert('Correo inválido', 'Escribe el correo con el que te registraron.');
      return;
    }
    if (pin.trim().length !== 6) {
      Alert.alert('PIN inválido', 'El PIN debe tener 6 dígitos.');
      return;
    }

    setCargando(true);
    try {
      await asegurarSesion();
      const aforador = await buscarAforadorPorCorreoYPin(correo, pin.trim());
      if (!aforador) {
        Alert.alert(
          'No pudimos validar tus datos',
          'Revisa el correo y el PIN, o pide al administrador que los verifique.'
        );
        return;
      }
      navigation.replace('MisTareas', { aforador });
    } catch (error) {
      Alert.alert('Error', 'No se pudo validar el ingreso: ' + error.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.contenido} keyboardShouldPersistTaps="handled">
        <Text style={styles.titulo}>Ingreso de aforador</Text>
        <Text style={styles.ayuda}>Usa el correo con el que te registraron y el PIN que recibiste.</Text>

        <Text style={styles.label}>Correo</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="tucorreo@ejemplo.com"
        />

        <Text style={styles.label}>PIN de 6 dígitos</Text>
        <TextInput
          style={styles.inputPin}
          value={pin}
          onChangeText={setPin}
          keyboardType="numeric"
          maxLength={6}
          placeholder="000000"
        />

        <View style={styles.botonWrapper}>
          {cargando ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <Button title="Ingresar" onPress={ingresar} color={colors.primary} />
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}