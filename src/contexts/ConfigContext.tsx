import React, { createContext, useContext } from 'react';
import { SystemConfig } from '../types';
import { useSystemContext } from './SystemContext';
import { saveSystemConfigToSupabase } from '../lib/supabaseService';
import { saveCachedSystemConfig } from '../lib/indexedDB';
import { isSupabaseActive } from '../lib/supabase';

interface ConfigContextType {
  systemConfig: SystemConfig;
  updateConfig: (newConfig: SystemConfig) => Promise<void>;
  soundEnabled: boolean;
  setSoundEnabled: React.Dispatch<React.SetStateAction<boolean>>;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { systemConfig, setSystemConfig, soundEnabled, setSoundEnabled, addAuditLog } = useSystemContext();

  const updateConfig = async (newConfig: SystemConfig) => {
    const oldConfig = systemConfig;
    setSystemConfig(newConfig);
    await saveCachedSystemConfig(newConfig);
    
    await addAuditLog(
      'Actualizar Parámetros',
      `Impresión: ${oldConfig.ticket.printSetting}, Papel: ${oldConfig.ticket.ticketSize}, Copias: ${oldConfig.ticket.copies}`,
      `Impresión: ${newConfig.ticket.printSetting}, Papel: ${newConfig.ticket.ticketSize}, Copias: ${newConfig.ticket.copies}`,
      'Configuración'
    );

    if (isSupabaseActive) {
      try {
        await saveSystemConfigToSupabase(newConfig);
      } catch (e) {
        console.warn('Error saving config to Supabase:', e);
      }
    }
  };

  return (
    <ConfigContext.Provider value={{ systemConfig, updateConfig, soundEnabled, setSoundEnabled }}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfigContext = () => {
  const context = useContext(ConfigContext);
  if (!context) throw new Error('useConfigContext must be used within a ConfigProvider');
  return context;
};
