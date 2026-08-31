'use client';

import { useDeviceContext } from '@/hooks/use-device';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Monitor } from 'lucide-react';

export function DeviceSelector() {
  const { devices, selectedDevice, setSelectedDeviceId, isLoading } = useDeviceContext();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-4 py-1.5 text-xs text-white/50 font-mono">
        <Monitor className="h-3.5 w-3.5" />
        <span>Loading...</span>
      </div>
    );
  }

  if (devices.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-4 py-1.5 text-xs text-white/50 font-mono">
        <Monitor className="h-3.5 w-3.5" />
        <span>No Devices</span>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 px-4 py-1.5 text-xs text-white font-mono shadow-sm transition-colors cursor-pointer outline-none max-w-[240px]">
          <Monitor className="h-3.5 w-3.5 text-white/80 shrink-0" />
          <span className="font-semibold truncate">{selectedDevice?.hostname || 'Select Device'}</span>
          <ChevronDown className="h-3.5 w-3.5 text-white/60 shrink-0 ml-1" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 bg-[#121212] border border-white/15 text-white shadow-2xl rounded-xl p-1.5 font-mono">
        {devices.map((device) => (
          <DropdownMenuItem 
            key={device.id} 
            onClick={() => setSelectedDeviceId(device.device_id)}
            className={`rounded-lg px-2.5 py-2 cursor-pointer transition-colors ${
              device.device_id === selectedDevice?.device_id 
                ? 'bg-white/15 text-white font-bold' 
                : 'hover:bg-white/5 text-white/80'
            }`}
          >
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold truncate">{device.hostname}</span>
              <span className="text-[10px] text-white/40 truncate">{(device as any).mac_address}</span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
