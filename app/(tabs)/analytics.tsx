import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Platform, ScrollView, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
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

// Tipo para los datos de temperatura/humedad
interface SensorData {
  timestamp: Date;
  temperature: number;
  humidity: number;
}

export default function AnalyticsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const [tempData, setTempData] = useState<SensorData[]>([]);
  const [humidityData, setHumidityData] = useState<SensorData[]>([]);
  const [timeLabels, setTimeLabels] = useState<string[]>([]);
  const [selectedView, setSelectedView] = useState<'temperature' | 'humidity'>('temperature');
  
  // Animación para transición entre vistas
  const viewTransition = useSharedValue(0);
  
  // Efectos de animación
  const tempViewStyle = useAnimatedStyle(() => {
    return {
      opacity: 1 - viewTransition.value,
      transform: [{ translateX: -100 * viewTransition.value }],
      position: 'absolute',
      width: '100%',
      display: viewTransition.value > 0.5 ? 'none' : 'flex',
    };
  });
  
  const humidityViewStyle = useAnimatedStyle(() => {
    return {
      opacity: viewTransition.value,
      transform: [{ translateX: 100 * (1 - viewTransition.value) }],
      position: 'absolute',
      width: '100%',
      display: viewTransition.value < 0.5 ? 'none' : 'flex',
    };
  });
  
  // Efecto de cambio de vista
  useEffect(() => {
    viewTransition.value = withTiming(
      selectedView === 'temperature' ? 0 : 1,
      { duration: 300, easing: Easing.inOut(Easing.ease) }
    );
  }, [selectedView]);
  
  // Paleta de colores adaptativa
  const palette = useMemo(() => ({
    background: Colors[colorScheme].background,
    card: colorScheme === 'dark' ? '#1C1C1E' : '#FFFFFF',
    cardShadow: colorScheme === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.1)',
    text: Colors[colorScheme].text,
    textSecondary: colorScheme === 'dark' ? '#8E8E93' : '#6E6E73',
    temperature: colorScheme === 'dark' ? '#FF9500' : '#FF6B00', // Naranja cálido
    humidity: colorScheme === 'dark' ? '#64D2FF' : '#0080FF', // Azul fresco
    segmentActive: colorScheme === 'dark' ? '#FFFFFF' : '#FFFFFF',
    segmentBg: colorScheme === 'dark' ? '#2C2C2E' : '#F2F2F7',
    segmentSelectedBg: colorScheme === 'dark' ? '#3A3A3C' : '#E5E5EA',
    gridLines: colorScheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
    limitLine: colorScheme === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
  }), [colorScheme]);
  
  // Usando useWindowDimensions para obtener dimensiones actualizadas de la pantalla
  const { width } = useWindowDimensions();
  // Calculando ancho con márgenes adecuados y asegurando valor mínimo
  const chartWidth = Math.max(width - SPACING.XLARGE, 300);
  
  // Optimizamos las etiquetas para mostrar solo aproximadamente 8 horas
  const getOptimizedLabels = () => {
    if (timeLabels.length === 0) return [];
    
    // Queremos mostrar aprox. 8 etiquetas equidistantes - más minimalista
    const step = Math.ceil(timeLabels.length / 8);
    
    return timeLabels.filter((_, index) => index % step === 0);
  };
  
  // Datos para las etiquetas optimizadas
  const [optimizedLabels, setOptimizedLabels] = useState<string[]>([]);

  // Simulación de datos históricos y generación de nuevos datos
  useEffect(() => {
    // Verificar si existe una configuración
    const checkConfig = async () => {
      try {
        const savedConfig = await AsyncStorage.getItem('incubationConfig');
        if (!savedConfig) {
          // No hay configuración, redirigir a la página inicial
          router.replace('/setup');
        }
      } catch (error) {
        console.error('Error al verificar configuración:', error);
      }
    };
    
    checkConfig();

    // Generar datos iniciales para las últimas 24 horas (uno por hora)
    const generateInitialData = () => {
      const initialTemp = [];
      const initialHumidity = [];
      const labels = [];
      
      const now = new Date();
      
      for (let i = 0; i < 24; i++) {
        const timestamp = new Date(now);
        timestamp.setHours(now.getHours() - (23 - i));
        
        // Datos simulados centrados alrededor de 37.5°C y 58% con pequeñas variaciones
        const temperature = +(37.5 + (Math.random() - 0.5) * 1).toFixed(1);
        const humidity = Math.floor(58 + (Math.random() - 0.5) * 6);
        
        initialTemp.push({ timestamp, temperature, humidity });
        initialHumidity.push({ timestamp, temperature, humidity });
        
        // Formato de hora para las etiquetas - más minimalista
        labels.push(timestamp.getHours().toString().padStart(2, '0'));
      }
      
      setTempData(initialTemp);
      setHumidityData(initialHumidity);
      setTimeLabels(labels);
    };
    
    generateInitialData();
    
    // Simular la adición de nuevos datos cada minuto
    const interval = setInterval(() => {
      const now = new Date();
      const newTemperature = +(37.5 + (Math.random() - 0.5) * 1).toFixed(1);
      const newHumidity = Math.floor(58 + (Math.random() - 0.5) * 6);
      
      const newData = { 
        timestamp: now, 
        temperature: newTemperature, 
        humidity: newHumidity 
      };
      
      setTempData(prev => {
        const updated = [...prev.slice(1), newData];
        return updated;
      });
      
      setHumidityData(prev => {
        const updated = [...prev.slice(1), newData];
        return updated;
      });
      
      setTimeLabels(prev => {
        const newHour = now.getHours().toString().padStart(2, '0');
        const updated = [...prev.slice(1), newHour];
        return updated;
      });
    }, 60000); // Actualizar cada minuto
    
    return () => clearInterval(interval);
  }, []);

  // Actualizar las etiquetas optimizadas cuando cambian las etiquetas originales
  useEffect(() => {
    setOptimizedLabels(getOptimizedLabels());
  }, [timeLabels]);

  // Configuración para el gráfico de temperatura
  const tempChartConfig = {
    backgroundColor: 'transparent',
    backgroundGradientFrom: palette.card,
    backgroundGradientTo: palette.card,
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(255, 107, 0, ${opacity})`,
    labelColor: (opacity = 1) => palette.text,
    style: {
      borderRadius: SPACING.MEDIUM,
    },
    propsForDots: {
      r: "3",
      strokeWidth: "2",
      stroke: palette.temperature
    },
    propsForBackgroundLines: {
      strokeDasharray: '', // Líneas continuas
      stroke: palette.gridLines,
      strokeWidth: 0.5,
    },
    formatYLabel: (value) => parseFloat(value).toFixed(1),
    formatXLabel: (value) => value,
    yAxisInterval: 1,
  };

  // Configuración para el gráfico de humedad
  const humidityChartConfig = {
    backgroundColor: 'transparent',
    backgroundGradientFrom: palette.card,
    backgroundGradientTo: palette.card,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(0, 128, 255, ${opacity})`,
    labelColor: (opacity = 1) => palette.text,
    style: {
      borderRadius: SPACING.MEDIUM,
    },
    propsForDots: {
      r: "3",
      strokeWidth: "2",
      stroke: palette.humidity
    },
    propsForBackgroundLines: {
      strokeDasharray: '', // Líneas continuas
      stroke: palette.gridLines,
      strokeWidth: 0.5,
    },
    formatXLabel: (value) => value,
    yAxisInterval: 5,
  };

  // Crear arrays con posiciones nulas para los puntos que no deben mostrar etiquetas
  const createSparseLabels = () => {
    if (timeLabels.length === 0) return [];
    
    const step = Math.ceil(timeLabels.length / 8);
    
    return timeLabels.map((label, index) => {
      return index % step === 0 ? label : "";
    });
  };

  const sparseLabels = createSparseLabels();

  return (
    <SafeAreaView 
      style={[
        styles.safeArea,
        { backgroundColor: palette.background }
      ]}
    >
      <ScrollView 
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <ThemedView style={styles.headerRow}>
          <ThemedText type="title" style={styles.title}>
            Análisis
          </ThemedText>
        </ThemedView>

        {/* Selector de visualización */}
        <ThemedView style={[
          styles.segmentContainer, 
          {backgroundColor: palette.segmentBg}
        ]}>
          <TouchableOpacity 
            style={[
              styles.segmentButton, 
              selectedView === 'temperature' && [
                styles.segmentButtonActive, 
                {backgroundColor: palette.temperature}
              ]
            ]}
            onPress={() => setSelectedView('temperature')}
          >
            <Feather 
              name="thermometer" 
              size={SPACING.MEDIUM} 
              color={selectedView === 'temperature' ? palette.segmentActive : palette.text} 
            />
            <ThemedText 
              style={[
                styles.segmentText, 
                selectedView === 'temperature' && [
                  styles.segmentTextActive,
                  {color: palette.segmentActive}
                ]
              ]}
            >
              Temperatura
            </ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.segmentButton, 
              selectedView === 'humidity' && [
                styles.segmentButtonActive,
                {backgroundColor: palette.humidity}
              ]
            ]}
            onPress={() => setSelectedView('humidity')}
          >
            <Feather 
              name="droplet" 
              size={SPACING.MEDIUM} 
              color={selectedView === 'humidity' ? palette.segmentActive : palette.text}
            />
            <ThemedText 
              style={[
                styles.segmentText, 
                selectedView === 'humidity' && [
                  styles.segmentTextActive,
                  {color: palette.segmentActive}
                ]
              ]}
            >
              Humedad
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>

        {/* Contenedor para vistas animadas */}
        <ThemedView style={styles.chartContainer}>
          {/* Vista de Temperatura */}
          <Animated.View style={[styles.chartView, tempViewStyle]}>
            {tempData.length > 0 && (
              <>
                <ThemedView style={styles.chartSummary}>
                  <ThemedView style={styles.summaryValue}>
                    <ThemedText style={styles.summaryLabel}>
                      Actual
                    </ThemedText>
                    <ThemedText style={[styles.summaryNumber, {color: palette.temperature}]}>
                      {tempData[tempData.length - 1].temperature.toFixed(1)}°C
                    </ThemedText>
                  </ThemedView>
                  
                  <ThemedView style={styles.summaryValue}>
                    <ThemedText style={styles.summaryLabel}>
                      Prom
                    </ThemedText>
                    <ThemedText style={styles.summaryNumber}>
                      {(tempData.reduce((sum, item) => sum + item.temperature, 0) / tempData.length).toFixed(1)}°C
                    </ThemedText>
                  </ThemedView>
                  
                  <ThemedView style={styles.summaryValue}>
                    <ThemedText style={styles.summaryLabel}>
                      Mín
                    </ThemedText>
                    <ThemedText style={styles.summaryNumber}>
                      {Math.min(...tempData.map(item => item.temperature)).toFixed(1)}°C
                    </ThemedText>
                  </ThemedView>
                  
                  <ThemedView style={styles.summaryValue}>
                    <ThemedText style={styles.summaryLabel}>
                      Máx
                    </ThemedText>
                    <ThemedText style={styles.summaryNumber}>
                      {Math.max(...tempData.map(item => item.temperature)).toFixed(1)}°C
                    </ThemedText>
                  </ThemedView>
                </ThemedView>

                <ThemedView style={[styles.chartWrapper, {backgroundColor: palette.card}]}>
                  <ThemedView style={styles.timeLabel}>
                    <Feather name="clock" size={SPACING.BASE} color={palette.textSecondary} />
                    <ThemedText style={styles.timeLabelText}>Últimas 24h</ThemedText>
                  </ThemedView>
                  
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.chartScrollContainer}
                  >
                    <LineChart
                      data={{
                        labels: sparseLabels,
                        datasets: [
                          {
                            data: tempData.map(data => data.temperature),
                            color: (opacity = 1) => `rgba(255, 107, 0, ${opacity})`,
                            strokeWidth: 2
                          },
                          // Líneas de límites más sutiles
                          {
                            data: Array(tempData.length).fill(37),
                            color: () => palette.limitLine,
                            strokeWidth: 1,
                            withDots: false
                          },
                          {
                            data: Array(tempData.length).fill(38),
                            color: () => palette.limitLine,
                            strokeWidth: 1,
                            withDots: false
                          }
                        ]
                      }}
                      width={chartWidth}
                      height={220}
                      chartConfig={tempChartConfig}
                      bezier
                      style={styles.chart}
                      withInnerLines={true}
                      withVerticalLines={false}
                      withOuterLines={false}
                      withShadow={false}
                      fromZero={false}
                      yAxisSuffix="°"
                      verticalLabelRotation={0}
                    />
                  </ScrollView>
                  
                  <ThemedView style={styles.referenceLines}>
                    <ThemedView style={styles.referenceLine}>
                      <ThemedView style={[styles.referenceIndicator, {backgroundColor: palette.limitLine}]} />
                      <ThemedText style={styles.referenceText}>Rango óptimo: 37-38°C</ThemedText>
                    </ThemedView>
                  </ThemedView>
                </ThemedView>
              </>
            )}
          </Animated.View>

          {/* Vista de Humedad */}
          <Animated.View style={[styles.chartView, humidityViewStyle]}>
            {humidityData.length > 0 && (
              <>
                <ThemedView style={styles.chartSummary}>
                  <ThemedView style={styles.summaryValue}>
                    <ThemedText style={styles.summaryLabel}>
                      Actual
                    </ThemedText>
                    <ThemedText style={[styles.summaryNumber, {color: palette.humidity}]}>
                      {humidityData[humidityData.length - 1].humidity}%
                    </ThemedText>
                  </ThemedView>
                  
                  <ThemedView style={styles.summaryValue}>
                    <ThemedText style={styles.summaryLabel}>
                      Prom
                    </ThemedText>
                    <ThemedText style={styles.summaryNumber}>
                      {Math.round(humidityData.reduce((sum, item) => sum + item.humidity, 0) / humidityData.length)}%
                    </ThemedText>
                  </ThemedView>
                  
                  <ThemedView style={styles.summaryValue}>
                    <ThemedText style={styles.summaryLabel}>
                      Mín
                    </ThemedText>
                    <ThemedText style={styles.summaryNumber}>
                      {Math.min(...humidityData.map(item => item.humidity))}%
                    </ThemedText>
                  </ThemedView>
                  
                  <ThemedView style={styles.summaryValue}>
                    <ThemedText style={styles.summaryLabel}>
                      Máx
                    </ThemedText>
                    <ThemedText style={styles.summaryNumber}>
                      {Math.max(...humidityData.map(item => item.humidity))}%
                    </ThemedText>
                  </ThemedView>
                </ThemedView>

                <ThemedView style={[styles.chartWrapper, {backgroundColor: palette.card}]}>
                  <ThemedView style={styles.timeLabel}>
                    <Feather name="clock" size={SPACING.BASE} color={palette.textSecondary} />
                    <ThemedText style={styles.timeLabelText}>Últimas 24h</ThemedText>
                  </ThemedView>
                  
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.chartScrollContainer}
                  >
                    <LineChart
                      data={{
                        labels: sparseLabels,
                        datasets: [
                          {
                            data: humidityData.map(data => data.humidity),
                            color: (opacity = 1) => `rgba(0, 128, 255, ${opacity})`,
                            strokeWidth: 2
                          },
                          // Líneas de límites más sutiles
                          {
                            data: Array(humidityData.length).fill(55),
                            color: () => palette.limitLine,
                            strokeWidth: 1,
                            withDots: false
                          },
                          {
                            data: Array(humidityData.length).fill(60),
                            color: () => palette.limitLine,
                            strokeWidth: 1,
                            withDots: false
                          }
                        ]
                      }}
                      width={chartWidth}
                      height={220}
                      chartConfig={humidityChartConfig}
                      bezier
                      style={styles.chart}
                      withInnerLines={true}
                      withVerticalLines={false}
                      withOuterLines={false}
                      withShadow={false}
                      fromZero={false}
                      yAxisSuffix="%"
                      verticalLabelRotation={0}
                    />
                  </ScrollView>
                  
                  <ThemedView style={styles.referenceLines}>
                    <ThemedView style={styles.referenceLine}>
                      <ThemedView style={[styles.referenceIndicator, {backgroundColor: palette.limitLine}]} />
                      <ThemedText style={styles.referenceText}>Rango óptimo: 55-60%</ThemedText>
                    </ThemedView>
                  </ThemedView>
                </ThemedView>
              </>
            )}
          </Animated.View>
        </ThemedView>

        <ThemedView style={[styles.tipCard, {backgroundColor: palette.card}]}>
          <Feather name="info" size={SPACING.MEDIUM} color={palette.textSecondary} style={styles.tipIcon} />
          <ThemedText style={styles.tipText}>
            Los valores estables dentro del rango óptimo favorecen el desarrollo embrionario.
          </ThemedText>
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.LARGE,
  },
  title: {
    fontSize: SPACING.LARGE,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  segmentContainer: {
    flexDirection: 'row',
    borderRadius: SPACING.LARGE,
    marginBottom: SPACING.LARGE,
    height: SPACING.XLARGE,
    overflow: 'hidden',
  },
  segmentButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  segmentButtonActive: {
    borderRadius: SPACING.MEDIUM,
  },
  segmentText: {
    fontSize: SPACING.MEDIUM - 2,
    marginLeft: SPACING.SMALL,
    fontWeight: '500',
  },
  segmentTextActive: {
    fontWeight: '600',
  },
  chartContainer: {
    position: 'relative',
    marginBottom: SPACING.LARGE,
    height: 360, // Altura fija para evitar saltos en la UI
  },
  chartView: {
    top: 0,
    left: 0,
    right: 0,
  },
  chartSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.MEDIUM,
    paddingHorizontal: SPACING.SMALL,
  },
  summaryValue: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: SPACING.SMALL + 3,
    marginBottom: SPACING.TINY,
    opacity: 0.7,
  },
  summaryNumber: {
    fontSize: SPACING.MEDIUM,
    fontWeight: '600',
  },
  chartWrapper: {
    borderRadius: SPACING.MEDIUM,
    padding: SPACING.MEDIUM,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: SPACING.TINY },
        shadowOpacity: 0.1,
        shadowRadius: SPACING.BASE,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  timeLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.SMALL,
  },
  timeLabelText: {
    fontSize: SPACING.BASE,
    opacity: 0.6,
    marginLeft: SPACING.TINY,
  },
  chartScrollContainer: {
    paddingRight: SPACING.MEDIUM,
  },
  chart: {
    borderRadius: SPACING.SMALL,
    marginVertical: SPACING.SMALL,
  },
  referenceLines: {
    marginTop: SPACING.SMALL,
  },
  referenceLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.TINY,
  },
  referenceIndicator: {
    width: SPACING.MEDIUM,
    height: SPACING.TINY,
    borderRadius: SPACING.TINY / 2,
    marginRight: SPACING.SMALL,
  },
  referenceText: {
    fontSize: SPACING.BASE - 1,
    opacity: 0.7,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.MEDIUM,
    borderRadius: SPACING.MEDIUM,
    marginBottom: SPACING.LARGE,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: SPACING.TINY },
        shadowOpacity: 0.1,
        shadowRadius: SPACING.BASE,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  tipIcon: {
    marginRight: SPACING.MEDIUM,
  },
  tipText: {
    fontSize: SPACING.BASE,
    flex: 1,
    opacity: 0.8,
  },
});