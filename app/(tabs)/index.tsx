import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, BackHandler, Platform, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function ConfigScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const [minTemp, setMinTemp] = useState('37.5');
  const [maxTemp, setMaxTemp] = useState('38.0');
  const [startDate] = useState(new Date());
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 21); // 21 días para la incubación

  useEffect(() => {
    // Verificar si ya existe una configuración guardada
    const checkExistingConfig = async () => {
      try {
        const savedConfig = await AsyncStorage.getItem('incubationConfig');
        if (savedConfig) {
          // Si hay una configuración guardada, ir directamente a monitoreo
          router.replace('./monitoring');
        }
      } catch (error) {
        console.error('Error al verificar configuración:', error);
      }
    };
    
    checkExistingConfig();

    // Prevenir la navegación hacia atrás sin configuración
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // Bloquear el botón de retroceso en Android
      return true;
    });

    return () => backHandler.remove();
  }, []);

  const handleStartIncubation = async () => {
    const min = parseFloat(minTemp);
    const max = parseFloat(maxTemp);
    
    if (isNaN(min) || isNaN(max) || min >= max) {
      Alert.alert('Error', 'Temperaturas inválidas (mínima < máxima)');
      return;
    }
    
    // Guardar la configuración
    const config = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      minTemp: min,
      maxTemp: max,
      configDate: new Date().toISOString(), // Añadir fecha de configuración
    };
    
    try {
      await AsyncStorage.setItem('incubationConfig', JSON.stringify(config));
      // Navegar a la pantalla de monitoreo sin opción de volver atrás
      router.replace('./monitoring');
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar la configuración');
      console.error(error);
    }
  };

  const adjustTemperature = (type: 'min' | 'max', increment: boolean) => {
    const step = 0.1;
    if (type === 'min') {
      const current = parseFloat(minTemp);
      const max = parseFloat(maxTemp);
      if (increment) {
        setMinTemp(Math.min(current + step, max - step).toFixed(1));
      } else {
        setMinTemp(Math.max(current - step, 35).toFixed(1));
      }
    } else {
      const min = parseFloat(minTemp);
      const current = parseFloat(maxTemp);
      if (increment) {
        setMaxTemp(Math.min(current + step, 40).toFixed(1));
      } else {
        setMaxTemp(Math.max(current - step, min + step).toFixed(1));
      }
    }
  };

  return (
    <ScrollView 
      contentContainerStyle={[
        styles.container,
        { backgroundColor: Colors[colorScheme].background }
      ]}
    >
      <ThemedView style={styles.headerRow}>
        <ThemedText type="title">Configuración Inicial</ThemedText>
      </ThemedView>

      {/* Instrucciones */}
      <ThemedView style={styles.instructionCard}>
        <ThemedText style={styles.instructionText}>
          Esta configuración es necesaria para comenzar el proceso de incubación. 
          Una vez establecida, no podrá modificarse.
        </ThemedText>
      </ThemedView>

      {/* Tarjetas de fechas */}
      <ThemedView style={styles.card}>
        <ThemedText style={styles.cardLabel}>Fecha inicio</ThemedText>
        <ThemedText type="defaultSemiBold" style={styles.cardValue}>
          {startDate.toLocaleDateString()}
        </ThemedText>
      </ThemedView>
      
      <ThemedView style={styles.card}>
        <ThemedText style={styles.cardLabel}>Fecha fin aprox.</ThemedText>
        <ThemedText type="defaultSemiBold" style={styles.cardValue}>
          {endDate.toLocaleDateString()}
        </ThemedText>
      </ThemedView>

      {/* Control de temperatura */}
      <ThemedView style={styles.temperatureBlock}>
        <ThemedView style={styles.temperatureRow}>
          <ThemedText style={styles.tempLabel}>Mínima: {minTemp}°C</ThemedText>
          <ThemedView style={styles.valueControl}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => adjustTemperature('min', false)}>
              <ThemedText style={styles.buttonText}>-</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => adjustTemperature('min', true)}>
              <ThemedText style={styles.buttonText}>+</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </ThemedView>
        
        <ThemedView style={styles.temperatureBar}>
          <ThemedView style={[styles.temperatureRange, { 
            left: `${((parseFloat(minTemp) - 35) / (40 - 35)) * 100}%`,
            right: `${(1 - (parseFloat(maxTemp) - 35) / (40 - 35)) * 100}%`,
            backgroundColor: Colors[colorScheme].tint
          }]} />
        </ThemedView>
        
        <ThemedView style={styles.temperatureScale}>
          <ThemedText style={styles.scaleText}>35°C</ThemedText>
          <ThemedText style={styles.scaleText}>40°C</ThemedText>
        </ThemedView>
        
        <ThemedView style={styles.temperatureRow}>
          <ThemedText style={styles.tempLabel}>Máxima: {maxTemp}°C</ThemedText>
          <ThemedView style={styles.valueControl}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => adjustTemperature('max', false)}>
              <ThemedText style={styles.buttonText}>-</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => adjustTemperature('max', true)}>
              <ThemedText style={styles.buttonText}>+</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </ThemedView>
      </ThemedView>

      {/* Consejos */}
      <ThemedView style={[styles.card, styles.adviceCard]}>
        <ThemedText style={styles.adviceTitle}>Consejos de incubación</ThemedText>
        <ThemedText style={styles.adviceText}>• Humedad recomendada: 55% – 60%</ThemedText>
        <ThemedText style={styles.adviceText}>• Temperatura óptima: 37.5°C (±0.5°C)</ThemedText>
        <ThemedText style={styles.adviceText}>• Voltear los huevos 3 veces al día</ThemedText>
      </ThemedView>

      {/* Botón de inicio */}
      <TouchableOpacity
        style={[
          styles.startButton,
          { backgroundColor: Colors[colorScheme].tint },
        ]}
        onPress={handleStartIncubation}>
        <ThemedText style={styles.startButtonText}>Iniciar Incubación</ThemedText>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flexGrow: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  instructionCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    backgroundColor: 'rgba(255, 193, 7, 0.2)',
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  instructionText: {
    fontSize: 14,
    lineHeight: 20,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: 'rgba(0,0,0,0.03)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  cardLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 16,
  },
  temperatureBlock: {
    marginVertical: 20,
  },
  temperatureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
  },
  tempLabel: {
    fontSize: 16,
  },
  valueControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  controlButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#0a7ea4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  temperatureBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginVertical: 12,
    position: 'relative',
  },
  temperatureRange: {
    position: 'absolute',
    top: 0,
    height: '100%',
    borderRadius: 4,
  },
  temperatureScale: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  scaleText: {
    fontSize: 12,
    color: '#888',
  },
  adviceCard: {
    backgroundColor: '#fffde7',
  },
  adviceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333333',
  },
  adviceText: {
    fontSize: 14,
    marginVertical: 2,
    color: '#333333',
  },
  startButton: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  startButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
