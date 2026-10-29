import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import IntersectionesScreen from './screens/IntersectionesScreen';
import RoleSelectScreen from './screens/RoleSelectScreen';
import AdminLoginScreen from './screens/AdminLoginScreen';
import AdminTabs from './screens/AdminTabs';
import CrearAforadorScreen from './screens/CrearAforadorScreen';
import PinLoginScreen from './screens/PinLoginScreen';
import CorredoresScreen from './screens/CorredoresScreen';
import CaracterizacionScreen from './screens/CaracterizacionScreen';
import JornadaScreen from './screens/JornadaScreen';
import AsignacionesScreen from './screens/AsignacionesScreen';
import MisTareasScreen from './screens/MisTareasScreen';
import JornadasListScreen from './screens/JornadasListScreen';
import JornadaFormScreen from './screens/JornadaFormScreen';
import NotificarScreen from './screens/NotificarScreen';
import ConteoScreen from './screens/ConteoScreen';



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
        <Stack.Screen name="Caracterizacion" component={CaracterizacionScreen} options={({ route }) => ({ title: route.params?.interseccion?.nombre || 'Caracterización' })} />
        <Stack.Screen name="Jornada" component={JornadaScreen} options={({ route }) => ({ title: route.params?.interseccion?.nombre || 'Jornada' })} />
        <Stack.Screen name="Asignaciones" component={AsignacionesScreen} options={({ route }) => ({ title: route.params?.interseccion?.nombre || 'Asignaciones' })} />
        <Stack.Screen name="MisTareas" component={MisTareasScreen} options={{ title: 'Mis tareas' }} />
        <Stack.Screen name="Jornadas" component={JornadasListScreen} options={({ route }) => ({ title: route.params?.interseccion?.nombre || 'Jornadas' })} />
        <Stack.Screen name="JornadaForm" component={JornadaFormScreen} options={{ title: 'Planificar jornada' }} />
        <Stack.Screen name="Notificar" component={NotificarScreen} options={{ title: 'Notificar aforadores' }} />
        <Stack.Screen name="Conteo" component={ConteoScreen} options={{ title: 'Conteo' }} />
        
      </Stack.Navigator>
    </NavigationContainer>
  );
}