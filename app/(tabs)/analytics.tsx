import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

// Constantes de proporción
const SPACING = {
  TINY: 2,
  SMALL: 5,
  BASE: 8,
  MEDIUM: 13,
  LARGE: 21,
  XLARGE: 34,
  XXLARGE: 55,
};

export default function AnalyticsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const [selectedView, setSelectedView] = useState('temperature');
  const [isLoading, setIsLoading] = useState(true);
  
  // Paleta de colores adaptativa
  const palette = useMemo(() => ({
    background: Colors[colorScheme].background,
    card: colorScheme === 'dark' ? '#1C1C1E' : '#FFFFFF',
    text: Colors[colorScheme].text,
    textSecondary: colorScheme === 'dark' ? '#8E8E93' : '#6E6E73',
    temperature: colorScheme === 'dark' ? '#FF9500' : '#FF6B00',
    humidity: colorScheme === 'dark' ? '#64D2FF' : '#0080FF',
    segmentActive: colorScheme === 'dark' ? '#FFFFFF' : '#FFFFFF',
    segmentBg: colorScheme === 'dark' ? '#2C2C2E' : '#F2F2F7',
  }), [colorScheme]);

  // Estadísticas estáticas para evitar cálculos
  const tempStats = {
    current: 37.5,
    avg: 37.6, 
    min: 37.3,
    max: 37.8
  };

  const humidityStats = {
    current: 58,
    avg: 58,
    min: 57,
    max: 59
  };

  useEffect(() => {
    const checkConfig = async () => {
      try {
        const savedConfig = await AsyncStorage.getItem('incubationConfig');
        if (!savedConfig) {
          router.replace('/setup');
          return;
        }
        
        // Simulamos tiempo de carga
        setTimeout(() => {
          setIsLoading(false);
        }, 500);
      } catch (error) {
        console.error('Error al verificar configuración:', error);
        setIsLoading(false);
      }
    };
    
    checkConfig();
  }, []);

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.background }]}>
        <ThemedView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={palette.temperature} />
          <ThemedText style={styles.loadingText}>Cargando datos...</ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.background }]}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <ThemedView style={styles.headerRow}>
          <ThemedText type="title" style={styles.title}>
            Análisis
          </ThemedText>
        </ThemedView>

        {/* Selector de visualización */}
        <ThemedView style={[styles.segmentContainer, {backgroundColor: palette.segmentBg}]}>
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
            <Feather name="thermometer" size={SPACING.MEDIUM} color={selectedView === 'temperature' ? palette.segmentActive : palette.text} />
            <ThemedText style={[styles.segmentText, selectedView === 'temperature' && styles.segmentTextActive]}>
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
            <Feather name="droplet" size={SPACING.MEDIUM} color={selectedView === 'humidity' ? palette.segmentActive : palette.text} />
            <ThemedText style={[styles.segmentText, selectedView === 'humidity' && styles.segmentTextActive]}>
              Humedad
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>

        {/* Contenedor para vistas estáticas (sin animaciones) */}
        <ThemedView style={styles.chartContainer}>
          {selectedView === 'temperature' ? (
            <View>
              <ThemedView style={styles.chartSummary}>
                <ThemedView style={styles.summaryValue}>
                  <ThemedText style={styles.summaryLabel}>Actual</ThemedText>
                  <ThemedText style={[styles.summaryNumber, {color: palette.temperature}]}>
                    {tempStats.current.toFixed(1)}°C
                  </ThemedText>
                </ThemedView>
                
                <ThemedView style={styles.summaryValue}>
                  <ThemedText style={styles.summaryLabel}>Prom</ThemedText>
                  <ThemedText style={styles.summaryNumber}>{tempStats.avg}°C</ThemedText>
                </ThemedView>
                
                <ThemedView style={styles.summaryValue}>
                  <ThemedText style={styles.summaryLabel}>Mín</ThemedText>
                  <ThemedText style={styles.summaryNumber}>{tempStats.min.toFixed(1)}°C</ThemedText>
                </ThemedView>
                
                <ThemedView style={styles.summaryValue}>
                  <ThemedText style={styles.summaryLabel}>Máx</ThemedText>
                  <ThemedText style={styles.summaryNumber}>{tempStats.max.toFixed(1)}°C</ThemedText>
                </ThemedView>
              </ThemedView>

              <ThemedView style={[styles.chartWrapper, {backgroundColor: palette.card}]}>
                <ThemedView style={styles.timeLabel}>
                  <Feather name="clock" size={SPACING.BASE} color={palette.textSecondary} />
                  <ThemedText style={styles.timeLabelText}>Últimas 24h</ThemedText>
                </ThemedView>
                
                {/* Gráfico estático simplificado */}
                <ThemedView style={styles.staticChart}>
                  <ThemedView style={styles.chartPlaceholder}>
                    <Feather name="bar-chart-2" size={SPACING.XLARGE} color={palette.temperature} />
                    <ThemedText style={styles.chartPlaceholderText}>
                      Gráfico de temperatura
                    </ThemedText>
                  </ThemedView>
                </ThemedView>
                
                <ThemedView style={styles.referenceLines}>
                  <ThemedView style={styles.referenceLine}>
                    <ThemedView style={[styles.referenceIndicator, {backgroundColor: palette.temperature}]} />
                    <ThemedText style={styles.referenceText}>Rango óptimo: 37-38°C</ThemedText>
                  </ThemedView>
                </ThemedView>
              </ThemedView>
            </View>
          ) : (
            <View>
              <ThemedView style={styles.chartSummary}>
                <ThemedView style={styles.summaryValue}>
                  <ThemedText style={styles.summaryLabel}>Actual</ThemedText>
                  <ThemedText style={[styles.summaryNumber, {color: palette.humidity}]}>
                    {humidityStats.current}%
                  </ThemedText>
                </ThemedView>
                
                <ThemedView style={styles.summaryValue}>
                  <ThemedText style={styles.summaryLabel}>Prom</ThemedText>
                  <ThemedText style={styles.summaryNumber}>{humidityStats.avg}%</ThemedText>
                </ThemedView>
                
                <ThemedView style={styles.summaryValue}>
                  <ThemedText style={styles.summaryLabel}>Mín</ThemedText>
                  <ThemedText style={styles.summaryNumber}>{humidityStats.min}%</ThemedText>
                </ThemedView>
                
                <ThemedView style={styles.summaryValue}>
                  <ThemedText style={styles.summaryLabel}>Máx</ThemedText>
                  <ThemedText style={styles.summaryNumber}>{humidityStats.max}%</ThemedText>
                </ThemedView>
              </ThemedView>

              <ThemedView style={[styles.chartWrapper, {backgroundColor: palette.card}]}>
                <ThemedView style={styles.timeLabel}>
                  <Feather name="clock" size={SPACING.BASE} color={palette.textSecondary} />
                  <ThemedText style={styles.timeLabelText}>Últimas 24h</ThemedText>
                </ThemedView>
                
                {/* Gráfico estático simplificado */}
                <ThemedView style={styles.staticChart}>
                  <ThemedView style={styles.chartPlaceholder}>
                    <Feather name="bar-chart-2" size={SPACING.XLARGE} color={palette.humidity} />
                    <ThemedText style={styles.chartPlaceholderText}>
                      Gráfico de humedad
                    </ThemedText>
                  </ThemedView>
                </ThemedView>
                
                <ThemedView style={styles.referenceLines}>
                  <ThemedView style={styles.referenceLine}>
                    <ThemedView style={[styles.referenceIndicator, {backgroundColor: palette.humidity}]} />
                    <ThemedText style={styles.referenceText}>Rango óptimo: 55-60%</ThemedText>
                  </ThemedView>
                </ThemedView>
              </ThemedView>
            </View>
          )}
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
    color: 'white',
  },
  chartContainer: {
    marginBottom: SPACING.LARGE,
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
  staticChart: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartPlaceholder: {
    alignItems: 'center',
    opacity: 0.7,
  },
  chartPlaceholderText: {
    marginTop: SPACING.SMALL,
    fontSize: SPACING.MEDIUM,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.LARGE,
  },
  loadingText: {
    marginTop: SPACING.MEDIUM,
    fontSize: SPACING.MEDIUM,
    opacity: 0.7,
  },
});