'use client';

import { useDeviceContext } from '@/hooks/use-device';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ChevronDown, Monitor } from 'lucide-react';

export function DeviceSelector() {
  const { devices, selectedDevice, setSelectedDeviceId, isLoading } = useDeviceContext();

  if (isLoading) {
    return (
      <Button variant="outline" className="w-[200px] justify-between" disabled>
        <span className="flex items-center gap-2">
          <Monitor className="h-4 w-4" />
          Loading...
        </span>
      </Button>
    );
  }

  if (devices.length === 0) {
    return (
      <Button variant="outline" className="w-[200px] justify-between" disabled>
        <span className="flex items-center gap-2">
          <Monitor className="h-4 w-4" />
          No Devices
        </span>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-[200px] justify-between">
          <span className="flex items-center gap-2 truncate">
            <Monitor className="h-4 w-4 shrink-0" />
            <span className="truncate">{selectedDevice?.hostname || 'Select Device'}</span>
          </span>
          <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[200px]">
        {devices.map((device) => (
          <DropdownMenuItem 
            key={device.id} 
            onClick={() => setSelectedDeviceId(device.id)}
            className={device.id === selectedDevice?.id ? 'bg-accent' : ''}
          >
            <div className="flex flex-col">
              <span className="font-medium truncate">{device.hostname}</span>
              <span className="text-xs text-muted-foreground truncate">{device.mac_address}</span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
