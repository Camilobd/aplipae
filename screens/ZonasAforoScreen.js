import { useState, useCallback } from 'react';
import { View, Text, TextInput, FlatList, Modal, TouchableOpacity, Button, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { getZonasAforo, crearZonaAforo } from '../utils/zonasAforo';
import { styles } from './ZonasAforoScreen.styles';
import { colors } from '../styles/theme';

export default function ZonasAforoScreen({ navigation }) {
  const [zonas, setZonas] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [guardando, setGuardando] = useState(false);

  const cargar = async () => {
    setCargando(true);
    const lista = await getZonasAforo();
    setZonas(lista);
    setCargando(false);
  };

  useFocusEffect(useCallback(() => { cargar(); }, []));

  const zonasFiltradas = zonas.filter((z) =>
    z.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const guardarZona = async () => {
    if (!nombre.trim()) {
      Alert.alert('Falta información', 'Ponle un nombre a la zona de aforo.');
      return;
    }
    setGuardando(true);
    try {
      await crearZonaAforo({ nombre: nombre.trim(), descripcion: descripcion.trim() });
      setNombre('');
      setDescripcion('');
      setModalVisible(false);
      cargar();
    } catch (error) {
      Alert.alert('Error', 'No se pudo crear la zona: ' + error.message);
    } finally {
      setGuardando(false);
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.fila}
      onPress={() => navigation.navigate('Corredores', { zonaAforo: item })}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.nombre}>{item.nombre}</Text>
        {!!item.descripcion && <Text style={styles.descripcion}>{item.descripcion}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.buscador}>
        <Ionicons name="search-outline" size={18} color={colors.textMuted} />
        <TextInput
          style={styles.buscadorInput}
          placeholder="Buscar zona de aforo..."
          value={busqueda}
          onChangeText={setBusqueda}
        />
      </View>

      <TouchableOpacity style={styles.botonNuevo} onPress={() => setModalVisible(true)}>
        <Ionicons name="add" size={20} color={colors.surface} />
        <Text style={styles.botonNuevoTexto}>Crear nueva zona de aforo</Text>
      </TouchableOpacity>

      {cargando ? (
        <ActivityIndicator color={colors.primary} />
      ) : zonasFiltradas.length === 0 ? (
        <Text style={styles.vacio}>
          {busqueda ? 'Sin resultados para esa búsqueda.' : 'Aún no has creado ninguna zona de aforo.'}
        </Text>
      ) : (
        <FlatList data={zonasFiltradas} keyExtractor={(i) => i.id} renderItem={renderItem} />
      )}

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalFondo}>
          <View style={styles.modalCaja}>
            <Text style={styles.modalTitulo}>Nueva zona de aforo</Text>

            <TextInput style={styles.input} placeholder="Nombre" value={nombre} onChangeText={setNombre} />
            <TextInput
              style={[styles.input, { height: 70 }]}
              placeholder="Descripción (opcional)"
              value={descripcion}
              onChangeText={setDescripcion}
              multiline
            />

            {guardando ? (
              <ActivityIndicator color={colors.surface} style={{ marginVertical: 10 }} />
            ) : (
              <>
                <Button title="Guardar" onPress={guardarZona} />
                <View style={{ marginTop: 10 }}>
                  <Button
                    title="Cancelar"
                    color="#888"
                    onPress={() => { setModalVisible(false); setNombre(''); setDescripcion(''); }}
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