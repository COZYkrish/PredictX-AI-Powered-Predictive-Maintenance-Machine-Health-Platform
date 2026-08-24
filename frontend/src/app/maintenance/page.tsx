'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Activity, Wrench, Calendar, CheckCircle } from 'lucide-react';
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

type MaintenanceRecordOut = any;
type MaintenanceRecordCreate = any;

export default function MaintenancePage() {
  const { selectedDeviceId, selectedDevice } = useDeviceContext();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const { data: records, isLoading } = useQuery({
    queryKey: ['maintenance', selectedDeviceId],
    queryFn: async () => {
      if (!selectedDeviceId) return [];
      const res = await apiClient.get<MaintenanceRecordOut[]>(`/api/v1/maintenance/device/${selectedDeviceId}`);
      return res.data;
    },
    enabled: !!selectedDeviceId,
  });

  const completeMutation = useMutation({
    mutationFn: async (recordId: string) => {
      const res = await apiClient.patch<MaintenanceRecordOut>(`/api/v1/maintenance/${recordId}`, {
        status: 'COMPLETED',
        completed_at: new Date().toISOString()
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance', selectedDeviceId] });
      setError(null);
    },
    onError: (err: any) => {
      setError(err.message || 'Failed to update maintenance record');
    }
  });

  if (!selectedDeviceId) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center space-y-4">
        <Activity className="h-12 w-12 text-muted-foreground opacity-20" />
        <h2 className="text-xl font-medium text-muted-foreground">No Device Selected</h2>
        <p className="text-sm text-muted-foreground">Select a device to view maintenance records.</p>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return <Badge className="bg-healthy text-primary-foreground">Completed</Badge>;
      case 'scheduled': return <Badge className="bg-warning text-primary-foreground">Scheduled</Badge>;
      case 'in_progress': return <Badge className="bg-primary text-primary-foreground">In Progress</Badge>;
      case 'cancelled': return <Badge variant="secondary">Cancelled</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const canManage = user?.role === 'ADMIN' || user?.role === 'ENGINEER' || user?.role === 'OPERATOR';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Maintenance Records</h2>
          <p className="text-muted-foreground">
            Hardware service history for {selectedDevice?.hostname}
          </p>
        </div>
        {canManage && (
          <Button>
            <Wrench className="mr-2 h-4 w-4" /> Schedule Maintenance
          </Button>
        )}
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-md text-sm border border-destructive/20">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Service Log</CardTitle>
          <CardDescription>View upcoming and past maintenance activities.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Scheduled Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      Loading records...
                    </TableCell>
                  </TableRow>
                ) : records && records.length > 0 ? (
                  records.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>{record.title}</span>
                          <span className="text-xs text-muted-foreground">{record.priority ? `${record.priority} PRIORITY` : ''}</span>
                        </div>
                      </TableCell>
                      <TableCell>{record.description}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {record.scheduled_at ? new Date(record.scheduled_at).toLocaleDateString() : 'Unscheduled'}
                      </TableCell>
                      <TableCell>{getStatusBadge(record.status)}</TableCell>
                      <TableCell className="text-right">
                        {record.status !== 'COMPLETED' && canManage && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => completeMutation.mutate(record.id)}
                            disabled={completeMutation.isPending}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" /> Mark Done
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      No maintenance records found.
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
