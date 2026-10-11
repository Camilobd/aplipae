import { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { getMisTareas } from '../utils/asignaciones';
import { getTiposVehiculo } from '../utils/tiposVehiculo';
import { estadoJornada } from '../utils/jornadas';
import { formatoRango, formatoFecha, formatoHora } from '../utils/fechas';
import useAhora from '../hooks/useAhora';
import { styles } from './MisTareasScreen.styles';
import { colors } from '../styles/theme';

const ESTADOS = {
  programada: { texto: 'Programada', color: '#2F80ED' },
  activa: { texto: 'En curso', color: '#2E8B57' },
};

export default function MisTareasScreen({ route }) {
  const { aforador } = route.params;
  const ahora = useAhora();

  const [tareas, setTareas] = useState([]);
  const [catalogo, setCatalogo] = useState([]);
  const [cargando, setCargando] = useState(true);

  const cargar = async () => {
    setCargando(true);
    const [lista, tipos] = await Promise.all([getMisTareas(aforador.id), getTiposVehiculo()]);
    setTareas(lista);
    setCatalogo(tipos);
    setCargando(false);
  };

  useFocusEffect(useCallback(() => { cargar(); }, []));

  const etiquetaTipo = (codigo) => {
    const t = catalogo.find((x) => x.codigo === codigo);
    return t ? `${t.nombre} (${t.codigo})` : codigo;
  };

  // El estado se recalcula con el reloj: una tarea programada pasa a "En curso" sola
  const visibles = tareas.filter((t) => estadoJornada(t.jornada, ahora) !== 'cerrada');

  const abrirTarea = (item, estado) => {
    if (estado === 'programada') {
      const ini = item.jornada.fechaInicio.toDate();
      Alert.alert('Aún no inicia', `Esta jornada comienza el ${formatoFecha(ini)} a las ${formatoHora(ini)}.`);
      return;
    }
    Alert.alert('Próximamente', 'Aquí vamos a construir la pantalla de conteo (Sprint 3).');
  };

  const renderItem = ({ item }) => {
    const estado = estadoJornada(item.jornada, ahora);
    const info = ESTADOS[estado];
    const tipos = item.asignacion.tiposAsignados || [];
    return (
      <TouchableOpacity style={styles.tarjeta} onPress={() => abrirTarea(item, estado)}>
        <Text style={styles.interseccionNombre}>{item.interseccion.nombre}</Text>

        <View style={styles.fila}>
          <Ionicons name="navigate-outline" size={14} color={colors.textMuted} />
          <Text style={styles.filaTexto}>Acceso {item.acceso.orientacion}</Text>
        </View>

        <View style={styles.fila}>
          <Ionicons name="git-branch-outline" size={14} color={colors.textMuted} />
          <Text style={styles.filaTexto}>{item.movimiento.nombre}</Text>
          <Text style={styles.codigo}>{item.movimiento.codigo}</Text>
        </View>

        <View style={styles.fila}>
          <Ionicons name="car-outline" size={14} color={colors.textMuted} />
          <Text style={[styles.filaTexto, { flex: 1 }]}>
            {tipos.length ? tipos.map(etiquetaTipo).join(', ') : 'Sin tipos definidos'}
          </Text>
        </View>

        <Text style={styles.fecha}>
          {formatoRango(item.jornada.fechaInicio.toDate(), item.jornada.fechaFin.toDate())}
        </Text>

        <View style={[styles.badge, { backgroundColor: info.color + '22' }]}>
          <Text style={[styles.badgeTexto, { color: info.color }]}>{info.texto}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.saludo}>Hola, {aforador.nombre}</Text>
      <Text style={styles.subtitulo}>Estas son tus tareas asignadas</Text>

      {cargando ? (
        <ActivityIndicator color={colors.primary} />
      ) : visibles.length === 0 ? (
        <Text style={styles.vacio}>No tienes tareas asignadas por ahora.</Text>
      ) : (
        <FlatList
          data={visibles}
          keyExtractor={(t) => t.asignacionId}
          renderItem={renderItem}
          refreshing={cargando}
          onRefresh={cargar}
        />
      )}
    </View>
  );
}