// app/screens/drawable/DrawerNavigator.tsx
import { createDrawerNavigator } from '@react-navigation/drawer';
import ChatScreen from './ChatScreen';
import DashboardScreen from './dashboard';
import LogoutScreen from './logout';
import ProfileScreen from './ProfileScreen';
export type RootDrawerParamList = {
  Dashboard: undefined;
  Profile: undefined;
  Logout: undefined;
  Chat: undefined;
};

const Drawer = createDrawerNavigator<RootDrawerParamList>();

export default function DrawerNavigator() {
  return (
    <Drawer.Navigator
      initialRouteName="Dashboard"
      screenOptions={{
        headerShown: false,
        drawerStyle: { backgroundColor: '#1e293b' },
        drawerActiveTintColor: '#FFD700',
        drawerInactiveTintColor: '#ccc',
        drawerType: 'slide',
      }}
    >
      <Drawer.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ title: '🏠 Dashboard' }}
      />
      <Drawer.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: '👤 Profile' }}
      />
      <Drawer.Screen
        name="Logout"
        component={LogoutScreen}
        options={{ title: '🚪 Logout' }}
      />
      <Drawer.Screen
        name="Chat"
        component={ChatScreen}
        options={{ title: '💬 Chat' }}
      />
    </Drawer.Navigator>
  );
}
