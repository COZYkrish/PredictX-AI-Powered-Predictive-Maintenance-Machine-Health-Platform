'use client';

import { useQuery } from '@tanstack/react-query';
import { Activity, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { useDeviceContext } from '@/hooks/use-device';
import { apiClient } from '@/lib/api/client';
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
      <div className="flex h-[60vh] flex-col items-center justify-center space-y-4 text-center font-mono">
        <Activity className="h-12 w-12 text-white/20 animate-pulse" />
        <h2 className="text-lg font-semibold text-white/50 uppercase tracking-widest">No Device Selected</h2>
        <p className="text-xs text-white/40">Select an active machine from the device dropdown above.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-manrope">
      <div>
        <h2 className="text-2xl font-black uppercase tracking-tight text-white font-geist">Incident & Alert Docket</h2>
        <p className="text-xs font-mono text-white/50 uppercase tracking-widest mt-1">
          Automated diagnostic events, resource pressure breaches, and anomaly detections.
        </p>
      </div>

      <div className="bg-[#0d0d0d] border border-white/15 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <div>
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white">RECORDED INCIDENTS</h3>
            <span className="text-[10px] font-mono text-white/40 uppercase">{issues?.length ?? 0} diagnostic event(s)</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-[#141414] text-white/50 uppercase text-[10px] border-b border-white/10">
              <tr>
                <th className="py-3 px-5">SEVERITY</th>
                <th className="py-3 px-5">ISSUE CONDITION</th>
                <th className="py-3 px-5">OBSERVED VALUE</th>
                <th className="py-3 px-5">DURATION</th>
                <th className="py-3 px-5">STATUS</th>
                <th className="py-3 px-5">DETECTED</th>
                <th className="py-3 px-5 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-white/40">
                    Querying incident database...
                  </td>
                </tr>
              ) : issues && issues.length > 0 ? (
                issues.map((issue) => (
                  <tr key={issue.id} className="hover:bg-white/[0.03] transition-colors">
                    <td className="py-4 px-5">
                      <span className={`px-2 py-0.5 rounded-sm text-[10px] font-black uppercase ${
                        issue.severity === 'CRITICAL' || issue.severity === 'HIGH' 
                          ? 'bg-swiss-red text-white' 
                          : 'bg-white/20 text-white'
                      }`}>
                        {issue.severity}
                      </span>
                    </td>
                    <td className="py-4 px-5 font-bold text-white uppercase text-xs">
                      {issue.issue_type.replace(/_/g, " ")}
                    </td>
                    <td className="py-4 px-5 text-white/80">
                      {issue.current_value != null ? `${issue.current_value.toFixed(1)}%` : 'N/A'}
                    </td>
                    <td className="py-4 px-5 text-white/70">
                      {issue.duration_seconds != null ? `~${issue.duration_seconds}s` : 'N/A'}
                    </td>
                    <td className="py-4 px-5">
                      <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase ${
                        issue.status === 'RESOLVED' 
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                          : 'bg-white/10 text-white border border-white/15'
                      }`}>
                        {issue.status}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-white/50 text-[11px]">
                      {new Date(issue.detected_at).toLocaleTimeString()}
                    </td>
                    <td className="py-4 px-5 text-right">
                      <button
                        onClick={() => router.push(`/alerts/${issue.id}`)}
                        className="rounded-full bg-white/10 hover:bg-white text-white hover:text-black px-3.5 py-1.5 text-xs font-mono font-bold uppercase tracking-wider transition-colors border border-white/15"
                      >
                        INVESTIGATE
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-white/40">
                    <CheckCircle className="h-10 w-10 text-white/20 mx-auto mb-2" />
                    <p className="font-bold text-white">Zero Active Incidents</p>
                    <p className="text-xs text-white/50 mt-1">Operating parameters nominal.</p>
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
