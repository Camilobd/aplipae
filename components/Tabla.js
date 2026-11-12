import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { colors, spacing } from '../styles/theme';

// Tabla con desplazamiento horizontal. Por defecto la primera columna es texto y las demás números.
export default function Tabla({ columnas, filas, anchos = [], numericas, totalFila = false, totalColumna = false }) {
  const ancho = (i) => anchos[i] ?? (i === 0 ? 130 : 64);
  const esNumerica = (i) => (numericas ? numericas.includes(i) : i > 0);

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator>
      <View>
        <View style={[estilos.fila, estilos.cabecera]}>
          {columnas.map((c, i) => (
            <Text
              key={i}
              style={[estilos.celda, estilos.celdaCabecera, { width: ancho(i) }, esNumerica(i) && estilos.derecha]}
            >
              {c}
            </Text>
          ))}
        </View>
        {filas.map((fila, r) => {
          const esTotal = totalFila && r === filas.length - 1;
          return (
            <View key={r} style={[estilos.fila, r % 2 === 1 && estilos.filaAlterna, esTotal && estilos.filaTotal]}>
              {fila.map((valor, i) => (
                <Text
                  key={i}
                  style={[
                    estilos.celda,
                    { width: ancho(i) },
                    esNumerica(i) && estilos.derecha,
                    (esTotal || (totalColumna && i === fila.length - 1)) && estilos.negrita,
                  ]}
                >
                  {valor}
                </Text>
              ))}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  fila: { flexDirection: 'row', alignItems: 'center' },
  cabecera: { backgroundColor: colors.primary },
  filaAlterna: { backgroundColor: colors.background },
  filaTotal: { borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: '#E8EEF0' },
  celda: { paddingVertical: 7, paddingHorizontal: spacing.xs + 2, fontSize: 12, color: colors.text },
  celdaCabecera: { color: colors.surface, fontWeight: '700', fontSize: 11 },
  derecha: { textAlign: 'right' },
  negrita: { fontWeight: '800' },
});