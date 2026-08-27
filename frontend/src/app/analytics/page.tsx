'use client';

import { useQuery } from '@tanstack/react-query';
import { Activity, Clock, Brain, BarChart2, CheckCircle, TrendingUp } from 'lucide-react';
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

  // ML Status (model comparison + feature importance)
  const { data: mlStatus } = useQuery({
    queryKey: ['ml-status'],
    queryFn: async () => {
      const res = await apiClient.get<any>('/api/v1/analytics/ml/status');
      return res.data;
    },
    refetchInterval: 60000,
    staleTime: 30000,
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

      {/* ML Model Performance Section */}
      {mlStatus && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-400" />
            <h3 className="text-lg font-semibold">ML Model Performance</h3>
            <Badge variant="outline" className={mlStatus.is_baseline ? 'border-yellow-500/50 text-yellow-400' : 'border-emerald-500/50 text-emerald-400'}>
              {mlStatus.active_model} {mlStatus.active_model_version}
            </Badge>
            {!mlStatus.is_baseline && (
              <Badge className="bg-emerald-950 text-emerald-400 border-0">
                <CheckCircle className="h-3 w-3 mr-1" /> ACTIVE
              </Badge>
            )}
          </div>

          {/* Active Model Metric Cards */}
          {(() => {
            const active = mlStatus.model_comparison?.find((m: any) => m.is_active);
            if (!active) return null;
            const mx = active.metrics;
            const fmt = (v: number | null) => v != null ? (v * 100).toFixed(1) + '%' : 'N/A';
            return (
              <div className="grid gap-4 md:grid-cols-4">
                {[{label: 'F1 Score', value: fmt(mx.f1), desc: 'Harmonic mean of precision & recall', color: 'text-emerald-400'},
                  {label: 'Precision', value: fmt(mx.precision), desc: 'True positive / all predicted positive', color: 'text-blue-400'},
                  {label: 'Recall', value: fmt(mx.recall), desc: 'True positive / all actual positive', color: 'text-purple-400'},
                  {label: 'PR-AUC', value: fmt(mx.pr_auc), desc: 'Area under precision-recall curve', color: 'text-orange-400'},
                ].map(item => (
                  <Card key={item.label} className="bg-slate-900 border-slate-800">
                    <CardHeader className="pb-1">
                      <CardTitle className="text-xs text-slate-400 font-medium uppercase tracking-wider">{item.label}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className={`text-2xl font-bold ${item.color}`}>{item.value}</div>
                      <p className="text-xs text-slate-500 mt-1">{item.desc}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            );
          })()}

          <div className="grid gap-6 md:grid-cols-2">
            {/* Model Comparison Table */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <BarChart2 className="h-4 w-4 text-blue-400" />
                  Model Comparison
                </CardTitle>
                <CardDescription>All 5 models trained on 1,253 real telemetry samples</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="grid grid-cols-5 gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-800">
                    <div className="col-span-2">Model</div>
                    <div>F1</div>
                    <div>Precision</div>
                    <div>PR-AUC</div>
                  </div>
                  {mlStatus.model_comparison?.map((m: any) => {
                    const mx = m.metrics;
                    const pct = (v: number | null) => v != null ? (v * 100).toFixed(0) + '%' : '-';
                    return (
                      <div key={m.model_name} className={`grid grid-cols-5 gap-2 text-sm py-2 rounded px-1 ${
                        m.is_active ? 'bg-blue-950/40 border border-blue-800/30' :
                        m.is_baseline ? 'opacity-60' : ''
                      }`}>
                        <div className="col-span-2 flex items-center gap-1">
                          <span className={m.is_active ? 'text-blue-300 font-semibold' : m.is_baseline ? 'text-slate-500' : 'text-slate-300'}>
                            {m.model_name}
                          </span>
                          {m.is_active && <span className="text-[10px] text-blue-400 bg-blue-950 px-1 rounded">ACTIVE</span>}
                          {m.is_baseline && <span className="text-[10px] text-slate-500 bg-slate-800 px-1 rounded">BASE</span>}
                        </div>
                        <div className={m.is_active ? 'text-emerald-400 font-bold' : 'text-slate-300'}>{pct(mx.f1)}</div>
                        <div className="text-slate-300">{pct(mx.precision)}</div>
                        <div className="text-slate-300">{pct(mx.pr_auc)}</div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-slate-600 mt-4">
                  MajorityBaseline is the evaluation floor (predicts majority class always). Any model beating it demonstrates learning.
                </p>
              </CardContent>
            </Card>

            {/* Top Feature Importances */}
            {mlStatus.feature_importance?.length > 0 && (
              <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-purple-400" />
                    Top Feature Importances
                  </CardTitle>
                  <CardDescription>XGBoost feature contribution scores</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={mlStatus.feature_importance.slice(0, 8).map((f: any) => ({...f, pct: +(f.importance * 100).toFixed(1)}))}
                        layout="vertical"
                        margin={{ top: 0, right: 20, bottom: 0, left: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--muted-foreground)/0.1)" />
                        <XAxis type="number" domain={[0, 100]} tickFormatter={v => `${v}%`} fontSize={10} stroke="hsl(var(--muted-foreground))" />
                        <YAxis type="category" dataKey="feature" width={160} fontSize={10} stroke="hsl(var(--muted-foreground))" />
                        <Tooltip formatter={(v: any) => `${v}%`} contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} />
                        <Bar dataKey="pct" fill="#7c3aed" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

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
