import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

type ConfigContextType = {
  isConfigured: boolean;
  setIsConfigured: (value: boolean) => void;
  saveConfiguration: (configData: any) => Promise<void>;
};

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export function ConfigProvider({ children }: { children: React.ReactNode }) {
  const [isConfigured, setIsConfigured] = useState(false);
  
  // Verificar si existe configuración previa al iniciar
  useEffect(() => {
    const checkConfiguration = async () => {
      try {
        const configData = await AsyncStorage.getItem('incubator_config');
        setIsConfigured(configData !== null);
      } catch (error) {
        console.error('Error al verificar configuración:', error);
      }
    };
    
    checkConfiguration();
  }, []);
  
  const saveConfiguration = async (configData: any) => {
    try {
      await AsyncStorage.setItem('incubator_config', JSON.stringify(configData));
      setIsConfigured(true);
    } catch (error) {
      console.error('Error al guardar configuración:', error);
    }
  };
  
  return (
    <ConfigContext.Provider value={{ isConfigured, setIsConfigured, saveConfiguration }}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error('useConfig debe ser usado dentro de un ConfigProvider');
  }
  return context;
}