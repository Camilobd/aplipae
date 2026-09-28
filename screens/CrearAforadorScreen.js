import { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, Alert, ActivityIndicator } from 'react-native';
import { crearAforador, actualizarAforador } from '../utils/aforadores';
import { styles } from './CrearAforadorScreen.styles';
import { colors } from '../styles/theme';

export default function CrearAforadorScreen({ navigation, route }) {
  const aforadorExistente = route.params?.aforador;
  const esEdicion = !!aforadorExistente;

  const [nombre, setNombre] = useState(aforadorExistente?.nombre || '');
  const [cedula, setCedula] = useState(aforadorExistente?.cedula || '');
  const [email, setEmail] = useState(aforadorExistente?.email || '');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: esEdicion ? 'Editar aforador' : 'Registrar aforador' });
  }, []);

  const guardar = async () => {
    if (!nombre.trim() || !cedula.trim() || !email.trim()) {
      Alert.alert('Falta información', 'Completa nombre, cédula y correo.');
      return;
    }

    setGuardando(true);
    try {
      if (esEdicion) {
        await actualizarAforador(aforadorExistente.id, {
          nombre: nombre.trim(),
          cedula: cedula.trim(),
          email: email.trim(),
        });
        Alert.alert('Actualizado', 'Los datos del aforador se actualizaron.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        const { pin } = await crearAforador({
          nombre: nombre.trim(),
          cedula: cedula.trim(),
          email: email.trim(),
        });
        Alert.alert(
          'Aforador registrado',
          `Se creó a ${nombre} y se envió el PIN (${pin}) a ${email}.`,
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar: ' + error.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Nombre completo</Text>
      <TextInput style={styles.input} value={nombre} onChangeText={setNombre} />

      <Text style={styles.label}>Cédula</Text>
      <TextInput style={styles.input} value={cedula} onChangeText={setCedula} keyboardType="numeric" />

      <Text style={styles.label}>Correo electrónico</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <View style={styles.botonWrapper}>
        {guardando ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <Button
            title={esEdicion ? 'Guardar cambios' : 'Registrar y enviar PIN'}
            onPress={guardar}
            color={colors.primary}
          />
        )}
      </View>
    </View>
  );
}