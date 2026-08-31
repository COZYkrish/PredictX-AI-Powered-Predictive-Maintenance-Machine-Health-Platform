'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Activity, AlertTriangle, CheckCircle2, ShieldAlert,
  Brain, Gauge, Clock, Sparkles, Loader2
} from 'lucide-react';
import { useDeviceContext } from '@/hooks/use-device';
import { apiClient } from '@/lib/api/client';
import { useAuth } from '@/hooks/use-auth';

type PredictionOut = {
  id: string;
  device_id: string;
  timestamp_utc: string;
  model_name?: string;
  model_version?: string;
  prediction?: string;
  prediction_probability?: number;
  risk_level?: string;
  health_score?: number;
  anomaly_label?: string;
  anomaly_score?: number;
  inference_duration_ms?: number;
  created_at: string;
};

type JobOut = {
  id: string;
  status: string;
  error_message?: string;
  model_name?: string;
  model_version?: string;
};

export default function PredictPage() {
  const { selectedDeviceId, selectedDevice } = useDeviceContext();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [pendingJobId, setPendingJobId] = useState<string | null>(null);

  // Fetch recent predictions
  const { data: predictions, isLoading: loadingPredictions } = useQuery({
    queryKey: ['predictions', selectedDeviceId],
    queryFn: async () => {
      if (!selectedDeviceId) return [];
      const res = await apiClient.get<PredictionOut[]>(
        `/api/v1/predictions/device/${selectedDeviceId}?limit=10`
      );
      return res.data;
    },
    enabled: !!selectedDeviceId,
    refetchInterval: pendingJobId ? 3000 : 30000,
  });

  // Poll pending job
  const { data: jobStatus } = useQuery({
    queryKey: ['prediction-job', pendingJobId],
    queryFn: async () => {
      if (!pendingJobId) return null;
      const res = await apiClient.get<JobOut>(`/api/v1/predictions/jobs/${pendingJobId}`);
      return res.data;
    },
    enabled: !!pendingJobId,
    refetchInterval: 2000,
  });

  useEffect(() => {
    if (!jobStatus) return;
    if (jobStatus.status === 'COMPLETED') {
      setPendingJobId(null);
      queryClient.invalidateQueries({ queryKey: ['predictions', selectedDeviceId] });
      queryClient.invalidateQueries({ queryKey: ['devices'] });
    }
    if (jobStatus.status === 'FAILED') {
      setError(`Prediction failed: ${jobStatus.error_message || 'Unknown error'}`);
      setPendingJobId(null);
    }
  }, [jobStatus]);

  const runPrediction = useMutation({
    mutationFn: async () => {
      if (!selectedDeviceId) throw new Error('No device selected');
      const res = await apiClient.post<JobOut>(
        `/api/v1/predictions/device/${selectedDeviceId}`
      );
      return res.data;
    },
    onSuccess: (job) => {
      setPendingJobId(job.id);
      setError(null);
    },
    onError: (err: any) => {
      setError(err.response?.data?.detail || err.message || 'Failed to trigger prediction');
    }
  });

  if (!selectedDeviceId) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center space-y-4 text-center font-mono">
        <Brain className="h-12 w-12 text-white/20 animate-pulse" />
        <h2 className="text-lg font-semibold text-white/50 uppercase tracking-widest">No Device Selected</h2>
        <p className="text-xs text-white/40">Select a device from the top navigation to trigger ML inference.</p>
      </div>
    );
  }

  const latestPrediction = predictions?.[0];
  const canRunPrediction = user?.role === 'ADMIN' || user?.role === 'ENGINEER';
  const isRunning = runPrediction.isPending || (pendingJobId && jobStatus?.status !== 'COMPLETED' && jobStatus?.status !== 'FAILED');

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-manrope">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tight text-white font-geist">Health Prediction Engine</h2>
          <p className="text-xs font-mono text-white/50 uppercase tracking-widest mt-1">
            Real-time inference execution and health score synthesis for {selectedDevice?.hostname}
          </p>
        </div>
        <div className="flex flex-col items-start md:items-end gap-2">
          <button
            onClick={() => runPrediction.mutate()}
            disabled={!!isRunning || !canRunPrediction}
            className="rounded-full bg-white text-black font-bold text-xs uppercase tracking-wider px-6 py-3 hover:bg-white/90 hover:scale-[1.01] transition-all flex items-center gap-2 cursor-pointer shadow-xl disabled:opacity-50"
          >
            {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
            <span>{isRunning ? 'RUNNING INFERENCE...' : 'ANALYZE SYSTEM'}</span>
          </button>
          {!canRunPrediction && (
            <p className="text-[10px] font-mono text-white/40 uppercase">
              Role ({user?.role}) restricted from on-demand inference triggering.
            </p>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-swiss-red/20 text-white p-4 rounded-xl text-xs font-mono border border-swiss-red/40">
          {error}
        </div>
      )}

      {pendingJobId && jobStatus && jobStatus.status !== 'COMPLETED' && jobStatus.status !== 'FAILED' && (
        <div className="bg-white/10 border border-white/20 p-4 rounded-xl font-mono text-xs text-white flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-white" />
          <div>
            <span className="font-bold uppercase block">INFERENCE PIPELINE ENGAGED</span>
            <span className="text-white/60">Processing 48 engineered temporal features across telemetry window...</span>
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Latest Prediction Result */}
        <div className="bg-[#0d0d0d] border border-white/15 rounded-2xl p-6 shadow-xl space-y-5 font-mono">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Gauge className="h-4 w-4 text-white" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">LATEST INFERENCE RESULT</h3>
            </div>
            {latestPrediction && (
              <span className="text-[10px] text-white/40 uppercase">
                {new Date(latestPrediction.timestamp_utc).toLocaleTimeString()}
              </span>
            )}
          </div>

          {loadingPredictions ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-10 w-full animate-pulse rounded-xl bg-white/5" />
              ))}
            </div>
          ) : latestPrediction ? (
            <div className="space-y-3">
              {/* Health Score Tile */}
              <div className="flex items-center justify-between rounded-xl bg-[#141414] border border-white/10 p-4">
                <span className="text-xs font-bold text-white/60 uppercase">SYSTEM HEALTH INDEX</span>
                <span className={`text-3xl font-black ${
                  (latestPrediction.health_score ?? 100) >= 80 ? 'text-white' : 'text-swiss-red'
                }`}>
                  {latestPrediction.health_score != null ? `${latestPrediction.health_score}/100` : 'N/A'}
                </span>
              </div>

              {/* State Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#141414] border border-white/10 p-3.5 rounded-xl">
                  <span className="text-[10px] text-white/40 uppercase block mb-1">SYSTEM STATE</span>
                  <span className="text-sm font-bold text-white uppercase">{latestPrediction.prediction ?? 'HEALTHY'}</span>
                </div>
                <div className="bg-[#141414] border border-white/10 p-3.5 rounded-xl">
                  <span className="text-[10px] text-white/40 uppercase block mb-1">RISK LEVEL</span>
                  <span className={`text-sm font-black uppercase ${
                    latestPrediction.risk_level === 'HIGH' || latestPrediction.risk_level === 'CRITICAL' ? 'text-swiss-red' : 'text-white'
                  }`}>
                    {latestPrediction.risk_level ?? 'LOW'}
                  </span>
                </div>
                <div className="bg-[#141414] border border-white/10 p-3.5 rounded-xl">
                  <span className="text-[10px] text-white/40 uppercase block mb-1">CONFIDENCE</span>
                  <span className="text-sm font-bold text-white">
                    {latestPrediction.prediction_probability != null ? `${(latestPrediction.prediction_probability * 100).toFixed(1)}%` : '100%'}
                  </span>
                </div>
                <div className="bg-[#141414] border border-white/10 p-3.5 rounded-xl">
                  <span className="text-[10px] text-white/40 uppercase block mb-1">ANOMALY STATUS</span>
                  <span className={`text-sm font-bold uppercase ${
                    latestPrediction.anomaly_label === 'YES' ? 'text-swiss-red font-black' : 'text-white'
                  }`}>
                    {latestPrediction.anomaly_label === 'YES' ? 'DETECTED' : 'NORMAL'}
                  </span>
                </div>
              </div>

              <div className="rounded-xl bg-white/[0.03] p-3 text-[11px] text-white/50 border border-white/5 leading-relaxed">
                Inference produced by model <strong>{latestPrediction.model_name ?? 'XGBoost'}</strong> ({latestPrediction.model_version ?? 'v1.0.0'}) across temporal features.
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-10 text-white/40">
              <Brain className="h-10 w-10 opacity-20" />
              <p className="text-xs">No predictions recorded yet.</p>
              <p className="text-[10px] text-center max-w-xs text-white/30">
                Click &ldquo;Analyze System&rdquo; to trigger dual ML inference on node telemetry.
              </p>
            </div>
          )}
        </div>

        {/* Prediction History */}
        <div className="bg-[#0d0d0d] border border-white/15 rounded-2xl p-6 shadow-xl space-y-4 font-mono">
          <div className="flex items-center gap-2 border-b border-white/10 pb-3">
            <Clock className="h-4 w-4 text-white" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">INFERENCE LOG</h3>
          </div>
          
          {predictions && predictions.length > 0 ? (
            <div className="space-y-2">
              {predictions.map((pred) => (
                <div
                  key={pred.id}
                  className="flex items-center justify-between rounded-xl bg-[#141414] border border-white/10 p-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <Activity className="h-4 w-4 text-white/60" />
                    <div>
                      <span className="font-bold text-white uppercase block">{pred.prediction ?? 'HEALTHY'}</span>
                      <span className="text-[10px] text-white/40">
                        {new Date(pred.timestamp_utc).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {pred.health_score != null && (
                      <span className="text-xs font-bold text-white/80">
                        {pred.health_score}/100
                      </span>
                    )}
                    <span className={`px-2 py-0.5 rounded-sm text-[9px] font-black uppercase ${
                      pred.risk_level === 'CRITICAL' || pred.risk_level === 'HIGH' ? 'bg-swiss-red text-white' : 'bg-white/15 text-white'
                    }`}>
                      {pred.risk_level ?? 'LOW'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-[200px] items-center justify-center text-white/40 text-xs">
              No prediction history available.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
