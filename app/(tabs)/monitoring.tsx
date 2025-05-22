import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, BackHandler, Platform, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import Calendar from '../../components/Calendar';

// Constantes de proporción basadas en secuencia Fibonacci
const SPACING = {
  TINY: 2,
  SMALL: 5,
  BASE: 8,
  MEDIUM: 13,
  LARGE: 21,
  XLARGE: 34,
  XXLARGE: 55,
};

export default function MonitoringScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  
  // Valores simulados
  const [currentTemp, setCurrentTemp] = useState(37.8);
  const [currentHumidity, setCurrentHumidity] = useState(58);
  const [daysLeft, setDaysLeft] = useState(21);
  const [progress, setProgress] = useState(0);
  
  // Animaciones
  const tempOpacity = useSharedValue(1);
  const humidityOpacity = useSharedValue(1);
  
  // Estado de alertas
  const [tempAlert, setTempAlert] = useState(false);
  const [humidityAlert, setHumidityAlert] = useState(false);
  
  // Paleta de colores dinámica
  const palette = useMemo(() => ({
    primary: Colors[colorScheme].tint,
    background: colorScheme === 'dark' ? '#1A1A1C' : '#FFFFFF',
    surface: colorScheme === 'dark' ? '#2C2C2E' : '#F5F5F7',
    card: colorScheme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
    text: Colors[colorScheme].text,
    textSecondary: colorScheme === 'dark' ? '#8E8E93' : '#6E6E73',
    danger: colorScheme === 'dark' ? '#FF453A' : '#FF3B30',
    success: colorScheme === 'dark' ? '#30D158' : '#34C759',
    warning: colorScheme === 'dark' ? '#FFD60A' : '#FFCC00',
    neutral: colorScheme === 'dark' ? '#8E8E93' : '#8E8E93',
  }), [colorScheme]);
  
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(startDate.getDate() + 21);
  
  // Simulación de cambios en los valores con alertas
  useEffect(() => {
    const interval = setInterval(() => {
      const newTemp = +(currentTemp + (Math.random() - 0.5) * 0.2).toFixed(1);
      const newHumidity = Math.floor(currentHumidity + (Math.random() - 0.5) * 2);
      
      // Verificar si los valores están fuera de rangos óptimos
      const isTempAlert = newTemp < 37 || newTemp > 38;
      const isHumidityAlert = newHumidity < 55 || newHumidity > 60;
      
      setTempAlert(isTempAlert);
      setHumidityAlert(isHumidityAlert);
      
      // Animar cambio de opacidad para resaltar cambios
      tempOpacity.value = withSpring(0.6, { damping: 15 });
      humidityOpacity.value = withSpring(0.6, { damping: 15 });
      
      setTimeout(() => {
        tempOpacity.value = withSpring(1, { damping: 15 });
        humidityOpacity.value = withSpring(1, { damping: 15 });
      }, 300);
      
      setCurrentTemp(newTemp);
      setCurrentHumidity(newHumidity);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [currentTemp, currentHumidity]);
  
  // Calcular el progreso de la incubación
  useEffect(() => {
    const daysPassed = 21 - daysLeft;
    const newProgress = (daysPassed / 21) * 100;
    setProgress(newProgress);
  }, [daysLeft]);
  
  // Para simular la reducción de días
  useEffect(() => {
    const timer = setTimeout(() => {
      if (daysLeft > 0) {
        setDaysLeft(prev => prev - 1);
      }
    }, 60000); // Reducir en un día cada minuto (para demostración)
    
    return () => clearTimeout(timer);
  }, [daysLeft]);
  
  // Estilos animados
  const tempValueStyle = useAnimatedStyle(() => {
    return {
      opacity: tempOpacity.value,
      transform: [{ scale: tempOpacity.value * 0.4 + 0.6 }]
    };
  });
  
  const humidityValueStyle = useAnimatedStyle(() => {
    return {
      opacity: humidityOpacity.value,
      transform: [{ scale: humidityOpacity.value * 0.4 + 0.6 }]
    };
  });
  
  const handleCancelIncubation = () => {
    Alert.alert(
      "Cancelar Incubación",
      "¿Estás seguro que deseas cancelar el proceso de incubación?",
      [
        { text: "No", style: "cancel" },
        { 
          text: "Sí", 
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('incubationConfig');
              router.replace('/setup');
            } catch (error) {
              console.error('Error al cancelar incubación:', error);
            }
          } 
        }
      ]
    );
  };
  
  const handleExit = () => {
    Alert.alert(
      "Minimizar aplicación",
      "La aplicación se minimizará y continuará monitoreando en segundo plano.",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Aceptar", 
          onPress: () => {
            if (Platform.OS === 'android') {
              // En Android, esto minimiza la aplicación sin cerrarla completamente
              BackHandler.exitApp();
            } else {
              // En iOS, esto es lo más cercano a minimizar (regresa a la pantalla de inicio)
              // La app seguirá ejecutándose en segundo plano
              router.navigate('/(tabs)/monitoring');
              setTimeout(() => {
                Alert.alert(
                  "Monitoreo en segundo plano", 
                  "La aplicación continuará el seguimiento de incubación en segundo plano."
                );
              }, 300);
            }
          } 
        }
      ]
    );
  };

  useEffect(() => {
    const checkConfig = async () => {
      try {
        const savedConfig = await AsyncStorage.getItem('incubationConfig');
        if (!savedConfig) {
          router.replace('/setup');
        }
      } catch (error) {
        console.error('Error al verificar configuración:', error);
        router.replace('/setup');
      }
    };
    
    checkConfig();
  }, []);

  // Obtener colores para valores según estados (normal/alerta)
  const getTempColor = () => {
    if (tempAlert) {
      return currentTemp < 37 ? palette.warning : palette.danger;
    }
    return palette.success;
  };
  
  const getHumidityColor = () => {
    if (humidityAlert) {
      return currentHumidity < 55 ? palette.warning : palette.danger;
    }
    return palette.success;
  };

  return (
    <SafeAreaView style={[
      styles.safeArea, 
      { backgroundColor: palette.background }
    ]}>
      <ParallaxScrollView
        headerBackgroundColor={{ light: '#F5F5F7', dark: '#1A1A1C' }}
        headerImage={
          <Image
            source={require('@/assets/images/partial-react-logo.png')}
            style={[
              styles.headerImage,
              
            ]}
          />
        }
      >
        
        {/* Encabezado con animación sutil */}
        <ThemedView style={[styles.titleContainer]}>
          <ThemedText type="title" style={styles.titleText}>
            Monitoreo de Incubadora
          </ThemedText>
          
          <ThemedView style={styles.dayCountContainer}>
            <ThemedText style={styles.dayCountLabel}>
              Día {21 - daysLeft} de 21
            </ThemedText>
          </ThemedView>
        </ThemedView>
        
        {/* Sección de Condiciones Actuales - Diseño minimalista */}
        <ThemedView style={[styles.section, { backgroundColor: palette.card }]}>
          <ThemedView style={styles.sectionHeader}>
            <Feather name="thermometer" size={SPACING.MEDIUM} color={palette.textSecondary} />
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Condiciones Actuales
            </ThemedText>
          </ThemedView>
          
          <ThemedView style={styles.statsContainer}>
            <ThemedView style={styles.statItem}>
              <ThemedText style={styles.statLabel}>Temperatura</ThemedText>
              <Animated.View style={tempValueStyle}>
                <ThemedText style={[
                  styles.statValue,
                  { color: getTempColor() }
                ]}>
                  {currentTemp}°C
                </ThemedText>
              </Animated.View>
              <ThemedText style={styles.statRange}>
                Ideal: 37.5 ± 0.5°C
              </ThemedText>
            </ThemedView>
            
            <ThemedView style={styles.statSeparator} />
            
            <ThemedView style={styles.statItem}>
              <ThemedText style={styles.statLabel}>Humedad</ThemedText>
              <Animated.View style={humidityValueStyle}>
                <ThemedText style={[
                  styles.statValue,
                  { color: getHumidityColor() }
                ]}>
                  {currentHumidity}%
                </ThemedText>
              </Animated.View>
              <ThemedText style={styles.statRange}>
                Ideal: 55-60%
              </ThemedText>
            </ThemedView>
            
            <ThemedView style={styles.statSeparator} />
            
            <ThemedView style={styles.statItem}>
              <ThemedText style={styles.statLabel}>Días Restantes</ThemedText>
              <ThemedText style={styles.statValue}>
                {daysLeft}
              </ThemedText>
              <ThemedText style={styles.statRange}>
                Eclosión: {endDate.toLocaleDateString('es-ES', {day: 'numeric', month: 'short'})}
              </ThemedText>
            </ThemedView>
          </ThemedView>
        </ThemedView>
        
        {/* Sección de Calendario */}
        <ThemedView style={[styles.section, { backgroundColor: palette.card }]}>
          <ThemedView style={styles.sectionHeader}>
            <Feather name="calendar" size={SPACING.MEDIUM} color={palette.textSecondary} />
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Calendario de Incubación
            </ThemedText>
          </ThemedView>
          <Calendar 
            startDate={startDate} 
            endDate={endDate} 
            currentDate={new Date()} 
          />
        </ThemedView>
        
        {/* Sección de Progreso */}
        <ThemedView style={[styles.section, { backgroundColor: palette.card }]}>
          <ThemedView style={styles.sectionHeader}>
            <Feather name="activity" size={SPACING.MEDIUM} color={palette.textSecondary} />
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Progreso de Incubación
            </ThemedText>
          </ThemedView>
          
          <ThemedView style={styles.progressContainer}>
            <ThemedText style={styles.progressText}>
              {progress.toFixed(0)}%
            </ThemedText>
            
            <ThemedView style={styles.progressBarContainer}>
              <ThemedView style={[
                styles.progressBarBackground,
                { backgroundColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }
              ]}>
                <ThemedView 
                  style={[
                    styles.progressBarFill, 
                    {width: `${progress}%`, backgroundColor: palette.primary}
                  ]} 
                />
              </ThemedView>
              
              <ThemedView style={styles.progressMarkers}>
                <ThemedText style={styles.progressMarkerText}>0%</ThemedText>
                <ThemedText style={styles.progressMarkerText}>50%</ThemedText>
                <ThemedText style={styles.progressMarkerText}>100%</ThemedText>
              </ThemedView>
            </ThemedView>
          </ThemedView>
          
          <ThemedView style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.secondaryButton]} 
              onPress={handleExit}
            >
              <Feather name="bar-chart-2" size={SPACING.MEDIUM} color={palette.text} />
              <ThemedText style={styles.secondaryButtonText}>Salir</ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, styles.dangerButton]} 
              onPress={handleCancelIncubation}
            >
              <Feather name="x-circle" size={SPACING.MEDIUM} color="white" />
              <ThemedText style={styles.dangerButtonText}>Cancelar</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </ThemedView>
      </ParallaxScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  headerImage: {
    height: '100%',
    width: '100%',
    bottom: 0,
    left: 0,
    position: 'absolute',
    resizeMode: 'contain',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: SPACING.LARGE,
    marginHorizontal: SPACING.LARGE,
    marginTop: SPACING.MEDIUM,
  },
  titleText: {
    fontSize: SPACING.LARGE,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  dayCountContainer: {
    marginTop: SPACING.SMALL,
    paddingHorizontal: SPACING.MEDIUM,
    paddingVertical: SPACING.SMALL,
    borderRadius: SPACING.LARGE,
    backgroundColor: 'rgba(0,122,255,0.1)',
  },
  dayCountLabel: {
    fontSize: SPACING.BASE + 2,
    fontWeight: '600',
    color: '#007AFF',
  },
  section: {
    borderRadius: SPACING.MEDIUM,
    marginBottom: SPACING.LARGE,
    marginHorizontal: SPACING.TINY,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: SPACING.TINY },
        shadowOpacity: 0.05,
        shadowRadius: SPACING.MEDIUM,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.LARGE,
    paddingTop: SPACING.LARGE,
    paddingBottom: SPACING.MEDIUM,
  },
  sectionTitle: {
    fontSize: SPACING.MEDIUM,
    fontWeight: '600',
    marginLeft: SPACING.SMALL,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.MEDIUM,
    paddingBottom: SPACING.LARGE,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statSeparator: {
    height: SPACING.XLARGE * 1.5,
    width: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(0,0,0,0.1)',
    alignSelf: 'center',
  },
  statLabel: {
    fontSize: SPACING.BASE + 2,
    marginBottom: SPACING.SMALL,
    opacity: 0.7,
    fontWeight: '500',
  },
  statValue: {
    fontSize: SPACING.LARGE + 1,
    fontWeight: '700',
    marginVertical: SPACING.SMALL,
  },
  statRange: {
    fontSize: SPACING.BASE - 1,
    opacity: 0.5,
    marginTop: SPACING.TINY,
  },
  progressContainer: {
    paddingHorizontal: SPACING.LARGE,
    paddingBottom: SPACING.LARGE,
  },
  progressText: {
    fontSize: SPACING.LARGE,
    fontWeight: '700',
    marginBottom: SPACING.SMALL,
    textAlign: 'center',
  },
  progressBarContainer: {
    marginTop: SPACING.SMALL,
  },
  progressBarBackground: {
    height: SPACING.BASE,
    borderRadius: SPACING.BASE / 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: SPACING.BASE / 2,
  },
  progressMarkers: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.TINY,
    marginTop: SPACING.SMALL,
  },
  progressMarkerText: {
    fontSize: SPACING.BASE - 1,
    opacity: 0.5,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.LARGE,
    paddingBottom: SPACING.LARGE,
  },
  button: {
    flexDirection: 'row',
    paddingVertical: SPACING.MEDIUM,
    borderRadius: SPACING.BASE,
    alignItems: 'center',
    justifyContent: 'center',
    width: '48%',
  },
  dangerButton: {
    backgroundColor: '#FF3B30',
  },
  secondaryButton: {
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  dangerButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: SPACING.SMALL,
  },
  secondaryButtonText: {
    fontWeight: '600',
    marginLeft: SPACING.SMALL,
  },
});