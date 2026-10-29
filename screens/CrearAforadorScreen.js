import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, Button, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { crearAforador, actualizarAforador, correoEnUso, normalizarCorreo } from '../utils/aforadores';
import { enviarPinPorCorreo } from '../utils/email';
import { styles } from './CrearAforadorScreen.styles';
import { colors, spacing } from '../styles/theme';

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

  const volver = () => navigation.goBack();

  const guardar = async () => {
    if (!nombre.trim() || !cedula.trim() || !email.trim()) {
      Alert.alert('Falta información', 'Completa nombre, cédula y correo.');
      return;
    }
    const correo = normalizarCorreo(email);
    if (!correo.includes('@')) {
      Alert.alert('Correo inválido', 'Revisa el correo electrónico.');
      return;
    }

    setGuardando(true);
    try {
      if (esEdicion) {
        if (await correoEnUso(correo, aforadorExistente.id)) {
          throw new Error('Ya existe otro aforador con ese correo.');
        }
        await actualizarAforador(aforadorExistente.id, {
          nombre: nombre.trim(),
          cedula: cedula.trim(),
          email: correo,
        });

        if (correo !== normalizarCorreo(aforadorExistente.email)) {
          // El PIN se envió al correo anterior: se ofrece enviarlo al nuevo
          Alert.alert('Correo actualizado', 'Cambiaste el correo. ¿Enviar el PIN al correo nuevo?', [
            { text: 'No enviar', onPress: volver },
            {
              text: 'Enviar PIN',
              onPress: async () => {
                try {
                  await enviarPinPorCorreo(correo, nombre.trim(), aforadorExistente.pin);
                  Alert.alert('Listo', `Se envió el PIN a ${correo}.`, [{ text: 'OK', onPress: volver }]);
                } catch (e) {
                  Alert.alert(
                    'No se pudo enviar el correo',
                    `El PIN de ${nombre.trim()} es ${aforadorExistente.pin}. Entrégaselo directamente.`,
                    [{ text: 'OK', onPress: volver }]
                  );
                }
              },
            },
          ]);
        } else {
          Alert.alert('Actualizado', 'Los datos del aforador se actualizaron.', [{ text: 'OK', onPress: volver }]);
        }
      } else {
        const r = await crearAforador({ nombre: nombre.trim(), cedula: cedula.trim(), email: correo });
        if (r.correoEnviado) {
          Alert.alert('Aforador registrado', `Se creó a ${nombre.trim()} y se envió el PIN a ${correo}.`, [
            { text: 'OK', onPress: volver },
          ]);
        } else {
          Alert.alert(
            'Registrado, pero no se envió el correo',
            `El PIN de ${nombre.trim()} es ${r.pin}. Entrégaselo directamente.`,
            [{ text: 'OK', onPress: volver }]
          );
        }
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar: ' + error.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
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
          autoCorrect={false}
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
      </ScrollView>
    </KeyboardAvoidingView>
  );
}