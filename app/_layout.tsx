import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { SplashScreen, Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      // Verificar si hay configuración guardada
      const checkConfig = async () => {
        try {
          const savedConfig = await AsyncStorage.getItem('incubationConfig');

          // Redirigir basado en la configuración
          if (savedConfig) {
            router.replace('/(tabs)/monitoring');
          } else {
            router.replace('/setup');
          }

          // Ocultar la pantalla de splash después de decidir la ruta
          SplashScreen.hideAsync();
        } catch (error) {
          console.error('Error al verificar configuración:', error);
          router.replace('/setup');
          SplashScreen.hideAsync();
        }
      };

      checkConfig();
    }
  }, [loaded, router]);

  // Mostrar una vista vacía mientras se cargan los recursos
  if (!loaded) {
    return <View />;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="setup" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
