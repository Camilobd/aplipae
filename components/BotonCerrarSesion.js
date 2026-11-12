import { TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { contarPendientesAforador } from '../utils/conteoLocal';
import { sincronizarTodo } from '../utils/conteoSync';
import { conTiempo } from '../utils/promesas';
import { colors } from '../styles/theme';

// Si se pasa aforadorId, antes de salir intenta enviar lo que tenga pendiente
export default function BotonCerrarSesion({ aforadorId = null }) {
  const navigation = useNavigation();

  const salir = async () => {
    if (aforadorId) {
      try {
        await conTiempo(sincronizarTodo(aforadorId), 10000);
      } catch (error) {}
    }
    try {
      await signOut(auth);
    } catch (error) {}
    navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'RoleSelect' }] }));
  };

  const pedirConfirmacion = async () => {
    let aviso = '';
    if (aforadorId) {
      try {
        const pendientes = await contarPendientesAforador(aforadorId);
        if (pendientes > 0) {
          aviso = `\n\nTienes ${pendientes} registro(s) sin enviar a la nube. Se intentará enviarlos ahora; lo que no alcance a enviarse queda guardado en este teléfono y se envía en tu próximo ingreso con internet.`;
        }
      } catch (error) {}
    }
    Alert.alert('Cerrar sesión', '¿Quieres salir y volver al inicio?' + aviso, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: salir },
    ]);
  };

  return (
    <TouchableOpacity
      onPress={pedirConfirmacion}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      style={{ padding: 6 }}
    >
      <Ionicons name="log-out-outline" size={24} color={colors.primary} />
    </TouchableOpacity>
  );
}