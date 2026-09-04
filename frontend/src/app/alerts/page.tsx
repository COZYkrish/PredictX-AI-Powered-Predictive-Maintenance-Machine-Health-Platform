'use client';

import { useQuery } from '@tanstack/react-query';
import { Activity, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { useDeviceContext } from '@/hooks/use-device';
import { apiClient } from '@/lib/api/client';
import { useRouter } from 'next/navigation';
import { DitherWave } from '@/components/ui/DitherWave';

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
      <div className="relative min-h-[70vh] flex flex-col items-center justify-center space-y-4 text-center font-mono">
        {/* Dither Wave Ambient Background */}
        <div className="fixed inset-0 pointer-events-auto z-0 overflow-hidden opacity-95">
          <DitherWave
            color1="#080808"
            color2="#ff3000"
            speed={0.8}
            waveFrequency={2.2}
            waveAmplitude={0.55}
            ditherScale={3.5}
            interactive={true}
          />
        </div>

        <div className="relative z-10 bg-black/60 backdrop-blur-2xl border border-white/20 p-8 rounded-3xl shadow-2xl max-w-md">
          <Activity className="h-12 w-12 text-white mx-auto mb-3 animate-pulse" />
          <h2 className="text-lg font-semibold text-white uppercase tracking-widest">No Device Selected</h2>
          <p className="text-xs text-white/70 mt-1">Select an active machine from the device dropdown above.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      
      {/* 🌟 Dither Wave Background from React Bits Pro */}
      <div className="fixed inset-0 pointer-events-auto z-0 overflow-hidden opacity-95">
        <DitherWave
          color1="#080808"
          color2="#ff3000"
          speed={0.8}
          waveFrequency={2.2}
          waveAmplitude={0.55}
          ditherScale={3.5}
          interactive={true}
        />
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 max-w-7xl mx-auto space-y-6 font-manrope">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tight text-white font-geist">Incident & Alert Docket</h2>
          <p className="text-xs font-mono text-white/60 uppercase tracking-widest mt-1">
            Automated diagnostic events, resource pressure breaches, and anomaly detections.
          </p>
        </div>

        <div className="bg-black/60 backdrop-blur-xl border border-white/20 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden">
          <div className="p-6 border-b border-white/10 flex justify-between items-center">
            <div>
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white">RECORDED INCIDENTS</h3>
              <span className="text-[10px] font-mono text-white/50 uppercase">{issues?.length ?? 0} diagnostic event(s)</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-black/50 text-white/60 uppercase text-[10px] border-b border-white/10">
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
                    <td colSpan={7} className="py-8 text-center text-white/50">
                      Querying incident database...
                    </td>
                  </tr>
                ) : issues && issues.length > 0 ? (
                  issues.map((issue) => (
                    <tr key={issue.id} className="hover:bg-white/[0.05] transition-colors">
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
                      <td className="py-4 px-5 text-white/90">
                        {issue.current_value != null ? `${issue.current_value.toFixed(1)}%` : 'N/A'}
                      </td>
                      <td className="py-4 px-5 text-white/80">
                        {issue.duration_seconds != null ? `~${issue.duration_seconds}s` : 'N/A'}
                      </td>
                      <td className="py-4 px-5">
                        <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase ${
                          issue.status === 'RESOLVED' 
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                            : 'bg-white/10 text-white border border-white/20'
                        }`}>
                          {issue.status}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-white/60 text-[11px]">
                        {new Date(issue.detected_at).toLocaleTimeString()}
                      </td>
                      <td className="py-4 px-5 text-right">
                        <button
                          onClick={() => router.push(`/alerts/${issue.id}`)}
                          className="rounded-full bg-white/10 hover:bg-white text-white hover:text-black px-3.5 py-1.5 text-xs font-mono font-bold uppercase tracking-wider transition-colors border border-white/20 shadow-sm"
                        >
                          INVESTIGATE
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-white/50">
                      <CheckCircle className="h-10 w-10 text-white/30 mx-auto mb-2" />
                      <p className="font-bold text-white">Zero Active Incidents</p>
                      <p className="text-xs text-white/60 mt-1">Operating parameters nominal.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
