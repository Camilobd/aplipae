import { useState } from 'react';
import { View, Text, TouchableOpacity, Platform, Modal, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { formatoFecha, formatoHora } from '../utils/fechas';
import { colors, spacing, radius } from '../styles/theme';

export default function SelectorFiltro({ etiqueta, valor, modo, onChange, vacio = 'Sin límite' }) {
  const [abierto, setAbierto] = useState(false);
  const texto = valor ? (modo === 'date' ? formatoFecha(valor) : formatoHora(valor)) : vacio;

  const alCambiarAndroid = (evento, fecha) => {
    setAbierto(false);
    if (evento?.type === 'set' && fecha) onChange(fecha);
  };

  return (
    <View style={estilos.contenedor}>
      <Text style={estilos.etiqueta}>{etiqueta}</Text>
      <TouchableOpacity style={estilos.boton} onPress={() => setAbierto(true)}>
        <Ionicons name={modo === 'date' ? 'calendar-outline' : 'time-outline'} size={16} color={colors.primary} />
        <Text style={[estilos.texto, !valor && estilos.textoVacio]} numberOfLines={1}>{texto}</Text>
        {!!valor && (
          <TouchableOpacity onPress={() => onChange(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      {abierto && Platform.OS === 'android' && (
        <DateTimePicker value={valor ?? new Date()} mode={modo} onChange={alCambiarAndroid} />
      )}

      {Platform.OS === 'ios' && (
        <Modal visible={abierto} transparent animationType="slide">
          <View style={estilos.fondoModal}>
            <View style={estilos.cajaModal}>
              <DateTimePicker
                value={valor ?? new Date()}
                mode={modo}
                display="spinner"
                onChange={(evento, fecha) => {
                  if (fecha) onChange(fecha);
                }}
              />
              <TouchableOpacity onPress={() => setAbierto(false)}>
                <Text style={estilos.listo}>Listo</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { marginBottom: spacing.sm },
  etiqueta: { fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', marginBottom: 6 },
  boton: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.sm, paddingVertical: 9, paddingHorizontal: spacing.sm,
  },
  texto: { flex: 1, fontSize: 13, color: colors.text },
  textoVacio: { color: colors.textMuted },
  fondoModal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  cajaModal: { backgroundColor: colors.surface, padding: spacing.lg, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  listo: { textAlign: 'center', color: colors.accent, fontWeight: '800', fontSize: 16, paddingVertical: spacing.md },
});