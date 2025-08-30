import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import DrawerNavigator from './DrawerNavigator';
import SettingsScreen from './SettingsScreen';

export type RootStackParamList = {
  MainDrawer: undefined;  
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainDrawer" component={DrawerNavigator} />
      <Stack.Screen name="Settings" component={SettingsScreen}/>
      
    </Stack.Navigator>
  );
}
