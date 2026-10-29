import { useState, useCallback } from 'react';
import {
  View, Text, TextInput, FlatList, Modal, TouchableOpacity,
  Button, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as Location from 'expo-location';
import {
  getIntersecciones, crearInterseccion, buscarInterseccionCercana, nombreDuplicado,
  actualizarInterseccion, eliminarInterseccion,
} from '../utils/intersecciones';
import { styles } from './IntersectionesScreen.styles';
import { colors, spacing } from '../styles/theme';

export default function IntersectionesScreen({ route, navigation }) {
  const { corredor } = route.params;

  const [intersecciones, setIntersecciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [nombre, setNombre] = useState('');
  const [direccion, setDireccion] = useState('');
  const [ubicacion, setUbicacion] = useState(null);
  const [cargandoGps, setCargandoGps] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [editando, setEditando] = useState(null);

  const cargar = async () => {
    setCargando(true);
    const lista = await getIntersecciones(corredor.id);
    setIntersecciones(lista);
    setCargando(false);
  };

  useFocusEffect(useCallback(() => { cargar(); }, []));

  const capturarGps = async () => {
    setCargandoGps(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'No se pudo acceder a la ubicación.');
        return;
      }
      const posicion = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setUbicacion({ latitude: posicion.coords.latitude, longitude: posicion.coords.longitude });
    } catch (error) {
      Alert.alert('Error', 'No se pudo obtener el GPS: ' + error.message);
    } finally {
      setCargandoGps(false);
    }
  };

  const abrirCrear = () => {
    setEditando(null);
    setNombre('');
    setDireccion('');
    setUbicacion(null);
    setModalVisible(true);
  };

  const abrirEditar = (interseccion) => {
    setEditando(interseccion);
    setNombre(interseccion.nombre);
    setDireccion(interseccion.direccion);
    setUbicacion(
      interseccion.latitude != null
        ? { latitude: interseccion.latitude, longitude: interseccion.longitude }
        : null
    );
    setModalVisible(true);
  };

  const guardar = async () => {
    if (!nombre.trim() || !direccion.trim()) {
      Alert.alert('Falta información', 'Completa nombre y dirección.');
      return;
    }

    setGuardando(true);
    try {
      if (await nombreDuplicado(corredor.id, nombre)) {
        Alert.alert('Nombre duplicado', 'Ya existe una intersección con ese nombre en este corredor.');
        setGuardando(false);
        return;
      }

      if (ubicacion) {
        const cercana = await buscarInterseccionCercana(corredor.id, ubicacion.latitude, ubicacion.longitude);
        if (cercana) {
          setGuardando(false);
          Alert.alert(
            'Posible duplicado',
            `Ya existe "${cercana.nombre}" a menos de 50m de esta ubicación. ¿Deseas crear igual una nueva intersección?`,
            [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Crear de todos modos', onPress: () => confirmarGuardado() },
            ]
          );
          return;
        }
      }

      await confirmarGuardado();
    } catch (error) {
      setGuardando(false);
      Alert.alert('Error', 'No se pudo crear la intersección: ' + error.message);
    }
  };

  const confirmarGuardado = async () => {
    setGuardando(true);
    try {
      await crearInterseccion({
        corredorId: corredor.id,
        nombre: nombre.trim(),
        direccion: direccion.trim(),
        latitude: ubicacion?.latitude,
        longitude: ubicacion?.longitude,
      });
      setNombre('');
      setDireccion('');
      setUbicacion(null);
      setModalVisible(false);
      cargar();
    } catch (error) {
      Alert.alert('Error', 'No se pudo crear la intersección: ' + error.message);
    } finally {
      setGuardando(false);
    }
  };

  const guardarEdicion = async () => {
    if (!nombre.trim() || !direccion.trim()) {
      Alert.alert('Falta información', 'Completa nombre y dirección.');
      return;
    }
    setGuardando(true);
    try {
      await actualizarInterseccion(editando.id, {
        nombre: nombre.trim(),
        direccion: direccion.trim(),
        latitude: ubicacion?.latitude ?? null,
        longitude: ubicacion?.longitude ?? null,
      });
      setModalVisible(false);
      setEditando(null);
      cargar();
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar: ' + error.message);
    } finally {
      setGuardando(false);
    }
  };

  const confirmarBorrado = (interseccion) => {
    Alert.alert(
      'Eliminar intersección',
      `¿Eliminar "${interseccion.nombre}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => { await eliminarInterseccion(interseccion.id); cargar(); },
        },
      ]
    );
  };

  const renderItem = ({ item }) => (
    <View style={styles.fila}>
      <View style={styles.filaTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.nombre}>{item.nombre}</Text>
          <Text style={styles.direccion}>{item.direccion}</Text>
          {item.latitude == null && (
            <Text style={styles.direccion}>📍 Sin ubicación GPS</Text>
          )}
          <Text style={styles.fecha}>
            {item.fechaCreacion?.toDate?.().toLocaleDateString('es-CO') || '—'}
          </Text>
        </View>
        <View style={[styles.badge, { backgroundColor: item.caracterizada ? '#2E8B5722' : '#E67E2222' }]}>
          <Text style={[styles.badgeTexto, { color: item.caracterizada ? '#2E8B57' : colors.accent }]}>
            {item.caracterizada
              ? `Caracterizada · ${item.entradasCodigos?.length ?? 0} de 8 accesos`
              : 'Pendiente'}
          </Text>
        </View>
      </View>

      <View style={styles.acciones}>
        <TouchableOpacity style={styles.botonAccion} onPress={() => abrirEditar(item)}>
          <Ionicons name="create-outline" size={20} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.botonAccion} onPress={() => confirmarBorrado(item)}>
          <Ionicons name="trash-outline" size={20} color={colors.danger} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.botonIr}
        onPress={() => navigation.navigate('Caracterizacion', { interseccion: item })}
      >
        <Ionicons name="arrow-forward-circle-outline" size={16} color={colors.surface} />
        <Text style={styles.botonIrTexto}>Ir a caracterización</Text>

      </TouchableOpacity>

      {item.caracterizada && (
        <TouchableOpacity
          style={[styles.botonIr, { backgroundColor: colors.accent, marginTop: spacing.xs }]}
          onPress={() => navigation.navigate('Jornadas', { interseccion: item })}
        >
          <Ionicons name="calendar-outline" size={16} color={colors.surface} />
          <Text style={styles.botonIrTexto}>Jornadas</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.botonNuevo} onPress={abrirCrear}>
        <Ionicons name="add" size={20} color={colors.surface} />
        <Text style={styles.botonNuevoTexto}>Nueva intersección</Text>
      </TouchableOpacity>

      {cargando ? (
        <ActivityIndicator color={colors.primary} />
      ) : intersecciones.length === 0 ? (
        <Text style={styles.vacio}>Aún no hay intersecciones en este corredor.</Text>
      ) : (
        <FlatList data={intersecciones} keyExtractor={(i) => i.id} renderItem={renderItem} />
      )}

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalFondo}>
          <View style={styles.modalCaja}>
            <Text style={styles.modalTitulo}>{editando ? 'Editar intersección' : 'Nueva intersección'}</Text>

            <TextInput style={styles.input} placeholder="Nombre de la intersección" value={nombre} onChangeText={setNombre} />
            <TextInput style={styles.input} placeholder="Dirección" value={direccion} onChangeText={setDireccion} />

            <View style={styles.gpsBox}>
              {cargandoGps ? (
                <ActivityIndicator color={colors.surface} />
              ) : ubicacion ? (
                <Text style={styles.gpsTexto}>
                  📍 Lat: {ubicacion.latitude.toFixed(6)}{'\n'}Lng: {ubicacion.longitude.toFixed(6)}
                </Text>
              ) : (
                <Text style={styles.gpsTexto}>Sin ubicación capturada (opcional)</Text>
              )}
              <Button title={ubicacion ? 'Recapturar GPS' : 'Capturar GPS'} onPress={capturarGps} />
            </View>

            {guardando ? (
              <ActivityIndicator color={colors.surface} style={{ marginVertical: 10 }} />
            ) : (
              <>
                <Button title="Guardar" onPress={editando ? guardarEdicion : guardar} />
                <View style={{ marginTop: 10 }}>
                  <Button
                    title="Cancelar"
                    color="#888"
                    onPress={() => {
                      setModalVisible(false);
                      setEditando(null);
                      setNombre(''); setDireccion(''); setUbicacion(null);
                    }}
                  />
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}