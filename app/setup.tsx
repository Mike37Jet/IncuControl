import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, BackHandler, Platform, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

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

export default function ConfigScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const [minTemp, setMinTemp] = useState('37.5');
  const [maxTemp, setMaxTemp] = useState('38.0');
  const [startDate] = useState(new Date());
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 21); // 21 días para la incubación
  
  // Valores para animación de feedback
  const minTempScale = useSharedValue(1);
  const maxTempScale = useSharedValue(1);
  
  // Paleta de colores dinámica
  const palette = useMemo(() => ({
    background: Colors[colorScheme].background,
    card: colorScheme === 'dark' ? 'rgba(50,50,55,0.4)' : 'rgba(245,245,247,0.6)',
    cardShadow: colorScheme === 'dark' ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)',
    text: Colors[colorScheme].text,
    textSecondary: colorScheme === 'dark' ? '#8E8E93' : '#6E6E73',
    accent: colorScheme === 'dark' ? '#0A84FF' : '#007AFF',
    subtle: colorScheme === 'dark' ? '#636366' : '#C7C7CC',
    warning: colorScheme === 'dark' ? '#FFD60A' : '#FF9500',
    highlight: colorScheme === 'dark' ? 'rgba(255,214,10,0.15)' : 'rgba(255,149,0,0.15)',
  }), [colorScheme]);

  useEffect(() => {
    // Verificar si ya existe una configuración guardada
    const checkExistingConfig = async () => {
      try {
        const savedConfig = await AsyncStorage.getItem('incubationConfig');
        if (savedConfig) {
          // Si hay una configuración guardada, ir directamente a monitoreo
          router.replace('/(tabs)/monitoring');
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
      configDate: new Date().toISOString(),
    };
    
    try {
      await AsyncStorage.setItem('incubationConfig', JSON.stringify(config));
      // Navegar a la pantalla de monitoreo sin opción de volver atrás
      router.replace('/(tabs)/monitoring');
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
      
      // Animación de feedback
      minTempScale.value = withSequence(
        withTiming(1.1, { duration: 100 }),
        withTiming(1, { duration: 100 })
      );
    } else {
      const min = parseFloat(minTemp);
      const current = parseFloat(maxTemp);
      if (increment) {
        setMaxTemp(Math.min(current + step, 40).toFixed(1));
      } else {
        setMaxTemp(Math.max(current - step, min + step).toFixed(1));
      }
      
      // Animación de feedback
      maxTempScale.value = withSequence(
        withTiming(1.1, { duration: 100 }),
        withTiming(1, { duration: 100 })
      );
    }
  };
  
  // Estilos animados
  const minTempStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: minTempScale.value }]
    };
  });
  
  const maxTempStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: maxTempScale.value }]
    };
  });

  // Determinar si la temperatura está en el rango ideal
  const isIdealRange = () => {
    const min = parseFloat(minTemp);
    const max = parseFloat(maxTemp);
    return min >= 37 && min <= 38 && max >= 37.5 && max <= 38.5 && max - min >= 0.5;
  };

  // Formateador de fechas
  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    };
    return date.toLocaleDateString('es-ES', options);
  };

  // Función para salir completamente de la aplicación
  const handleExitApp = () => {
    Alert.alert(
      "Salir de la aplicación",
      "¿Estás seguro de que deseas salir completamente?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Salir", 
          onPress: () => {
            if (Platform.OS === 'android') {
              // En Android podemos forzar el cierre de la aplicación
              BackHandler.exitApp();
            } else {
              // En iOS mostramos un mensaje explicando que debe usar el gesto del sistema
              Alert.alert(
                "Información",
                "Para salir completamente en iOS, utiliza el gesto de deslizar hacia arriba desde la parte inferior de la pantalla y desliza esta aplicación hacia arriba."
              );
            }
          } 
        }
      ]
    );
  };

  return (
    <SafeAreaView style={[
      styles.safeArea,
      { backgroundColor: palette.background }
    ]}>
      <ScrollView 
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <ThemedText style={styles.titleText}>
          Configuración Inicial
        </ThemedText>

        {/* Instrucciones - Minimalistas */}
        <ThemedView style={[
          styles.section, 
          { 
            backgroundColor: palette.highlight,
            borderLeftColor: palette.warning,
            borderLeftWidth: SPACING.TINY,
            marginBottom: SPACING.LARGE 
          }
        ]}>
          <ThemedView style={styles.sectionHeader}>
            <Feather name="info" size={SPACING.MEDIUM} color={palette.warning} />
            <ThemedText style={[styles.sectionTitle, {color: palette.text}]}>
              Instrucciones
            </ThemedText>
          </ThemedView>
          <ThemedText style={[styles.instructionText, {
            color: palette.text,
            paddingHorizontal: SPACING.LARGE,
            paddingBottom: SPACING.LARGE,
          }]}>
            Establecer el rango de temperatura óptimo para el proceso de incubación
          </ThemedText>
        </ThemedView>

        {/* Tarjetas de fechas - Unificadas */}
        <ThemedView style={[styles.section, { backgroundColor: palette.card }]}>
          <ThemedView style={styles.sectionHeader}>
            <Feather name="calendar" size={SPACING.MEDIUM} color={palette.textSecondary} />
            <ThemedText style={styles.sectionTitle}>Período de Incubación</ThemedText>
          </ThemedView>
          
          <ThemedView style={[styles.dateRow, {
            paddingHorizontal: SPACING.LARGE,
            paddingBottom: SPACING.LARGE,
          }]}>
            <ThemedView style={styles.dateItem}>
              <Feather name="calendar" size={SPACING.MEDIUM} color={palette.textSecondary} />
              <ThemedText style={styles.cardLabel}>Inicio</ThemedText>
              <ThemedText style={styles.dateText}>
                {formatDate(startDate)}
              </ThemedText>
            </ThemedView>
            
            <Feather name="arrow-right" size={SPACING.MEDIUM} color={palette.subtle} style={styles.arrowIcon} />
            
            <ThemedView style={styles.dateItem}>
              <Feather name="check-square" size={SPACING.MEDIUM} color={palette.textSecondary} />
              <ThemedText style={styles.cardLabel}>Finalización</ThemedText>
              <ThemedText style={styles.dateText}>
                {formatDate(endDate)}
              </ThemedText>
            </ThemedView>
          </ThemedView>
        </ThemedView>

        {/* Control de temperatura - Con feedback visual */}
        <ThemedView style={[styles.section, { backgroundColor: palette.card, marginTop: SPACING.LARGE }]}>
          <ThemedView style={styles.sectionHeader}>
            <Feather name="thermometer" size={SPACING.MEDIUM} color={palette.textSecondary} />
            <ThemedText style={styles.sectionTitle}>Rango de Temperatura</ThemedText>
          </ThemedView>
          
          <ThemedView style={[styles.temperatureBlock, {
            paddingHorizontal: SPACING.LARGE,
            paddingBottom: SPACING.LARGE,
          }]}>
            <ThemedView style={styles.temperatureRow}>
              <ThemedView style={styles.tempLabelContainer}>
                <ThemedText style={styles.tempLabelText}>Mínima</ThemedText>
                <Animated.View style={minTempStyle}>
                  <ThemedText style={styles.tempValue}>{minTemp}°C</ThemedText>
                </Animated.View>
              </ThemedView>
              <ThemedView style={styles.valueControl}>
                <TouchableOpacity
                  style={[styles.controlButton, { backgroundColor: palette.subtle }]}
                  onPress={() => adjustTemperature('min', false)}>
                  <Feather name="minus" size={SPACING.MEDIUM} color="white" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.controlButton, { backgroundColor: palette.accent }]}
                  onPress={() => adjustTemperature('min', true)}>
                  <Feather name="plus" size={SPACING.MEDIUM} color="white" />
                </TouchableOpacity>
              </ThemedView>
            </ThemedView>
            
            <ThemedView style={[styles.temperatureBar, { backgroundColor: 'rgba(0,0,0,0.1)' }]}>
              <ThemedView style={[styles.temperatureRange, { 
                left: `${((parseFloat(minTemp) - 35) / (40 - 35)) * 100}%`,
                right: `${(1 - (parseFloat(maxTemp) - 35) / (40 - 35)) * 100}%`,
                backgroundColor: isIdealRange() ? '#34C759' : palette.accent
              }]} />
              
              {/* Marcador del rango óptimo */}
              <ThemedView style={[styles.optimalRangeMarker, { 
                left: `${((37.0 - 35) / (40 - 35)) * 100}%`,
                right: `${(1 - (38.0 - 35) / (40 - 35)) * 100}%`,
              }]} />
            </ThemedView>
            
            <ThemedView style={styles.temperatureScale}>
              <ThemedText style={[styles.scaleText, {color: palette.textSecondary}]}>35°C</ThemedText>
              <ThemedText style={[styles.scaleText, {color: palette.textSecondary}]}>40°C</ThemedText>
            </ThemedView>
            
            <ThemedView style={styles.temperatureRow}>
              <ThemedView style={styles.tempLabelContainer}>
                <ThemedText style={styles.tempLabelText}>Máxima</ThemedText>
                <Animated.View style={maxTempStyle}>
                  <ThemedText style={styles.tempValue}>{maxTemp}°C</ThemedText>
                </Animated.View>
              </ThemedView>
              <ThemedView style={styles.valueControl}>
                <TouchableOpacity
                  style={[styles.controlButton, { backgroundColor: palette.subtle }]}
                  onPress={() => adjustTemperature('max', false)}>
                  <Feather name="minus" size={SPACING.MEDIUM} color="white" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.controlButton, { backgroundColor: palette.accent }]}
                  onPress={() => adjustTemperature('max', true)}>
                  <Feather name="plus" size={SPACING.MEDIUM} color="white" />
                </TouchableOpacity>
              </ThemedView>
            </ThemedView>
            
            {/* Indicador de rango ideal */}
            <ThemedView style={styles.rangeIndicator}>
              <ThemedView style={styles.rangeIconContainer}>
                <Feather 
                  name={isIdealRange() ? "check-circle" : "alert-circle"} 
                  size={SPACING.MEDIUM} 
                  color={isIdealRange() ? "#34C759" : palette.warning} 
                />
              </ThemedView>
              <ThemedText style={[
                styles.rangeIndicatorText, 
                { color: isIdealRange() ? "#34C759" : palette.warning }
              ]}>
                {isIdealRange() 
                  ? "Rango óptimo configurado" 
                  : "Recomendación: 37.0°C - 38.0°C"
                }
              </ThemedText>
            </ThemedView>
          </ThemedView>
        </ThemedView>

        {/* Consejos - Minimalistas */}
        <ThemedView style={[styles.section, { 
          backgroundColor: 'rgba(0,122,255,0.05)', 
          marginTop: SPACING.LARGE 
        }]}>
          <ThemedView style={styles.sectionHeader}>
            <Feather name="info" size={SPACING.MEDIUM} color={palette.accent} />
            <ThemedText style={[styles.sectionTitle, {color: palette.accent}]}>Consejos</ThemedText>
          </ThemedView>
          
          <ThemedView style={[styles.tipsList, {
            paddingHorizontal: SPACING.LARGE,
            paddingBottom: SPACING.LARGE,
          }]}>
            <ThemedView style={styles.tipItem}>
              <Feather name="droplet" size={SPACING.SMALL + 2} color={palette.accent} style={styles.tipIcon} />
              <ThemedText style={styles.tipText}>Humedad recomendada: 55% - 60%</ThemedText>
            </ThemedView>
            
            <ThemedView style={styles.tipItem}>
              <Feather name="thermometer" size={SPACING.SMALL + 2} color={palette.accent} style={styles.tipIcon} />
              <ThemedText style={styles.tipText}>Temperatura óptima: 37.5°C (±0.5°C)</ThemedText>
            </ThemedView>
            
            <ThemedView style={styles.tipItem}>
              <Feather name="refresh-cw" size={SPACING.SMALL + 2} color={palette.accent} style={styles.tipIcon} />
              <ThemedText style={styles.tipText}>Voltear los huevos 3 veces al día</ThemedText>
            </ThemedView>
          </ThemedView>
        </ThemedView>

        {/* Botones de acción */}
        <ThemedView style={styles.buttonContainer}>
          {/* Botón de inicio */}
          <TouchableOpacity
            style={[
              styles.startButton,
              { backgroundColor: isIdealRange() ? '#34C759' : palette.accent },
            ]}
            onPress={handleStartIncubation}>
            <Feather name="play" size={SPACING.MEDIUM} color="white" style={styles.buttonIcon} />
            <ThemedText style={styles.startButtonText}>Iniciar Incubación</ThemedText>
          </TouchableOpacity>
                    {/* Botón de salir */}
          <TouchableOpacity
            style={[styles.exitButton, { backgroundColor: palette.textSecondary }]
            }
            onPress={handleExitApp}>
            <Feather name="x-circle" size={SPACING.MEDIUM} color="white" style={styles.buttonIcon} />
            <ThemedText style={styles.exitButtonText}>Salir de la aplicación</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    padding: SPACING.LARGE,
    flexGrow: 1,
  },
  titleText: {
    fontSize: SPACING.LARGE,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: SPACING.LARGE,
    letterSpacing: -0.5,
  },
  section: {
    borderRadius: SPACING.MEDIUM,
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
    paddingTop: SPACING.MEDIUM,
    paddingBottom: SPACING.MEDIUM,
  },
  sectionTitle: {
    fontSize: SPACING.MEDIUM,
    fontWeight: '600',
    marginLeft: SPACING.SMALL,
  },
  instructionText: {
    fontSize: SPACING.BASE + 2,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateItem: {
    flex: 1,
    alignItems: 'center',
  },
  arrowIcon: {
    marginHorizontal: SPACING.SMALL,
  },
  cardLabel: {
    fontSize: SPACING.BASE,
    marginTop: SPACING.SMALL,
    marginBottom: SPACING.TINY,
    opacity: 0.7,
  },
  dateText: {
    fontSize: SPACING.BASE + 2,
    fontWeight: '600',
  },
  temperatureBlock: {
    marginTop: SPACING.SMALL,
  },
  temperatureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.BASE,
  },
  tempLabelContainer: {
    alignItems: 'flex-start',
  },
  tempLabelText: {
    fontSize: SPACING.BASE,
    opacity: 0.7,
    marginBottom: SPACING.TINY,
  },
  tempValue: {
    fontSize: SPACING.MEDIUM + 2,
    fontWeight: '600',
  },
  valueControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.BASE,
  },
  controlButton: {
    width: SPACING.XLARGE - 2,
    height: SPACING.XLARGE - 2,
    borderRadius: SPACING.MEDIUM,
    justifyContent: 'center',
    alignItems: 'center',
  },
  temperatureBar: {
    height: SPACING.BASE,
    borderRadius: SPACING.BASE / 2,
    marginVertical: SPACING.MEDIUM,
    position: 'relative',
  },
  temperatureRange: {
    position: 'absolute',
    top: 0,
    height: '100%',
    borderRadius: SPACING.BASE / 2,
  },
  optimalRangeMarker: {
    position: 'absolute',
    top: -SPACING.TINY,
    height: SPACING.BASE + SPACING.TINY * 2,
    borderRadius: SPACING.SMALL,
    borderWidth: 1,
    borderColor: '#34C759',
    borderStyle: 'dashed',
    backgroundColor: 'transparent',
  },
  temperatureScale: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.MEDIUM,
  },
  scaleText: {
    fontSize: SPACING.BASE - 1,
  },
  rangeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.SMALL,

  },
  rangeIconContainer: {
    marginRight: SPACING.SMALL,
  },
  rangeIndicatorText: {
    fontSize: SPACING.BASE,
    fontWeight: '500',
  },
  tipsList: {
    marginTop: SPACING.SMALL,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.BASE,
  },
  tipIcon: {
    marginRight: SPACING.SMALL,
  },
  tipText: {
    fontSize: SPACING.BASE + 1,
  },
  buttonContainer: {
    marginTop: SPACING.LARGE,
    gap: SPACING.MEDIUM,
  },
  startButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.MEDIUM + 2,
    borderRadius: SPACING.MEDIUM,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: SPACING.TINY },
        shadowOpacity: 0.2,
        shadowRadius: SPACING.SMALL,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  exitButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.MEDIUM,
    borderRadius: SPACING.MEDIUM,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: SPACING.TINY },
        shadowOpacity: 0.2,
        shadowRadius: SPACING.SMALL,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  buttonIcon: {
    marginRight: SPACING.SMALL,
  },
  startButtonText: {
    color: 'white',
    fontSize: SPACING.MEDIUM,
    fontWeight: '600',
  },
  exitButtonText: {
    color: 'white',
    fontSize: SPACING.MEDIUM - 1,
    fontWeight: '600',
  },
});