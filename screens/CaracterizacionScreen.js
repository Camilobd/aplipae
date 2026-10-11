import { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, Switch, Button, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getAccesos, crearAcceso } from '../utils/accesos';
import { getMovimientosDeAccesos, crearMovimiento, actualizarMovimiento } from '../utils/movimientos';
import { actualizarInterseccion } from '../utils/intersecciones';
import { ACCESOS, TIPOS_MOVIMIENTO, codigoMovimiento } from '../constants/rilsa';
import { styles } from './CaracterizacionScreen.styles';
import { colors, spacing } from '../styles/theme';

export default function CaracterizacionScreen({ route, navigation }) {
    const { interseccion } = route.params;

    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);
    // estado: { Norte: { accesoId, movimientos: [{ id, tipo, nombre, codigo, activo }] }, ... }
    const [estado, setEstado] = useState({});

    const construirMovimientosVacios = (codigoAcceso) =>
        TIPOS_MOVIMIENTO.map((t) => ({
            id: null,
            tipo: t.tipo,
            nombre: t.nombre,
            codigo: codigoMovimiento(codigoAcceso, t.codigoMov),
            activo: true,
        }));

    const cargar = async () => {
        setCargando(true);
        const accesos = await getAccesos(interseccion.id);
        const accesoIds = accesos.map((a) => a.id);
        const movimientos = await getMovimientosDeAccesos(accesoIds);

        const nuevoEstado = {};
        ACCESOS.forEach(({ nombre, codigo }) => {
            const acceso = accesos.find((a) => a.orientacion === nombre);
            if (acceso) {
                const movs = movimientos.filter((m) => m.accesoId === acceso.id);
                nuevoEstado[nombre] = {
                    accesoId: acceso.id,
                    movimientos: movs.length > 0 ? movs : construirMovimientosVacios(codigo),
                };
            } else {
                nuevoEstado[nombre] = { accesoId: null, movimientos: null };
            }
        });
        setEstado(nuevoEstado);
        setCargando(false);
    };

    useFocusEffect(useCallback(() => { cargar(); }, []));

    const toggleAcceso = (nombre, codigo) => {
        setEstado((prev) => {
            const actual = prev[nombre];
            const seleccionado = actual.movimientos != null;
            return {
                ...prev,
                [nombre]: seleccionado
                    ? { accesoId: actual.accesoId, movimientos: null }
                    : { accesoId: actual.accesoId, movimientos: construirMovimientosVacios(codigo) },
            };
        });
    };

    const toggleMovimiento = (nombre, tipo) => {
        setEstado((prev) => ({
            ...prev,
            [nombre]: {
                ...prev[nombre],
                movimientos: prev[nombre].movimientos.map((m) =>
                    m.tipo === tipo ? { ...m, activo: !m.activo } : m
                ),
            },
        }));
    };

    const guardar = async () => {
        const accesosSeleccionados = ACCESOS.filter((a) => estado[a.nombre]?.movimientos != null);
        if (accesosSeleccionados.length < 3) {
            Alert.alert('Faltan accesos', 'Selecciona al menos 3 accesos para caracterizar la intersección.');
            return;
        }

        setGuardando(true);
        try {
            for (const { nombre, codigo } of accesosSeleccionados) {
                const { accesoId, movimientos } = estado[nombre];

                let idAcceso = accesoId;
                if (!idAcceso) {
                    const nuevo = await crearAcceso({ interseccionId: interseccion.id, orientacion: nombre, codigo });
                    idAcceso = nuevo.id;
                }

                for (const mov of movimientos) {
                    if (mov.id) {
                        await actualizarMovimiento(mov.id, { activo: mov.activo });
                    } else {
                        await crearMovimiento({
                            accesoId: idAcceso,
                            tipo: mov.tipo,
                            nombre: mov.nombre,
                            codigo: mov.codigo,
                            activo: mov.activo,
                        });
                    }
                }
            }

            await actualizarInterseccion(interseccion.id, { caracterizada: true });

            Alert.alert('Guardado', 'La caracterización se guardó correctamente.', [
                { text: 'OK', onPress: () => navigation.goBack() },
            ]);
        } catch (error) {
            Alert.alert('Error', 'No se pudo guardar: ' + error.message);
        } finally {
            setGuardando(false);
        }
    };

    if (cargando) {
        return (
            <View style={[styles.container, { justifyContent: 'center' }]}>
                <ActivityIndicator color={colors.primary} />
            </View>
        );
    }

    return (
        <ScrollView
            style={{ flex: 1, backgroundColor: colors.background }}
            contentContainerStyle={{ padding: spacing.lg, paddingBottom: 60 }}
        >
            <Text style={styles.subtitulo}>
                Selecciona los accesos de "{interseccion.nombre}" (mínimo 3) y desactiva los movimientos que no apliquen.
            </Text>

            <View style={styles.chipsFila}>
                {ACCESOS.map(({ nombre, codigo }) => {
                    const seleccionado = estado[nombre]?.movimientos != null;
                    return (
                        <TouchableOpacity
                            key={nombre}
                            style={[styles.chip, seleccionado && styles.chipActivo]}
                            onPress={() => toggleAcceso(nombre, codigo)}
                        >
                            <Text style={[styles.chipTexto, seleccionado && styles.chipTextoActivo]}>
                                {nombre} ({codigo})
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {ACCESOS.filter((a) => estado[a.nombre]?.movimientos != null).map(({ nombre }) => (
                <View key={nombre} style={styles.tarjetaAcceso}>
                    <Text style={styles.tarjetaTitulo}>Acceso {nombre}</Text>
                    {estado[nombre].movimientos.map((mov) => (
                        <View key={mov.tipo} style={styles.movFila}>
                            <View>
                                <Text style={styles.movTexto}>{mov.nombre}</Text>
                                <Text style={styles.movCodigo}>{mov.codigo}</Text>
                            </View>
                            <Switch
                                value={mov.activo}
                                onValueChange={() => toggleMovimiento(nombre, mov.tipo)}
                                trackColor={{ false: colors.border, true: colors.primary }}
                            />
                        </View>
                    ))}
                </View>
            ))}

            <View style={styles.botonGuardar}>
                {guardando ? (
                    <ActivityIndicator color={colors.primary} />
                ) : (
                    <Button title="Guardar caracterización" onPress={guardar} color={colors.primary} />
                )}
            </View>
        </ScrollView>
    );
}
