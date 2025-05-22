import { Feather } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';

import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

/**
 * Layout para el sistema de pestañas
 * Solo incluye las pantallas de monitoreo y análisis
 */
export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        tabBarStyle: {
          height: 60,
          paddingBottom: 10,
        },
        headerShown: false,
      }}
    >
      {/* Pantalla de monitoreo */}
      <Tabs.Screen
        name="monitoring"
        options={{
          title: 'Monitoreo',
          tabBarIcon: ({ color }) => <Feather name="activity" size={24} color={color} />,
          tabBarLabelStyle: {
            fontSize: 12,
          },
        }}
      />
      
      {/* Pantalla de análisis/gráficos */}
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Análisis',
          tabBarIcon: ({ color }) => <Feather name="bar-chart-2" size={24} color={color} />,
          tabBarLabelStyle: {
            fontSize: 12,
          },
        }}
      />
      
      {/* Ocultar la pantalla de índice predeterminada si existe */}
      <Tabs.Screen
        name="index"
        options={{
          href: null, // Esto evita que esta pestaña aparezca en el tabBar
        }}
      />
    </Tabs>
  );
}
