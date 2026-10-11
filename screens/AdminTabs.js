import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import AforadoresListScreen from './AforadoresListScreen';
import ZonasAforoScreen from './ZonasAforoScreen';
import ReportesScreen from './ReportesScreen';
import TiposVehiculoScreen from './TiposVehiculoScreen';
import { colors } from '../styles/theme';

const Tab = createBottomTabNavigator();

const ICONOS = {
  Aforadores: 'people-outline',
  ZonasAforo: 'git-network-outline',
  Reportes: 'bar-chart-outline',
  TiposVehiculo: 'car-outline',
};

export default function AdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={ICONOS[route.name]} size={size} color={color} />
        ),
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { borderTopColor: colors.border },
      })}
    >
      <Tab.Screen name="Aforadores" component={AforadoresListScreen} />
      <Tab.Screen name="ZonasAforo" component={ZonasAforoScreen} options={{ tabBarLabel: 'Zonas', title: 'Zonas de aforo' }} />
      <Tab.Screen name="TiposVehiculo" component={TiposVehiculoScreen} options={{ tabBarLabel: 'Tipología', title: 'Tipología vehicular' }} />
      <Tab.Screen name="Reportes" component={ReportesScreen} />
    </Tab.Navigator>
  );
}