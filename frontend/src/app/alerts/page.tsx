'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Activity, ShieldAlert, CheckCircle, Clock } from 'lucide-react';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useState } from 'react';

type AlertOut = components['schemas']['AlertOut'];

export default function AlertsPage() {
  const { selectedDeviceId, selectedDevice } = useDeviceContext();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [ackError, setAckError] = useState<string | null>(null);

  const { data: alerts, isLoading } = useQuery({
    queryKey: ['alerts', selectedDeviceId],
    queryFn: async () => {
      if (!selectedDeviceId) return [];
      const res = await apiClient.get<AlertOut[]>(`/api/v1/alerts/device/${selectedDeviceId}`);
      return res.data;
    },
    enabled: !!selectedDeviceId,
  });

  const ackMutation = useMutation({
    mutationFn: async (alertId: string) => {
      const res = await apiClient.post<AlertOut>(`/api/v1/alerts/${alertId}/acknowledge`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts', selectedDeviceId] });
      setAckError(null);
    },
    onError: (err: any) => {
      setAckError(err.message || 'Failed to acknowledge alert');
    }
  });

  if (!selectedDeviceId) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center space-y-4">
        <Activity className="h-12 w-12 text-muted-foreground opacity-20" />
        <h2 className="text-xl font-medium text-muted-foreground">No Device Selected</h2>
        <p className="text-sm text-muted-foreground">Select a device to view its alerts.</p>
      </div>
    );
  }

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'bg-critical text-primary-foreground';
      case 'high': return 'bg-high-risk text-primary-foreground';
      case 'medium': return 'bg-warning text-primary-foreground';
      case 'low': return 'bg-neutral text-primary-foreground';
      default: return 'bg-neutral text-primary-foreground';
    }
  };

  const canAck = user?.role === 'ADMIN' || user?.role === 'ENGINEER' || user?.role === 'OPERATOR';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">System Alerts</h2>
          <p className="text-muted-foreground">
            Active and historical alerts for {selectedDevice?.hostname}
          </p>
        </div>
      </div>

      {ackError && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-md text-sm border border-destructive/20">
          {ackError}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Alerts Log</CardTitle>
          <CardDescription>Review system warnings and ML anomalies.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Severity</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      Loading alerts...
                    </TableCell>
                  </TableRow>
                ) : alerts && alerts.length > 0 ? (
                  alerts.map((alert) => (
                    <TableRow key={alert.id}>
                      <TableCell>
                        <Badge className={getSeverityColor(alert.severity)}>
                          {alert.severity}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{alert.message}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(alert.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {alert.is_acknowledged ? (
                          <span className="flex items-center text-xs text-healthy">
                            <CheckCircle className="mr-1 h-3 w-3" /> Acknowledged
                          </span>
                        ) : (
                          <span className="flex items-center text-xs text-warning">
                            <Clock className="mr-1 h-3 w-3" /> Pending
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {!alert.is_acknowledged && canAck && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => ackMutation.mutate(alert.id)}
                            disabled={ackMutation.isPending}
                          >
                            Acknowledge
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      No alerts found for this device.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
