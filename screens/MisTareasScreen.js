import { useState, useCallback, useLayoutEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { getMisTareas } from '../utils/asignaciones';
import { getTiposVehiculo } from '../utils/tiposVehiculo';
import { estadoJornada } from '../utils/jornadas';
import { formatoRango, formatoFecha, formatoHora } from '../utils/fechas';
import { contarPendientesAforador } from '../utils/conteoLocal';
import { sincronizarTodo } from '../utils/conteoSync';
import { nombreAcceso, tituloTrayectoria, textoSalidas } from '../constants/rilsa';
import BotonCerrarSesion from '../components/BotonCerrarSesion';
import useAhora from '../hooks/useAhora';
import { styles } from './MisTareasScreen.styles';
import { colors } from '../styles/theme';

const ESTADOS = {
  programada: { texto: 'Programada', color: '#2F80ED' },
  activa: { texto: 'En curso', color: '#2E8B57' },
};

// El aforador está parado en una entrada: sus trayectorias de esa entrada se cuentan en una sola pantalla
function agrupar(tareas) {
  const mapa = {};
  tareas.forEach((t) => {
    const k = `${t.jornada.id}|${t.trayectoria.origenCodigo}`;
    if (!mapa[k]) {
      mapa[k] = {
        clave: k,
        jornada: t.jornada,
        interseccion: t.interseccion,
        entrada: t.trayectoria.origenCodigo,
        tareas: [],
      };
    }
    mapa[k].tareas.push({ asignacion: t.asignacion, trayectoria: t.trayectoria });
  });
  return Object.values(mapa)
    .map((g) => ({
      ...g,
      tareas: g.tareas.sort((a, b) => (a.trayectoria.numero ?? 0) - (b.trayectoria.numero ?? 0)),
    }))
    .sort((a, b) => a.jornada.fechaInicio.toMillis() - b.jornada.fechaInicio.toMillis());
}

export default function MisTareasScreen({ route, navigation }) {
  const { aforador } = route.params;
  const ahora = useAhora();

  const [tareas, setTareas] = useState([]);
  const [catalogo, setCatalogo] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [pendientes, setPendientes] = useState(0);
  const [sincronizando, setSincronizando] = useState(false);

  // La salida es el botón del encabezado: sin botón de volver, para que cerrar sesión sea deliberado
  useLayoutEffect(() => {
    navigation.setOptions({
      headerBackVisible: false,
      gestureEnabled: false,
      headerRight: () => <BotonCerrarSesion aforadorId={aforador.id} />,
    });
  }, [navigation, aforador.id]);

  const actualizarPendientes = async () => {
    try {
      setPendientes(await contarPendientesAforador(aforador.id));
    } catch (error) {}
  };

  const cargar = async () => {
    setCargando(true);
    try {
      const [lista, tipos] = await Promise.all([getMisTareas(aforador.id), getTiposVehiculo()]);
      setTareas(lista);
      setCatalogo(tipos);
    } catch (error) {
      Alert.alert('No se pudieron cargar tus tareas', error.message);
    } finally {
      setCargando(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      cargar();
      sincronizarTodo(aforador.id)
        .catch(() => {})
        .then(actualizarPendientes);
    }, [])
  );

  const sincronizarAhora = async () => {
    setSincronizando(true);
    try {
      const r = await sincronizarTodo(aforador.id);
      await actualizarPendientes();
      if (r.error) Alert.alert('No se pudo sincronizar', r.error);
    } finally {
      setSincronizando(false);
    }
  };

  const etiquetaTipo = (codigo) => {
    const t = catalogo.find((x) => x.codigo === codigo);
    return t ? `${t.nombre} (${t.codigo})` : codigo;
  };

  // El estado se recalcula con el reloj: una tarea programada pasa a "En curso" sola
  const grupos = agrupar(tareas).filter((g) => estadoJornada(g.jornada, ahora) !== 'cerrada');

  const abrirGrupo = (g, estado) => {
    if (estado === 'programada') {
      const ini = g.jornada.fechaInicio.toDate();
      Alert.alert('Aún no inicia', `Esta jornada comienza el ${formatoFecha(ini)} a las ${formatoHora(ini)}.`);
      return;
    }
    navigation.navigate('Conteo', {
      aforador,
      jornada: g.jornada,
      interseccion: g.interseccion,
      entrada: g.entrada,
      tareas: g.tareas,
      catalogo,
    });
  };

  const renderItem = ({ item: g }) => {
    const estado = estadoJornada(g.jornada, ahora);
    const info = ESTADOS[estado];
    return (
      <TouchableOpacity style={styles.tarjeta} onPress={() => abrirGrupo(g, estado)}>
        <Text style={styles.interseccionNombre}>{g.interseccion.nombre}</Text>

        <View style={styles.fila}>
          <Ionicons name="navigate-outline" size={14} color={colors.textMuted} />
          <Text style={styles.filaTexto}>Entra por {nombreAcceso(g.entrada)} ({g.entrada})</Text>
        </View>

        {g.tareas.map((t) => {
          const tipos = t.asignacion.tiposAsignados || [];
          return (
            <View key={t.trayectoria.id} style={styles.bloqueTray}>
              <Text style={styles.trayTitulo}>
                {tituloTrayectoria(t.trayectoria)}: sale por {textoSalidas(t.trayectoria)}
              </Text>
              <Text style={styles.trayTipos}>
                {tipos.length ? tipos.map(etiquetaTipo).join(', ') : 'Sin tipos definidos'}
              </Text>
            </View>
          );
        })}

        <Text style={styles.fecha}>
          {formatoRango(g.jornada.fechaInicio.toDate(), g.jornada.fechaFin.toDate())}
        </Text>

        <View style={[styles.badge, { backgroundColor: info.color + '22' }]}>
          <Text style={[styles.badgeTexto, { color: info.color }]}>{info.texto}</Text>
        </View>

        {estado === 'activa' && <Text style={styles.tocar}>Toca para contar</Text>}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.saludo}>Hola, {aforador.nombre}</Text>
      <Text style={styles.subtitulo}>Estas son tus tareas asignadas</Text>

      {pendientes > 0 && (
        <View style={styles.bannerPend}>
          <Ionicons name="cloud-upload-outline" size={18} color="#8A5A12" />
          <Text style={styles.bannerTexto}>{pendientes} registro(s) sin enviar a la nube</Text>
          {sincronizando ? (
            <ActivityIndicator color="#B7791F" />
          ) : (
            <TouchableOpacity style={styles.bannerBoton} onPress={sincronizarAhora}>
              <Text style={styles.bannerBotonTexto}>Sincronizar</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {cargando && grupos.length === 0 ? (
        <ActivityIndicator color={colors.primary} />
      ) : grupos.length === 0 ? (
        <Text style={styles.vacio}>No tienes tareas asignadas por ahora.</Text>
      ) : (
        <FlatList
          data={grupos}
          keyExtractor={(g) => g.clave}
          renderItem={renderItem}
          refreshing={cargando}
          onRefresh={cargar}
        />
      )}
    </View>
  );
}