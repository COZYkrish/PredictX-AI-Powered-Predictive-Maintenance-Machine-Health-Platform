'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient } from '@/lib/api/client';
import { components } from '@/types/api';
import { useAuth } from './use-auth';

type Device = components['schemas']['DeviceOut'];

interface DeviceContextType {
  devices: Device[];
  selectedDeviceId: string | null;
  selectedDevice: Device | null;
  setSelectedDeviceId: (id: string) => void;
  isLoading: boolean;
  error: string | null;
}

const DeviceContext = createContext<DeviceContextType | undefined>(undefined);

export function DeviceProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDeviceId, setSelectedDeviceIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    
    let isMounted = true;
    
    const fetchDevices = async () => {
      setIsLoading(true);
      try {
        const res = await apiClient.get<Device[]>('/api/v1/devices');
        if (isMounted) {
          setDevices(res.data);
          
          // Initialize selection from localStorage or pick first
          const savedId = localStorage.getItem('predictx_selected_device');
          if (savedId && res.data.some(d => d.device_id === savedId)) {
            setSelectedDeviceIdState(savedId);
          } else if (res.data.length > 0) {
            setSelectedDeviceIdState(res.data[0].device_id);
          }
        }
      } catch (err) {
        if (isMounted) setError('Failed to load devices');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    
    fetchDevices();
    
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  const setSelectedDeviceId = (id: string) => {
    setSelectedDeviceIdState(id);
    localStorage.setItem('predictx_selected_device', id);
  };

  const selectedDevice = devices.find(d => d.device_id === selectedDeviceId) || null;

  return (
    <DeviceContext.Provider value={{
      devices,
      selectedDeviceId,
      selectedDevice,
      setSelectedDeviceId,
      isLoading,
      error
    }}>
      {children}
    </DeviceContext.Provider>
  );
}

export function useDeviceContext() {
  const context = useContext(DeviceContext);
  if (context === undefined) {
    throw new Error('useDeviceContext must be used within a DeviceProvider');
  }
  return context;
}
