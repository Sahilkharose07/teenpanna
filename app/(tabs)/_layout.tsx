// app/_layout.tsx
import { useColorScheme } from '@/hooks/useColorScheme';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import 'react-native-reanimated';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../../assets/fonts/SpaceMono-Regular.ttf'), 
  });

  const [isLoggedIn, setIsLoggedIn] = useState(true); // Set to true after login

  if (!loaded) return null;

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      {isLoggedIn ? (
        <Slot /> // ✅ Goes to screens/drawable/_layout.tsx
      ) : (
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="screens/LoginScreen" />
          <Stack.Screen name="screens/RegisterScreen" />
          <Stack.Screen name="screens/HomeScreen" />
        </Stack>
      )}
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
