'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Activity, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { useDeviceContext } from '@/hooks/use-device';
import { apiClient } from '@/lib/api/client';
import { components } from '@/types/api';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';

type PredictionOut = any;

export default function PredictPage() {
  const { selectedDeviceId, selectedDevice } = useDeviceContext();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  // Fetch recent predictions
  const { data: predictions, isLoading: loadingPredictions } = useQuery({
    queryKey: ['predictions', selectedDeviceId],
    queryFn: async () => {
      if (!selectedDeviceId) return [];
      const res = await apiClient.get<PredictionOut[]>(`/api/v1/predictions/device/${selectedDeviceId}?limit=5`);
      return res.data;
    },
    enabled: !!selectedDeviceId,
  });

  // Run prediction mutation
  const runPrediction = useMutation({
    mutationFn: async () => {
      if (!selectedDeviceId) throw new Error('No device selected');
      const res = await apiClient.post<PredictionOut>(`/api/v1/predictions/device/${selectedDeviceId}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['predictions', selectedDeviceId] });
      queryClient.invalidateQueries({ queryKey: ['devices', selectedDeviceId] });
      setError(null);
    },
    onError: (err: any) => {
      setError(err.message || 'Failed to run prediction');
    }
  });

  if (!selectedDeviceId) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center space-y-4">
        <Activity className="h-12 w-12 text-muted-foreground opacity-20" />
        <h2 className="text-xl font-medium text-muted-foreground">No Device Selected</h2>
        <p className="text-sm text-muted-foreground">Select a device to view or run predictions.</p>
      </div>
    );
  }

  const latestPrediction = predictions?.[0];
  const canRunPrediction = user?.role === 'ADMIN' || user?.role === 'ENGINEER';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Health Prediction</h2>
          <p className="text-muted-foreground">
            Run on-demand ML predictions for {selectedDevice?.hostname}
          </p>
        </div>
        <Button 
          onClick={() => runPrediction.mutate()} 
          disabled={runPrediction.isPending || !canRunPrediction}
        >
          {runPrediction.isPending ? 'Running ML Engine...' : 'Run New Prediction'}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {!canRunPrediction && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Read Only</AlertTitle>
          <AlertDescription>Your role ({user?.role}) does not permit running new predictions.</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Latest Prediction Results</CardTitle>
            <CardDescription>
              Based on recent telemetry data points.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {loadingPredictions ? (
              <div className="space-y-2">
                <div className="h-4 w-full animate-pulse rounded bg-muted" />
                <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
              </div>
            ) : latestPrediction ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Anomaly Detected</span>
                  <Badge variant={latestPrediction.is_anomaly ? 'destructive' : 'default'} className={!latestPrediction.is_anomaly ? 'bg-healthy' : ''}>
                    {latestPrediction.is_anomaly ? 'Yes' : 'No'}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Risk Score</span>
                  <span className="font-bold">{latestPrediction.risk_score.toFixed(2)}%</span>
                </div>

                {latestPrediction.health_score !== null && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Health Score</span>
                    <span className="font-bold">{latestPrediction.health_score.toFixed(2)}%</span>
                  </div>
                )}

                <div className="space-y-2">
                  <span className="text-sm font-medium text-muted-foreground">Contributing Factors</span>
                  {latestPrediction.features_used && Object.keys(latestPrediction.features_used).length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {Object.keys(latestPrediction.features_used).slice(0, 5).map(feat => (
                        <Badge key={feat} variant="outline" className="text-xs">{feat}</Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No feature importance available</p>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                No predictions have been run for this device yet.
              </div>
            )}
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground border-t bg-muted/50 p-4">
            {latestPrediction 
              ? `Prediction generated at: ${new Date(latestPrediction.created_at).toLocaleString()}` 
              : 'Machine learning model: IsolationForest (Phase 2)'}
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Prediction History</CardTitle>
            <CardDescription>
              Last 5 predictions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {predictions && predictions.length > 0 ? (
              <div className="space-y-4">
                {predictions.map((pred) => (
                  <div key={pred.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-3">
                      {pred.is_anomaly ? (
                        <AlertTriangle className="h-5 w-5 text-critical" />
                      ) : (
                        <CheckCircle2 className="h-5 w-5 text-healthy" />
                      )}
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {pred.is_anomaly ? 'Anomaly Detected' : 'Normal Operation'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(pred.created_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex flex-col">
                      <span className="text-sm font-bold">Risk: {pred.risk_score.toFixed(1)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                No history available.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
