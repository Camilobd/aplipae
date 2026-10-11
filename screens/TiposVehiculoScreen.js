import { useState, useCallback } from 'react';
import { View, Text, Switch, SectionList, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getTiposVehiculo, toggleActivoTipo } from '../utils/tiposVehiculo';
import { styles } from './TiposVehiculoScreen.styles';
import { colors } from '../styles/theme';

export default function TiposVehiculoScreen() {
  const [secciones, setSecciones] = useState([]);
  const [cargando, setCargando] = useState(true);

  const cargar = async () => {
    setCargando(true);
    const lista = await getTiposVehiculo();
    const grupos = {};
    lista.forEach((t) => {
      if (!grupos[t.grupo]) grupos[t.grupo] = [];
      grupos[t.grupo].push(t);
    });
    setSecciones(Object.keys(grupos).map((g) => ({ title: g, data: grupos[g] })));
    setCargando(false);
  };

  useFocusEffect(useCallback(() => { cargar(); }, []));

  const toggle = async (item) => {
    await toggleActivoTipo(item.id, !item.activo);
    cargar();
  };

  if (cargando) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <SectionList
      style={styles.container}
      sections={secciones}
      keyExtractor={(item) => item.id}
      renderSectionHeader={({ section }) => <Text style={styles.grupoTitulo}>{section.title}</Text>}
      renderItem={({ item }) => {
        const esObligatorio = item.codigo === 'OTR'; // RN-4
        return (
          <View style={[styles.fila, !item.activo && styles.filaInactiva]}>
            <Text style={styles.codigo}>{item.codigo}</Text>
            <Text style={styles.nombre}>{item.nombre}</Text>
            {esObligatorio ? (
              <Text style={styles.fijo}>Siempre activo</Text>
            ) : (
              <Switch
                value={item.activo}
                onValueChange={() => toggle(item)}
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            )}
          </View>
        );
      }}
    />
  );
}