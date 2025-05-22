import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Feather } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';

// Constantes de proporción basadas en secuencia Fibonacci (1, 1, 2, 3, 5, 8, 13, 21)
const SPACING = {
  TINY: 2,
  SMALL: 5,
  BASE: 8,
  MEDIUM: 13,
  LARGE: 21,
  XLARGE: 34,
};

interface CalendarProps {
  startDate: Date;
  endDate: Date;
  currentDate: Date;
}

export default function Calendar({ startDate, endDate, currentDate }: CalendarProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const [currentMonth, setCurrentMonth] = useState(startDate.getMonth());
  const [currentYear, setCurrentYear] = useState(startDate.getFullYear());
  
  // Paletas de colores adaptables según el tema - Simplificada
  const palette = useMemo(() => ({
    primary: Colors[colorScheme].tint,
    background: colorScheme === 'dark' ? '#1E1E1E' : '#FFFFFF',
    text: Colors[colorScheme].text,
    textSubdued: colorScheme === 'dark' ? '#8E8E93' : '#6E6E73',
    inactive: colorScheme === 'dark' ? '#333333' : '#E5E5EA',
  }), [colorScheme]);
  
  // Obtener el primer día del mes y cuántos días tiene el mes
  const firstDayOfMonth = useMemo(() => new Date(currentYear, currentMonth, 1).getDay(), [currentMonth, currentYear]);
  const daysInMonth = useMemo(() => new Date(currentYear, currentMonth + 1, 0).getDate(), [currentMonth, currentYear]);
  
  // Nombres de los días de la semana - Reducidos a inicial para minimalismo
  const weekdays = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
  
  // Nombres de los meses
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  // Navegación de meses limitada al periodo de incubación
  const canGoPrevious = useMemo(() => {
    if (currentYear < startDate.getFullYear()) return false;
    if (currentYear === startDate.getFullYear() && currentMonth <= startDate.getMonth()) return false;
    return true;
  }, [currentMonth, currentYear, startDate]);

  const canGoNext = useMemo(() => {
    if (currentYear > endDate.getFullYear()) return false;
    if (currentYear === endDate.getFullYear() && currentMonth >= endDate.getMonth()) return false;
    return true;
  }, [currentMonth, currentYear, endDate]);
  
  const previousMonth = () => {
    if (!canGoPrevious) return;
    
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };
  
  const nextMonth = () => {
    if (!canGoNext) return;
    
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Verificar estados simplificados de los días
  const getDayStatus = (day: number) => {
    const date = new Date(currentYear, currentMonth, day);
    const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const normalizedStartDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const normalizedEndDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    const normalizedCurrentDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
    
    // Verificar si es hoy
    const today = new Date();
    const isToday = day === today.getDate() && 
                    currentMonth === today.getMonth() && 
                    currentYear === today.getFullYear();
    
    // Estados simplificados
    if (normalizedDate < normalizedStartDate || normalizedDate > normalizedEndDate) {
      return 'outside'; // Fuera del periodo
    } else if (normalizedDate.getTime() === normalizedCurrentDate.getTime()) {
      return 'current'; // Día actual de incubación
    } else if (normalizedDate < normalizedCurrentDate) {
      return 'past'; // Día pasado del periodo
    } else {
      return 'future'; // Día futuro del periodo
    }
  };

  // Generar las celdas para los días del mes
  const generateDays = () => {
    const days = [];
    
    // Espacios en blanco para los días antes del primer día del mes
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(
        <ThemedView key={`empty-${i}`} style={styles.dayCell} />
      );
    }
    
    // Días del mes
    for (let day = 1; day <= daysInMonth; day++) {
      const status = getDayStatus(day);
      
      // Simplificación extrema - solo mostramos los días relevantes
      days.push(
        <ThemedView 
          key={`day-${day}`} 
          style={styles.dayCell}
        >
          {status !== 'outside' ? (
            <ThemedView
              style={[
                styles.dayIndicator,
                status === 'current' && styles.currentDay,
                status === 'past' && styles.pastDay,
                status === 'future' && styles.futureDay
              ]}
            >
              <ThemedText 
                style={[
                  styles.dayText,
                  status === 'current' ? styles.currentText : 
                  status === 'past' ? styles.pastText : 
                  styles.futureText
                ]}
              >
                {day}
              </ThemedText>
            </ThemedView>
          ) : (
            <ThemedText 
              style={styles.outsideText}
            >
              {day}
            </ThemedText>
          )}
        </ThemedView>
      );
    }
    
    return days;
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <TouchableOpacity 
          onPress={previousMonth}
          disabled={!canGoPrevious}
          style={styles.navigationButton}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        >
          <Feather 
            name="chevron-left" 
            size={SPACING.LARGE} 
            color={canGoPrevious ? palette.text : 'transparent'} 
          />
        </TouchableOpacity>
        
        <ThemedText style={styles.monthYearText}>
          {monthNames[currentMonth]} {currentYear}
        </ThemedText>
        
        <TouchableOpacity 
          onPress={nextMonth}
          disabled={!canGoNext}
          style={styles.navigationButton}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        >
          <Feather 
            name="chevron-right" 
            size={SPACING.LARGE} 
            color={canGoNext ? palette.text : 'transparent'} 
          />
        </TouchableOpacity>
      </ThemedView>
      
      <ThemedView style={styles.weekdaysContainer}>
        {weekdays.map(day => (
          <ThemedText key={day} style={styles.weekday}>{day}</ThemedText>
        ))}
      </ThemedView>
      
      <ThemedView style={styles.daysContainer}>
        {generateDays()}
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: SPACING.MEDIUM,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.MEDIUM,
  },
  navigationButton: {
    padding: SPACING.TINY,
    justifyContent: 'center',
    alignItems: 'center',
    width: SPACING.XLARGE,
    height: SPACING.XLARGE,
  },
  monthYearText: {
    fontSize: SPACING.LARGE - 3,
    fontWeight: '600',
  },
  weekdaysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SPACING.BASE,
    paddingBottom: SPACING.SMALL,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  weekday: {
    width: SPACING.LARGE + SPACING.SMALL,
    textAlign: 'center',
    fontSize: SPACING.BASE + 2,
    opacity: 0.6,
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  dayCell: {
    width: `${100/7}%`,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.TINY,
  },
  dayIndicator: {
    width: '75%',
    aspectRatio: 1,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentDay: {
    backgroundColor: '#007AFF',
    transform: [{ scale: 1.1 }],
  },
  pastDay: {
    backgroundColor: '#8E8E93',
  },
  futureDay: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#C7C7CC',
  },
  dayText: {
    fontSize: SPACING.BASE + 2,
    fontWeight: '400',
  },
  outsideText: {
    fontSize: SPACING.BASE + 2,
    color: '#58585B',
  },
  currentText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  pastText: {
    color: '#FFFFFF',
  },
  futureText: {
    color: '#8E8E93',
  },
});