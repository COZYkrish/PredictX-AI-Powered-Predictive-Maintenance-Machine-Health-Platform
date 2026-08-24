'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Activity, AlertTriangle, CheckCircle2, Info, ShieldAlert,
  Brain, Gauge, TrendingUp, Clock, Cpu, MemoryStick
} from 'lucide-react';
import { useDeviceContext } from '@/hooks/use-device';
import { apiClient } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';

type PredictionOut = {
  id: string;
  device_id: string;
  timestamp_utc: string;
  model_name?: string;
  model_version?: string;
  prediction?: string;        // "HEALTHY" | "WARNING" | "CRITICAL"
  prediction_probability?: number;
  risk_level?: string;        // "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
  health_score?: number;
  anomaly_label?: string;     // "YES" | "NO" | "UNAVAILABLE" | "ERROR"
  anomaly_score?: number;
  inference_duration_ms?: number;
  created_at: string;
};

type JobOut = {
  id: string;
  status: string;             // PENDING | PROCESSING | COMPLETED | FAILED
  error_message?: string;
  model_name?: string;
  model_version?: string;
};

const RISK_COLORS: Record<string, string> = {
  LOW: 'bg-green-100 text-green-800 border-green-300',
  MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  HIGH: 'bg-orange-100 text-orange-800 border-orange-300',
  CRITICAL: 'bg-red-100 text-red-800 border-red-300',
};

const PRED_ICONS: Record<string, React.ReactNode> = {
  HEALTHY: <CheckCircle2 className="h-5 w-5 text-green-500" />,
  WARNING: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
  CRITICAL: <ShieldAlert className="h-5 w-5 text-red-500" />,
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

  // When job completes, clear pendingJobId and refresh
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

  // Trigger on-demand prediction
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
      <div className="flex h-[50vh] flex-col items-center justify-center space-y-4">
        <Brain className="h-12 w-12 text-muted-foreground opacity-20" />
        <h2 className="text-xl font-medium text-muted-foreground">No Device Selected</h2>
        <p className="text-sm text-muted-foreground">Select a device to view or run predictions.</p>
      </div>
    );
  }

  const latestPrediction = predictions?.[0];
  const canRunPrediction = user?.role === 'ADMIN' || user?.role === 'ENGINEER';
  const isRunning = runPrediction.isPending || (pendingJobId && jobStatus?.status !== 'COMPLETED' && jobStatus?.status !== 'FAILED');

  const getJobStatusText = () => {
    if (!pendingJobId) return null;
    if (!jobStatus) return 'PENDING...';
    return jobStatus.status === 'PROCESSING' ? 'PROCESSING — Running ML inference...' : jobStatus.status;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Health Prediction</h2>
          <p className="text-muted-foreground">
            AI-powered system analysis for <strong>{selectedDevice?.hostname}</strong>
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Button
            onClick={() => runPrediction.mutate()}
            disabled={!!isRunning || !canRunPrediction}
            size="lg"
          >
            <Brain className="mr-2 h-4 w-4" />
            {isRunning ? getJobStatusText() : 'Analyze System'}
          </Button>
          {!canRunPrediction && (
            <p className="text-xs text-muted-foreground">
              Role <strong>{user?.role}</strong> cannot trigger predictions.
            </p>
          )}
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Prediction Failed</AlertTitle>
          <AlertDescription className="whitespace-pre-wrap">{error}</AlertDescription>
        </Alert>
      )}

      {pendingJobId && jobStatus && jobStatus.status !== 'COMPLETED' && jobStatus.status !== 'FAILED' && (
        <Alert>
          <Activity className="h-4 w-4 animate-spin" />
          <AlertTitle>Analysis In Progress</AlertTitle>
          <AlertDescription>
            Job {pendingJobId.slice(0, 8)}... — Status: <strong>{jobStatus.status}</strong>
            <br />
            Running real-time feature engineering and ML inference on your telemetry history...
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Latest Prediction Result */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gauge className="h-5 w-5" />
              Latest Prediction
            </CardTitle>
            <CardDescription>
              {latestPrediction
                ? `Generated at ${new Date(latestPrediction.timestamp_utc).toLocaleString()}`
                : 'No predictions yet for this device'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingPredictions ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-4 w-full animate-pulse rounded bg-muted" />
                ))}
              </div>
            ) : latestPrediction ? (
              <>
                {/* Health Score */}
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-2">
                    <Gauge className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Health Score</span>
                  </div>
                  <span className="text-2xl font-bold">
                    {latestPrediction.health_score != null
                      ? `${latestPrediction.health_score}/100`
                      : 'N/A'}
                  </span>
                </div>

                {/* Prediction */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">System State</span>
                  <div className="flex items-center gap-2">
                    {PRED_ICONS[latestPrediction.prediction || ''] ?? <Activity className="h-5 w-5" />}
                    <span className="font-semibold">{latestPrediction.prediction ?? 'UNKNOWN'}</span>
                  </div>
                </div>

                {/* Risk */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Risk Level</span>
                  <Badge
                    variant="outline"
                    className={RISK_COLORS[latestPrediction.risk_level || 'LOW']}
                  >
                    {latestPrediction.risk_level ?? 'UNKNOWN'}
                  </Badge>
                </div>

                {/* Probability */}
                {latestPrediction.prediction_probability != null && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Confidence</span>
                    <span className="font-mono text-sm">
                      {(latestPrediction.prediction_probability * 100).toFixed(1)}%
                    </span>
                  </div>
                )}

                {/* Anomaly */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Anomaly Status</span>
                  {latestPrediction.anomaly_label === 'YES' ? (
                    <Badge variant="destructive">DETECTED</Badge>
                  ) : latestPrediction.anomaly_label === 'NO' ? (
                    <Badge className="bg-green-100 text-green-800 border-green-300 border">
                      NORMAL
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {latestPrediction.anomaly_label ?? 'UNAVAILABLE'}
                    </span>
                  )}
                </div>

                {/* Explanation note */}
                <div className="rounded-md bg-muted/30 p-3 text-xs text-muted-foreground border">
                  <Info className="inline h-3 w-3 mr-1" />
                  This result was produced by the <strong>{latestPrediction.model_name ?? 'ML'}</strong>{' '}
                  model ({latestPrediction.model_version ?? 'v?'}).
                  Detailed SHAP explanations are not available for this model version.
                  The prediction is based on CPU, memory, disk, network and historical trend features.
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-3 py-10 text-muted-foreground">
                <Brain className="h-10 w-10 opacity-20" />
                <p className="text-sm">No predictions have been run yet.</p>
                <p className="text-xs text-center max-w-xs">
                  Click &ldquo;Analyze System&rdquo; to trigger a real ML inference.
                  At least 70 seconds of telemetry history is required.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Prediction History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Prediction History
            </CardTitle>
            <CardDescription>Last 10 predictions</CardDescription>
          </CardHeader>
          <CardContent>
            {predictions && predictions.length > 0 ? (
              <div className="space-y-2">
                {predictions.map((pred) => (
                  <div
                    key={pred.id}
                    className="flex items-center justify-between rounded-lg border p-2.5 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      {PRED_ICONS[pred.prediction || ''] ?? <Activity className="h-4 w-4" />}
                      <div className="flex flex-col">
                        <span className="font-medium">{pred.prediction ?? 'UNKNOWN'}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(pred.timestamp_utc).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {pred.health_score != null && (
                        <span className="text-xs text-muted-foreground">
                          H:{pred.health_score}
                        </span>
                      )}
                      <Badge
                        variant="outline"
                        className={`text-xs ${RISK_COLORS[pred.risk_level || 'LOW']}`}
                      >
                        {pred.risk_level ?? 'N/A'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                No prediction history available.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
