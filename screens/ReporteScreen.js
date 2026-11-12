import { useState, useMemo, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Modal, ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  cargarDatosReporte, calcularReporte, fechaIso,
  csvDetalle, csvPorTipo, csvPorTrayectoria, csvMatriz, csvAforadores,
} from '../utils/reportes';
import { compartirCsv, nombreSeguro, decimal } from '../utils/csv';
import { formatoFecha, formatoHora } from '../utils/fechas';
import { nombreAcceso } from '../constants/rilsa';
import { colorDeGrupo } from '../constants/iconosTipos';
import Tabla from '../components/Tabla';
import SelectorFiltro from '../components/SelectorFiltro';
import IconoTipo from '../components/IconoTipo';
import { styles } from './ReporteScreen.styles';
import { colors, spacing } from '../styles/theme';

const OPCIONES_CSV = [
  { clave: 'detalle', titulo: 'Detalle de registros', desc: 'Una fila por vehículo contado', filas: csvDetalle, requiereDatos: true },
  { clave: 'por_tipo', titulo: 'Total por tipo de vehículo', desc: 'Total y porcentaje de cada tipo', filas: csvPorTipo, requiereDatos: true },
  { clave: 'por_trayectoria', titulo: 'Por trayectoria', desc: 'Trayectoria, salida y tipo', filas: csvPorTrayectoria, requiereDatos: true },
  { clave: 'matriz_origen_destino', titulo: 'Matriz origen–destino', desc: 'Entradas contra salidas, con totales', filas: csvMatriz, requiereDatos: true },
  { clave: 'aforadores', titulo: 'Aforadores', desc: 'Registros, inicio, ubicación y sincronización', filas: csvAforadores, requiereDatos: false },
];

const textoCorto = (ms) =>
  new Date(ms).toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

const minutosDelDia = (fecha) => (fecha ? fecha.getHours() * 60 + fecha.getMinutes() : null);

export default function ReporteScreen({ route }) {
  const { interseccion } = route.params;
  const insets = useSafeAreaInsets();

  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const [jornadaIds, setJornadaIds] = useState(null); // null = todas
  const [fechaDesde, setFechaDesde] = useState(null);
  const [fechaHasta, setFechaHasta] = useState(null);
  const [horaDesde, setHoraDesde] = useState(null);
  const [horaHasta, setHoraHasta] = useState(null);

  const [modalExportar, setModalExportar] = useState(false);
  const [exportando, setExportando] = useState(false);

  const cargar = async () => {
    setCargando(true);
    setError(null);
    try {
      setDatos(await cargarDatosReporte(interseccion.id));
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  };

  useFocusEffect(useCallback(() => { cargar(); }, []));

  const filtros = useMemo(
    () => ({
      jornadaIds,
      fechaDesde,
      fechaHasta,
      horaDesde: minutosDelDia(horaDesde),
      horaHasta: minutosDelDia(horaHasta),
    }),
    [jornadaIds, fechaDesde, fechaHasta, horaDesde, horaHasta]
  );

  const reporte = useMemo(() => (datos ? calcularReporte(datos, filtros) : null), [datos, filtros]);

  const hayFiltros = !!(jornadaIds || fechaDesde || fechaHasta || horaDesde || horaHasta);

  const limpiarFiltros = () => {
    setJornadaIds(null);
    setFechaDesde(null);
    setFechaHasta(null);
    setHoraDesde(null);
    setHoraHasta(null);
  };

  const alTocarJornada = (id) => {
    const todas = datos.jornadas.map((j) => j.id);
    if (jornadaIds === null) {
      setJornadaIds([id]);
      return;
    }
    const siguiente = jornadaIds.includes(id) ? jornadaIds.filter((x) => x !== id) : [...jornadaIds, id];
    setJornadaIds(siguiente.length === 0 || siguiente.length === todas.length ? null : siguiente);
  };

  const exportar = async (opcion) => {
    if (opcion.requiereDatos && reporte.total === 0) {
      Alert.alert('Sin registros', 'No hay registros con los filtros actuales.');
      return;
    }
    setExportando(true);
    try {
      const nombre = `aplipae_${nombreSeguro(interseccion.nombre)}_${opcion.clave}_${fechaIso(Date.now())}.csv`;
      await compartirCsv(nombre, opcion.filas(reporte));
    } catch (e) {
      Alert.alert('No se pudo exportar', e.message);
    } finally {
      setExportando(false);
    }
  };

  /* ---------- Estados de carga ---------- */
  if (cargando && !datos) {
    return (
      <View style={styles.centrado}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (error && !datos) {
    return (
      <View style={styles.centrado}>
        <Text style={styles.textoCentro}>No se pudo cargar el reporte: {error}</Text>
      </View>
    );
  }

  if (!datos || !reporte) return null;

  if (datos.jornadas.length === 0 || datos.registros.length === 0) {
    return (
      <View style={styles.centrado}>
        <Ionicons name="bar-chart-outline" size={44} color={colors.textMuted} />
        <Text style={styles.textoCentro}>
          {datos.jornadas.length === 0
            ? 'Esta intersección aún no tiene jornadas.'
            : 'Aún no hay conteos sincronizados para esta intersección.'}
        </Text>
      </View>
    );
  }

  const multiJornada = reporte.jornadasIncluidas > 1;
  const rango = reporte.rangoDatos;
  const sinVerificar = reporte.aforadores.filter(
    (a) => a.ubicacion === 'Sin verificar' || a.ubicacion === 'Parcial'
  );

  const columnasAf = [
    'Aforador',
    ...(multiJornada ? ['Jornada'] : []),
    'Entrada', 'Reg.', 'Anul.', 'Inicio', 'Ubicación', 'Últ. sync.',
  ];
  const anchosAf = [130, ...(multiJornada ? [190] : []), 60, 46, 46, 100, 96, 100];
  const filasAf = reporte.aforadores.map((a) => [
    a.nombre,
    ...(multiJornada ? [a.jornadaTexto] : []),
    a.entradas.join(', ') || '—',
    a.registros,
    a.anulados,
    a.inicio ? textoCorto(a.inicio) : '—',
    a.ubicacion,
    a.ultimaSync ? textoCorto(a.ultimaSync) : '—',
  ]);
  const numericasAf = multiJornada ? [3, 4] : [2, 3];

  const { matriz } = reporte;
  const etiquetaCodigo = (c) => (c === '?' ? '?' : c);

  return (
    <View style={styles.raiz}>
      <ScrollView
        contentContainerStyle={styles.contenido}
        refreshControl={<RefreshControl refreshing={cargando} onRefresh={cargar} />}
      >
        <Text style={styles.titulo}>{interseccion.nombre}</Text>
        {!!interseccion.direccion && <Text style={styles.sub}>{interseccion.direccion}</Text>}

        {/* Filtros */}
        <View style={styles.tarjeta}>
          <View style={styles.filtrosCab}>
            <Text style={styles.tarjetaTitulo}>Filtros</Text>
            {hayFiltros && (
              <TouchableOpacity onPress={limpiarFiltros}>
                <Text style={styles.link}>Limpiar</Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.etiqueta}>Jornada</Text>
          <View style={styles.chips}>
            <TouchableOpacity
              style={[styles.chip, jornadaIds === null && styles.chipActivo]}
              onPress={() => setJornadaIds(null)}
            >
              <Text style={[styles.chipTexto, jornadaIds === null && styles.chipTextoActivo]}>Todas</Text>
            </TouchableOpacity>
            {datos.jornadas.map((j) => {
              const activo = !!jornadaIds?.includes(j.id);
              return (
                <TouchableOpacity
                  key={j.id}
                  style={[styles.chip, activo && styles.chipActivo]}
                  onPress={() => alTocarJornada(j.id)}
                >
                  <Text style={[styles.chipTexto, activo && styles.chipTextoActivo]}>
                    {textoCorto(j.fechaInicio.toMillis())} – {formatoHora(j.fechaFin.toDate())}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.fila2}>
            <View style={styles.columna}>
              <SelectorFiltro etiqueta="Fecha desde" modo="date" valor={fechaDesde} onChange={setFechaDesde} />
            </View>
            <View style={styles.columna}>
              <SelectorFiltro etiqueta="Fecha hasta" modo="date" valor={fechaHasta} onChange={setFechaHasta} />
            </View>
          </View>
          <View style={styles.fila2}>
            <View style={styles.columna}>
              <SelectorFiltro etiqueta="Hora desde" modo="time" valor={horaDesde} onChange={setHoraDesde} />
            </View>
            <View style={styles.columna}>
              <SelectorFiltro etiqueta="Hora hasta" modo="time" valor={horaHasta} onChange={setHoraHasta} />
            </View>
          </View>

          {rango && (
            <Text style={styles.ayuda}>
              Hay datos del {formatoFecha(new Date(rango.desde))} al {formatoFecha(new Date(rango.hasta))}.
            </Text>
          )}
          <Text style={styles.ayuda}>
            La franja de horas se aplica a todos los días. Si la hora final es menor que la inicial, se toma la franja que cruza la medianoche.
          </Text>
        </View>

        {/* Avisos */}
        {reporte.calidad.parcial && (
          <View style={styles.aviso}>
            <Ionicons name="time-outline" size={16} color="#8A5A12" />
            <Text style={styles.avisoTexto}>
              Reporte parcial: hay jornadas en curso o programadas, y solo incluye lo ya sincronizado.
            </Text>
          </View>
        )}
        {reporte.calidad.fueraDeFranja > 0 && (
          <View style={styles.aviso}>
            <Ionicons name="alert-circle-outline" size={16} color="#8A5A12" />
            <Text style={styles.avisoTexto}>
              {reporte.calidad.fueraDeFranja} registro(s) caen fuera del horario de su jornada. Puede ser un reloj mal configurado en algún teléfono.
            </Text>
          </View>
        )}

        {/* Resumen */}
        <View style={styles.resumenFila}>
          <View style={styles.resumenCard}>
            <Text style={styles.resumenNum}>{reporte.total}</Text>
            <Text style={styles.resumenEtiqueta}>vehículos</Text>
          </View>
          <View style={styles.resumenCard}>
            <Text style={styles.resumenNum}>{reporte.jornadasIncluidas}</Text>
            <Text style={styles.resumenEtiqueta}>{reporte.jornadasIncluidas === 1 ? 'jornada' : 'jornadas'}</Text>
          </View>
          <View style={styles.resumenCard}>
            <Text style={styles.resumenNum}>{reporte.aforadoresParticipantes}</Text>
            <Text style={styles.resumenEtiqueta}>aforadores</Text>
          </View>
          <View style={styles.resumenCard}>
            <Text style={styles.resumenNum}>{reporte.anulados}</Text>
            <Text style={styles.resumenEtiqueta}>anulados</Text>
          </View>
        </View>

        {reporte.total === 0 ? (
          <View style={styles.tarjeta}>
            <Text style={styles.vacio}>No hay registros con los filtros actuales.</Text>
          </View>
        ) : (
          <>
            {/* Por tipo */}
            <View style={styles.tarjeta}>
              <Text style={styles.seccionTitulo}>Por tipo de vehículo</Text>
              {reporte.porTipo.map((t) => (
                <View key={t.codigo} style={styles.filaTipo}>
                  <View style={styles.filaTipoCab}>
                    <IconoTipo codigo={t.codigo} grupo={t.grupo} tamano={16} />
                    <Text style={styles.tipoNombre}>{t.nombre}</Text>
                    <Text style={styles.tipoNumero}>{t.total}</Text>
                    <Text style={styles.tipoPct}>{decimal(t.pct)} %</Text>
                  </View>
                  <View style={styles.barraFondo}>
                    <View
                      style={[
                        styles.barra,
                        { width: `${Math.max(2, t.pct)}%`, backgroundColor: colorDeGrupo(t.grupo) },
                      ]}
                    />
                  </View>
                </View>
              ))}
            </View>

            {/* Por trayectoria */}
            <View style={styles.tarjeta}>
              <Text style={styles.seccionTitulo}>Por trayectoria</Text>
              {reporte.porTrayectoria.map((t) => (
                <View key={t.id} style={{ marginBottom: spacing.md }}>
                  <Text style={styles.subtitulo}>
                    {t.titulo} · entra por {t.entrada === '?' ? '?' : nombreAcceso(t.entrada)} · {t.total} vehículos
                  </Text>
                  {t.total === 0 ? (
                    <Text style={styles.obs}>Sin registros con los filtros actuales.</Text>
                  ) : (
                    <>
                      <Tabla
                        columnas={['Tipo', ...t.salidas.map(etiquetaCodigo), 'Total']}
                        anchos={[170]}
                        filas={[
                          ...t.filas.map((f) => [
                            `${f.codigo} · ${f.nombre}`,
                            ...t.salidas.map((s) => f.porSalida[s]),
                            f.total,
                          ]),
                          ['Total', ...t.salidas.map((s) => t.totalesSalida[s]), t.total],
                        ]}
                        totalFila
                        totalColumna
                      />
                      <Text style={styles.leyenda}>
                        Salidas: {t.salidas.map((s) => `${s} = ${nombreAcceso(s)}`).join(' · ')}
                      </Text>
                    </>
                  )}
                </View>
              ))}
            </View>

            {/* Matriz origen-destino */}
            <View style={styles.tarjeta}>
              <Text style={styles.seccionTitulo}>Matriz origen – destino</Text>
              <Tabla
                columnas={['Entrada', ...matriz.salidas.map(etiquetaCodigo), 'Total']}
                anchos={[100]}
                filas={[
                  ...matriz.entradas.map((o) => [
                    o,
                    ...matriz.salidas.map((s) => matriz.celdas[`${o}|${s}`] || 0),
                    matriz.totalesFila[o],
                  ]),
                  ['Total', ...matriz.salidas.map((s) => matriz.totalesColumna[s]), reporte.total],
                ]}
                totalFila
                totalColumna
              />
              <Text style={styles.leyenda}>
                Entradas y salidas: {[...new Set([...matriz.entradas, ...matriz.salidas])]
                  .filter((c) => c !== '?')
                  .map((c) => `${c} = ${nombreAcceso(c)}`)
                  .join(' · ')}
              </Text>
            </View>

            {/* Por jornada */}
            {multiJornada && (
              <View style={styles.tarjeta}>
                <Text style={styles.seccionTitulo}>Por jornada</Text>
                <Tabla
                  columnas={['Jornada', 'Vehículos']}
                  anchos={[250, 80]}
                  filas={reporte.porJornada.map((j) => [j.texto, j.total])}
                />
              </View>
            )}
          </>
        )}

        {/* Aforadores */}
        <View style={styles.tarjeta}>
          <Text style={styles.seccionTitulo}>Aforadores</Text>
          {filasAf.length === 0 ? (
            <Text style={styles.obs}>Sin aforadores asignados.</Text>
          ) : (
            <Tabla columnas={columnasAf} anchos={anchosAf} numericas={numericasAf} filas={filasAf} />
          )}
        </View>

        {/* Control de calidad */}
        <View style={styles.tarjeta}>
          <Text style={styles.seccionTitulo}>Control de calidad</Text>
          {reporte.calidad.sinDatos.length === 0 &&
            sinVerificar.length === 0 &&
            reporte.calidad.fueraDeFranja === 0 && (
              <Text style={styles.obsOk}>Sin observaciones.</Text>
            )}
          {reporte.calidad.sinDatos.length > 0 && (
            <>
              <Text style={styles.subtitulo}>Asignaciones sin registros</Text>
              {reporte.calidad.sinDatos.map((texto, i) => (
                <Text key={i} style={styles.obs}>• {texto}</Text>
              ))}
            </>
          )}
          {sinVerificar.length > 0 && (
            <>
              <Text style={[styles.subtitulo, { marginTop: spacing.sm }]}>Ubicación sin verificar</Text>
              {sinVerificar.map((a) => (
                <Text key={a.clave} style={styles.obs}>
                  • {a.nombre}{multiJornada ? ` (${a.jornadaTexto})` : ''}
                </Text>
              ))}
            </>
          )}
          {reporte.calidad.fueraDeFranja > 0 && (
            <Text style={[styles.obs, { marginTop: spacing.sm }]}>
              • {reporte.calidad.fueraDeFranja} registro(s) fuera del horario de su jornada.
            </Text>
          )}
        </View>
      </ScrollView>

      <View style={[styles.pie, { paddingBottom: spacing.md + insets.bottom }]}>
        <TouchableOpacity style={styles.botonExportar} onPress={() => setModalExportar(true)}>
          <Ionicons name="download-outline" size={20} color={colors.surface} />
          <Text style={styles.botonExportarTexto}>Exportar CSV</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={modalExportar} transparent animationType="slide" onRequestClose={() => setModalExportar(false)}>
        <View style={styles.modalFondo}>
          <View style={[styles.modalCaja, { paddingBottom: spacing.lg + insets.bottom }]}>
            <Text style={styles.modalTitulo}>Exportar CSV</Text>
            <Text style={styles.modalSub}>Se exporta con los filtros actuales. Cada archivo se comparte por separado.</Text>
            {OPCIONES_CSV.map((op) => (
              <TouchableOpacity
                key={op.clave}
                style={styles.opcion}
                disabled={exportando}
                onPress={() => exportar(op)}
              >
                <Ionicons name="document-text-outline" size={22} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.opcionTitulo}>{op.titulo}</Text>
                  <Text style={styles.opcionDesc}>{op.desc}</Text>
                </View>
                {exportando ? (
                  <ActivityIndicator color={colors.primary} />
                ) : (
                  <Ionicons name="share-outline" size={20} color={colors.textMuted} />
                )}
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={() => setModalExportar(false)}>
              <Text style={styles.cerrar}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}