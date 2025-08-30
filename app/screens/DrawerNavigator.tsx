import { createDrawerNavigator } from '@react-navigation/drawer';
import { createStackNavigator } from '@react-navigation/stack';
import DashboardScreen from '../screens/drawable/dashboard';
import ProfileScreen from '../screens/drawable/ProfileScreen';
import SettingsScreen from './SettingsScreen';
import TeenPattiScreen from './TeenPattiScreen';

const Drawer = createDrawerNavigator();
const Stack = createStackNavigator();

// Stack screen for game-related views
function GameStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TeenPatti" component={TeenPattiScreen} />
    </Stack.Navigator>
  );
}

export default function DrawerNavigator() {
  return (
    <Drawer.Navigator screenOptions={{ headerShown: false }}>
      <Drawer.Screen name="Dashboard" component={DashboardScreen} />
      <Drawer.Screen name="Profile" component={ProfileScreen} />
      <Drawer.Screen name="Settings" component={SettingsScreen} />

    
      <Drawer.Screen
        name="GameStack"
        component={GameStack}
        options={{
          drawerItemStyle: { display: 'none' }, 
        }}
      />
    </Drawer.Navigator>
  );
}
