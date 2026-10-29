import { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { getJornadasDeInterseccion, estadoJornada } from '../utils/jornadas';
import { getAsignacionesDeJornada } from '../utils/asignaciones';
import { getTrayectoriasDeInterseccion } from '../utils/trayectorias';
import { formatoFecha, formatoHora, formatoRango } from '../utils/fechas';
import useAhora from '../hooks/useAhora';
import { styles } from './JornadasListScreen.styles';
import { colors } from '../styles/theme';

const ESTADOS = {
  programada: { texto: 'Programada', color: '#2F80ED', icono: 'time-outline' },
  activa: { texto: 'Activa', color: '#2E8B57', icono: 'radio-button-on' },
  cerrada: { texto: 'Cerrada', color: colors.textMuted, icono: 'checkmark-circle-outline' },
};

export default function JornadasListScreen({ route, navigation }) {
  const { interseccion } = route.params;
  const ahora = useAhora();

  const [jornadas, setJornadas] = useState([]);
  const [totalTray, setTotalTray] = useState(0);
  const [conAforador, setConAforador] = useState({}); // { jornadaId: cantidad de trayectorias con aforador }
  const [cargando, setCargando] = useState(true);

  const cargar = async () => {
    setCargando(true);
    const [lista, trays] = await Promise.all([
      getJornadasDeInterseccion(interseccion.id),
      getTrayectoriasDeInterseccion(interseccion.id),
    ]);
    const idsTray = new Set(trays.map((t) => t.id));
    const conteo = {};
    await Promise.all(
      lista.map(async (j) => {
        const asigs = await getAsignacionesDeJornada(j.id);
        conteo[j.id] = new Set(
          asigs.map((a) => a.trayectoriaId).filter((id) => idsTray.has(id))
        ).size;
      })
    );
    setJornadas(lista);
    setTotalTray(trays.length);
    setConAforador(conteo);
    setCargando(false);
  };

  useFocusEffect(useCallback(() => { cargar(); }, []));

  const renderItem = ({ item }) => {
    const estado = estadoJornada(item, ahora);
    const info = ESTADOS[estado];
    const ini = item.fechaInicio?.toDate?.();
    const fin = item.fechaFin?.toDate?.();
    const mismoDia = ini && fin && ini.toDateString() === fin.toDateString();
    const puedeAsignar = !!(ini && fin) && estado !== 'cerrada';
    const asignadas = conAforador[item.id] ?? 0;
    const completa = totalTray > 0 && asignadas === totalTray;
    const colorAvance = completa ? '#2E8B57' : '#B7791F';

    return (
      <View style={styles.tarjeta}>
        <TouchableOpacity
          style={styles.tarjetaFila}
          onPress={() => navigation.navigate('Jornada', { interseccion, jornadaId: item.id })}
        >
          <View style={[styles.barraEstado, { backgroundColor: info.color }]} />

          <View style={styles.info}>
            {ini && fin ? (
              <>
                <Text style={styles.fecha}>{mismoDia ? formatoFecha(ini) : formatoRango(ini, fin)}</Text>
                {mismoDia && (
                  <Text style={styles.horas}>{formatoHora(ini)} – {formatoHora(fin)}</Text>
                )}
              </>
            ) : (
              <Text style={styles.fecha}>Jornada del modelo anterior</Text>
            )}
          </View>

          <View style={[styles.badge, { backgroundColor: info.color + '22' }]}>
            <Ionicons name={info.icono} size={12} color={info.color} />
            <Text style={[styles.badgeTexto, { color: info.color }]}>{info.texto}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} style={{ marginLeft: 6 }} />
        </TouchableOpacity>

        {puedeAsignar && (
          <View style={styles.pie}>
            <Text style={[styles.pieTexto, { color: colorAvance }]}>
              {asignadas} de {totalTray} {totalTray === 1 ? 'trayectoria' : 'trayectorias'} con aforador
            </Text>
            <TouchableOpacity
              style={styles.botonAsignar}
              onPress={() => navigation.navigate('Asignaciones', { interseccion, jornada: item })}
            >
              <Ionicons name="people-outline" size={14} color={colors.surface} />
              <Text style={styles.botonAsignarTexto}>Asignar aforadores</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.botonNuevo}
        onPress={() => navigation.navigate('JornadaForm', { interseccion })}
      >
        <Ionicons name="add" size={20} color={colors.surface} />
        <Text style={styles.botonNuevoTexto}>Planificar jornada</Text>
      </TouchableOpacity>

      {cargando ? (
        <ActivityIndicator color={colors.primary} />
      ) : jornadas.length === 0 ? (
        <View>
          <Text style={styles.vacio}>Aún no hay jornadas en esta intersección.</Text>
          <Text style={styles.ayudaVacio}>Planifica una para poder asignar aforadores.</Text>
        </View>
      ) : (
        <FlatList data={jornadas} keyExtractor={(j) => j.id} renderItem={renderItem} />
      )}
    </View>
  );
}