'use client';

import { Monitor, Wifi, WifiOff, Clock } from 'lucide-react';
import { useDeviceContext } from '@/hooks/use-device';

export default function DevicesPage() {
  const { devices, selectedDeviceId, setSelectedDeviceId, isLoading } = useDeviceContext();

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-manrope">
      <div>
        <h2 className="text-2xl font-black uppercase tracking-tight text-white font-geist">Device Fleet Inventory</h2>
        <p className="text-xs font-mono text-white/50 uppercase tracking-widest mt-1">
          Connected Windows nodes actively streaming telemetry to inference engine.
        </p>
      </div>

      <div className="bg-[#0d0d0d] border border-white/15 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <div>
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white">ACTIVE NODES</h3>
            <span className="text-[10px] font-mono text-white/40 uppercase">{devices?.length ?? 0} node(s) registered</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-[#141414] text-white/50 uppercase text-[10px] border-b border-white/10">
              <tr>
                <th className="py-3 px-5">DEVICE</th>
                <th className="py-3 px-5">OPERATING SYSTEM</th>
                <th className="py-3 px-5">ARCHITECTURE</th>
                <th className="py-3 px-5">STATUS</th>
                <th className="py-3 px-5">HEALTH INDEX</th>
                <th className="py-3 px-5">LAST SEEN</th>
                <th className="py-3 px-5 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-white/40">
                    Scanning fleet telemetry...
                  </td>
                </tr>
              ) : devices && devices.length > 0 ? (
                devices.map((device: any) => (
                  <tr
                    key={device.device_id}
                    className={`transition-colors ${selectedDeviceId === device.device_id ? 'bg-white/10' : 'hover:bg-white/[0.03]'}`}
                  >
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <Monitor className="h-4 w-4 text-white/60 shrink-0" />
                        <div className="flex flex-col">
                          <span className="font-bold text-white text-sm">{device.hostname ?? 'Unknown'}</span>
                          <span className="text-[10px] text-white/40 truncate max-w-[140px]">
                            {device.device_id}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-5 text-white/80">
                      <div>{device.operating_system ?? 'Windows'}</div>
                      {device.os_version && (
                        <div className="text-[10px] text-white/40">{device.os_version}</div>
                      )}
                    </td>

                    <td className="py-4 px-5 text-white/70">
                      {device.architecture ?? 'x86_64'}
                    </td>

                    <td className="py-4 px-5">
                      {device.is_online ? (
                        <div className="flex items-center gap-1.5 text-white">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          <span className="font-bold text-[11px] uppercase">Online</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-white/40">
                          <WifiOff className="h-3.5 w-3.5" />
                          <span className="text-[11px] uppercase">Offline</span>
                        </div>
                      )}
                    </td>

                    <td className="py-4 px-5">
                      {device.health_score != null ? (
                        <span className={`px-2.5 py-1 rounded-sm text-[11px] font-black uppercase ${
                          device.health_score >= 80 ? 'bg-white text-black' : 'bg-swiss-red text-white'
                        }`}>
                          {device.health_score}/100
                        </span>
                      ) : (
                        <span className="text-[10px] text-white/40">CALIBRATING</span>
                      )}
                    </td>

                    <td className="py-4 px-5 text-white/50 text-[11px]">
                      {device.last_seen_at
                        ? new Date(device.last_seen_at).toLocaleTimeString()
                        : 'Never'}
                    </td>

                    <td className="py-4 px-5 text-right">
                      <button
                        onClick={() => setSelectedDeviceId(device.device_id)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${
                          selectedDeviceId === device.device_id
                            ? 'bg-white text-black font-black'
                            : 'bg-white/10 hover:bg-white text-white hover:text-black border border-white/15'
                        }`}
                      >
                        {selectedDeviceId === device.device_id ? 'Selected' : 'Select'}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-white/40">
                    No devices detected. Install the PredictX Windows agent to begin streaming.
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
