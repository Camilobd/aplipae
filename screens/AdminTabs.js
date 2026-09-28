import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import AforadoresListScreen from './AforadoresListScreen';
import ZonasAforoScreen from './ZonasAforoScreen';
import ReportesScreen from './ReportesScreen';
import { colors } from '../styles/theme';

const Tab = createBottomTabNavigator();

const ICONOS = {
  Aforadores: 'people-outline',
  ZonasAforo: 'git-network-outline',
  Reportes: 'bar-chart-outline',
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
      <Tab.Screen name="ZonasAforo" component={ZonasAforoScreen} options={{ tabBarLabel: 'Zonas de aforo', title: 'Zonas de aforo' }} />
      <Tab.Screen name="Reportes" component={ReportesScreen} />
    </Tab.Navigator>
  );
}