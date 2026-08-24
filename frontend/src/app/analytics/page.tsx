'use client';

import { useQuery } from '@tanstack/react-query';
import { Activity, Clock } from 'lucide-react';
import { useDeviceContext } from '@/hooks/use-device';
import { apiClient } from '@/lib/api/client';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, Cell
} from 'recharts';
import { Badge } from '@/components/ui/badge';

const RISK_COLORS: Record<string, string> = {
  LOW: '#22c55e',     // green-500
  MEDIUM: '#eab308',  // yellow-500
  HIGH: '#f97316',    // orange-500
  CRITICAL: '#ef4444',// red-500
};

export default function AnalyticsPage() {
  const { selectedDeviceId, selectedDevice } = useDeviceContext();

  // Telemetry History
  const { data: telemetryHistory, isLoading: loadingTelemetry } = useQuery({
    queryKey: ['telemetry-history-full', selectedDeviceId],
    queryFn: async () => {
      if (!selectedDeviceId) return [];
      const res = await apiClient.get<any[]>(`/api/v1/telemetry/device/${selectedDeviceId}?limit=50`);
      return res.data.reverse().map(point => ({
        ...point,
        timeLabel: point.timestamp
          ? new Date(point.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : '',
        cpu: point.cpu_percent != null ? +point.cpu_percent.toFixed(1) : null,
        memory: point.memory_percent != null ? +point.memory_percent.toFixed(1) : null,
      }));
    },
    enabled: !!selectedDeviceId,
    refetchInterval: 30000
  });

  // Prediction History
  const { data: predictions, isLoading: loadingPredictions } = useQuery({
    queryKey: ['predictions', selectedDeviceId, 'history'],
    queryFn: async () => {
      if (!selectedDeviceId) return [];
      const res = await apiClient.get<any[]>(`/api/v1/predictions/device/${selectedDeviceId}?limit=50`);
      return res.data;
    },
    enabled: !!selectedDeviceId,
    refetchInterval: 30000
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

  // Calculate Risk Distribution
  const riskDistribution = [
    { name: 'LOW', count: 0 },
    { name: 'MEDIUM', count: 0 },
    { name: 'HIGH', count: 0 },
    { name: 'CRITICAL', count: 0 },
  ];
  if (predictions) {
    predictions.forEach(p => {
      const level = p.risk_level || 'LOW';
      const bucket = riskDistribution.find(b => b.name === level);
      if (bucket) bucket.count++;
    });
  }

  // Check if we have at least one prediction with valid fields
  const hasPredictions = predictions && predictions.length > 0;
  const latestPrediction = hasPredictions ? predictions[0] : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">System Analytics</h2>
          <p className="text-muted-foreground">
            Historical trends and ML inference analysis for {selectedDevice?.hostname}
          </p>
        </div>
      </div>

      {/* Overview Cards */}
      {hasPredictions && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">ML Model</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">{latestPrediction.model_name || 'N/A'}</div>
              <p className="text-xs text-muted-foreground">v{latestPrediction.model_version || '?'}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Inference Speed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">{latestPrediction.inference_duration_ms || 0} ms</div>
              <p className="text-xs text-muted-foreground">Latest evaluation time</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Prediction Count</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">{predictions.length}</div>
              <p className="text-xs text-muted-foreground">In current view window</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Last Inference</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">
                {new Date(latestPrediction.timestamp_utc).toLocaleTimeString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {new Date(latestPrediction.timestamp_utc).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {/* Telemetry Chart */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>CPU & Memory Usage</CardTitle>
            <CardDescription>Last 50 recorded data points</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingTelemetry ? (
              <div className="h-[300px] w-full animate-pulse bg-muted rounded-md" />
            ) : telemetryHistory && telemetryHistory.length > 0 ? (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={telemetryHistory} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
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
                    />
                    <Legend wrapperStyle={{ paddingTop: '10px' }} />
                    <Line type="monotone" dataKey="cpu" name="CPU (%)" stroke="#0ea5e9" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="memory" name="Memory (%)" stroke="#10b981" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground border border-dashed rounded-md">
                No telemetry data available.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Risk Distribution Chart */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Risk Distribution</CardTitle>
            <CardDescription>Based on recent predictions</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingPredictions ? (
              <div className="h-[300px] w-full animate-pulse bg-muted rounded-md" />
            ) : hasPredictions ? (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={riskDistribution} margin={{ top: 20, right: 0, bottom: 0, left: -30 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip cursor={{ fill: 'transparent' }} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {riskDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={RISK_COLORS[entry.name]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground border border-dashed rounded-md text-sm text-center px-4">
                No predictions yet.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Prediction History Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Prediction Log
          </CardTitle>
          <CardDescription>Detailed chronological history of ML evaluations.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            {loadingPredictions ? (
              <div className="h-32 flex items-center justify-center text-muted-foreground">Loading history...</div>
            ) : hasPredictions ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50 text-left">
                      <th className="p-3 font-medium">Time</th>
                      <th className="p-3 font-medium">Prediction</th>
                      <th className="p-3 font-medium">Probability</th>
                      <th className="p-3 font-medium">Risk</th>
                      <th className="p-3 font-medium">Health</th>
                      <th className="p-3 font-medium">Anomaly</th>
                    </tr>
                  </thead>
                  <tbody>
                    {predictions.map((p: any) => (
                      <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="p-3 whitespace-nowrap text-muted-foreground">
                          {new Date(p.timestamp_utc).toLocaleString()}
                        </td>
                        <td className="p-3 font-medium">{p.prediction || 'UNKNOWN'}</td>
                        <td className="p-3 font-mono">
                          {p.prediction_probability != null ? (p.prediction_probability * 100).toFixed(1) + '%' : '-'}
                        </td>
                        <td className="p-3">
                          <Badge variant="outline" style={{ color: RISK_COLORS[p.risk_level || 'LOW'], borderColor: RISK_COLORS[p.risk_level || 'LOW'] }}>
                            {p.risk_level || 'N/A'}
                          </Badge>
                        </td>
                        <td className="p-3 font-medium">
                          {p.health_score != null ? p.health_score : '-'}
                        </td>
                        <td className="p-3">
                          {p.anomaly_label === 'YES' ? (
                            <span className="text-red-500 font-medium">DETECTED</span>
                          ) : p.anomaly_label === 'NO' ? (
                            <span className="text-green-500">NORMAL</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="h-32 flex items-center justify-center text-muted-foreground">
                No prediction history found.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
