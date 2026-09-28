import { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { getAforadores, desactivarAforador, reactivarAforador } from '../utils/aforadores';
import { styles } from './AforadoresListScreen.styles';
import { colors } from '../styles/theme';

export default function AforadoresListScreen({ navigation }) {
  const [aforadores, setAforadores] = useState([]);
  const [cargando, setCargando] = useState(true);

  const cargar = async () => {
    setCargando(true);
    const lista = await getAforadores();
    setAforadores(lista);
    setCargando(false);
  };

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [])
  );

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
      <TouchableOpacity
        style={styles.botonNuevo}
        onPress={() => navigation.navigate('CrearAforador')}
      >
        <Ionicons name="add" size={20} color={colors.surface} />
        <Text style={styles.botonNuevoTexto}>Nueva Aforador</Text>
      </TouchableOpacity>

      {cargando ? (
        <ActivityIndicator color={colors.primary} />
      ) : aforadores.length === 0 ? (
        <Text style={styles.vacio}>Aún no hay aforadores registrados.</Text>
      ) : (
        <FlatList data={aforadores} keyExtractor={(i) => i.id} renderItem={renderItem} />
      )}
    </View>
  );
}