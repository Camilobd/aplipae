import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, Pressable, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import NetInfo from '@react-native-community/netinfo';
import { getJornadaPorId } from '../utils/jornadas';
import {
  cargarEstado, getSesion, guardarSesion, registrar, anularUltimo, contarPendientes,
} from '../utils/conteoLocal';
import { sincronizar, hayInternet } from '../utils/conteoSync';
import { conTiempo } from '../utils/promesas';
import { formatoDuracion, formatoHora } from '../utils/fechas';
import {
  nombreAcceso, ordenAcceso, salidasDe, tituloTrayectoria, textoSalidas,
} from '../constants/rilsa';
import IconoTipo from '../components/IconoTipo';
import useAhora from '../hooks/useAhora';
import { styles } from './ConteoScreen.styles';
import { colors, spacing } from '../styles/theme';

export default function ConteoScreen({ route }) {
  const { aforador, jornada, interseccion, entrada, tareas, catalogo } = route.params;
  const ahora = useAhora();
  // Espacio que ocupa la barra del sistema (botones o línea de gestos) en la parte de abajo
  const insets = useSafeAreaInsets();

  const trayectoriaIds = useMemo(() => tareas.map((t) => t.trayectoria.id), [tareas]);

  // Para cada tipo asignado: por qué salidas puede salir y a qué trayectoria pertenece cada salida
  const { tipos, salidasPorTipo } = useMemo(() => {
    const mapa = {};
    tareas.forEach(({ asignacion, trayectoria }) => {
      (asignacion.tiposAsignados || []).forEach((tipo) => {
        if (!mapa[tipo]) mapa[tipo] = {};
        salidasDe(trayectoria).forEach((salida) => {
          if (!mapa[tipo][salida]) mapa[tipo][salida] = trayectoria.id;
        });
      });
    });
    const porTipo = {};
    Object.keys(mapa).forEach((tipo) => {
      porTipo[tipo] = Object.keys(mapa[tipo])
        .sort((a, b) => ordenAcceso(a) - ordenAcceso(b))
        .map((salida) => ({ salida, trayectoriaId: mapa[tipo][salida] }));
    });
    return {
      tipos: catalogo.filter((t) => porTipo[t.codigo]?.length > 0),
      salidasPorTipo: porTipo,
    };
  }, [tareas, catalogo]);

  const grupos = useMemo(() => [...new Set(tipos.map((t) => t.grupo))], [tipos]);

  const nombreTipo = (codigo) => catalogo.find((t) => t.codigo === codigo)?.nombre ?? codigo;

  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState(null);
  const [sesion, setSesion] = useState(null);
  const [iniciando, setIniciando] = useState(false);
  const [conteos, setConteos] = useState({});
  const [ultimo, setUltimo] = useState(null);
  const [pendienteTipo, setPendienteTipo] = useState(null);
  const [sync, setSync] = useState({ estado: 'ok', pendientes: 0, mensaje: null });
  const [sincronizandoManual, setSincronizandoManual] = useState(false);
  const [inicioMs, setInicioMs] = useState(jornada.fechaInicio.toMillis());
  const [finMs, setFinMs] = useState(jornada.fechaFin.toMillis());
  const [finalizada, setFinalizada] = useState(() => Date.now() >= jornada.fechaFin.toMillis());

  const inicioRef = useRef(inicioMs);
  const finRef = useRef(finMs);
  const montado = useRef(true);
  const deshaciendo = useRef(false);
  inicioRef.current = inicioMs;
  finRef.current = finMs;

  /* ---------- Carga inicial ---------- */
  useEffect(() => {
    montado.current = true;
    (async () => {
      try {
        const [estado, ses] = await Promise.all([
          cargarEstado(jornada.id, aforador.id, trayectoriaIds),
          getSesion(jornada.id, aforador.id, entrada),
        ]);
        const p = await contarPendientes(jornada.id, aforador.id);
        if (!montado.current) return;
        setConteos(estado.conteos);
        setUltimo(estado.ultimo);
        setSesion(ses);
        setSync((s) => ({ ...s, pendientes: p }));
      } catch (error) {
        if (montado.current) setErrorCarga(error.message);
      } finally {
        if (montado.current) setCargando(false);
      }
    })();
  }, []);

  /* ---------- Pantalla encendida mientras se cuenta ---------- */
  useEffect(() => {
    if (!sesion || finalizada) return undefined;
    activateKeepAwakeAsync('conteo').catch(() => {});
    return () => {
      try {
        Promise.resolve(deactivateKeepAwake('conteo')).catch(() => {});
      } catch (e) {}
    };
  }, [sesion, finalizada]);

  /* ---------- Fin de la jornada ---------- */
  useEffect(() => {
    const resto = finMs - Date.now();
    if (resto <= 0) {
      setFinalizada(true);
      return undefined;
    }
    setFinalizada(false);
    const t = setTimeout(() => setFinalizada(true), Math.min(resto, 2147483000));
    return () => clearTimeout(t);
  }, [finMs]);

  /* ---------- Sincronización ---------- */
  const aplicarResultado = (r) => {
    if (!montado.current || r.estado === 'ocupado') return;
    setSync({ estado: r.estado, pendientes: r.pendientes ?? 0, mensaje: r.mensaje ?? null });
  };

  const ejecutarSync = useCallback(async () => {
    aplicarResultado(await sincronizar(jornada.id, aforador.id));
  }, []);

  const refrescarJornada = useCallback(async () => {
    try {
      if (!(await hayInternet())) return;
      const j = await conTiempo(getJornadaPorId(jornada.id), 8000);
      if (!montado.current || !j?.fechaInicio?.toDate) return;
      setInicioMs(j.fechaInicio.toMillis());
      setFinMs(j.fechaFin.toMillis());
    } catch (e) {}
  }, []);

  useEffect(() => {
    const cicloSync = setInterval(ejecutarSync, 30000);
    const cicloJornada = setInterval(refrescarJornada, 60000);
    // Al abrir la pantalla y cada vez que vuelve la conexión
    const suscripcion = NetInfo.addEventListener((estado) => {
      if (estado.isConnected && estado.isInternetReachable !== false) {
        ejecutarSync();
        refrescarJornada();
      }
    });
    return () => {
      montado.current = false;
      clearInterval(cicloSync);
      clearInterval(cicloJornada);
      suscripcion();
      sincronizar(jornada.id, aforador.id).catch(() => {}); // al salir
    };
  }, []);

  const sincronizarManual = async () => {
    setSincronizandoManual(true);
    const r = await sincronizar(jornada.id, aforador.id);
    if (montado.current) setSincronizandoManual(false);
    aplicarResultado(r);
    if (r.estado === 'sin_conexion') {
      Alert.alert(
        'Sin conexión',
        'Los datos están guardados en el teléfono y se enviarán cuando haya internet.'
      );
    }
  };

  const alTocarSync = () => {
    if (sync.estado === 'error' && sync.mensaje) {
      Alert.alert('Error al sincronizar', sync.mensaje, [
        { text: 'Cerrar', style: 'cancel' },
        { text: 'Reintentar', onPress: sincronizarManual },
      ]);
      return;
    }
    sincronizarManual();
  };

  /* ---------- Inicio con ubicación ---------- */
  const comenzar = async (ubic) => {
    try {
      await guardarSesion({
        jornadaId: jornada.id,
        aforadorId: aforador.id,
        entrada,
        lat: ubic?.lat,
        lng: ubic?.lng,
        precision: ubic?.precision,
        verificada: !!ubic,
      });
      setSesion({ inicio: Date.now(), ubicacion_verificada: ubic ? 1 : 0 });
      ejecutarSync();
    } catch (error) {
      Alert.alert('Error', 'No se pudo iniciar el conteo: ' + error.message);
    }
  };

  const iniciar = async () => {
    setIniciando(true);
    let ubic = null;
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const pos = await conTiempo(
          Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
          12000,
          'Sin señal GPS'
        );
        ubic = { lat: pos.coords.latitude, lng: pos.coords.longitude, precision: pos.coords.accuracy };
      }
    } catch (error) {
      ubic = null;
    }
    if (montado.current) setIniciando(false);

    if (ubic) {
      await comenzar(ubic);
      return;
    }
    Alert.alert(
      'No se pudo obtener tu ubicación',
      'Puedes reintentar o continuar sin ella. Si continúas, el conteo queda marcado como "sin ubicación verificada".',
      [
        { text: 'Reintentar', onPress: iniciar },
        { text: 'Continuar sin ubicación', onPress: () => comenzar(null) },
      ]
    );
  };

  /* ---------- Conteo ---------- */
  const puedeContar = () => {
    const t = Date.now();
    return !!sesion && t >= inicioRef.current && t < finRef.current;
  };

  const registrarVehiculo = (tipo, { salida, trayectoriaId }) => {
    if (!puedeContar()) {
      Alert.alert('Jornada finalizada', 'El tiempo de la jornada terminó: ya no se pueden registrar más vehículos.');
      return;
    }
    const ts = Date.now();
    let resultado;
    try {
      resultado = registrar({
        jornadaId: jornada.id,
        aforadorId: aforador.id,
        trayectoriaId,
        tipo,
        salida,
        ts,
      });
    } catch (error) {
      Alert.alert('Error', error.message);
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    } catch (e) {}

    const k = `${tipo}|${salida}`;
    setConteos((prev) => ({ ...prev, [k]: (prev[k] || 0) + 1 }));
    setUltimo({ seq: resultado.seq, tipo, salida, ts });
    setSync((s) => ({ ...s, pendientes: s.pendientes + 1 }));

    resultado.guardado.catch(async (error) => {
      // Si no se pudo guardar en el teléfono, se vuelve a leer lo realmente guardado
      Alert.alert('No se pudo guardar el último registro', error.message);
      try {
        const estado = await cargarEstado(jornada.id, aforador.id, trayectoriaIds);
        if (montado.current) {
          setConteos(estado.conteos);
          setUltimo(estado.ultimo);
        }
      } catch (e) {}
    });
  };

  const alTocarTipo = (tipo) => {
    if (!puedeContar()) return;
    const opciones = salidasPorTipo[tipo] || [];
    if (opciones.length === 0) return;
    if (opciones.length === 1) {
      registrarVehiculo(tipo, opciones[0]); // una sola salida posible: un solo toque
      return;
    }
    setPendienteTipo(tipo);
  };

  const alElegirSalida = (opcion) => {
    const tipo = pendienteTipo;
    setPendienteTipo(null);
    if (tipo) registrarVehiculo(tipo, opcion);
  };

  const deshacer = async () => {
    if (finalizada || deshaciendo.current) return;
    deshaciendo.current = true;
    try {
      const r = await anularUltimo({ jornadaId: jornada.id, aforadorId: aforador.id, trayectoriaIds });
      if (!r) return;
      const k = `${r.anulado.tipo}|${r.anulado.salida}`;
      setConteos((prev) => ({ ...prev, [k]: Math.max(0, (prev[k] || 0) - 1) }));
      setUltimo(r.ultimo);
      const p = await contarPendientes(jornada.id, aforador.id);
      if (montado.current) setSync((s) => ({ ...s, pendientes: p }));
    } catch (error) {
      Alert.alert('Error', 'No se pudo deshacer: ' + error.message);
    } finally {
      deshaciendo.current = false;
    }
  };

  /* ---------- Totales ---------- */
  const totales = useMemo(() => {
    let total = 0;
    const porTipo = {};
    const porSalida = {};
    Object.keys(conteos).forEach((k) => {
      const [tipo, salida] = k.split('|');
      const n = conteos[k];
      total += n;
      porTipo[tipo] = (porTipo[tipo] || 0) + n;
      porSalida[salida] = (porSalida[salida] || 0) + n;
    });
    return { total, porTipo, porSalida };
  }, [conteos]);

  const salidasTodas = useMemo(() => {
    const set = new Set();
    Object.values(salidasPorTipo).forEach((lista) => lista.forEach((o) => set.add(o.salida)));
    return [...set].sort((a, b) => ordenAcceso(a) - ordenAcceso(b));
  }, [salidasPorTipo]);

  /* ---------- Pantallas ---------- */
  if (cargando) {
    return (
      <View style={styles.centrado}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (errorCarga) {
    return (
      <View style={styles.centrado}>
        <Text style={styles.textoCentro}>No se pudo abrir el conteo: {errorCarga}</Text>
      </View>
    );
  }

  if (tipos.length === 0) {
    return (
      <View style={styles.centrado}>
        <Text style={styles.textoCentro}>No tienes tipos de vehículo asignados para esta entrada.</Text>
      </View>
    );
  }

  if (ahora.getTime() < inicioMs) {
    return (
      <View style={styles.centrado}>
        <Ionicons name="time-outline" size={44} color={colors.primary} />
        <Text style={styles.textoCentro}>
          Esta jornada aún no inicia. Comienza a las {formatoHora(new Date(inicioMs))}.
        </Text>
      </View>
    );
  }

  if (!sesion) {
    if (finalizada) {
      return (
        <View style={styles.centrado}>
          <Ionicons name="checkmark-circle-outline" size={44} color={colors.textMuted} />
          <Text style={styles.textoCentro}>La jornada ya terminó y no se registró conteo en este teléfono.</Text>
        </View>
      );
    }
    return (
      <View style={styles.centrado}>
        <Ionicons name="location-outline" size={44} color={colors.primary} />
        <Text style={styles.tituloInicio}>{interseccion.nombre}</Text>
        <Text style={styles.textoInicio}>Entra por {nombreAcceso(entrada)} ({entrada})</Text>
        {tareas.map((t) => (
          <Text key={t.trayectoria.id} style={styles.trayItem}>
            {tituloTrayectoria(t.trayectoria)}: sale por {textoSalidas(t.trayectoria)}
          </Text>
        ))}
        <Text style={styles.notaInicio}>
          Al iniciar, la app registra tu ubicación para dejar constancia de dónde se hace el conteo.
          Si no hay señal GPS, puedes continuar sin ella.
        </Text>
        {iniciando ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <TouchableOpacity style={styles.botonIniciar} onPress={iniciar}>
            <Text style={styles.botonIniciarTexto}>Iniciar conteo</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  const restanteMin = Math.max(1, Math.ceil((finMs - ahora.getTime()) / 60000));
  const tipoPendiente = pendienteTipo ? tipos.find((t) => t.codigo === pendienteTipo) : null;

  let colorSync = '#2E8B57';
  let textoSync = 'Sincronizado';
  let iconoSync = 'cloud-done-outline';
  if (sync.estado === 'error') {
    colorSync = colors.danger;
    textoSync = 'Error · toca para ver';
    iconoSync = 'alert-circle-outline';
  } else if (sync.estado === 'sin_conexion') {
    colorSync = '#B7791F';
    textoSync = `Sin conexión · ${sync.pendientes} pendientes`;
    iconoSync = 'cloud-offline-outline';
  } else if (sync.pendientes > 0) {
    colorSync = '#B7791F';
    textoSync = `${sync.pendientes} pendientes`;
    iconoSync = 'cloud-upload-outline';
  }

  return (
    <View style={styles.raiz}>
      <View style={styles.cabecera}>
        <View style={{ flex: 1 }}>
          <Text style={styles.titulo}>{interseccion.nombre}</Text>
          <Text style={styles.subtituloCab}>Entra por {nombreAcceso(entrada)} ({entrada})</Text>
          <Text style={styles.tiempo}>
            {finalizada
              ? 'Jornada finalizada'
              : `Quedan ${formatoDuracion(restanteMin)} · termina a las ${formatoHora(new Date(finMs))}`}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.badgeSync, { backgroundColor: colorSync + '22' }]}
          onPress={alTocarSync}
        >
          {sincronizandoManual ? (
            <ActivityIndicator size="small" color={colorSync} />
          ) : (
            <Ionicons name={iconoSync} size={14} color={colorSync} />
          )}
          <Text style={[styles.badgeSyncTexto, { color: colorSync }]}>{textoSync}</Text>
        </TouchableOpacity>
      </View>

      {finalizada && (
        <View style={styles.bannerFin}>
          <Text style={styles.bannerFinTexto}>
            El conteo está cerrado. Lo registrado se conserva y se envía a la nube.
          </Text>
        </View>
      )}

      {sesion.ubicacion_verificada !== 1 && (
        <Text style={styles.avisoUbicacion}>Ubicación no verificada</Text>
      )}

      <View style={styles.resumen}>
        <View>
          <Text style={styles.total}>{totales.total}</Text>
          <Text style={styles.totalEtiqueta}>vehículos</Text>
        </View>
        <Text style={styles.salidasLinea}>
          {salidasTodas.map((s) => `${nombreAcceso(s)} ${totales.porSalida[s] || 0}`).join('  ·  ')}
        </Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContenido}>
        {grupos.map((grupo) => (
          <View key={grupo}>
            <Text style={styles.grupoTitulo}>{grupo}</Text>
            <View style={styles.grilla}>
              {tipos
                .filter((t) => t.grupo === grupo)
                .map((t) => (
                  <TouchableOpacity
                    key={t.codigo}
                    style={[styles.botonTipo, finalizada && styles.botonTipoBloqueado]}
                    activeOpacity={0.6}
                    disabled={finalizada}
                    onPress={() => alTocarTipo(t.codigo)}
                  >
                    <View style={styles.tipoCabecera}>
                      <IconoTipo codigo={t.codigo} grupo={t.grupo} tamano={26} />
                      <Text style={styles.tipoCodigo}>{t.codigo}</Text>
                    </View>
                    <View style={styles.tipoPie}>
                      <Text style={styles.tipoNombre} numberOfLines={2}>{t.nombre}</Text>
                      <Text style={styles.tipoConteo}>{totales.porTipo[t.codigo] || 0}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={[styles.pie, { paddingBottom: spacing.md + insets.bottom }]}>
        <TouchableOpacity
          style={[styles.botonDeshacer, (!ultimo || finalizada) && styles.botonDeshacerDeshabilitado]}
          disabled={!ultimo || finalizada}
          onPress={deshacer}
        >
          <Ionicons name="arrow-undo-outline" size={18} color={colors.danger} />
          <Text style={styles.botonDeshacerTexto}>Deshacer</Text>
        </TouchableOpacity>
        <Text style={styles.ultimoTexto} numberOfLines={2}>
          {ultimo
            ? `Último: ${nombreTipo(ultimo.tipo)} → ${nombreAcceso(ultimo.salida)} · ${new Date(
                ultimo.ts
              ).toLocaleTimeString('es-CO')}`
            : 'Aún no hay registros'}
        </Text>
      </View>

      {pendienteTipo && (
        <View style={styles.capa}>
          <Pressable style={styles.fondoCapa} onPress={() => setPendienteTipo(null)} />
          <View style={[styles.panelSalida, { paddingBottom: spacing.lg + insets.bottom }]}>
            {tipoPendiente && (
              <View style={styles.panelIcono}>
                <IconoTipo codigo={tipoPendiente.codigo} grupo={tipoPendiente.grupo} tamano={30} />
              </View>
            )}
            <Text style={styles.panelTitulo}>¿Por dónde salió?</Text>
            <Text style={styles.panelSub}>{nombreTipo(pendienteTipo)}</Text>
            <ScrollView>
              {salidasPorTipo[pendienteTipo].map((o) => (
                <TouchableOpacity
                  key={o.salida}
                  style={styles.botonSalida}
                  activeOpacity={0.7}
                  onPress={() => alElegirSalida(o)}
                >
                  <Text style={styles.salidaNombre}>
                    {nombreAcceso(o.salida)} ({o.salida}){o.salida === entrada ? ' · retorno' : ''}
                  </Text>
                  <Text style={styles.salidaConteo}>{conteos[`${pendienteTipo}|${o.salida}`] || 0}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity onPress={() => setPendienteTipo(null)}>
              <Text style={styles.cancelar}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}