import { useState } from 'react';
import { View, Text, TextInput, Button, Alert, ActivityIndicator } from 'react-native';
import { buscarAforadorPorPin } from '../utils/aforadores';
import { styles } from './PinLoginScreen.styles';
import { colors } from '../styles/theme';

export default function PinLoginScreen({ navigation }) {
  const [pin, setPin] = useState('');
  const [cargando, setCargando] = useState(false);

  const ingresar = async () => {
    if (pin.trim().length !== 6) {
      Alert.alert('PIN inválido', 'El PIN debe tener 6 dígitos.');
      return;
    }

    setCargando(true);
    try {
      const aforador = await buscarAforadorPorPin(pin.trim());
      if (!aforador) {
        Alert.alert('PIN incorrecto', 'No encontramos un aforador activo con ese PIN.');
        return;
      }

      navigation.replace('MisTareas', { aforador });
      // Aquí, en el siguiente paso, navegamos a la pantalla de jornadas/asignaciones del aforador
    } catch (error) {
      Alert.alert('Error', 'No se pudo validar el PIN: ' + error.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Ingresa tu PIN de 6 dígitos</Text>
      <TextInput
        style={styles.input}
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
    </View>
  );
}