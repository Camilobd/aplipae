import { useState, useEffect } from 'react';
import { Text, Button, Alert, ActivityIndicator, ScrollView } from 'react-native';
import SelectorFechaHora from '../components/SelectorFechaHora';
import { planificarJornada, actualizarHorarioJornada } from '../utils/jornadas';
import { getAsignacionesDeJornada, asignarAforador } from '../utils/asignaciones';
import { formatoDuracion } from '../utils/fechas';
import { styles } from './JornadaFormScreen.styles';
import { colors } from '../styles/theme';

const UN_DIA = 24 * 60 * 60 * 1000;
const TOLERANCIA_MIN = 5; // margen para poder planificar "ahora mismo"

function valoresIniciales(jornada, plantilla) {
  if (jornada) {
    return { ini: jornada.fechaInicio.toDate(), fin: jornada.fechaFin.toDate() };
  }
  if (plantilla) {
    // Duplicar: mismo horario, en el primer día futuro
    let ini = new Date(plantilla.fechaInicio.toDate().getTime() + UN_DIA);
    let fin = new Date(plantilla.fechaFin.toDate().getTime() + UN_DIA);
    while (ini < new Date()) {
      ini = new Date(ini.getTime() + UN_DIA);
      fin = new Date(fin.getTime() + UN_DIA);
    }
    return { ini, fin };
  }
  const ini = new Date();
  ini.setMinutes(0, 0, 0);
  ini.setHours(ini.getHours() + 1);
  return { ini, fin: new Date(ini.getTime() + 2 * 60 * 60 * 1000) };
}

export default function JornadaFormScreen({ route, navigation }) {
  const { interseccion, jornada, plantilla } = route.params;
  const esEdicion = !!jornada;

  const [inicio, setInicio] = useState(() => valoresIniciales(jornada, plantilla).ini);
  const [fin, setFin] = useState(() => valoresIniciales(jornada, plantilla).fin);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      title: esEdicion ? 'Editar horario' : plantilla ? 'Duplicar jornada' : 'Planificar jornada',
    });
  }, []);

  // Al mover el inicio se conserva la duración
  const cambiarInicio = (nuevo) => {
    const duracion = fin.getTime() - inicio.getTime();
    setInicio(nuevo);
    setFin(new Date(nuevo.getTime() + duracion));
  };

  const minutos = Math.round((fin.getTime() - inicio.getTime()) / 60000);
  const textoDuracion = minutos > 0 ? formatoDuracion(minutos) : 'el fin debe ser posterior al inicio';

  const guardar = async () => {
    setGuardando(true);
    try {
      const ahora = new Date();
      if (inicio.getTime() < ahora.getTime() - TOLERANCIA_MIN * 60000) {
        throw new Error(
          'La hora de inicio ya pasó. Elige una hora futura; si quieres empezar ya, planifícala y usa "Abrir ahora".'
        );
      }
      if (fin <= ahora) {
        throw new Error('Ese horario ya terminó. Elige una fecha y hora futuras.');
      }

      if (esEdicion) {
        await actualizarHorarioJornada(jornada, inicio, fin);
      } else {
        const nueva = await planificarJornada({
          interseccionId: interseccion.id,
          inicio,
          fin,
          tiposSeleccionados: plantilla?.tiposSeleccionados ?? null,
        });

        if (plantilla) {
          const asignaciones = await getAsignacionesDeJornada(plantilla.id);
          await Promise.all(
            asignaciones.map((a) =>
              asignarAforador({
                jornadaId: nueva.id,
                movimientoId: a.movimientoId,
                aforadorId: a.aforadorId,
                tiposAsignados: a.tiposAsignados ?? [],
              })
            )
          );
        }
      }
      navigation.goBack();
    } catch (error) {
      Alert.alert('No se pudo guardar', error.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={styles.intro}>
        {interseccion.nombre}: define cuándo empieza y cuándo termina el aforo.
      </Text>

      <SelectorFechaHora label="Inicio" value={inicio} onChange={cambiarInicio} />
      <SelectorFechaHora label="Fin" value={fin} onChange={setFin} />

      <Text style={styles.duracion}>Duración: {textoDuracion}</Text>
      <Text style={styles.nota}>Los aforadores cuentan durante toda la franja.</Text>

      {guardando ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <Button title={esEdicion ? 'Guardar cambios' : 'Planificar jornada'} onPress={guardar} color={colors.primary} />
      )}
    </ScrollView>
  );
}