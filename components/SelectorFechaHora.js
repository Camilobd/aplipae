import { useState } from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { formatoFecha, formatoHora } from '../utils/fechas';
import { styles } from './SelectorFechaHora.styles';
import { colors } from '../styles/theme';

export default function SelectorFechaHora({ label, value, onChange }) {
  const [modo, setModo] = useState(null); // solo Android: 'date' | 'time'

  const alCambiar = (event, seleccionada) => {
    if (Platform.OS === 'android') setModo(null);
    if (event?.type === 'dismissed' || !seleccionada) return;
    onChange(seleccionada);
  };

  return (
    <View style={styles.contenedor}>
      <Text style={styles.label}>{label}</Text>

      {Platform.OS === 'ios' ? (
        <DateTimePicker value={value} mode="datetime" display="compact" onChange={alCambiar} />
      ) : (
        <View style={styles.fila}>
          <TouchableOpacity style={styles.boton} onPress={() => setModo('date')}>
            <Ionicons name="calendar-outline" size={16} color={colors.primary} />
            <Text style={styles.botonTexto}>{formatoFecha(value)}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.boton} onPress={() => setModo('time')}>
            <Ionicons name="time-outline" size={16} color={colors.primary} />
            <Text style={styles.botonTexto}>{formatoHora(value)}</Text>
          </TouchableOpacity>
        </View>
      )}

      {Platform.OS === 'android' && modo && (
        <DateTimePicker value={value} mode={modo} onChange={alCambiar} />
      )}
    </View>
  );
}