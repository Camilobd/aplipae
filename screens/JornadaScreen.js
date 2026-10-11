import { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ActivityIndicator, Alert, Modal, ScrollView, Button,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import {
  getJornadaPorId, estadoJornada, abrirJornadaAhora, cerrarJornadaAhora,
  extenderJornada, actualizarTiposJornada, eliminarJornada,
} from '../utils/jornadas';
import { getAsignacionesDeJornada, quitarAsignacion } from '../utils/asignaciones';
import { getTiposVehiculo } from '../utils/tiposVehiculo';
import { formatoRango } from '../utils/fechas';
import useAhora from '../hooks/useAhora';
import { styles } from './JornadaScreen.styles';
import { colors } from '../styles/theme';

const INFO_ESTADO = {
  programada: { texto: 'Jornada programada', icono: 'time-outline', color: '#2F80ED' },
  activa: { texto: 'Jornada activa', icono: 'radio-button-on', color: '#2E8B57' },
  cerrada: { texto: 'Jornada cerrada', icono: 'checkmark-circle-outline', color: colors.textMuted },
};

export default function JornadaScreen({ route, navigation }) {
  const { interseccion, jornadaId } = route.params;
  const ahora = useAhora();

  const [jornada, setJornada] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);

  const [tipos, setTipos] = useState([]);
  const [modalTipos, setModalTipos] = useState(false);
  const [seleccionTipos, setSeleccionTipos] = useState([]);

  const cargar = async () => {
    setCargando(true);
    setJornada(await getJornadaPorId(jornadaId));
    const catalogo = await getTiposVehiculo();
    setTipos(catalogo.filter((t) => t.activo));
    setCargando(false);
  };

  useFocusEffect(useCallback(() => { cargar(); }, []));

  const ejecutar = async (accion) => {
    setProcesando(true);
    try {
      await accion();
      await cargar();
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setProcesando(false);
    }
  };

  const abrirAhora = () =>
    Alert.alert('Abrir ahora', 'El inicio de la jornada pasará a ser la hora actual.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Abrir ahora', onPress: () => ejecutar(() => abrirJornadaAhora(jornada)) },
    ]);

  const cerrarAhora = () =>
    Alert.alert(
      'Cerrar ahora',
      'El fin pasará a ser la hora actual. Una jornada cerrada no admite nuevos conteos, solo consulta y reporte.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cerrar ahora', style: 'destructive', onPress: () => ejecutar(() => cerrarJornadaAhora(jornada)) },
      ]
    );

  const extender = () =>
    Alert.alert(
      'Extender jornada',
      'La hora de fin se moverá hacia adelante.',
      [
        { text: '+15 min', onPress: () => ejecutar(() => extenderJornada(jornada, 15)) },
        { text: '+30 min', onPress: () => ejecutar(() => extenderJornada(jornada, 30)) },
        { text: '+1 hora', onPress: () => ejecutar(() => extenderJornada(jornada, 60)) },
      ],
      { cancelable: true }
    );

  const eliminar = () =>
    Alert.alert('Eliminar jornada', '¿Eliminar esta jornada y sus asignaciones? No se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          setProcesando(true);
          try {
            const asignaciones = await getAsignacionesDeJornada(jornada.id);
            await Promise.all(asignaciones.map((a) => quitarAsignacion(a.id)));
            await eliminarJornada(jornada.id);
            navigation.goBack();
          } catch (error) {
            setProcesando(false);
            Alert.alert('Error', error.message);
          }
        },
      },
    ]);

  const tiposActuales = jornada?.tiposSeleccionados || tipos.map((t) => t.codigo);

  const abrirSelectorTipos = () => {
    setSeleccionTipos(tiposActuales);
    setModalTipos(true);
  };

  const toggleTipo = (codigo) =>
    setSeleccionTipos((prev) =>
      prev.includes(codigo) ? prev.filter((c) => c !== codigo) : [...prev, codigo]
    );

  const guardarTipos = async () => {
    try {
      await actualizarTiposJornada(jornada.id, seleccionTipos);
      setModalTipos(false);
      cargar();
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar la tipología: ' + error.message);
    }
  };

  if (cargando) {
    return (
      <View style={styles.centrado}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!jornada) {
    return (
      <View style={styles.centrado}>
        <Text style={styles.aviso}>Esta jornada ya no existe.</Text>
      </View>
    );
  }

  // Jornada creada con el modelo anterior (sin horario): solo se puede eliminar
  if (!jornada.fechaInicio?.toDate) {
    return (
      <View style={styles.centrado}>
        <Text style={styles.aviso}>
          Esta jornada es del modelo anterior (sin horario planificado). Elimínala y crea una nueva.
        </Text>
        {procesando ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <TouchableOpacity style={styles.botonPeligro} onPress={eliminar}>
            <Text style={styles.botonPeligroTexto}>Eliminar jornada</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  const estado = estadoJornada(jornada, ahora);
  const info = INFO_ESTADO[estado];
  const rango = formatoRango(jornada.fechaInicio.toDate(), jornada.fechaFin.toDate());

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <View style={styles.tarjetaEstado}>
        <Ionicons name={info.icono} size={28} color={info.color} />
        <Text style={[styles.estadoTexto, { color: info.color }]}>{info.texto}</Text>
        <Text style={styles.fechaTexto}>{rango}</Text>
      </View>

      {procesando ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <>
          {estado === 'programada' && (
            <TouchableOpacity style={styles.botonPrincipal} onPress={abrirAhora}>
              <Text style={styles.botonPrincipalTexto}>Abrir ahora</Text>
            </TouchableOpacity>
          )}

          {estado === 'activa' && (
            <TouchableOpacity style={styles.botonPrincipal} onPress={extender}>
              <Text style={styles.botonPrincipalTexto}>Extender jornada</Text>
            </TouchableOpacity>
          )}

          {estado !== 'cerrada' && (
            <>
              <TouchableOpacity style={styles.botonSecundario} onPress={abrirSelectorTipos}>
                <Text style={styles.botonSecundarioTexto}>
                  Tipología para esta jornada ({tiposActuales.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.botonSecundario}
                onPress={() => navigation.navigate('Asignaciones', { interseccion, jornada })}
              >
                <Text style={styles.botonSecundarioTexto}>Asignar aforadores a movimientos</Text>
              </TouchableOpacity>
            </>
          )}

          {estado === 'cerrada' && (
            <Text style={styles.aviso}>Jornada cerrada: solo consulta y reporte.</Text>
          )}

          {estado === 'programada' && (
            <TouchableOpacity
              style={styles.botonNeutro}
              onPress={() => navigation.navigate('JornadaForm', { interseccion, jornada })}
            >
              <Text style={styles.botonNeutroTexto}>Editar horario</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.botonNeutro}
            onPress={() => navigation.navigate('JornadaForm', { interseccion, plantilla: jornada })}
          >
            <Text style={styles.botonNeutroTexto}>Duplicar jornada</Text>
          </TouchableOpacity>

          {estado === 'activa' && (
            <TouchableOpacity style={styles.botonPeligro} onPress={cerrarAhora}>
              <Text style={styles.botonPeligroTexto}>Cerrar ahora</Text>
            </TouchableOpacity>
          )}


          <TouchableOpacity style={styles.botonPeligro} onPress={eliminar}>
            <Text style={styles.botonPeligroTexto}>Eliminar jornada</Text>
          </TouchableOpacity>

        </>
      )}

      <Modal visible={modalTipos} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ width: '85%', maxHeight: '75%', backgroundColor: colors.primary, borderRadius: 12, padding: 20 }}>
            <Text style={{ color: colors.surface, fontWeight: '700', fontSize: 16, marginBottom: 10, textAlign: 'center' }}>
              Tipos de vehículo para esta jornada
            </Text>
            <ScrollView>
              {tipos.map((t) => {
                const marcado = seleccionTipos.includes(t.codigo);
                return (
                  <TouchableOpacity
                    key={t.id}
                    style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8 }}
                    onPress={() => toggleTipo(t.codigo)}
                  >
                    <Ionicons
                      name={marcado ? 'checkbox' : 'square-outline'}
                      size={20}
                      color={colors.surface}
                      style={{ marginRight: 8 }}
                    />
                    <Text style={{ color: colors.surface, flex: 1 }}>{t.codigo} — {t.nombre}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <View style={{ marginTop: 15 }}>
              <Button title="Guardar" onPress={guardarTipos} />
            </View>
            <View style={{ marginTop: 10 }}>
              <Button title="Cancelar" color="#888" onPress={() => setModalTipos(false)} />
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}