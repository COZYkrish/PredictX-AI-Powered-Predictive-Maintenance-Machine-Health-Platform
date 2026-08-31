'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Activity, Wrench, Calendar, CheckCircle } from 'lucide-react';
import { useDeviceContext } from '@/hooks/use-device';
import { apiClient } from '@/lib/api/client';
import { useAuth } from '@/hooks/use-auth';
import { useState } from 'react';

type MaintenanceRecordOut = any;

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
      <div className="flex h-[60vh] flex-col items-center justify-center space-y-4 text-center font-mono">
        <Activity className="h-12 w-12 text-white/20 animate-pulse" />
        <h2 className="text-lg font-semibold text-white/50 uppercase tracking-widest">No Device Selected</h2>
        <p className="text-xs text-white/40">Select a device from the top navigation to view maintenance schedules.</p>
      </div>
    );
  }

  const canManage = user?.role === 'ADMIN' || user?.role === 'ENGINEER' || user?.role === 'OPERATOR';

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-manrope">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tight text-white font-geist">Maintenance & Service Log</h2>
          <p className="text-xs font-mono text-white/50 uppercase tracking-widest mt-1">
            Hardware lifecycle interventions and scheduled servicing for {selectedDevice?.hostname}
          </p>
        </div>
        {canManage && (
          <button className="rounded-full bg-white text-black font-bold text-xs uppercase tracking-wider px-5 py-2.5 hover:bg-white/90 transition-all flex items-center gap-2 cursor-pointer shadow-lg w-fit">
            <Wrench className="h-3.5 w-3.5" />
            <span>SCHEDULE INTERVENTION</span>
          </button>
        )}
      </div>

      {error && (
        <div className="bg-swiss-red/20 text-white p-4 rounded-xl text-xs font-mono border border-swiss-red/40">
          {error}
        </div>
      )}

      <div className="bg-[#0d0d0d] border border-white/15 rounded-2xl shadow-xl overflow-hidden font-mono">
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">HARDWARE SERVICE DOCKET</h3>
            <span className="text-[10px] text-white/40 uppercase">Tracking past and queued maintenance jobs</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#141414] text-white/50 text-[10px] uppercase border-b border-white/10">
              <tr>
                <th className="py-3 px-5">SERVICE TITLE</th>
                <th className="py-3 px-5">DESCRIPTION</th>
                <th className="py-3 px-5">SCHEDULED DATE</th>
                <th className="py-3 px-5">STATUS</th>
                <th className="py-3 px-5 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-white/40">
                    Loading maintenance logs...
                  </td>
                </tr>
              ) : records && records.length > 0 ? (
                records.map((record) => (
                  <tr key={record.id} className="hover:bg-white/[0.03] transition-colors">
                    <td className="py-4 px-5">
                      <div className="flex flex-col">
                        <span className="font-bold text-white text-sm">{record.title}</span>
                        {record.priority && (
                          <span className="text-[9px] text-swiss-red font-bold uppercase mt-0.5">{record.priority} PRIORITY</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-5 text-white/80 max-w-xs truncate">{record.description}</td>
                    <td className="py-4 px-5 text-white/60">
                      {record.scheduled_at ? new Date(record.scheduled_at).toLocaleDateString() : 'Unscheduled'}
                    </td>
                    <td className="py-4 px-5">
                      <span className={`px-2.5 py-1 rounded-sm text-[10px] font-bold uppercase ${
                        record.status === 'COMPLETED'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-white/10 text-white border border-white/15'
                      }`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-right">
                      {record.status !== 'COMPLETED' && canManage && (
                        <button
                          onClick={() => completeMutation.mutate(record.id)}
                          disabled={completeMutation.isPending}
                          className="rounded-full bg-white/10 hover:bg-white text-white hover:text-black px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors border border-white/15 inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <CheckCircle className="h-3 w-3" />
                          <span>MARK DONE</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-white/40">
                    <CheckCircle className="h-10 w-10 text-white/20 mx-auto mb-2" />
                    <p className="font-bold text-white">No Maintenance Records</p>
                    <p className="text-xs text-white/50 mt-1">Hardware operating in verified equilibrium.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
