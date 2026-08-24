'use client';

import { useQuery } from '@tanstack/react-query';
import { Activity } from 'lucide-react';
import { useDeviceContext } from '@/hooks/use-device';
import { apiClient } from '@/lib/api/client';
import { components } from '@/types/api';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

type TelemetryOut = any;

export default function AnalyticsPage() {
  const { selectedDeviceId, selectedDevice } = useDeviceContext();

  const { data: telemetryHistory, isLoading } = useQuery({
    queryKey: ['telemetry-history', selectedDeviceId],
    queryFn: async () => {
      if (!selectedDeviceId) return [];
      const res = await apiClient.get<TelemetryOut[]>(`/api/v1/telemetry/device/${selectedDeviceId}?limit=50`);
      // Reverse so it reads chronologically left-to-right
      return res.data.reverse().map(point => ({
        ...point,
        timeLabel: new Date(point.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      }));
    },
    enabled: !!selectedDeviceId,
    refetchInterval: 30000 // Refetch history every 30s as a fallback (Websockets handle live)
  });

  if (!selectedDeviceId) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center space-y-4">
        <Activity className="h-12 w-12 text-muted-foreground opacity-20" />
        <h2 className="text-xl font-medium text-muted-foreground">No Device Selected</h2>
        <p className="text-sm text-muted-foreground">Select a device to view historical analytics.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">System Analytics</h2>
          <p className="text-muted-foreground">
            Historical performance trends for {selectedDevice?.hostname}
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>CPU & Memory Usage</CardTitle>
            <CardDescription>
              Last 50 data points recorded
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-[400px] w-full animate-pulse bg-muted rounded-md" />
            ) : telemetryHistory && telemetryHistory.length > 0 ? (
              <div className="h-[400px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={telemetryHistory} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground)/0.2)" />
                    <XAxis 
                      dataKey="timeLabel" 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false}
                      minTickGap={30}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(value) => `${value}%`}
                      domain={[0, 100]}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                      itemStyle={{ color: 'hsl(var(--foreground))' }}
                      labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    <Line 
                      type="monotone" 
                      dataKey="cpu_percent" 
                      name="CPU (%)" 
                      stroke="#0ea5e9" 
                      strokeWidth={2} 
                      dot={false}
                      activeDot={{ r: 6 }} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="memory_percent" 
                      name="Memory (%)" 
                      stroke="#10b981" 
                      strokeWidth={2} 
                      dot={false} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-[400px] items-center justify-center text-muted-foreground border border-dashed rounded-md">
                No telemetry data available for this device.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Can add Disk/Network charts below in the future */}
      </div>
    </div>
  );
}
