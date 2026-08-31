'use client';

import { useQuery } from '@tanstack/react-query';
import { Activity, Clock, Brain, BarChart2, CheckCircle, TrendingUp } from 'lucide-react';
import { useDeviceContext } from '@/hooks/use-device';
import { apiClient } from '@/lib/api/client';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, Cell
} from 'recharts';

const RISK_COLORS: Record<string, string> = {
  LOW: '#ffffff',
  MEDIUM: '#ff3000',
  HIGH: '#ff3000',
  CRITICAL: '#ff3000',
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
      <div className="flex h-[60vh] flex-col items-center justify-center space-y-4 text-center font-mono">
        <Activity className="h-12 w-12 text-white/20 animate-pulse" />
        <h2 className="text-lg font-semibold text-white/50 uppercase tracking-widest">No Device Selected</h2>
        <p className="text-xs text-white/40">Select a device from the top navigation to view historical analytics.</p>
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

  const hasPredictions = predictions && predictions.length > 0;
  const latestPrediction = hasPredictions ? predictions[0] : null;

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-manrope">
      <div>
        <h2 className="text-2xl font-black uppercase tracking-tight text-white font-geist">Telemetry & ML Analytics</h2>
        <p className="text-xs font-mono text-white/50 uppercase tracking-widest mt-1">
          Historical trends, inference metrics, and feature importances for {selectedDevice?.hostname}
        </p>
      </div>

      {/* Overview Cards */}
      {hasPredictions && (
        <div className="grid gap-4 md:grid-cols-4 font-mono">
          <div className="bg-[#0d0d0d] border border-white/15 rounded-2xl p-5 shadow-xl">
            <span className="text-[10px] text-white/50 font-bold uppercase tracking-widest block mb-1">ACTIVE ML ENGINE</span>
            <div className="text-xl font-black text-white">{latestPrediction.model_name || 'XGBoost'}</div>
            <p className="text-[10px] text-white/40 mt-1 uppercase">v{latestPrediction.model_version || '1.0.0'}</p>
          </div>
          <div className="bg-[#0d0d0d] border border-white/15 rounded-2xl p-5 shadow-xl">
            <span className="text-[10px] text-white/50 font-bold uppercase tracking-widest block mb-1">INFERENCE LATENCY</span>
            <div className="text-xl font-black text-white">{latestPrediction.inference_duration_ms || 0} ms</div>
            <p className="text-[10px] text-white/40 mt-1 uppercase">Real-time inference cycle</p>
          </div>
          <div className="bg-[#0d0d0d] border border-white/15 rounded-2xl p-5 shadow-xl">
            <span className="text-[10px] text-white/50 font-bold uppercase tracking-widest block mb-1">EVALUATIONS</span>
            <div className="text-xl font-black text-white">{predictions.length}</div>
            <p className="text-[10px] text-white/40 mt-1 uppercase">Logged window</p>
          </div>
          <div className="bg-[#0d0d0d] border border-white/15 rounded-2xl p-5 shadow-xl">
            <span className="text-[10px] text-white/50 font-bold uppercase tracking-widest block mb-1">LAST INFERENCE</span>
            <div className="text-xl font-black text-white">
              {new Date(latestPrediction.timestamp_utc).toLocaleTimeString()}
            </div>
            <p className="text-[10px] text-white/40 mt-1 uppercase">
              {new Date(latestPrediction.timestamp_utc).toLocaleDateString()}
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {/* Telemetry Chart */}
        <div className="md:col-span-2 bg-[#0d0d0d] border border-white/15 rounded-2xl p-6 shadow-xl space-y-4">
          <div>
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white">CPU & MEMORY HISTORICAL OCCUPANCY</h3>
            <span className="text-[10px] font-mono text-white/40 uppercase">Rolling telemetry snapshots</span>
          </div>
          <div>
            {loadingTelemetry ? (
              <div className="h-[280px] w-full animate-pulse bg-white/5 rounded-xl" />
            ) : telemetryHistory && telemetryHistory.length > 0 ? (
              <div className="h-[280px] w-full font-mono">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={telemetryHistory} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#222222" />
                    <XAxis 
                      dataKey="timeLabel" 
                      stroke="#666666" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false}
                      minTickGap={30}
                    />
                    <YAxis 
                      stroke="#666666" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(value) => `${value}%`}
                      domain={[0, 100]}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#121212', borderColor: '#333333', color: '#ffffff', borderRadius: '8px' }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '10px' }} />
                    <Line type="monotone" dataKey="cpu" name="CPU (%)" stroke="#ff3000" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="memory" name="Memory (%)" stroke="#ffffff" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-[280px] items-center justify-center text-white/40 font-mono text-xs">
                No telemetry history recorded.
              </div>
            )}
          </div>
        </div>

        {/* Risk Distribution Chart */}
        <div className="bg-[#0d0d0d] border border-white/15 rounded-2xl p-6 shadow-xl space-y-4">
          <div>
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white">RISK DISTRIBUTION</h3>
            <span className="text-[10px] font-mono text-white/40 uppercase">Classified telemetry intervals</span>
          </div>
          <div>
            {loadingPredictions ? (
              <div className="h-[280px] w-full animate-pulse bg-white/5 rounded-xl" />
            ) : hasPredictions ? (
              <div className="h-[280px] w-full font-mono">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={riskDistribution} margin={{ top: 20, right: 0, bottom: 0, left: -30 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#222222" />
                    <XAxis dataKey="name" fontSize={10} stroke="#666666" tickLine={false} axisLine={false} />
                    <YAxis fontSize={10} stroke="#666666" tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: '#121212', borderColor: '#333333', color: '#ffffff', borderRadius: '8px' }} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {riskDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.name === 'LOW' ? '#ffffff' : '#ff3000'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-[280px] items-center justify-center text-white/40 font-mono text-xs">
                No predictions recorded.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ML Model Performance Section */}
      {mlStatus && (
        <div className="space-y-4 font-mono">
          <div className="flex items-center gap-3">
            <Brain className="h-5 w-5 text-white" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">ML MODEL LEADERBOARD</h3>
            <span className="bg-white/10 text-white text-[10px] font-bold px-2 py-0.5 rounded-sm border border-white/15">
              {mlStatus.active_model} {mlStatus.active_model_version}
            </span>
          </div>

          {/* Active Model Metric Cards */}
          {(() => {
            const active = mlStatus.model_comparison?.find((m: any) => m.is_active);
            if (!active) return null;
            const mx = active.metrics;
            const fmt = (v: number | null) => v != null ? (v * 100).toFixed(1) + '%' : 'N/A';
            return (
              <div className="grid gap-4 md:grid-cols-4">
                {[{label: 'F1 SCORE', value: fmt(mx.f1), desc: 'Harmonic mean of precision & recall'},
                  {label: 'PRECISION', value: fmt(mx.precision), desc: 'True positive / all predicted positive'},
                  {label: 'RECALL', value: fmt(mx.recall), desc: 'True positive / all actual positive'},
                  {label: 'PR-AUC', value: fmt(mx.pr_auc), desc: 'Area under precision-recall curve'},
                ].map(item => (
                  <div key={item.label} className="bg-[#0d0d0d] border border-white/15 rounded-2xl p-5 shadow-xl">
                    <span className="text-[10px] text-white/50 font-bold uppercase tracking-widest block mb-1">{item.label}</span>
                    <div className="text-2xl font-black text-white">{item.value}</div>
                    <p className="text-[10px] text-white/40 mt-1 uppercase">{item.desc}</p>
                  </div>
                ))}
              </div>
            );
          })()}

          <div className="grid gap-6 md:grid-cols-2">
            {/* Model Comparison Table */}
            <div className="bg-[#0d0d0d] border border-white/15 rounded-2xl p-6 shadow-xl space-y-4">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-white">BENCHMARK COMPARISON</h4>
                <span className="text-[10px] text-white/40 uppercase">5 candidate models evaluated</span>
              </div>
              <div className="space-y-1.5">
                <div className="grid grid-cols-5 gap-2 text-[10px] font-bold text-white/50 uppercase pb-2 border-b border-white/10">
                  <div className="col-span-2">MODEL</div>
                  <div>F1</div>
                  <div>PRECISION</div>
                  <div>PR-AUC</div>
                </div>
                {mlStatus.model_comparison?.map((m: any) => {
                  const mx = m.metrics;
                  const pct = (v: number | null) => v != null ? (v * 100).toFixed(0) + '%' : '-';
                  return (
                    <div key={m.model_name} className={`grid grid-cols-5 gap-2 text-xs py-2 px-2 rounded-lg items-center ${
                      m.is_active ? 'bg-white/10 text-white font-bold' : 'text-white/70 hover:bg-white/5'
                    }`}>
                      <div className="col-span-2 flex items-center gap-1.5 truncate">
                        <span>{m.model_name}</span>
                        {m.is_active && <span className="text-[8px] bg-white text-black px-1 rounded-sm font-black">ACTIVE</span>}
                      </div>
                      <div className={m.is_active ? 'text-swiss-red font-black' : 'text-white'}>{pct(mx.f1)}</div>
                      <div>{pct(mx.precision)}</div>
                      <div>{pct(mx.pr_auc)}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top Feature Importances */}
            {mlStatus.feature_importance?.length > 0 && (
              <div className="bg-[#0d0d0d] border border-white/15 rounded-2xl p-6 shadow-xl space-y-4">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white">TOP FEATURE ATTRIBUTION</h4>
                  <span className="text-[10px] text-white/40 uppercase">XGBoost temporal feature weights</span>
                </div>
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={mlStatus.feature_importance.slice(0, 6).map((f: any) => ({...f, pct: +(f.importance * 100).toFixed(1)}))}
                      layout="vertical"
                      margin={{ top: 0, right: 20, bottom: 0, left: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#222222" />
                      <XAxis type="number" domain={[0, 100]} tickFormatter={v => `${v}%`} fontSize={10} stroke="#666666" />
                      <YAxis type="category" dataKey="feature" width={140} fontSize={10} stroke="#666666" />
                      <Tooltip formatter={(v: any) => `${v}%`} contentStyle={{ backgroundColor: '#121212', borderColor: '#333333', color: '#ffffff', borderRadius: '8px' }} />
                      <Bar dataKey="pct" fill="#ffffff" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Prediction History Table */}
      <div className="bg-[#0d0d0d] border border-white/15 rounded-2xl p-6 shadow-xl font-mono">
        <div className="flex items-center gap-2 mb-4 border-b border-white/10 pb-3">
          <Clock className="h-4 w-4 text-white" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">CHRONOLOGICAL INFERENCE LOG</h3>
        </div>
        <div className="overflow-x-auto">
          {loadingPredictions ? (
            <div className="h-32 flex items-center justify-center text-white/40 text-xs">Querying inference logs...</div>
          ) : hasPredictions ? (
            <table className="w-full text-left text-xs">
              <thead className="bg-[#141414] text-white/50 text-[10px] uppercase border-b border-white/10">
                <tr>
                  <th className="p-3">TIMESTAMP</th>
                  <th className="p-3">PREDICTION</th>
                  <th className="p-3">CONFIDENCE</th>
                  <th className="p-3">RISK</th>
                  <th className="p-3">HEALTH</th>
                  <th className="p-3">ANOMALY</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {predictions.map((p: any) => (
                  <tr key={p.id} className="hover:bg-white/[0.03] transition-colors">
                    <td className="p-3 text-white/50">
                      {new Date(p.timestamp_utc).toLocaleTimeString()}
                    </td>
                    <td className="p-3 font-bold text-white">{p.prediction || 'UNKNOWN'}</td>
                    <td className="p-3 text-white/80">
                      {p.prediction_probability != null ? (p.prediction_probability * 100).toFixed(1) + '%' : '-'}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-sm text-[10px] font-black uppercase ${
                        p.risk_level === 'CRITICAL' || p.risk_level === 'HIGH' ? 'bg-swiss-red text-white' : 'bg-white/20 text-white'
                      }`}>
                        {p.risk_level || 'LOW'}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-white">
                      {p.health_score != null ? `${p.health_score}/100` : '-'}
                    </td>
                    <td className="p-3">
                      {p.anomaly_label === 'YES' ? (
                        <span className="text-swiss-red font-black text-[10px] uppercase">DETECTED</span>
                      ) : (
                        <span className="text-white/60 text-[10px] uppercase">NORMAL</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="h-32 flex items-center justify-center text-white/40 text-xs">
              No prediction history recorded.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
