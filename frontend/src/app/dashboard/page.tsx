'use client';

import { useQuery } from '@tanstack/react-query';
import { useDeviceContext } from '@/hooks/use-device';
import { useWebsocket } from '@/hooks/use-websocket';
import { apiClient } from '@/lib/api/client';
import { components } from '@/types/api';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Cpu, HardDrive, MemoryStick } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

type Telemetry = any;
type Device = components['schemas']['DeviceOut'] & { health_score?: number; capabilities?: Record<string, boolean> };

export default function DashboardPage() {
  const { selectedDeviceId, selectedDevice } = useDeviceContext();
  
  const { status: wsStatus } = useWebsocket(selectedDeviceId ? `/api/v1/ws/devices/${selectedDeviceId}` : undefined);

  const { data: telemetry, isLoading: telemetryLoading } = useQuery({
    queryKey: ['telemetry', selectedDeviceId],
    queryFn: async () => {
      if (!selectedDeviceId) return null;
      // Fetch the latest 1 telemetry point
      const res = await apiClient.get<Telemetry[]>(`/api/v1/telemetry/device/${selectedDeviceId}?limit=1`);
      return res.data[0] || null;
    },
    enabled: !!selectedDeviceId,
    refetchInterval: wsStatus === 'connected' ? false : 5000 // Fallback polling if WS fails
  });

  if (!selectedDeviceId) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center space-y-4 text-center">
        <Activity className="h-12 w-12 text-muted-foreground opacity-20" />
        <h2 className="text-xl font-medium text-muted-foreground">No Device Selected</h2>
        <p className="text-sm text-muted-foreground">Select a device from the top navigation to view its telemetry.</p>
      </div>
    );
  }

  const getStatusColor = (health_score?: number) => {
    if (health_score === undefined) return 'bg-neutral';
    if (health_score >= 90) return 'bg-healthy text-primary-foreground';
    if (health_score >= 70) return 'bg-warning text-primary-foreground';
    if (health_score >= 40) return 'bg-high-risk text-primary-foreground';
    return 'bg-critical text-primary-foreground';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{selectedDevice?.hostname}</h2>
          <p className="text-muted-foreground">
            {selectedDevice?.os_version} | {selectedDevice?.architecture}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={wsStatus === 'connected' ? 'default' : 'secondary'} className={wsStatus === 'connected' ? 'bg-healthy' : ''}>
            <span className="flex items-center gap-1">
              <span className={`h-2 w-2 rounded-full ${wsStatus === 'connected' ? 'bg-white animate-pulse' : 'bg-muted-foreground'}`} />
              {wsStatus === 'connected' ? 'Live' : 'Disconnected'}
            </span>
          </Badge>
          <Badge className={getStatusColor((selectedDevice as any)?.health_score)}>
            Health: {(selectedDevice as any)?.health_score ? `${Math.round((selectedDevice as any).health_score)}%` : 'N/A'}
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* CPU Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {telemetryLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {telemetry?.cpu_percent !== undefined ? `${telemetry.cpu_percent.toFixed(1)}%` : 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {telemetry?.cpu_freq_current ? `${(telemetry.cpu_freq_current / 1000).toFixed(2)} GHz` : 'Freq N/A'}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Memory Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
            <MemoryStick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {telemetryLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {telemetry?.memory_percent !== undefined ? `${telemetry.memory_percent.toFixed(1)}%` : 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {telemetry?.memory_used && telemetry?.memory_total 
                    ? `${(telemetry.memory_used / 1e9).toFixed(1)} / ${(telemetry.memory_total / 1e9).toFixed(1)} GB` 
                    : 'N/A'}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Disk Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disk Usage (C:)</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {telemetryLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {telemetry?.disk_percent !== undefined ? `${telemetry.disk_percent.toFixed(1)}%` : 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {telemetry?.disk_used && telemetry?.disk_total 
                    ? `${(telemetry.disk_used / 1e9).toFixed(1)} / ${(telemetry.disk_total / 1e9).toFixed(1)} GB` 
                    : 'N/A'}
                </p>
              </>
            )}
          </CardContent>
        </Card>
        
        {/* Network/Other Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {telemetryLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {telemetry?.system_uptime 
                    ? `${Math.floor(telemetry.system_uptime / 3600)}h ${Math.floor((telemetry.system_uptime % 3600) / 60)}m` 
                    : 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Continuous operation
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Telemetry Trend</CardTitle>
            <CardDescription>
              CPU and Memory usage over the last few minutes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Chart will go here in Analytics page or expanded dashboard */}
            <div className="h-[300px] w-full bg-muted/20 rounded-md flex items-center justify-center border border-dashed">
              <span className="text-muted-foreground text-sm">Real-time chart visualization</span>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Capability Flags</CardTitle>
            <CardDescription>Supported hardware sensors on this device</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {(selectedDevice as any)?.capabilities && Object.entries((selectedDevice as any).capabilities).map(([key, value]) => (
                <Badge key={key} variant={value ? 'outline' : 'secondary'} className={value ? 'border-healthy text-healthy' : 'opacity-50'}>
                  {key}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
