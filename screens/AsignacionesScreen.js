import { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, Modal, Button, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { getAccesos } from '../utils/accesos';
import { getMovimientosDeAccesos } from '../utils/movimientos';
import { getAforadores } from '../utils/aforadores';
import { getTiposVehiculo } from '../utils/tiposVehiculo';
import {
  getAsignacionesDeJornada, asignarAforador, actualizarAsignacion, quitarAsignacion, reasignarAforador,
} from '../utils/asignaciones';
import { styles } from './AsignacionesScreen.styles';
import { colors } from '../styles/theme';

export default function AsignacionesScreen({ route, navigation }) {
  const { interseccion, jornada } = route.params;

  const [cargando, setCargando] = useState(true);
  const [accesos, setAccesos] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [aforadores, setAforadores] = useState([]);
  const [asignaciones, setAsignaciones] = useState([]);
  const [catalogo, setCatalogo] = useState([]);

  const [modalMovimiento, setModalMovimiento] = useState(null);
  // config: { [aforadorId]: { tipos: [codigos], asignacionId: id|null } }
  const [config, setConfig] = useState({});
  const [reemplazando, setReemplazando] = useState(null); // aforadorId que se está reemplazando
  const [guardando, setGuardando] = useState(false);

  const cargar = async () => {
    setCargando(true);
    const accesosLista = await getAccesos(interseccion.id);
    const accesoIds = accesosLista.map((a) => a.id);
    const [movimientosLista, aforadoresLista, asignacionesLista, catalogoLista] = await Promise.all([
      getMovimientosDeAccesos(accesoIds),
      getAforadores(),
      getAsignacionesDeJornada(jornada.id),
      getTiposVehiculo(),
    ]);
    setAccesos(accesosLista);
    setMovimientos(movimientosLista.filter((m) => m.activo));
    setAforadores(aforadoresLista.filter((a) => a.activo));
    setAsignaciones(asignacionesLista);
    setCatalogo(catalogoLista);
    setCargando(false);
  };

  useFocusEffect(useCallback(() => { cargar(); }, []));

  // Tipos que cuenta la jornada (siempre incluye "Otros / no identificado", RN-4)
  const seleccionJornada = jornada.tiposSeleccionados;
  const universo = catalogo.filter(
    (t) => t.codigo === 'OTR' || (t.activo && (!seleccionJornada || seleccionJornada.includes(t.codigo)))
  );
  const grupos = [...new Set(universo.map((t) => t.grupo))];

  // Textos legibles: nombre y código
  const etiquetaTipo = (codigo) => {
    const t = catalogo.find((x) => x.codigo === codigo);
    return t ? `${t.nombre} (${t.codigo})` : codigo;
  };
  const etiquetasTipos = (codigos) => codigos.map(etiquetaTipo).join(', ');

  const nombreAforador = (id) => aforadores.find((a) => a.id === id)?.nombre || 'el aforador';
  const primerNombre = (id) => nombreAforador(id).split(' ')[0];
  const asignadosDe = (movimientoId) => asignaciones.filter((a) => a.movimientoId === movimientoId);

  const sinCubrirDe = (movimientoId) => {
    const asigs = asignadosDe(movimientoId);
    if (asigs.length === 0) return [];
    const cubiertos = new Set(asigs.flatMap((a) => a.tiposAsignados || []));
    return universo.filter((t) => !cubiertos.has(t.codigo)).map((t) => t.codigo);
  };

  const abrirModal = (movimiento) => {
    const inicial = {};
    asignadosDe(movimiento.id).forEach((a) => {
      inicial[a.aforadorId] = { tipos: a.tiposAsignados || [], asignacionId: a.id };
    });
    setConfig(inicial);
    setReemplazando(null);
    setModalMovimiento(movimiento);
  };

  const cerrarModal = () => {
    setModalMovimiento(null);
    setReemplazando(null);
  };

  const toggleAforador = (aforadorId) => {
    setConfig((prev) => {
      if (prev[aforadorId]) {
        const { [aforadorId]: _quitado, ...resto } = prev;
        return resto;
      }
      // El nuevo aforador parte con los tipos que nadie ha tomado todavía
      const tomados = new Set(Object.values(prev).flatMap((c) => c.tipos));
      const libres = universo.filter((t) => !tomados.has(t.codigo)).map((t) => t.codigo);
      return { ...prev, [aforadorId]: { tipos: libres, asignacionId: null } };
    });
  };

  // Un tipo pertenece a un solo aforador: si lo tenía otro, pasa al actual
  const toggleTipo = (aforadorId, codigo) => {
    setConfig((prev) => {
      const actual = prev[aforadorId];
      if (actual.tipos.includes(codigo)) {
        return { ...prev, [aforadorId]: { ...actual, tipos: actual.tipos.filter((c) => c !== codigo) } };
      }
      const siguiente = {};
      Object.keys(prev).forEach((id) => {
        siguiente[id] =
          id === aforadorId
            ? { ...prev[id], tipos: [...prev[id].tipos, codigo] }
            : { ...prev[id], tipos: prev[id].tipos.filter((c) => c !== codigo) };
      });
      return siguiente;
    });
  };

  // Asigna o quita todos los tipos de una categoría de una vez
  const toggleGrupo = (aforadorId, codigos) => {
    setConfig((prev) => {
      const todosMios = codigos.every((c) => prev[aforadorId].tipos.includes(c));
      const siguiente = {};
      Object.keys(prev).forEach((id) => {
        if (id === aforadorId) {
          siguiente[id] = {
            ...prev[id],
            tipos: todosMios
              ? prev[id].tipos.filter((c) => !codigos.includes(c))
              : [...new Set([...prev[id].tipos, ...codigos])],
          };
        } else {
          siguiente[id] = {
            ...prev[id],
            tipos: todosMios ? prev[id].tipos : prev[id].tipos.filter((c) => !codigos.includes(c)),
          };
        }
      });
      return siguiente;
    });
  };

  const idsConfig = Object.keys(config);
  const sinCubrirModal =
    idsConfig.length > 0
      ? universo.filter((t) => !idsConfig.some((id) => config[id].tipos.includes(t.codigo))).map((t) => t.codigo)
      : [];

  const persistir = async () => {
    setGuardando(true);
    try {
      const existentes = asignadosDe(modalMovimiento.id);
      const operaciones = [];

      idsConfig.forEach((aforadorId) => {
        const c = config[aforadorId];
        const existente = existentes.find((a) => a.aforadorId === aforadorId);
        if (existente) {
          operaciones.push(actualizarAsignacion(existente.id, { tiposAsignados: c.tipos }));
        } else {
          operaciones.push(
            asignarAforador({
              jornadaId: jornada.id,
              movimientoId: modalMovimiento.id,
              aforadorId,
              tiposAsignados: c.tipos,
            })
          );
        }
      });

      existentes
        .filter((a) => !idsConfig.includes(a.aforadorId))
        .forEach((a) => operaciones.push(quitarAsignacion(a.id)));

      await Promise.all(operaciones);
      cerrarModal();
      await cargar();
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar la asignación: ' + error.message);
    } finally {
      setGuardando(false);
    }
  };

  const guardar = () => {
    const sinTipos = idsConfig.find((id) => config[id].tipos.length === 0);
    if (sinTipos) {
      Alert.alert(
        'Falta asignar tipos',
        `${nombreAforador(sinTipos)} no tiene tipos asignados. Dale al menos uno o quítalo del movimiento.`
      );
      return;
    }
    if (sinCubrirModal.length > 0) {
      Alert.alert(
        'Tipos sin cubrir',
        `Ningún aforador cuenta: ${etiquetasTipos(sinCubrirModal)}. ¿Guardar de todos modos?`,
        [
          { text: 'Volver', style: 'cancel' },
          { text: 'Guardar de todos modos', onPress: persistir },
        ]
      );
      return;
    }
    persistir();
  };

  const confirmarReemplazo = (nuevo) => {
    const original = config[reemplazando];
    const asignacion = asignaciones.find((a) => a.id === original.asignacionId);
    Alert.alert(
      'Reemplazar aforador',
      `${nombreAforador(reemplazando)} será reemplazado por ${nuevo.nombre}. Hereda sus tipos de vehículo y el cambio queda en el historial.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Reemplazar',
          onPress: async () => {
            setGuardando(true);
            try {
              await reasignarAforador(asignacion, nuevo.id);
              cerrarModal();
              await cargar();
            } catch (error) {
              Alert.alert('Error', 'No se pudo reemplazar: ' + error.message);
            } finally {
              setGuardando(false);
            }
          },
        },
      ]
    );
  };

  const irACrearAforador = () => {
    cerrarModal();
    navigation.navigate('CrearAforador');
  };

  if (cargando) {
    return (
      <View style={[styles.raiz, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (movimientos.length === 0) {
    return (
      <View style={styles.raiz}>
        <Text style={styles.vacio}>
          Esta intersección no tiene movimientos activos. Revisa la caracterización (HU-02b).
        </Text>
      </View>
    );
  }

  const candidatos = aforadores.filter((a) => !config[a.id]);

  return (
    <View style={styles.raiz}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.subtitulo}>
          Toca el ícono junto a cada movimiento para asignar aforadores y los tipos de vehículo que cuenta cada uno.
        </Text>

        {accesos.map((acceso) => {
          const movsDeAcceso = movimientos.filter((m) => m.accesoId === acceso.id);
          if (movsDeAcceso.length === 0) return null;
          return (
            <View key={acceso.id} style={styles.tarjetaAcceso}>
              <Text style={styles.tarjetaTitulo}>Acceso {acceso.orientacion}</Text>
              {movsDeAcceso.map((mov) => {
                const asigs = asignadosDe(mov.id);
                const faltan = sinCubrirDe(mov.id);
                return (
                  <View key={mov.id} style={styles.movFila}>
                    <View style={styles.movInfo}>
                      <Text style={styles.movTexto}>{mov.nombre}</Text>
                      <Text style={styles.movCodigo}>{mov.codigo}</Text>

                      {asigs.length === 0 ? (
                        <Text style={styles.sinAforador}>Sin aforador asignado</Text>
                      ) : (
                        asigs.map((a) => (
                          <View key={a.id} style={styles.asigFila}>
                            <Text style={styles.asigNombre}>{nombreAforador(a.aforadorId)}</Text>
                            <Text style={styles.asigDetalle}>
                              {a.tiposAsignados?.length ? etiquetasTipos(a.tiposAsignados) : 'Sin tipos definidos'}
                            </Text>
                          </View>
                        ))
                      )}

                      {faltan.length > 0 && (
                        <Text style={styles.advertencia}>⚠ Sin cubrir: {etiquetasTipos(faltan)}</Text>
                      )}
                    </View>
                    <TouchableOpacity style={styles.botonAsignar} onPress={() => abrirModal(mov)}>
                      <Ionicons name="person-add-outline" size={20} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          );
        })}
      </ScrollView>

      <Modal visible={!!modalMovimiento} animationType="slide" transparent>
        <View style={styles.modalFondo}>
          <View style={styles.modalCaja}>
            {reemplazando ? (
              <>
                <Text style={styles.modalTitulo}>¿Quién reemplaza a {nombreAforador(reemplazando)}?</Text>
                <Text style={styles.modalSubtitulo}>El nuevo aforador hereda sus tipos de vehículo.</Text>
                <ScrollView>
                  {candidatos.length === 0 ? (
                    <Text style={styles.vacioModal}>No hay otros aforadores activos disponibles.</Text>
                  ) : (
                    candidatos.map((af) => (
                      <TouchableOpacity
                        key={af.id}
                        style={styles.aforadorBloque}
                        onPress={() => confirmarReemplazo(af)}
                      >
                        <Text style={styles.aforadorNombre}>{af.nombre}</Text>
                      </TouchableOpacity>
                    ))
                  )}
                </ScrollView>
                <View style={{ marginTop: 15 }}>
                  <Button title="Volver" color="#888" onPress={() => setReemplazando(null)} />
                </View>
              </>
            ) : (
              <>
                <Text style={styles.modalTitulo}>
                  {modalMovimiento?.nombre} ({modalMovimiento?.codigo})
                </Text>
                <Text style={styles.modalSubtitulo}>Elige aforadores y los tipos que cuenta cada uno</Text>

                <TouchableOpacity style={styles.botonNuevoAforador} onPress={irACrearAforador}>
                  <Ionicons name="person-add" size={16} color={colors.surface} />
                  <Text style={styles.botonNuevoAforadorTexto}>+ Nuevo aforador</Text>
                </TouchableOpacity>

                <ScrollView>
                  {aforadores.length === 0 ? (
                    <Text style={styles.vacioModal}>No hay aforadores activos registrados.</Text>
                  ) : (
                    aforadores.map((af) => {
                      const c = config[af.id];
                      return (
                        <View key={af.id} style={styles.aforadorBloque}>
                          <View style={styles.aforadorFila}>
                            <TouchableOpacity
                              style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
                              onPress={() => toggleAforador(af.id)}
                            >
                              <View style={[styles.checkbox, c && styles.checkboxMarcado]}>
                                {c && <Ionicons name="checkmark" size={14} color={colors.surface} />}
                              </View>
                              <Text style={styles.aforadorNombre}>{af.nombre}</Text>
                            </TouchableOpacity>
                            {c?.asignacionId && (
                              <TouchableOpacity onPress={() => setReemplazando(af.id)} style={{ padding: 6 }}>
                                <Ionicons name="swap-horizontal" size={20} color={colors.surface} />
                              </TouchableOpacity>
                            )}
                          </View>

                          {c && (
                            <View style={styles.panel}>
                              <Text style={styles.panelTitulo}>Tipos de vehículo que cuenta</Text>
                              <Text style={styles.ayudaPanel}>
                                Cada tipo pertenece a un solo aforador. Si tocas uno que ya tiene dueño, pasa a este aforador.
                              </Text>

                              {grupos.map((grupo) => {
                                const tiposGrupo = universo.filter((t) => t.grupo === grupo);
                                const codigosGrupo = tiposGrupo.map((t) => t.codigo);
                                const todosMios = codigosGrupo.every((cod) => c.tipos.includes(cod));
                                return (
                                  <View key={grupo}>
                                    <View style={styles.grupoCabecera}>
                                      <Text style={styles.grupoTitulo}>{grupo}</Text>
                                      {tiposGrupo.length > 1 && (
                                        <TouchableOpacity onPress={() => toggleGrupo(af.id, codigosGrupo)}>
                                          <Text style={styles.grupoAccion}>
                                            {todosMios ? 'Quitar todos' : 'Asignar todos'}
                                          </Text>
                                        </TouchableOpacity>
                                      )}
                                    </View>

                                    {tiposGrupo.map((t) => {
                                      const mio = c.tipos.includes(t.codigo);
                                      const dueno = idsConfig.find(
                                        (id) => id !== af.id && config[id].tipos.includes(t.codigo)
                                      );
                                      return (
                                        <TouchableOpacity
                                          key={t.codigo}
                                          style={[styles.tipoFila, mio && styles.tipoFilaActiva]}
                                          onPress={() => toggleTipo(af.id, t.codigo)}
                                        >
                                          <View style={[styles.tipoCheck, mio && styles.tipoCheckActivo]}>
                                            {mio && <Ionicons name="checkmark" size={12} color={colors.surface} />}
                                          </View>
                                          <Text style={styles.tipoCodigo}>{t.codigo}</Text>
                                          <Text
                                            style={[styles.tipoNombre, !mio && dueno && styles.tipoNombreTomado]}
                                            numberOfLines={2}
                                          >
                                            {t.nombre}
                                          </Text>
                                          {!mio && dueno && (
                                            <Text style={styles.tipoDueno}>de {primerNombre(dueno)}</Text>
                                          )}
                                        </TouchableOpacity>
                                      );
                                    })}
                                  </View>
                                );
                              })}

                              {c.tipos.length === 0 && (
                                <Text style={styles.ayuda}>Toca un tipo para asignárselo a este aforador.</Text>
                              )}
                            </View>
                          )}
                        </View>
                      );
                    })
                  )}
                </ScrollView>

                {sinCubrirModal.length > 0 && (
                  <View style={styles.avisoModal}>
                    <Text style={styles.avisoModalTexto}>⚠ Sin cubrir: {etiquetasTipos(sinCubrirModal)}</Text>
                  </View>
                )}

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
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}