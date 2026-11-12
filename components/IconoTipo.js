import { View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { iconoDeTipo, colorDeGrupo } from '../constants/iconosTipos';

export default function IconoTipo({ codigo, grupo, tamano = 28 }) {
  const color = colorDeGrupo(grupo);
  const lado = tamano + 14;
  return (
    <View
      style={{
        width: lado,
        height: lado,
        borderRadius: lado / 2,
        backgroundColor: color + '22',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <MaterialCommunityIcons name={iconoDeTipo(codigo)} size={tamano} color={color} />
    </View>
  );
}