import { useState, useCallback } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { getInterseccionesParaReporte } from '../utils/reportes';
import { styles } from './ReportesScreen.styles';
import { colors } from '../styles/theme';

export default function ReportesScreen({ navigation }) {
  const [lista, setLista] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const cargar = async () => {
    setCargando(true);
    setError(null);
    try {
      setLista(await getInterseccionesParaReporte());
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  };

  useFocusEffect(useCallback(() => { cargar(); }, []));

  const filtradas = lista.filter((i) =>
    `${i.nombre} ${i.corredorNombre} ${i.zonaNombre} ${i.direccion ?? ''}`
      .toLowerCase()
      .includes(busqueda.toLowerCase())
  );

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.tarjeta} onPress={() => navigation.navigate('Reporte', { interseccion: item })}>
      <View style={{ flex: 1 }}>
        <Text style={styles.nombre}>{item.nombre}</Text>
        <Text style={styles.contexto}>{item.corredorNombre} · {item.zonaNombre}</Text>
        {!!item.direccion && <Text style={styles.direccion}>{item.direccion}</Text>}
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
          placeholder="Buscar intersección, corredor o zona..."
          value={busqueda}
          onChangeText={setBusqueda}
        />
      </View>
      <Text style={styles.ayuda}>Elige una intersección para ver sus conteos.</Text>

      {cargando && lista.length === 0 ? (
        <ActivityIndicator color={colors.primary} />
      ) : error ? (
        <Text style={styles.vacio}>No se pudo cargar: {error}</Text>
      ) : filtradas.length === 0 ? (
        <Text style={styles.vacio}>
          {busqueda ? 'Sin resultados para esa búsqueda.' : 'Aún no hay intersecciones.'}
        </Text>
      ) : (
        <FlatList
          data={filtradas}
          keyExtractor={(i) => i.id}
          renderItem={renderItem}
          refreshing={cargando}
          onRefresh={cargar}
        />
      )}
    </View>
  );
}