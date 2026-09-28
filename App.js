import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import IntersectionesScreen from './screens/IntersectionesScreen';
import RoleSelectScreen from './screens/RoleSelectScreen';
import AdminLoginScreen from './screens/AdminLoginScreen';
import AdminTabs from './screens/AdminTabs';
import CrearAforadorScreen from './screens/CrearAforadorScreen';
import PinLoginScreen from './screens/PinLoginScreen';
import CorredoresScreen from './screens/CorredoresScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="RoleSelect">
        <Stack.Screen name="RoleSelect" component={RoleSelectScreen} options={{ title: 'APLIPAE' }} />
        <Stack.Screen name="AdminLogin" component={AdminLoginScreen} options={{ title: 'Acceso Admin' }} />
        <Stack.Screen name="AdminHome" component={AdminTabs} options={{ headerShown: false, title: 'Administrador' }} />
        <Stack.Screen name="CrearAforador" component={CrearAforadorScreen} options={{ title: 'Registrar aforador' }} />
        <Stack.Screen name="PinLogin" component={PinLoginScreen} options={{ title: 'Ingresar con PIN' }} />
        <Stack.Screen name="Corredores" component={CorredoresScreen} options={({ route }) => ({ title: route.params?.zonaAforo?.nombre || 'Corredores' })} />
        <Stack.Screen name="Intersecciones" component={IntersectionesScreen} options={({ route }) => ({ title: route.params?.corredor?.nombre || 'Intersecciones' })} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}