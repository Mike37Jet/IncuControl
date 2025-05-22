import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { SplashScreen, Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const segments = useSegments();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Verificar si debemos ir a setup o a monitoring
    const checkInitialRoute = async () => {
      try {
        // Comprobar si ya hay una configuración guardada
        const savedConfig = await AsyncStorage.getItem('incubationConfig');

        // Si estamos en una ruta diferente de setup o (tabs), redirigir
        if (segments[0] !== 'setup' && segments[0] !== '(tabs)') {
          // Si ya hay configuración, ir a la tab de monitoring, si no, ir a setup
          if (savedConfig) {
            router.replace('/(tabs)/monitoring');
          } else {
            router.replace('/setup');
          }
        }

        // Marcar que ya estamos listos para mostrar la UI
        setIsReady(true);
      } catch (error) {
        console.error('Error al verificar la ruta inicial:', error);
        // En caso de error, mostrar setup
        router.replace('/setup');
        setIsReady(true);
      }
    };

    checkInitialRoute();
  }, [router, segments]);

  useEffect(() => {
    // Ocultar la pantalla de splash cuando estemos listos
    if (isReady) {
      SplashScreen.hideAsync();
    }
  }, [isReady]);

  // Mientras se decide a dónde ir, mostrar una vista vacía
  if (!isReady || !loaded) {
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
