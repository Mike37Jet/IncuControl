import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, BackHandler, Platform, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
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
  
  // Justo después de los estados existentes, añadir:
  const [showTempEditModal, setShowTempEditModal] = useState(false);
  const [editMinTemp, setEditMinTemp] = useState('37.5');
  const [editMaxTemp, setEditMaxTemp] = useState('38.0');
  const [incubationConfig, setIncubationConfig] = useState<any>(null);
  
  // Animación para el modal
  const modalOpacity = useSharedValue(0);
  const modalScale = useSharedValue(0.9);
  
  const modalAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: modalOpacity.value,
      transform: [{ scale: modalScale.value }]
    };
  });
  
  // Cargar configuración existente
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const savedConfig = await AsyncStorage.getItem('incubationConfig');
        if (savedConfig) {
          const config = JSON.parse(savedConfig);
          setIncubationConfig(config);
          setEditMinTemp(config.minTemp.toFixed(1));
          setEditMaxTemp(config.maxTemp.toFixed(1));
        }
      } catch (error) {
        console.error('Error al cargar configuración:', error);
      }
    };
    
    loadConfig();
  }, []);
  
  // Mostrar modal de edición
  const handleShowEditTemp = () => {
    // Cargar valores actuales
    if (incubationConfig) {
      setEditMinTemp(incubationConfig.minTemp.toFixed(1));
      setEditMaxTemp(incubationConfig.maxTemp.toFixed(1));
    }
    
    setShowTempEditModal(true);
    modalOpacity.value = withTiming(1, { duration: 300 });
    modalScale.value = withTiming(1, { duration: 300 });
  };
  
  // Ocultar modal
  const handleCloseModal = () => {
    modalOpacity.value = withTiming(0, { duration: 200 });
    modalScale.value = withTiming(0.9, { duration: 200 }, () => {
      runOnJS(setShowTempEditModal)(false);
    });
  };
  
  // Ajustar temperaturas en el modal
  const adjustEditTemperature = (type: 'min' | 'max', increment: boolean) => {
    const step = 0.1;
    if (type === 'min') {
      const current = parseFloat(editMinTemp);
      const max = parseFloat(editMaxTemp);
      if (increment) {
        setEditMinTemp(Math.min(current + step, max - step).toFixed(1));
      } else {
        setEditMinTemp(Math.max(current - step, 35).toFixed(1));
      }
    } else {
      const min = parseFloat(editMinTemp);
      const current = parseFloat(editMaxTemp);
      if (increment) {
        setEditMaxTemp(Math.min(current + step, 40).toFixed(1));
      } else {
        setEditMaxTemp(Math.max(current - step, min + step).toFixed(1));
      }
    }
  };
  
  // Guardar cambios
  const handleSaveTemperature = async () => {
    const min = parseFloat(editMinTemp);
    const max = parseFloat(editMaxTemp);
    
    if (isNaN(min) || isNaN(max) || min >= max) {
      Alert.alert('Error', 'Temperaturas inválidas (mínima < máxima)');
      return;
    }
    
    try {
      // Actualizar la configuración existente
      const updatedConfig = {
        ...incubationConfig,
        minTemp: min,
        maxTemp: max,
        lastUpdated: new Date().toISOString()
      };
      
      await AsyncStorage.setItem('incubationConfig', JSON.stringify(updatedConfig));
      setIncubationConfig(updatedConfig);
      
      // Actualizar la UI con efecto de confirmación
      tempOpacity.value = withSpring(0.6, { damping: 15 });
      setTimeout(() => {
        tempOpacity.value = withSpring(1, { damping: 15 });
      }, 300);
      
      // Cerrar el modal
      handleCloseModal();
      
      // Notificar al usuario
      Alert.alert(
        "Configuración actualizada", 
        `El rango de temperatura ha sido actualizado a ${min}°C - ${max}°C.`
      );
    } catch (error) {
      console.error('Error al guardar configuración:', error);
      Alert.alert('Error', 'No se pudo guardar la configuración');
    }
  };
  
  // Determinar si el rango de temperatura es ideal
  const isIdealRange = () => {
    const min = parseFloat(editMinTemp);
    const max = parseFloat(editMaxTemp);
    return min >= 37 && min <= 38 && max >= 37.5 && max <= 38.5 && max - min >= 0.5;
  };
  
  const handleCancelOrFinishIncubation = () => {
    const isCompleted = progress >= 100;
    
    Alert.alert(
      isCompleted ? "Finalizar Incubación" : "Cancelar Incubación",
      isCompleted 
        ? "¿Estás seguro que deseas finalizar el proceso de incubación? Los huevos ya deberían haber eclosionado."
        : "¿Estás seguro que deseas cancelar el proceso de incubación?",
      [
        { text: "No", style: "cancel" },
        { 
          text: "Sí", 
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('incubationConfig');
              
              if (isCompleted) {
                // Podríamos guardar un registro de la incubación completada exitosamente
                await AsyncStorage.setItem('lastIncubation', JSON.stringify({
                  endDate: new Date().toISOString(),
                  successful: true,
                  duration: 21, // días
                }));
              }
              
              router.replace('/setup');
            } catch (error) {
              console.error(`Error al ${isCompleted ? 'finalizar' : 'cancelar'} incubación:`, error);
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

  // Optimiza la verificación de configuración
  useEffect(() => {
    let isMounted = true;
    
    const checkConfig = async () => {
      try {
        const savedConfig = await AsyncStorage.getItem('incubationConfig');
        if (!savedConfig && isMounted) {
          router.replace('/setup');
        }
      } catch (error) {
        console.error('Error al verificar configuración:', error);
        if (isMounted) router.replace('/setup');
      }
    };
    
    checkConfig();
    
    return () => {
      isMounted = false;
    };
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
            <TouchableOpacity 
              style={styles.editButton}
              onPress={handleShowEditTemp}
            >
              <Feather name="edit-2" size={SPACING.MEDIUM} color={palette.textSecondary} />
            </TouchableOpacity>
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
              style={[styles.button, styles.dangerButton, progress >= 100 && styles.successButton]} 
              onPress={handleCancelOrFinishIncubation}
            >
              <Feather 
                name={progress >= 100 ? "check-circle" : "x-circle"} 
                size={SPACING.MEDIUM} 
                color="white" 
              />
              <ThemedText style={styles.dangerButtonText}>
                {progress >= 100 ? "Finalizar" : "Cancelar"}
              </ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </ThemedView>
        
        {/* Modal para editar temperatura */}
        {showTempEditModal && (
          <>
            <TouchableOpacity 
              style={styles.modalOverlay} 
              activeOpacity={0.8}
              onPress={handleCloseModal}
            />
            <Animated.View style={[styles.modalContainer, modalAnimatedStyle]}>
              <ThemedView style={[styles.modalContent, { backgroundColor: palette.surface }]}>
                <ThemedView style={styles.modalHeader}>
                  <ThemedText style={styles.modalTitle}>Editar Temperatura</ThemedText>
                  <TouchableOpacity onPress={handleCloseModal}>
                    <Feather name="x" size={SPACING.MEDIUM} color={palette.textSecondary} />
                  </TouchableOpacity>
                </ThemedView>
                
                <ThemedView style={[styles.modalBody, { paddingTop: SPACING.MEDIUM }]}>
                  {/* Control de Temperatura Mínima */}
                  <ThemedView style={styles.temperatureRow}>
                    <ThemedView style={styles.tempLabelContainer}>
                      <ThemedText style={styles.tempLabelText}>Mínima</ThemedText>
                      <ThemedText style={styles.tempValue}>{editMinTemp}°C</ThemedText>
                    </ThemedView>
                    <ThemedView style={styles.valueControl}>
                      <TouchableOpacity
                        style={[styles.controlButton, { backgroundColor: palette.neutral }]}
                        onPress={() => adjustEditTemperature('min', false)}>
                        <Feather name="minus" size={SPACING.MEDIUM - 2} color="white" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.controlButton, { backgroundColor: palette.primary }]}
                        onPress={() => adjustEditTemperature('min', true)}>
                        <Feather name="plus" size={SPACING.MEDIUM - 2} color="white" />
                      </TouchableOpacity>
                    </ThemedView>
                  </ThemedView>
                  
                  {/* Barra de rango */}
                  <ThemedView style={[styles.temperatureBar, { backgroundColor: 'rgba(0,0,0,0.1)' }]}>
                    <ThemedView style={[styles.temperatureRange, { 
                      left: `${((parseFloat(editMinTemp) - 35) / (40 - 35)) * 100}%`,
                      right: `${(1 - (parseFloat(editMaxTemp) - 35) / (40 - 35)) * 100}%`,
                      backgroundColor: isIdealRange() ? palette.success : palette.primary
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
                  
                  {/* Control de Temperatura Máxima */}
                  <ThemedView style={styles.temperatureRow}>
                    <ThemedView style={styles.tempLabelContainer}>
                      <ThemedText style={styles.tempLabelText}>Máxima</ThemedText>
                      <ThemedText style={styles.tempValue}>{editMaxTemp}°C</ThemedText>
                    </ThemedView>
                    <ThemedView style={styles.valueControl}>
                      <TouchableOpacity
                        style={[styles.controlButton, { backgroundColor: palette.neutral }]}
                        onPress={() => adjustEditTemperature('max', false)}>
                        <Feather name="minus" size={SPACING.MEDIUM - 2} color="white" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.controlButton, { backgroundColor: palette.primary }]}
                        onPress={() => adjustEditTemperature('max', true)}>
                        <Feather name="plus" size={SPACING.MEDIUM - 2} color="white" />
                      </TouchableOpacity>
                    </ThemedView>
                  </ThemedView>
                  
                  {/* Indicador de rango ideal */}
                  <ThemedView style={styles.rangeIndicator}>
                    <ThemedView style={styles.rangeIconContainer}>
                      <Feather 
                        name={isIdealRange() ? "check-circle" : "alert-circle"} 
                        size={SPACING.MEDIUM} 
                        color={isIdealRange() ? palette.success : palette.warning} 
                      />
                    </ThemedView>
                    <ThemedText style={[
                      styles.rangeIndicatorText, 
                      { color: isIdealRange() ? palette.success : palette.warning }
                    ]}>
                      {isIdealRange() 
                        ? "Rango óptimo configurado" 
                        : "Recomendación: 37.0°C - 38.0°C"
                      }
                    </ThemedText>
                  </ThemedView>
                </ThemedView>
                
                <ThemedView style={styles.modalFooter}>
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={handleCloseModal}
                  >
                    <ThemedText style={styles.cancelButtonText}>Cancelar</ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.saveButton, { backgroundColor: palette.primary }]}
                    onPress={handleSaveTemperature}
                  >
                    <ThemedText style={styles.saveButtonText}>Guardar</ThemedText>
                  </TouchableOpacity>
                </ThemedView>
              </ThemedView>
            </Animated.View>
          </>
        )}
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
  successButton: {
    backgroundColor: '#34C759',
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
  // Estilos para el botón de edición
  editButton: {
    marginLeft: 'auto',
    padding: SPACING.SMALL,
  },
  
  // Estilos para el modal
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContainer: {
    position: 'absolute',
    width: '90%',
    alignSelf: 'center',
    top: '25%',
    zIndex: 1001,
  },
  modalContent: {
    borderRadius: SPACING.MEDIUM,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: SPACING.TINY },
        shadowOpacity: 0.25,
        shadowRadius: SPACING.MEDIUM,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.MEDIUM,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalTitle: {
    fontSize: SPACING.MEDIUM,
    fontWeight: '600',
  },
  modalBody: {
    padding: SPACING.MEDIUM,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: SPACING.MEDIUM,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.1)',
    gap: SPACING.MEDIUM,
  },
  modalButton: {
    paddingVertical: SPACING.BASE,
    paddingHorizontal: SPACING.LARGE,
    borderRadius: SPACING.BASE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  saveButton: {
    minWidth: 100,
  },
  cancelButtonText: {
    fontWeight: '500',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  
  // Estilos adicionales para el editor de temperatura
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
    fontSize: SPACING.MEDIUM,
    fontWeight: '600',
  },
  valueControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.BASE,
  },
  controlButton: {
    width: SPACING.XLARGE - 8,
    height: SPACING.XLARGE - 8,
    borderRadius: SPACING.SMALL,
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
    fontSize: SPACING.BASE - 1,
    fontWeight: '500',
  },
});