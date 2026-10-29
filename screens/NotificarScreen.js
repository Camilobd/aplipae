import { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { getTrayectoriasDeInterseccion } from '../utils/trayectorias';
import { getAsignacionesDeJornada } from '../utils/asignaciones';
import { getAforadores } from '../utils/aforadores';
import { getTiposVehiculo } from '../utils/tiposVehiculo';
import { enviarNotificacionPorCorreo } from '../utils/email';
import {
  getNotificacionesDeJornada, registrarNotificacion, huellaDe, armarDetalleHtml, textoRango,
} from '../utils/notificaciones';
import { ordenAcceso } from '../constants/rilsa';
import { styles } from './NotificarScreen.styles';
import { colors } from '../styles/theme';

const ESTADOS = {
  pendiente: { texto: 'Sin avisar', color: '#B7791F' },
  cambio: { texto: 'Con cambios desde el último aviso', color: '#2F80ED' },
  enviado: { texto: 'Avisado', color: '#2E8B57' },
};

const comparador = (a, b) =>
  ordenAcceso(a.trayectoria.origenCodigo) - ordenAcceso(b.trayectoria.origenCodigo) ||
  (a.trayectoria.numero ?? 0) - (b.trayectoria.numero ?? 0);

const esperar = (ms) => new Promise((resolver) => setTimeout(resolver, ms));

export default function NotificarScreen({ route }) {
  const { interseccion, jornada } = route.params;

  const [filas, setFilas] = useState([]);
  const [catalogo, setCatalogo] = useState([]);
  const [seleccion, setSeleccion] = useState({});
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [progreso, setProgreso] = useState(null);

  const cargar = async () => {
    setCargando(true);
    const [trays, asigs, aforadores, tipos, notifs] = await Promise.all([
      getTrayectoriasDeInterseccion(interseccion.id),
      getAsignacionesDeJornada(jornada.id),
      getAforadores(),
      getTiposVehiculo(),
      getNotificacionesDeJornada(jornada.id),
    ]);

    const trayPorId = {};
    trays.forEach((t) => { trayPorId[t.id] = t; });
    const notifPorAforador = {};
    notifs.forEach((n) => { notifPorAforador[n.aforadorId] = n; });

    const tareasPorAforador = {};
    asigs.forEach((a) => {
      const t = trayPorId[a.trayectoriaId];
      if (!t) return;
      if (!tareasPorAforador[a.aforadorId]) tareasPorAforador[a.aforadorId] = [];
      tareasPorAforador[a.aforadorId].push({ trayectoria: t, tipos: a.tiposAsignados || [] });
    });

    const lista = Object.keys(tareasPorAforador)
      .map((aforadorId) => {
        const af = aforadores.find((x) => x.id === aforadorId);
        if (!af) return null;
        const tareas = tareasPorAforador[aforadorId].sort(comparador);
        const huella = huellaDe(jornada, tareas);
        const previa = notifPorAforador[aforadorId];
        const estado = !previa ? 'pendiente' : previa.huella !== huella ? 'cambio' : 'enviado';
        return {
          aforadorId,
          nombre: af.nombre,
          email: af.email,
          activo: af.activo !== false,
          tareas,
          huella,
          estado,
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.nombre.localeCompare(b.nombre));

    // Por defecto se marcan solo los que faltan por avisar o tienen cambios
    const inicial = {};
    lista.forEach((f) => { inicial[f.aforadorId] = f.activo && f.estado !== 'enviado'; });

    setCatalogo(tipos);
    setFilas(lista);
    setSeleccion(inicial);
    setCargando(false);
  };

  useFocusEffect(useCallback(() => { cargar(); }, []));

  const toggle = (fila) => {
    if (!fila.activo || enviando) return;
    setSeleccion((prev) => ({ ...prev, [fila.aforadorId]: !prev[fila.aforadorId] }));
  };

  const destinatarios = filas.filter((f) => seleccion[f.aforadorId]);

  const ejecutarEnvio = async () => {
    setEnviando(true);
    const fallidos = [];
    let enviados = 0;
    const rango = textoRango(jornada);

    for (let i = 0; i < destinatarios.length; i++) {
      const f = destinatarios[i];
      setProgreso(`Enviando ${i + 1} de ${destinatarios.length}…`);
      try {
        await enviarNotificacionPorCorreo({
          email: f.email,
          nombre: f.nombre,
          interseccion: interseccion.nombre,
          fechaHora: rango,
          detalleHtml: armarDetalleHtml({ interseccion, jornada, tareas: f.tareas, catalogo }),
        });
        await registrarNotificacion(jornada.id, f.aforadorId, f.huella);
        enviados += 1;
      } catch (error) {
        fallidos.push(`${f.nombre}: ${error.message}`);
      }
      // Pausa corta entre envíos para no saturar el servicio de correo
      if (i < destinatarios.length - 1) await esperar(1200);
    }

    setProgreso(null);
    setEnviando(false);
    await cargar();

    if (fallidos.length === 0) {
      Alert.alert('Listo', `Se enviaron ${enviados} correo(s).`);
    } else {
      Alert.alert(
        'Envío con problemas',
        `Enviados: ${enviados}. No se pudo enviar a:\n\n${fallidos.join('\n')}`
      );
    }
  };

  const confirmarEnvio = () => {
    Alert.alert(
      'Enviar correos',
      `Se enviarán ${destinatarios.length} correo(s). Cada envío cuenta contra el límite mensual de tu plan de correo (200 en el plan gratuito). ¿Continuar?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Enviar', onPress: ejecutarEnvio },
      ]
    );
  };

  if (cargando && filas.length === 0) {
    return (
      <View style={styles.centrado}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const renderItem = ({ item }) => {
    const marcado = !!seleccion[item.aforadorId];
    const info = ESTADOS[item.estado];
    return (
      <TouchableOpacity
        style={[styles.tarjeta, !item.activo && styles.tarjetaInactiva]}
        onPress={() => toggle(item)}
        activeOpacity={0.8}
      >
        <View style={[styles.checkbox, marcado && styles.checkboxMarcado]}>
          {marcado && <Ionicons name="checkmark" size={14} color={colors.surface} />}
        </View>
        <View style={styles.info}>
          <Text style={styles.nombre}>{item.nombre}</Text>
          <Text style={styles.correo}>{item.email}</Text>
          <Text style={styles.detalle}>
            {item.tareas.length} {item.tareas.length === 1 ? 'trayectoria asignada' : 'trayectorias asignadas'}
          </Text>
          <View
            style={[
              styles.badge,
              { backgroundColor: (item.activo ? info.color : colors.textMuted) + '22' },
            ]}
          >
            <Text style={[styles.badgeTexto, { color: item.activo ? info.color : colors.textMuted }]}>
              {item.activo ? info.texto : 'Aforador inactivo'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.raiz}>
      <View style={styles.cabecera}>
        <Text style={styles.titulo}>{interseccion.nombre}</Text>
        <Text style={styles.rango}>{textoRango(jornada)}</Text>
        <Text style={styles.ayuda}>
          Cada aforador recibe un correo con sus trayectorias y los vehículos que cuenta. Por defecto se marcan los que aún no tienen aviso o cambiaron.
        </Text>
      </View>

      {filas.length === 0 ? (
        <Text style={styles.vacio}>
          Aún no hay aforadores asignados en esta jornada. Asígnalos primero.
        </Text>
      ) : (
        <FlatList
          data={filas}
          keyExtractor={(f) => f.aforadorId}
          renderItem={renderItem}
          contentContainerStyle={styles.lista}
        />
      )}

      {filas.length > 0 && (
        <View style={styles.pie}>
          {progreso && <Text style={styles.progreso}>{progreso}</Text>}
          <TouchableOpacity
            style={[
              styles.botonEnviar,
              (destinatarios.length === 0 || enviando) && styles.botonEnviarDeshabilitado,
            ]}
            disabled={destinatarios.length === 0 || enviando}
            onPress={confirmarEnvio}
          >
            {enviando ? (
              <ActivityIndicator color={colors.surface} />
            ) : (
              <Ionicons name="mail-outline" size={18} color={colors.surface} />
            )}
            <Text style={styles.botonEnviarTexto}>
              {destinatarios.length === 0
                ? 'Selecciona a quién avisar'
                : `Enviar ${destinatarios.length} ${destinatarios.length === 1 ? 'correo' : 'correos'}`}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}