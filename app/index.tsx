import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function Index() {
  const colorScheme = useColorScheme() ?? 'light';
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const checkConfig = async () => {
      try {
        // Esperar un poco para mostrar la pantalla de carga
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Comprobar si existe configuración
        const savedConfig = await AsyncStorage.getItem('incubationConfig');
        
        if (savedConfig) {
          router.replace('/(tabs)/monitoring');
        } else {
          router.replace('/setup');
        }
      } catch (error) {
        console.error('Error al verificar configuración:', error);
        router.replace('/setup');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkConfig();
  }, []);
  
  return (
    <View style={[
      styles.container,
      { backgroundColor: Colors[colorScheme].background }
    ]}>
      <Image
        source={require('@/assets/images/icon.svg')}
        style={styles.logo}
      />
      <ThemedText style={styles.title}>IncuControl</ThemedText>
      <ActivityIndicator 
        size="large" 
        color={Colors[colorScheme].tint}
        style={styles.loader} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  loader: {
    marginTop: 20,
  }
});