'use client';

import { useQuery } from '@tanstack/react-query';
import { Activity, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { useDeviceContext } from '@/hooks/use-device';
import { apiClient } from '@/lib/api/client';
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
import { useRouter } from 'next/navigation';

type Issue = {
  id: string;
  issue_type: string;
  severity: string;
  status: string;
  current_value?: number;
  duration_seconds?: number;
  explanation?: string;
  detected_at: string;
};

export default function AlertsPage() {
  const { selectedDeviceId } = useDeviceContext();
  const router = useRouter();

  const { data: issues, isLoading } = useQuery({
    queryKey: ['issues', selectedDeviceId],
    queryFn: async () => {
      if (!selectedDeviceId) return [];
      const res = await apiClient.get<Issue[]>(`/api/v1/issues?device_id=${selectedDeviceId}`);
      return res.data;
    },
    enabled: !!selectedDeviceId,
    refetchInterval: 5000,
  });

  if (!selectedDeviceId) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center space-y-4">
        <Activity className="h-12 w-12 text-muted-foreground opacity-20" />
        <h2 className="text-xl font-medium text-muted-foreground">No Device Selected</h2>
        <p className="text-sm text-muted-foreground">Select a device to view its alerts and issues.</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-slate-200">System Issues & Alerts</CardTitle>
          <CardDescription className="text-slate-400">
            Detected diagnostic events, resource pressures, and anomalies.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-slate-800 hover:bg-slate-900/50">
                <TableHead className="text-slate-400">Severity</TableHead>
                <TableHead className="text-slate-400">Issue</TableHead>
                <TableHead className="text-slate-400">Observed Value</TableHead>
                <TableHead className="text-slate-400">Duration</TableHead>
                <TableHead className="text-slate-400">Status</TableHead>
                <TableHead className="text-slate-400">Created</TableHead>
                <TableHead className="text-slate-400 text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow className="border-slate-800">
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Loading issues…
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && issues?.length === 0 && (
                <TableRow className="border-slate-800">
                  <TableCell colSpan={7} className="text-center py-12">
                    <div className="flex flex-col items-center space-y-2 text-slate-500">
                      <CheckCircle className="h-10 w-10 text-emerald-900" />
                      <p className="font-medium text-slate-400">No Active Issues</p>
                      <p className="text-sm">The system is not reporting any active diagnostic events for this device.</p>
                      <p className="text-xs text-slate-600">Last checked: {new Date().toLocaleTimeString()}</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {issues?.map((issue) => (
                <TableRow key={issue.id} className="border-slate-800 hover:bg-slate-800/30">
                  <TableCell>
                    <Badge className={
                      issue.severity === 'CRITICAL' ? 'bg-red-900/50 text-red-400 border-red-900' :
                      issue.severity === 'HIGH' ? 'bg-orange-900/50 text-orange-400 border-orange-900' :
                      issue.severity === 'WARNING' ? 'bg-yellow-900/50 text-yellow-400 border-yellow-900' :
                      'bg-slate-800 text-slate-300 border-slate-700'
                    }>
                      {issue.severity}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium text-slate-200 capitalize">
                    {issue.issue_type.replace(/_/g, " ")}
                  </TableCell>
                  <TableCell className="text-slate-300">
                    {issue.current_value != null ? `${issue.current_value.toFixed(1)}%` : 'N/A'}
                  </TableCell>
                  <TableCell className="text-slate-300">
                    {issue.duration_seconds != null ? `~${issue.duration_seconds}s` : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={
                      issue.status === 'RESOLVED' ? 'border-emerald-500/50 text-emerald-400' :
                      issue.status === 'VERIFYING' ? 'border-blue-500/50 text-blue-400' :
                      issue.status === 'PERSISTING' || issue.status === 'ESCALATED' ? 'border-red-500/50 text-red-400' :
                      'border-slate-600 text-slate-300'
                    }>
                      {issue.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-400">
                    {new Date(issue.detected_at).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-slate-700 text-slate-300 hover:text-white"
                      onClick={() => router.push(`/alerts/${issue.id}`)}
                    >
                      INVESTIGATE
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
