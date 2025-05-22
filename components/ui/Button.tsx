import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import React from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TextStyle,
    TouchableOpacity,
    TouchableOpacityProps,
    ViewStyle,
} from 'react-native';

interface ButtonProps extends TouchableOpacityProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  children,
  variant = 'primary',
  size = 'medium',
  loading = false,
  style,
  textStyle,
  disabled,
  ...props
}: ButtonProps) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  
  // Determinar estilos basados en la variante
  let containerStyle: ViewStyle = {};
  let labelStyle: TextStyle = {};
  
  switch (variant) {
    case 'primary':
      containerStyle = {
        backgroundColor: theme.tint,
      };
      labelStyle = {
        color: '#FFFFFF',
      };
      break;
    case 'secondary':
      containerStyle = {
        backgroundColor: theme.tabIconSelected,
      };
      labelStyle = {
        color: '#FFFFFF',
      };
      break;
    case 'outline':
      containerStyle = {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: theme.tint,
      };
      labelStyle = {
        color: theme.tint,
      };
      break;
  }
  
  // Determinar estilos basados en el tamaño
  let sizeStyle: ViewStyle = {};
  let textSizeStyle: TextStyle = {};
  
  switch (size) {
    case 'small':
      sizeStyle = {
        paddingVertical: 8,
        paddingHorizontal: 12,
      };
      textSizeStyle = {
        fontSize: 14,
      };
      break;
    case 'medium':
      sizeStyle = {
        paddingVertical: 12,
        paddingHorizontal: 16,
      };
      textSizeStyle = {
        fontSize: 16,
      };
      break;
    case 'large':
      sizeStyle = {
        paddingVertical: 16,
        paddingHorizontal: 24,
      };
      textSizeStyle = {
        fontSize: 18,
      };
      break;
  }
  
  // Estado deshabilitado
  if (disabled) {
    containerStyle = {
      ...containerStyle,
      backgroundColor: '#CCCCCC',
      borderColor: '#BBBBBB',
    };
    labelStyle = {
      ...labelStyle,
      color: '#888888',
    };
  }
  
  return (
    <TouchableOpacity
      style={[styles.container, containerStyle, sizeStyle, style]}
      disabled={disabled || loading}
      activeOpacity={0.7}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={labelStyle.color} />
      ) : (
        <Text style={[styles.text, labelStyle, textSizeStyle, textStyle]}>
          {children}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '600',
  },
});