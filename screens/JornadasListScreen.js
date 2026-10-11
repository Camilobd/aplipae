import { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { getJornadasDeInterseccion, estadoJornada } from '../utils/jornadas';
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
  const [cargando, setCargando] = useState(true);

  const cargar = async () => {
    setCargando(true);
    setJornadas(await getJornadasDeInterseccion(interseccion.id));
    setCargando(false);
  };

  useFocusEffect(useCallback(() => { cargar(); }, []));

  const renderItem = ({ item }) => {
    const info = ESTADOS[estadoJornada(item, ahora)];
    const ini = item.fechaInicio?.toDate?.();
    const fin = item.fechaFin?.toDate?.();
    const mismoDia = ini && fin && ini.toDateString() === fin.toDateString();

    return (
      <TouchableOpacity
        style={styles.tarjeta}
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
        <Text style={styles.vacio}>Aún no hay jornadas en esta intersección.</Text>
      ) : (
        <FlatList data={jornadas} keyExtractor={(j) => j.id} renderItem={renderItem} />
      )}
    </View>
  );
}