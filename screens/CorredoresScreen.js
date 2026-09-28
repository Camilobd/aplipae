import { useState, useCallback } from 'react';
import { View, Text, TextInput, FlatList, Modal, TouchableOpacity, Button, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import {
  getCorredores, crearCorredor, actualizarCorredor, eliminarCorredor, corredorTieneIntersecciones,
} from '../utils/corredores';
import { styles } from './CorredoresScreen.styles';
import { colors } from '../styles/theme';

export default function CorredoresScreen({ route, navigation }) {
  const { zonaAforo } = route.params;

  const [corredores, setCorredores] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editando, setEditando] = useState(null);
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [guardando, setGuardando] = useState(false);

  const cargar = async () => {
    setCargando(true);
    const lista = await getCorredores(zonaAforo.id);
    setCorredores(lista);
    setCargando(false);
  };

  useFocusEffect(useCallback(() => { cargar(); }, []));

  const abrirCrear = () => {
    setEditando(null);
    setNombre('');
    setDescripcion('');
    setModalVisible(true);
  };

  const abrirEditar = (corredor) => {
    setEditando(corredor);
    setNombre(corredor.nombre);
    setDescripcion(corredor.descripcion || '');
    setModalVisible(true);
  };

  const guardar = async () => {
    if (!nombre.trim()) {
      Alert.alert('Falta información', 'Ponle un nombre al corredor.');
      return;
    }
    setGuardando(true);
    try {
      if (editando) {
        await actualizarCorredor(editando.id, { nombre: nombre.trim(), descripcion: descripcion.trim() });
      } else {
        await crearCorredor({ zonaAforoId: zonaAforo.id, nombre: nombre.trim(), descripcion: descripcion.trim() });
      }
      setModalVisible(false);
      cargar();
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar: ' + error.message);
    } finally {
      setGuardando(false);
    }
  };

  const confirmarBorrado = async (corredor) => {
    const tieneHijos = await corredorTieneIntersecciones(corredor.id);
    Alert.alert(
      'Eliminar corredor',
      tieneHijos
        ? `"${corredor.nombre}" tiene intersecciones asociadas. Si lo eliminas, esas intersecciones quedarán huérfanas (no se borran automáticamente). ¿Continuar de todos modos?`
        : `¿Eliminar "${corredor.nombre}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: async () => { await eliminarCorredor(corredor.id); cargar(); } },
      ]
    );
  };

  const renderItem = ({ item }) => (
    <View style={[styles.fila, styles.filaConAcciones]}>
      <TouchableOpacity
        style={{ flex: 1 }}
        onPress={() => navigation.navigate('Intersecciones', { corredor: item, zonaAforo })}
      >
        <Text style={styles.nombre}>{item.nombre}</Text>
        {!!item.descripcion && <Text style={styles.descripcion}>{item.descripcion}</Text>}
      </TouchableOpacity>
      <View style={styles.acciones}>
        <TouchableOpacity style={styles.botonAccion} onPress={() => abrirEditar(item)}>
          <Ionicons name="create-outline" size={20} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.botonAccion} onPress={() => confirmarBorrado(item)}>
          <Ionicons name="trash-outline" size={20} color={colors.danger} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.botonNuevo} onPress={abrirCrear}>
        <Ionicons name="add" size={20} color={colors.surface} />
        <Text style={styles.botonNuevoTexto}>Nuevo corredor</Text>
      </TouchableOpacity>

      {cargando ? (
        <ActivityIndicator color={colors.primary} />
      ) : corredores.length === 0 ? (
        <Text style={styles.vacio}>Aún no hay corredores en esta zona.</Text>
      ) : (
        <FlatList data={corredores} keyExtractor={(i) => i.id} renderItem={renderItem} />
      )}

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalFondo}>
          <View style={styles.modalCaja}>
            <Text style={styles.modalTitulo}>{editando ? 'Editar corredor' : 'Nuevo corredor'}</Text>
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
                <Button title="Guardar" onPress={guardar} />
                <View style={{ marginTop: 10 }}>
                  <Button title="Cancelar" color="#888" onPress={() => setModalVisible(false)} />
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}