'use client';

import { useQuery } from '@tanstack/react-query';
import { useDeviceContext } from '@/hooks/use-device';
import { useWebsocket } from '@/hooks/use-websocket';
import { apiClient } from '@/lib/api/client';
import { Badge } from '@/components/ui/badge';
import { Activity, Cpu, ShieldAlert, CheckCircle2, AlertTriangle, ArrowRight, TrendingUp, TrendingDown, Minus, Sparkles } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { useRouter } from 'next/navigation';
import { LiquidChrome } from '@/components/ui/LiquidChrome';

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
            ? new Date(p.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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
      <div className="relative min-h-[70vh] flex flex-col items-center justify-center space-y-4 text-center font-mono">
        {/* Full Visibility Liquid Chrome Background */}
        <div className="fixed inset-0 pointer-events-auto z-0 overflow-hidden opacity-100">
          <LiquidChrome
            baseColor={[0.1, 0.1, 0.1]}
            speed={0.6}
            amplitude={0.65}
            frequencyX={2.5}
            frequencyY={1.5}
            interactive={true}
          />
        </div>

        <div className="relative z-10 bg-black/60 backdrop-blur-2xl border border-white/20 p-8 rounded-3xl shadow-[0_24px_50px_rgba(0,0,0,0.8)] max-w-md">
          <Activity className="h-12 w-12 text-white mx-auto mb-3 animate-pulse" />
          <h2 className="text-lg font-semibold text-white uppercase tracking-widest">No Device Selected</h2>
          <p className="text-xs text-white/70 mt-1">Select an active machine from the device dropdown above to stream telemetry.</p>
        </div>
      </div>
    );
  }

  const latestPrediction = predictions?.[0];
  const activeIssuesCount = systemState?.active_issue_count ?? issues?.length ?? 0;
  const anomalyCount = systemState?.anomaly?.is_anomaly ? 1 : (issues?.filter(i => i.issue_type === 'ANOMALY_DETECTED').length || 0);
  const healthScore = systemState?.health_score ?? (selectedDevice as any)?.health_score ?? 100;
  const riskLevel = systemState?.risk_level ?? (selectedDevice as any)?.risk_level ?? 'UNKNOWN';
  const recommendation = systemState?.recommended_action ?? null;
  const activeIssues = systemState?.active_issues ?? issues ?? [];
  const highestSeverityIssue = activeIssues.sort((a, b) => {
    const rank: Record<string, number> = { CRITICAL: 3, HIGH: 2, WARNING: 1, INFO: 0 };
    return (rank[b.severity] ?? 0) - (rank[a.severity] ?? 0);
  })[0];

  return (
    <div className="relative min-h-screen">
      
      {/* 🌟 Radiant Liquid Chrome Background */}
      <div className="fixed inset-0 pointer-events-auto z-0 overflow-hidden opacity-100">
        <LiquidChrome
          baseColor={[0.1, 0.1, 0.1]}
          speed={0.6}
          amplitude={0.65}
          frequencyX={2.5}
          frequencyY={1.5}
          interactive={true}
        />
      </div>

      {/* Main Dashboard UI with Glassmorphic Cards */}
      <div className="relative z-10 max-w-7xl mx-auto space-y-6 font-manrope">
        
        {/* 1. TOP PRIORITIES KPI CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* System Health */}
          <div className="bg-black/50 backdrop-blur-xl border border-white/20 rounded-2xl p-5 shadow-[0_16px_36px_rgba(0,0,0,0.6)] transition-all duration-200 hover:border-white/40">
            <span className="text-[10px] font-mono font-bold text-white/70 uppercase tracking-widest block mb-2">SYSTEM HEALTH</span>
            <div className={`text-4xl font-mono font-black tracking-tight ${
              healthScore >= 80 ? 'text-white' : 
              healthScore >= 50 ? 'text-swiss-red' : 'text-swiss-red'
            }`}>
              {healthScore}<span className="text-sm font-normal text-white/50">/100</span>
            </div>
            <span className="text-[10px] font-mono text-white/50 uppercase mt-2 block">
              {healthScore >= 80 ? '● OPTIMAL OPERATING STATE' : '⚠ COMPROMISED TELEMETRY'}
            </span>
          </div>
          
          {/* Risk Level */}
          <div className="bg-black/50 backdrop-blur-xl border border-white/20 rounded-2xl p-5 shadow-[0_16px_36px_rgba(0,0,0,0.6)] transition-all duration-200 hover:border-white/40">
            <span className="text-[10px] font-mono font-bold text-white/70 uppercase tracking-widest block mb-2">RISK LEVEL</span>
            <div className={`text-4xl font-mono font-black tracking-tight ${
              riskLevel === 'CRITICAL' || riskLevel === 'HIGH' ? 'text-swiss-red' :
              riskLevel === 'MEDIUM' ? 'text-swiss-red' : 'text-white'
            }`}>
              {riskLevel}
            </div>
            <span className="text-[10px] font-mono text-white/50 uppercase mt-2 block">
              INFERENCE DRIFT VECTOR
            </span>
          </div>

          {/* Active Issues */}
          <div className="bg-black/50 backdrop-blur-xl border border-white/20 rounded-2xl p-5 shadow-[0_16px_36px_rgba(0,0,0,0.6)] transition-all duration-200 hover:border-white/40">
            <span className="text-[10px] font-mono font-bold text-white/70 uppercase tracking-widest block mb-2">ACTIVE ISSUES</span>
            <div className="text-4xl font-mono font-black text-white tracking-tight">
              {activeIssuesCount}
            </div>
            <span className="text-[10px] font-mono text-white/50 uppercase mt-2 block">
              TRACKED INCIDENT DOCKETS
            </span>
          </div>

          {/* Anomalies */}
          <div className="bg-black/50 backdrop-blur-xl border border-white/20 rounded-2xl p-5 shadow-[0_16px_36px_rgba(0,0,0,0.6)] transition-all duration-200 hover:border-white/40">
            <span className="text-[10px] font-mono font-bold text-white/70 uppercase tracking-widest block mb-2">ANOMALIES</span>
            <div className={`text-4xl font-mono font-black tracking-tight ${anomalyCount > 0 ? 'text-swiss-red' : 'text-white'}`}>
              {anomalyCount}
            </div>
            <span className="text-[10px] font-mono text-white/50 uppercase mt-2 block">
              ISOLATION FOREST CLUSTERS
            </span>
          </div>

        </div>

        {/* 2. LATEST AI ANALYSIS */}
        <div className="bg-black/50 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-[0_16px_36px_rgba(0,0,0,0.6)]">
          <div className="flex items-center justify-between border-b border-white/15 pb-4 mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-white" />
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-white">LATEST AI INFERENCE DOCKET</h2>
            </div>
            <span className="text-[10px] font-mono text-white/50 uppercase">DUAL ML PIPELINE ACTIVE</span>
          </div>
          
          {latestPrediction ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 font-mono">
              <div className="bg-white/[0.05] p-3 rounded-xl border border-white/10">
                <span className="text-[10px] text-white/50 uppercase block mb-1">PREDICTION</span>
                <span className="text-sm font-bold text-white">{latestPrediction.prediction}</span>
              </div>
              <div className="bg-white/[0.05] p-3 rounded-xl border border-white/10">
                <span className="text-[10px] text-white/50 uppercase block mb-1">PROBABILITY</span>
                <span className="text-sm font-bold text-white">{(latestPrediction.prediction_probability * 100).toFixed(1)}%</span>
              </div>
              <div className="bg-white/[0.05] p-3 rounded-xl border border-white/10">
                <span className="text-[10px] text-white/50 uppercase block mb-1">ANOMALY</span>
                <span className="text-sm font-bold text-white">{latestPrediction.anomaly_label}</span>
              </div>
              <div className="bg-white/[0.05] p-3 rounded-xl border border-white/10">
                <span className="text-[10px] text-white/50 uppercase block mb-1">RISK</span>
                <span className={`text-sm font-bold ${latestPrediction.risk_level === 'HIGH' ? 'text-swiss-red' : 'text-white'}`}>
                  {latestPrediction.risk_level}
                </span>
              </div>
              <div className="bg-white/[0.05] p-3 rounded-xl border border-white/10">
                <span className="text-[10px] text-white/50 uppercase block mb-1">MODEL</span>
                <span className="text-sm font-bold text-white">{latestPrediction.model_version}</span>
              </div>
              <div className="bg-white/[0.05] p-3 rounded-xl border border-white/10">
                <span className="text-[10px] text-white/50 uppercase block mb-1">LAST INFERENCE</span>
                <span className="text-sm font-bold text-white">{new Date(latestPrediction.created_at).toLocaleTimeString()}</span>
              </div>
            </div>
          ) : (
            <div className="text-white/50 text-xs font-mono py-4 text-center">No predictions recorded yet for this device.</div>
          )}
        </div>

        {/* 3. CURRENT ISSUES & RECOMMENDATION */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Issues List: 7 Columns */}
          <div className="lg:col-span-7 bg-black/50 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-[0_16px_36px_rgba(0,0,0,0.6)] flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4 border-b border-white/15 pb-3">
                <AlertTriangle className="w-4 h-4 text-swiss-red" />
                <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-white">ACTIVE INCIDENTS</h2>
              </div>

              {activeIssues && activeIssues.length > 0 ? (
                <div className="space-y-3">
                  {activeIssues.map(issue => (
                    <div key={issue.id} className="bg-black/60 p-4 rounded-xl border border-white/15 flex justify-between items-center transition-all hover:border-white/30">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-[9px] px-2 py-0.5 rounded font-mono font-black uppercase bg-swiss-red text-white">
                            {issue.severity}
                          </span>
                          <span className="text-white font-semibold text-xs sm:text-sm uppercase">{issue.issue_type.replace(/_/g, " ")}</span>
                        </div>
                        <div className="text-xs font-mono text-white/60 mt-1.5">
                          {issue.current_value?.toFixed(1)}% for ~{issue.duration_seconds}s
                        </div>
                      </div>
                      <button
                        className="rounded-full bg-white/10 hover:bg-white text-white hover:text-black px-3.5 py-1.5 text-xs font-mono font-bold uppercase tracking-wider transition-colors border border-white/15"
                        onClick={() => router.push(`/alerts/${issue.id}`)}
                      >
                        VIEW
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-white/50 font-mono text-xs">
                  <CheckCircle2 className="w-10 h-10 text-white/30 mb-2" />
                  <p>ZERO ACTIVE INCIDENTS. SYSTEM STABLE.</p>
                </div>
              )}
            </div>
          </div>

          {/* Recommended Action: 5 Columns */}
          <div className="lg:col-span-5 bg-black/50 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-[0_16px_36px_rgba(0,0,0,0.6)] flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4 border-b border-white/15 pb-3">
                <CheckCircle2 className="w-4 h-4 text-white" />
                <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-white">RECOMMENDED REMEDIATION</h2>
              </div>

              {highestSeverityIssue ? (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wide">{highestSeverityIssue.issue_type.replace(/_/g, " ")}</h3>
                  <p className="text-white/90 text-xs leading-relaxed whitespace-pre-wrap">
                    {recommendation || highestSeverityIssue.recommendation || highestSeverityIssue.explanation}
                  </p>
                </div>
              ) : (
                <div className="text-white/60 text-xs leading-relaxed font-mono">
                  {recommendation ?? 'System operating within optimal parameters. No manual intervention needed.'}
                </div>
              )}
            </div>

            {highestSeverityIssue && (
              <button
                className="w-full mt-6 rounded-full bg-white text-black font-bold text-xs uppercase tracking-widest py-3.5 hover:bg-white/90 hover:scale-[1.01] transition-all flex items-center justify-center gap-2 shadow-xl"
                onClick={() => router.push(`/alerts/${highestSeverityIssue.id}`)}
              >
                <span>EXECUTE REMEDIATION</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>

        </div>

        {/* 4. LIVE TELEMETRY CHART */}
        <div className="bg-black/50 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-[0_16px_36px_rgba(0,0,0,0.6)] space-y-6">
          <div className="flex items-center justify-between border-b border-white/15 pb-4">
            <div>
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-white">LIVE TELEMETRY STREAM</h2>
              <span className="text-[10px] font-mono text-white/50 uppercase">REAL-TIME SYSTEM RESOURCE METRICS</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-swiss-red animate-pulse" />
              <span className="text-[10px] font-mono font-bold uppercase text-white/90">LIVE FEED</span>
            </div>
          </div>

          {/* 3 Snapshot Tiles */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
            <div className="bg-black/60 p-4 rounded-xl border border-white/15">
              <span className="text-[10px] text-white/50 uppercase block mb-1">CPU UTILIZATION</span>
              <span className="text-3xl font-black text-white">{telemetry?.cpu_percent?.toFixed(1) || '0.0'}%</span>
            </div>
            <div className="bg-black/60 p-4 rounded-xl border border-white/15">
              <span className="text-[10px] text-white/50 uppercase block mb-1">MEMORY OCCUPANCY</span>
              <span className="text-3xl font-black text-white">{telemetry?.memory_percent?.toFixed(1) || '0.0'}%</span>
            </div>
            <div className="bg-black/60 p-4 rounded-xl border border-white/15">
              <span className="text-[10px] text-white/50 uppercase block mb-1">DISK OCCUPANCY</span>
              <span className="text-3xl font-black text-white">{telemetry?.disk_percent?.toFixed(1) || '0.0'}%</span>
            </div>
          </div>
          
          {/* Recharts Container */}
          <div className="h-[280px] w-full pt-2">
            {chartData && chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333333" />
                  <XAxis dataKey="time" stroke="#888888" fontSize={11} fontFamily="monospace" />
                  <YAxis stroke="#888888" fontSize={11} domain={[0, 100]} fontFamily="monospace" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#121212', borderColor: '#444444', color: '#ffffff', borderRadius: '8px' }}
                    itemStyle={{ color: '#ffffff' }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="CPU" stroke="#ff3000" strokeWidth={2.5} dot={false} isAnimationActive={false} />
                  <Line type="monotone" dataKey="Memory" stroke="#ffffff" strokeWidth={2.5} dot={false} isAnimationActive={false} />
                  <Line type="monotone" dataKey="Disk" stroke="#f59e0b" strokeWidth={2.5} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-white/50 font-mono text-xs">
                Waiting for telemetry data...
              </div>
            )}
          </div>
        </div>

        {/* 5. 30-MINUTE TREND FORECAST */}
        {forecast && (
          <div className="bg-black/50 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-[0_16px_36px_rgba(0,0,0,0.6)] space-y-4">
            <div className="flex items-center justify-between border-b border-white/15 pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-white" />
                <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-white">30-MINUTE LINEAR TRAJECTORY FORECAST</h2>
              </div>
              {forecast.has_warnings && (
                <span className="bg-swiss-red text-white text-[9px] font-mono font-bold px-2 py-0.5 uppercase rounded-sm">
                  THRESHOLD WARNING
                </span>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-3 font-mono">
              {forecast.forecasts?.map((f: any) => {
                const TrendIcon = f.trend === 'RISING' ? TrendingUp : f.trend === 'FALLING' ? TrendingDown : Minus;
                const isWarning = f.will_breach_threshold;
                return (
                  <div key={f.metric} className={`rounded-xl p-4 border ${
                    isWarning ? 'bg-swiss-red/15 border-swiss-red/50' : 'bg-black/60 border-white/15'
                  }`}>
                    <div className="text-[10px] text-white/60 mb-2 uppercase tracking-wider font-bold">{f.label}</div>
                    <div className="flex items-end justify-between">
                      <div>
                        <div className="text-white/50 text-[10px]">NOW</div>
                        <div className="text-2xl font-black text-white">{f.current ?? '—'}%</div>
                      </div>
                      <TrendIcon className={`h-5 w-5 mx-2 ${isWarning ? 'text-swiss-red' : 'text-white'}`} />
                      <div className="text-right">
                        <div className="text-white/50 text-[10px]">PROJECTED T+30M</div>
                        <div className={`text-2xl font-black ${isWarning ? 'text-swiss-red' : 'text-white'}`}>{f.forecast_30min ?? '—'}%</div>
                      </div>
                    </div>
                    {f.will_breach_threshold && (
                      <div className="mt-2 text-[10px] text-swiss-red font-bold uppercase">
                        ⚠ Approaching {f.threshold}% threshold {f.eta_threshold_minutes && `(~${f.eta_threshold_minutes} min)`}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
