'use client';

import { useQuery } from '@tanstack/react-query';
import { useDeviceContext } from '@/hooks/use-device';
import { useWebsocket } from '@/hooks/use-websocket';
import { apiClient } from '@/lib/api/client';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, Cpu, HardDrive, MemoryStick, ShieldAlert, CheckCircle2, AlertTriangle, Info, ArrowRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { useRouter } from 'next/navigation';

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

type Prediction = {
  prediction: string;
  prediction_probability: number;
  risk_level: string;
  anomaly_label: string;
  anomaly_score: number;
  model_version: string;
  created_at: string;
};

type Issue = {
  id: string;
  issue_type: string;
  severity: string;
  status: string;
  current_value?: number;
  duration_seconds?: number;
  explanation?: string;
  recommendation?: string;
};

type SystemState = {
  health_score: number;
  health_status: string;
  health_factors: string[];
  risk_level: string;
  presence_status: string;
  last_seen_at: string | null;
  active_issue_count: number;
  active_alert_count: number;
  active_issues: Issue[];
  recommended_action: string;
  latest_prediction: {
    prediction: string;
    prediction_probability: number;
    risk_level: string;
    timestamp: string;
  } | null;
  anomaly: {
    label: string;
    score: number | null;
    is_anomaly: boolean;
  };
  model: {
    name: string;
    version: string;
    status: string;
    is_baseline: boolean;
    mode: string;
  };
};

export default function DashboardPage() {
  const { selectedDeviceId, selectedDevice } = useDeviceContext();
  const router = useRouter();

  const { status: wsStatus } = useWebsocket(
    selectedDeviceId ? `/api/v1/ws/devices/${selectedDeviceId}` : undefined
  );

  const { data: telemetry } = useQuery({
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

  const { data: issues } = useQuery({
    queryKey: ['issues', selectedDeviceId],
    queryFn: async () => {
      if (!selectedDeviceId) return [];
      const res = await apiClient.get<Issue[]>(`/api/v1/issues?device_id=${selectedDeviceId}`);
      return res.data.filter(i => i.status !== 'RESOLVED' && i.status !== 'DISMISSED');
    },
    enabled: !!selectedDeviceId,
    refetchInterval: 5000,
  });

  // Single authoritative system state — drives all summary cards
  const { data: systemState } = useQuery({
    queryKey: ['system-state', selectedDeviceId],
    queryFn: async () => {
      if (!selectedDeviceId) return null;
      const res = await apiClient.get<SystemState>(`/api/v1/devices/${selectedDeviceId}/state`);
      return res.data;
    },
    enabled: !!selectedDeviceId,
    refetchInterval: 5000,
  });

  const { data: predictions } = useQuery({
    queryKey: ['predictions', selectedDeviceId],
    queryFn: async () => {
      if (!selectedDeviceId) return [];
      const res = await apiClient.get<Prediction[]>(`/api/v1/predictions/device/${selectedDeviceId}?limit=1`);
      return res.data;
    },
    enabled: !!selectedDeviceId,
    refetchInterval: 10000,
  });

  const { data: forecast } = useQuery({
    queryKey: ['forecast', selectedDeviceId],
    queryFn: async () => {
      if (!selectedDeviceId) return null;
      const res = await apiClient.get<any>(`/api/v1/devices/${selectedDeviceId}/forecast`);
      return res.data;
    },
    enabled: !!selectedDeviceId,
    refetchInterval: 60000,
    staleTime: 30000,
  });

  if (!selectedDeviceId || !selectedDevice) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center space-y-4 text-center">
        <Activity className="h-12 w-12 text-muted-foreground opacity-20" />
        <h2 className="text-xl font-medium text-muted-foreground">No Device Selected</h2>
      </div>
    );
  }

  const latestPrediction = predictions?.[0];
  // Use systemState for all summary card values — single source of truth
  const activeIssuesCount = systemState?.active_issue_count ?? issues?.length ?? 0;
  const activeAlertCount = systemState?.active_alert_count ?? 0;
  const anomalyCount = systemState?.anomaly?.is_anomaly ? 1 : (issues?.filter(i => i.issue_type === 'ANOMALY_DETECTED').length || 0);
  const healthScore = systemState?.health_score ?? selectedDevice.health_score ?? 100;
  const riskLevel = systemState?.risk_level ?? selectedDevice.risk_level ?? 'UNKNOWN';
  const recommendation = systemState?.recommended_action ?? null;
  const activeIssues = systemState?.active_issues ?? issues ?? [];
  const highestSeverityIssue = activeIssues.sort((a, b) => {
    const rank: Record<string, number> = { CRITICAL: 3, HIGH: 2, WARNING: 1, INFO: 0 };
    return (rank[b.severity] ?? 0) - (rank[a.severity] ?? 0);
  })[0];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* 1. TOP PRIORITIES */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-400 uppercase tracking-wider">System Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${
              healthScore >= 80 ? 'text-emerald-400' : 
              healthScore >= 50 ? 'text-yellow-400' : 'text-red-400'
            }`}>
              {healthScore}/100
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-400 uppercase tracking-wider">Risk Level</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${
              riskLevel === 'CRITICAL' ? 'text-red-500' :
              riskLevel === 'HIGH' ? 'text-orange-500' :
              riskLevel === 'MEDIUM' ? 'text-yellow-500' :
              riskLevel === 'LOW' ? 'text-emerald-500' : 'text-slate-400'
            }`}>
              {riskLevel}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-400 uppercase tracking-wider">Active Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {activeIssuesCount}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-400 uppercase tracking-wider">Anomalies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${anomalyCount > 0 ? 'text-orange-400' : 'text-slate-200'}`}>
              {anomalyCount}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 2. LATEST AI ANALYSIS */}
      <Card className="bg-slate-950 border-slate-800">
        <CardHeader>
          <CardTitle className="text-blue-400 flex items-center">
            <Activity className="w-5 h-5 mr-2" /> Latest AI Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          {latestPrediction ? (
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
              <div><span className="text-slate-500 block">Prediction</span><span className="text-slate-200 font-medium">{latestPrediction.prediction}</span></div>
              <div><span className="text-slate-500 block">Probability</span><span className="text-slate-200">{(latestPrediction.prediction_probability * 100).toFixed(1)}%</span></div>
              <div><span className="text-slate-500 block">Anomaly</span><span className="text-slate-200">{latestPrediction.anomaly_label}</span></div>
              <div><span className="text-slate-500 block">Risk</span><span className="text-slate-200">{latestPrediction.risk_level}</span></div>
              <div><span className="text-slate-500 block">Model</span><span className="text-slate-200">{latestPrediction.model_version}</span></div>
              <div><span className="text-slate-500 block">Last Inference</span><span className="text-slate-200">{new Date(latestPrediction.created_at).toLocaleTimeString()}</span></div>
            </div>
          ) : (
            <div className="text-slate-500 text-sm">No predictions yet.</div>
          )}
        </CardContent>
      </Card>

      {/* 3. CURRENT ISSUES & RECOMMENDATION */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-slate-200 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-orange-400" /> Current Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeIssues && activeIssues.length > 0 ? (
              <div className="space-y-4">
                {activeIssues.map(issue => (
                  <div key={issue.id} className="bg-slate-950 p-4 rounded-lg border border-slate-800/50 flex justify-between items-center">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                          issue.severity === 'CRITICAL' ? 'bg-red-900/50 text-red-400' :
                          issue.severity === 'HIGH' ? 'bg-orange-900/50 text-orange-400' :
                          'bg-yellow-900/50 text-yellow-400'
                        }`}>{issue.severity}</span>
                        <span className="text-slate-200 font-medium capitalize">{issue.issue_type.replace(/_/g, " ")}</span>
                      </div>
                      <div className="text-sm text-slate-400 mt-1">
                        {issue.current_value?.toFixed(1)}% for ~{issue.duration_seconds}s
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="border-slate-700 text-slate-300 hover:text-white" onClick={() => router.push(`/alerts/${issue.id}`)}>
                      VIEW DETAILS
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-slate-500">
                <CheckCircle2 className="w-12 h-12 text-emerald-900 mb-2" />
                <p>No active issues.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-blue-950/20 border-blue-900/40">
          <CardHeader>
            <CardTitle className="text-blue-400 flex items-center">
              <CheckCircle2 className="w-5 h-5 mr-2" /> Recommended Action
            </CardTitle>
          </CardHeader>
          <CardContent>
            {highestSeverityIssue ? (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-slate-200 capitalize">{highestSeverityIssue.issue_type.replace(/_/g, " ")}</h3>
                <p className="text-slate-300 text-sm whitespace-pre-wrap">
                  {recommendation || highestSeverityIssue.recommendation || highestSeverityIssue.explanation}
                </p>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white w-full" onClick={() => router.push(`/alerts/${highestSeverityIssue.id}`)}>
                  INVESTIGATE <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            ) : (
              <div className="text-slate-500 text-sm">{recommendation ?? 'System is operating normally. No action required.'}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 4. LIVE TELEMETRY */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-slate-200">Live Telemetry</CardTitle>
          <CardDescription className="text-slate-500">Real-time resource utilization</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
              <span className="text-xs text-slate-500 block mb-1">CPU USAGE</span>
              <span className="text-2xl text-slate-200">{telemetry?.cpu_percent?.toFixed(1) || '0.0'}%</span>
            </div>
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
              <span className="text-xs text-slate-500 block mb-1">MEMORY USAGE</span>
              <span className="text-2xl text-slate-200">{telemetry?.memory_percent?.toFixed(1) || '0.0'}%</span>
            </div>
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
              <span className="text-xs text-slate-500 block mb-1">DISK USAGE</span>
              <span className="text-2xl text-slate-200">{telemetry?.disk_percent?.toFixed(1) || '0.0'}%</span>
            </div>
          </div>
          
          <div className="h-[300px] w-full">
            {chartData && chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="time" stroke="#475569" fontSize={12} />
                  <YAxis stroke="#475569" fontSize={12} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }}
                    itemStyle={{ color: '#e2e8f0' }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="CPU" stroke="#3b82f6" strokeWidth={2} dot={false} isAnimationActive={false} />
                  <Line type="monotone" dataKey="Memory" stroke="#10b981" strokeWidth={2} dot={false} isAnimationActive={false} />
                  <Line type="monotone" dataKey="Disk" stroke="#f59e0b" strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                Waiting for telemetry data...
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      {/* 30-Minute Trend Forecast */}
      {forecast && (
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-400" />
                  30-Minute Trend Forecast
                </CardTitle>
                <CardDescription className="text-xs mt-1">Linear regression on last 30 minutes of telemetry</CardDescription>
              </div>
              {forecast.has_warnings && (
                <Badge className="bg-orange-950/60 text-orange-400 border border-orange-700/30">
                  <AlertTriangle className="h-3 w-3 mr-1" /> Threshold Warning
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-3">
              {forecast.forecasts?.map((f: any) => {
                const TrendIcon = f.trend === 'RISING' ? TrendingUp : f.trend === 'FALLING' ? TrendingDown : Minus;
                const trendColor = f.trend === 'RISING'
                  ? (f.will_breach_threshold ? 'text-red-400' : 'text-orange-400')
                  : f.trend === 'FALLING' ? 'text-emerald-400' : 'text-slate-400';
                const isWarning = f.will_breach_threshold;
                return (
                  <div key={f.metric} className={`rounded-lg p-4 border ${
                    isWarning ? 'bg-red-950/20 border-red-800/30' : 'bg-slate-950/60 border-slate-800'
                  }`}>
                    <div className="text-xs text-slate-400 mb-2 uppercase tracking-wider">{f.label}</div>
                    <div className="flex items-end justify-between">
                      <div>
                        <div className="text-slate-400 text-xs">Now</div>
                        <div className="text-xl font-bold text-white">{f.current ?? '—'}%</div>
                      </div>
                      <TrendIcon className={`h-5 w-5 mx-2 ${trendColor}`} />
                      <div className="text-right">
                        <div className="text-slate-400 text-xs">In 30 min</div>
                        <div className={`text-xl font-bold ${trendColor}`}>{f.forecast_30min ?? '—'}%</div>
                      </div>
                    </div>
                    {f.will_breach_threshold && (
                      <div className="mt-2 text-xs text-red-400">
                        ⚠ Approaching {f.threshold}% threshold
                        {f.eta_threshold_minutes && ` (~${f.eta_threshold_minutes} min)`}
                      </div>
                    )}
                    {!f.will_breach_threshold && (
                      <div className="mt-2 text-xs text-slate-600">
                        Threshold: {f.threshold}% · {f.data_points} samples
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
