// app/screens/drawable/_layout.tsx (updated)
import { createDrawerNavigator, DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import ChatScreen from './chat';
import DashboardScreen from './dashboard';
import LogoutScreen from './logout';
import ProfileScreen from './ProfileScreen';

const Drawer = createDrawerNavigator();

// Custom Drawer Content Component
function CustomDrawerContent(props) {
  return (
    <DrawerContentScrollView 
      {...props} 
      contentContainerStyle={styles.drawerContainer}
    >
      {/* Drawer Header - Using same image as profile page */}
      <View style={styles.drawerHeader}>
        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: 'https://i.pravatar.cc/300' }}
            style={styles.profileImage}
          />
          <View style={styles.onlineIndicator} />
        </View>
        <View style={styles.headerTextContainer}>
          <Text style={styles.userName}>User123</Text>
          <Text style={styles.userEmail}>user123@example.com</Text>
          
        </View>
      </View>

      {/* Drawer Items */}
      <View style={styles.drawerItems}>
        <DrawerItem
          label="Dashboard"
          onPress={() => props.navigation.navigate('Dashboard')}
          icon={({ color, size }) => (
            <Ionicons name="home-outline" size={size} color="#FFD700" />
          )}
          labelStyle={styles.drawerLabel}
        />
        <DrawerItem
          label="Profile"
          onPress={() => props.navigation.navigate('Profile')}
          icon={({ color, size }) => (
            <Ionicons name="person-outline" size={size} color="#FFD700" />
          )}
          labelStyle={styles.drawerLabel}
        />
        <DrawerItem
          label="Chat"
          onPress={() => props.navigation.navigate('Chat')}
          icon={({ color, size }) => (
            <Ionicons name="chatbubble-outline" size={size} color="#FFD700" />
          )}
          labelStyle={styles.drawerLabel}
        />
      </View>

      {/* Logout Button positioned above footer */}
      <View style={styles.logoutContainer}>
        <DrawerItem
          label="Logout"
          onPress={() => props.navigation.navigate('Logout')}
          icon={({ color, size }) => (
            <MaterialIcons name="logout" size={size} color="#FFD700" />
          )}
          labelStyle={[styles.drawerLabel, styles.logoutLabel]}
        />
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>v1.0.0</Text>
      </View>
    </DrawerContentScrollView>
  );
}

export default function DrawerLayout() {
  return (
    <>
      <StatusBar hidden />
      <Drawer.Navigator
        initialRouteName="Dashboard"
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        screenOptions={{
          headerShown: false,
          drawerStyle: { backgroundColor: '#1e293b', width: 300 },
          drawerActiveTintColor: '#FFD700',
          drawerInactiveTintColor: '#ccc',
          drawerType: 'slide',
          drawerLabelStyle: {
            marginLeft: -15,
            fontSize: 16,
          },
        }}
      >
        <Drawer.Screen
          name="Dashboard"
          component={DashboardScreen}
        />
        <Drawer.Screen
          name="Profile"
          component={ProfileScreen}
        />
        <Drawer.Screen
          name="Logout"
          component={LogoutScreen}
        />
        <Drawer.Screen
          name="Chat"
          component={ChatScreen}
        />
      </Drawer.Navigator>
    </>
  );
}

const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
  },
  drawerHeader: {
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 15,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#1e293b',
  },
  headerTextContainer: {
    flex: 1,
  },
  userName: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  userEmail: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    marginBottom: 8,
  },
  userLevelBadge: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  userLevelText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: 'bold',
  },
  drawerItems: {
    flex: 1,
    paddingTop: 10,
  },
  drawerLabel: {
    color: 'white',
    fontWeight: '500',
  },
  logoutContainer: {
    marginTop: 'auto',
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  logoutLabel: {
    color: '#FF6B6B',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    fontSize: 12,
  },
});