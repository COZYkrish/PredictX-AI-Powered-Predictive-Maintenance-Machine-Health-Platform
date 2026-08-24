'use client';

import { useQuery } from '@tanstack/react-query';
import { useDeviceContext } from '@/hooks/use-device';
import { useWebsocket } from '@/hooks/use-websocket';
import { apiClient } from '@/lib/api/client';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Cpu, HardDrive, MemoryStick, Gauge, ShieldAlert, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

type Telemetry = {
  cpu_percent?: number;
  cpu_freq_current?: number;
  memory_percent?: number;
  memory_used?: number;
  memory_total?: number;
  disk_percent?: number;
  system_uptime?: number;
  timestamp?: string;
};

type Capability = {
  metric_name: string;
  status: string;
  reason?: string;
};

function HealthBadge({ score, risk }: { score?: number; risk?: string }) {
  const label = risk ?? (score != null ? (score >= 80 ? 'LOW' : score >= 60 ? 'MEDIUM' : score >= 40 ? 'HIGH' : 'CRITICAL') : null);
  const className =
    label === 'LOW' ? 'bg-green-500 text-white' :
    label === 'MEDIUM' ? 'bg-yellow-500 text-white' :
    label === 'HIGH' ? 'bg-orange-500 text-white' :
    label === 'CRITICAL' ? 'bg-red-500 text-white' :
    'bg-muted text-muted-foreground';
  return (
    <Badge className={className}>
      Health: {score != null ? `${score}/100` : 'NO_PREDICTION_YET'}
    </Badge>
  );
}

export default function DashboardPage() {
  const { selectedDeviceId, selectedDevice } = useDeviceContext();
  const { status: wsStatus } = useWebsocket(
    selectedDeviceId ? `/api/v1/ws/devices/${selectedDeviceId}` : undefined
  );

  // Latest telemetry (single point for the metrics cards)
  const { data: telemetry, isLoading: telemetryLoading } = useQuery({
    queryKey: ['telemetry-latest', selectedDeviceId],
    queryFn: async () => {
      if (!selectedDeviceId) return null;
      const res = await apiClient.get<Telemetry[]>(
        `/api/v1/telemetry/device/${selectedDeviceId}?limit=1`
      );
      return res.data[0] ?? null;
    },
    enabled: !!selectedDeviceId,
    refetchInterval: wsStatus === 'connected' ? false : 5000,
  });

  // Chart data — last 30 points
  const { data: chartData } = useQuery({
    queryKey: ['telemetry-chart', selectedDeviceId],
    queryFn: async () => {
      if (!selectedDeviceId) return [];
      const res = await apiClient.get<Telemetry[]>(
        `/api/v1/telemetry/device/${selectedDeviceId}?limit=30`
      );
      return res.data
        .reverse()
        .map((p: Telemetry) => ({
          time: p.timestamp
            ? new Date(p.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
            : '',
          CPU: p.cpu_percent != null ? +p.cpu_percent.toFixed(1) : null,
          Memory: p.memory_percent != null ? +p.memory_percent.toFixed(1) : null,
          Disk: p.disk_percent != null ? +p.disk_percent.toFixed(1) : null,
        }));
    },
    enabled: !!selectedDeviceId,
    refetchInterval: 10000,
  });

  // Capability flags
  const { data: capabilities } = useQuery<Capability[]>({
    queryKey: ['capabilities', selectedDeviceId],
    queryFn: async () => {
      if (!selectedDeviceId) return [];
      const res = await apiClient.get<Capability[]>(
        `/api/v1/devices/${selectedDeviceId}/capabilities`
      );
      return res.data;
    },
    enabled: !!selectedDeviceId,
  });

  if (!selectedDeviceId) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center space-y-4 text-center">
        <Activity className="h-12 w-12 text-muted-foreground opacity-20" />
        <h2 className="text-xl font-medium text-muted-foreground">No Device Selected</h2>
        <p className="text-sm text-muted-foreground">
          Select a device from the top navigation to view its telemetry.
        </p>
      </div>
    );
  }

  const dev = selectedDevice as any;
  const healthScore = dev?.health_score;
  const riskLevel = dev?.risk_level;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{dev?.hostname ?? selectedDeviceId}</h2>
          <p className="text-muted-foreground">
            {dev?.os_version} {dev?.architecture ? `| ${dev.architecture}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={wsStatus === 'connected' ? 'default' : 'secondary'}
            className={wsStatus === 'connected' ? 'bg-green-500' : ''}
          >
            <span className="flex items-center gap-1">
              <span
                className={`h-2 w-2 rounded-full ${wsStatus === 'connected' ? 'bg-white animate-pulse' : 'bg-muted-foreground'}`}
              />
              {wsStatus === 'connected' ? 'Live' : wsStatus === 'connecting' ? 'Connecting' : 'Offline'}
            </span>
          </Badge>
          <HealthBadge score={healthScore} risk={riskLevel} />
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {telemetryLoading ? <Skeleton className="h-8 w-24" /> : (
              <>
                <div className="text-2xl font-bold">
                  {telemetry?.cpu_percent != null ? `${telemetry.cpu_percent.toFixed(1)}%` : 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {telemetry?.cpu_freq_current
                    ? `${(telemetry.cpu_freq_current / 1000).toFixed(2)} GHz`
                    : 'Freq unavailable'}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
            <MemoryStick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {telemetryLoading ? <Skeleton className="h-8 w-24" /> : (
              <>
                <div className="text-2xl font-bold">
                  {telemetry?.memory_percent != null ? `${telemetry.memory_percent.toFixed(1)}%` : 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {telemetry?.memory_used && telemetry?.memory_total
                    ? `${(telemetry.memory_used / 1e9).toFixed(1)} / ${(telemetry.memory_total / 1e9).toFixed(1)} GB`
                    : 'Size unavailable'}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disk Usage</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {telemetryLoading ? <Skeleton className="h-8 w-24" /> : (
              <>
                <div className="text-2xl font-bold">
                  {telemetry?.disk_percent != null ? `${telemetry.disk_percent.toFixed(1)}%` : 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">Primary drive utilization</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {telemetryLoading ? <Skeleton className="h-8 w-24" /> : (
              <>
                <div className="text-2xl font-bold">
                  {telemetry?.system_uptime
                    ? `${Math.floor(telemetry.system_uptime / 3600)}h ${Math.floor((telemetry.system_uptime % 3600) / 60)}m`
                    : 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">Continuous operation</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Chart + Capability Flags */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Live Chart */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Telemetry Trend</CardTitle>
            <CardDescription>CPU, Memory &amp; Disk usage — last 30 samples (auto-refreshes)</CardDescription>
          </CardHeader>
          <CardContent>
            {!chartData || chartData.length === 0 ? (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground border border-dashed rounded-md text-sm">
                Collecting telemetry... (requires a few samples)
              </div>
            ) : (
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.08)" />
                    <XAxis
                      dataKey="time"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      minTickGap={40}
                    />
                    <YAxis
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `${v}%`}
                      domain={[0, 100]}
                    />
                    <Tooltip
                      contentStyle={{ fontSize: 12, borderRadius: 6 }}
                      formatter={(v: any) => [`${v}%`]}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="CPU" stroke="#0ea5e9" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="Memory" stroke="#10b981" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="Disk" stroke="#f59e0b" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Capability Flags */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Capability Flags</CardTitle>
            <CardDescription>Supported sensors on this device</CardDescription>
          </CardHeader>
          <CardContent>
            {!capabilities || capabilities.length === 0 ? (
              <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                <p>No capability data available.</p>
                <p className="text-xs">
                  Capabilities are populated when the agent reports telemetry.
                  Ensure <code>agent_sync.py</code> is running.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {Array.from(new Map(capabilities.map(cap => [cap.metric_name, cap])).values()).map((cap) => (
                  <div key={cap.metric_name} className="flex items-center justify-between text-sm">
                    <span className="capitalize">{(cap.metric_name || '').replace(/_/g, ' ')}</span>
                    <Badge
                      variant="outline"
                      className={
                        cap.status === 'AVAILABLE'
                          ? 'border-green-400 text-green-700'
                          : cap.status === 'UNAVAILABLE'
                          ? 'opacity-50'
                          : 'border-yellow-400 text-yellow-700'
                      }
                    >
                      {cap.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
