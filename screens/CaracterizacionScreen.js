import { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, Modal, Button, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { actualizarInterseccion } from '../utils/intersecciones';
import {
  getTrayectoriasDeInterseccion, crearTrayectoria, actualizarTrayectoria, eliminarTrayectoria,
} from '../utils/trayectorias';
import { getAsignacionesDeTrayectorias, quitarAsignacion } from '../utils/asignaciones';
import {
  ACCESOS, nombreAcceso, ordenarCodigos, ordenarTrayectorias, salidasDe, tituloTrayectoria,
} from '../constants/rilsa';
import { styles } from './CaracterizacionScreen.styles';
import { colors } from '../styles/theme';


export default function CaracterizacionScreen({ route, navigation }) {
  const { interseccion } = route.params;

  const [trayectorias, setTrayectorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editando, setEditando] = useState(null); // trayectoria que se edita, o null si es nueva
  const [entradaSel, setEntradaSel] = useState(null);
  const [salidasSel, setSalidasSel] = useState([]);
  const [guardando, setGuardando] = useState(false);

  const cargar = async () => {
    setCargando(true);
    const lista = await getTrayectoriasDeInterseccion(interseccion.id);
    setTrayectorias(ordenarTrayectorias(lista));
    setCargando(false);
  };

  useFocusEffect(useCallback(() => { cargar(); }, []));

  // Deja la intersección al día: caracterizada si tiene al menos una trayectoria
  const sincronizarInterseccion = async () => {
    const lista = await getTrayectoriasDeInterseccion(interseccion.id);
    const entradas = ordenarCodigos([...new Set(lista.map((t) => t.origenCodigo))]);
    await actualizarInterseccion(interseccion.id, {
      caracterizada: lista.length > 0,
      entradasCodigos: entradas,
    });
  };

  // Salidas de esta entrada que ya usa otra trayectoria: { S: 2, NE: 1 } (valor = número de trayectoria)
  const usadasPorOtras = (entrada, lista = trayectorias, excluirId = editando?.id) => {
    const mapa = {};
    lista.forEach((t) => {
      if (t.origenCodigo !== entrada || t.id === excluirId) return;
      salidasDe(t).forEach((d) => { mapa[d] = t.numero; });
    });
    return mapa;
  };

  const abrirNueva = () => {
    setEditando(null);
    setEntradaSel(null);
    setSalidasSel([]);
    setModalVisible(true);
  };

  const abrirEditar = (t) => {
    setEditando(t);
    setEntradaSel(t.origenCodigo);
    setSalidasSel(salidasDe(t));
    setModalVisible(true);
  };

  const cerrarModal = () => {
    setModalVisible(false);
    setEditando(null);
  };

  const elegirEntrada = (codigo) => {
    const ocupadas = usadasPorOtras(codigo);
    setEntradaSel(codigo);
    setSalidasSel((prev) => prev.filter((d) => !ocupadas[d]));
  };

  const usadas = entradaSel ? usadasPorOtras(entradaSel) : {};
  const disponibles = ACCESOS.map((a) => a.codigo).filter((c) => !usadas[c]);
  const todasMarcadas = disponibles.length > 0 && disponibles.every((c) => salidasSel.includes(c));

  const toggleSalida = (codigo) => {
    if (usadas[codigo]) return;
    setSalidasSel((prev) => (prev.includes(codigo) ? prev.filter((c) => c !== codigo) : [...prev, codigo]));
  };

  const toggleTodas = () => setSalidasSel(todasMarcadas ? [] : disponibles);

  const guardar = async () => {
    if (!entradaSel) {
      Alert.alert('Falta la entrada', 'Elige el acceso por donde entran los vehículos.');
      return;
    }
    if (salidasSel.length === 0) {
      Alert.alert('Faltan salidas', 'Marca al menos una salida para esta trayectoria.');
      return;
    }

    setGuardando(true);
    try {
      // Se revisa de nuevo con datos frescos, por si otra persona cambió algo
      const frescas = await getTrayectoriasDeInterseccion(interseccion.id);
      const ocupadas = usadasPorOtras(entradaSel, frescas);
      const repetidas = salidasSel.filter((d) => ocupadas[d]);
      if (repetidas.length > 0) {
        Alert.alert(
          'Salidas repetidas',
          `${repetidas.map((d) => nombreAcceso(d)).join(', ')} ya se usa en otra trayectoria de esta entrada.`
        );
        return;
      }

      const salidas = ordenarCodigos(salidasSel);
      if (editando) {
        await actualizarTrayectoria(editando.id, { destinosCodigos: salidas });
      } else {
        await crearTrayectoria({
          interseccionId: interseccion.id,
          origenCodigo: entradaSel,
          destinosCodigos: salidas,
        });
      }
      await sincronizarInterseccion();
      cerrarModal();
      await cargar();
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar: ' + error.message);
    } finally {
      setGuardando(false);
    }
  };

  const quitar = async (t) => {
    try {
      const afectadas = await getAsignacionesDeTrayectorias([t.id]);
      Alert.alert(
        'Quitar trayectoria',
        afectadas.length > 0
          ? `Se quitará la ${tituloTrayectoria(t)} y sus ${afectadas.length} asignación(es) en jornadas. ¿Continuar?`
          : `¿Quitar la ${tituloTrayectoria(t)}?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Quitar',
            style: 'destructive',
            onPress: async () => {
              setCargando(true);
              try {
                await Promise.all(afectadas.map((a) => quitarAsignacion(a.id)));
                await eliminarTrayectoria(t.id);
                await sincronizarInterseccion();
                await cargar();
              } catch (error) {
                setCargando(false);
                Alert.alert('Error', 'No se pudo quitar: ' + error.message);
              }
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  if (cargando) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <Text style={styles.subtitulo}>
          Define las trayectorias de "{interseccion.nombre}" una por una: cada una tiene una entrada y una o varias salidas.
        </Text>

        <TouchableOpacity style={styles.botonNuevo} onPress={abrirNueva}>
          <Ionicons name="add" size={20} color={colors.surface} />
          <Text style={styles.botonNuevoTexto}>Agregar trayectoria</Text>
        </TouchableOpacity>

        {trayectorias.length === 0 ? (
          <Text style={styles.vacio}>Aún no has definido ninguna trayectoria para esta intersección.</Text>
        ) : (
          trayectorias.map((t) => (
            <View key={t.id} style={styles.tarjeta}>
              <View style={{ flex: 1 }}>
                <Text style={styles.numeroTexto}>{tituloTrayectoria(t)}</Text>
                <Text style={styles.entradaTitulo}>
                  Entra por {nombreAcceso(t.origenCodigo)} ({t.origenCodigo})
                </Text>
                <Text style={styles.salidasEtiqueta}>Sale por</Text>
                <Text style={styles.salidasTexto}>
                  {salidasDe(t)
                    .map((d) => `${nombreAcceso(d)} (${d})${d === t.origenCodigo ? ' · retorno' : ''}`)
                    .join(', ')}
                </Text>
              </View>
              <View style={styles.acciones}>
                <TouchableOpacity style={styles.botonAccion} onPress={() => abrirEditar(t)}>
                  <Ionicons name="create-outline" size={20} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.botonAccion} onPress={() => quitar(t)}>
                  <Ionicons name="trash-outline" size={20} color={colors.danger} />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        {trayectorias.length > 0 && (
          <Text style={styles.resumen}>
            {trayectorias.length} {trayectorias.length === 1 ? 'trayectoria definida' : 'trayectorias definidas'}
          </Text>
        )}
 {trayectorias.length > 0 && (
          <TouchableOpacity
            style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
              backgroundColor: colors.primary, paddingVertical: 14, borderRadius: 12, marginTop: 20,
            }}
            onPress={() => navigation.navigate('Jornadas', { interseccion })}
          >
            <Ionicons name="calendar-outline" size={18} color={colors.surface} />
            <Text style={{ color: colors.surface, fontWeight: '700', fontSize: 15 }}>
              Siguiente: planificar jornada y asignar aforadores
            </Text>
          </TouchableOpacity>
        )}

      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalFondo}>
          <View style={styles.modalCaja}>
            <Text style={styles.modalTitulo}>
              {editando ? `Editar ${tituloTrayectoria(editando)}` : 'Nueva trayectoria'}
            </Text>
            <Text style={styles.modalSubtitulo}>Una entrada y una o varias salidas</Text>

            <ScrollView>
              <View style={styles.seccionCabecera}>
                <Text style={styles.seccionLabel}>Entra por</Text>
              </View>
              {editando ? (
                <Text style={styles.entradaFija}>
                  {nombreAcceso(editando.origenCodigo)} ({editando.origenCodigo})
                </Text>
              ) : (
                <View style={styles.chipsFila}>
                  {ACCESOS.map(({ nombre, codigo }) => (
                    <TouchableOpacity
                      key={codigo}
                      style={[styles.chip, entradaSel === codigo && styles.chipActivo]}
                      onPress={() => elegirEntrada(codigo)}
                    >
                      <Text style={styles.chipTexto}>{nombre} ({codigo})</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {entradaSel ? (
                <>
                  <View style={styles.seccionCabecera}>
                    <Text style={styles.seccionLabel}>Sale por (puedes marcar varias)</Text>
                    <TouchableOpacity onPress={toggleTodas}>
                      <Text style={styles.accionLink}>
                        {todasMarcadas ? 'Quitar todas' : 'Marcar todas'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.chipsFila}>
                    {ACCESOS.map(({ nombre, codigo }) => {
                      const ocupada = usadas[codigo];
                      const activa = salidasSel.includes(codigo);
                      return (
                        <TouchableOpacity
                          key={codigo}
                          disabled={!!ocupada}
                          style={[
                            styles.chip,
                            activa && styles.chipActivo,
                            !!ocupada && styles.chipDeshabilitado,
                          ]}
                          onPress={() => toggleSalida(codigo)}
                        >
                          <Text style={styles.chipTexto}>
                            {nombre} ({codigo})
                            {codigo === entradaSel ? ' · retorno' : ''}
                            {ocupada ? ` · en T${ocupada}` : ''}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  <Text style={styles.ayuda}>
                    Entrar y salir por el mismo acceso es un retorno (U). Una salida ya usada por otra trayectoria de esta entrada no se puede repetir.
                  </Text>
                  <Text style={styles.cuenta}>
                    {salidasSel.length} {salidasSel.length === 1 ? 'salida' : 'salidas'} desde {nombreAcceso(entradaSel)}
                  </Text>
                </>
              ) : (
                <Text style={styles.ayuda}>Primero elige la entrada.</Text>
              )}
            </ScrollView>

            {guardando ? (
              <ActivityIndicator color={colors.surface} style={{ marginVertical: 10 }} />
            ) : (
              <>
                <View style={{ marginTop: 15 }}>
                  <Button title="Guardar" onPress={guardar} />
                </View>
                <View style={{ marginTop: 10 }}>
                  <Button title="Cancelar" color="#888" onPress={cerrarModal} />
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}