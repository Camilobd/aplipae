import { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import {
  getAforadores, desactivarAforador, reactivarAforador, reenviarPin, generarNuevoPin,
} from '../utils/aforadores';
import { styles } from './AforadoresListScreen.styles';
import { colors } from '../styles/theme';

export default function AforadoresListScreen({ navigation }) {
  const [aforadores, setAforadores] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [procesandoId, setProcesandoId] = useState(null);

  const cargar = async () => {
    setCargando(true);
    try {
      setAforadores(await getAforadores());
    } catch (error) {
      Alert.alert('No se pudo cargar la lista', error.message);
    } finally {
      setCargando(false);
    }
  };

  useFocusEffect(useCallback(() => { cargar(); }, []));

  const confirmarBorrado = (aforador) => {
    Alert.alert(
      'Borrar aforador',
      `¿Desactivar a ${aforador.nombre}? No podrá ingresar a la app, pero se conserva su historial de conteos.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desactivar',
          style: 'destructive',
          onPress: async () => {
            await desactivarAforador(aforador.id);
            cargar();
          },
        },
      ]
    );
  };

  const reactivar = async (aforador) => {
    await reactivarAforador(aforador.id);
    cargar();
  };

  const ejecutarPin = async (aforador, modo) => {
    setProcesandoId(aforador.id);
    try {
      const r = modo === 'nuevo' ? await generarNuevoPin(aforador) : await reenviarPin(aforador);
      if (r.correoEnviado) {
        Alert.alert(
          modo === 'nuevo' ? 'PIN nuevo enviado' : 'PIN reenviado',
          `Se envió el PIN a ${aforador.email}.`
        );
      } else {
        Alert.alert(
          'No se pudo enviar el correo',
          `El PIN de ${aforador.nombre} es ${r.pin}. Entrégaselo directamente.`
        );
      }
      await cargar();
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setProcesandoId(null);
    }
  };

  const confirmarPinNuevo = (aforador) => {
    Alert.alert(
      'Generar un PIN nuevo',
      `El PIN actual de ${aforador.nombre} dejará de funcionar de inmediato y se enviará el nuevo a ${aforador.email}.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Generar nuevo', style: 'destructive', onPress: () => ejecutarPin(aforador, 'nuevo') },
      ]
    );
  };

  const gestionarPin = (aforador) => {
    Alert.alert('PIN de acceso', `¿Qué quieres hacer con el PIN de ${aforador.nombre}?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Reenviar el mismo', onPress: () => ejecutarPin(aforador, 'reenviar') },
      { text: 'Generar uno nuevo', onPress: () => confirmarPinNuevo(aforador) },
    ]);
  };

  const renderItem = ({ item }) => (
    <View style={[styles.fila, !item.activo && styles.filaInactiva]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.nombre}>{item.nombre}</Text>
        <Text style={styles.correo}>{item.email}</Text>
        <Text style={[styles.estado, { color: item.activo ? '#2E8B57' : colors.danger }]}>
          {item.activo ? 'Activo' : 'Inactivo'}
        </Text>
      </View>
      <View style={styles.acciones}>
        {item.activo &&
          (procesandoId === item.id ? (
            <View style={styles.botonAccion}>
              <ActivityIndicator color={colors.accent} />
            </View>
          ) : (
            <TouchableOpacity
              style={styles.botonAccion}
              disabled={procesandoId !== null}
              onPress={() => gestionarPin(item)}
            >
              <Ionicons name="key-outline" size={20} color={colors.accent} />
            </TouchableOpacity>
          ))}
        <TouchableOpacity
          style={styles.botonAccion}
          onPress={() => navigation.navigate('CrearAforador', { aforador: item })}
        >
          <Ionicons name="create-outline" size={20} color={colors.primary} />
        </TouchableOpacity>
        {item.activo ? (
          <TouchableOpacity style={styles.botonAccion} onPress={() => confirmarBorrado(item)}>
            <Ionicons name="trash-outline" size={20} color={colors.danger} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.botonAccion} onPress={() => reactivar(item)}>
            <Ionicons name="refresh-outline" size={20} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.botonNuevo} onPress={() => navigation.navigate('CrearAforador')}>
        <Ionicons name="add" size={20} color={colors.surface} />
        <Text style={styles.botonNuevoTexto}>Nuevo aforador</Text>
      </TouchableOpacity>
      <Text style={[styles.descripcion, { marginBottom: 12 }]}>
        Toca la llave para reenviar el PIN de un aforador o generarle uno nuevo.
      </Text>

      {cargando && aforadores.length === 0 ? (
        <ActivityIndicator color={colors.primary} />
      ) : aforadores.length === 0 ? (
        <Text style={styles.vacio}>Aún no hay aforadores registrados.</Text>
      ) : (
        <FlatList data={aforadores} keyExtractor={(i) => i.id} renderItem={renderItem} />
      )}
    </View>
  );
}