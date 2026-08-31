"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiClient } from "@/lib/api/client";
import { 
  AlertTriangle, CheckCircle, Clock, Cpu, HardDrive, 
  Activity, ArrowLeft, Loader2, Info, List
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Issue {
  id: string;
  device_id?: string;
  issue_type: string;
  severity: string;
  status: string;
  current_value?: number;
  threshold?: number;
  duration_seconds?: number;
  baseline_value?: number;
  explanation?: string;
  likely_causes?: string[];
  evidence_level?: string;
  recommendation?: string;
  verification_target?: number;
  verification_metric?: string;
  verification_operator?: string;
  verification_duration_seconds?: number;
  detected_at: string;
  resolution_duration_seconds?: number;
}

export default function IssueInvestigationPage() {
  const params = useParams();
  const router = useRouter();
  const [issue, setIssue] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [processes, setProcesses] = useState<any[]>([]);
  const [processesLoading, setProcessesLoading] = useState(false);

  const fetchIssue = async () => {
    try {
      const res = await apiClient.get(`/api/v1/issues/${params.id}`);
      setIssue(res.data);
    } catch (err) {
      console.error("Failed to load issue", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssue();
    // Poll if in VERIFYING state
    const interval = setInterval(() => {
      if (issue?.status === "VERIFYING") {
        fetchIssue();
        setElapsed(prev => prev + 1);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [params.id, issue?.status]);

  const handleAction = async (action: string) => {
    setActionLoading(true);
    try {
      await apiClient.post(`/api/v1/issues/${params.id}/action`, { action });
      setElapsed(0);
      await fetchIssue();
    } catch (err) {
      console.error(`Failed to ${action} issue`, err);
    } finally {
      setActionLoading(false);
    }
  };

  const fetchTopProcesses = async () => {
    if (!issue?.device_id) return;
    setProcessesLoading(true);
    try {
      const sort = issue.issue_type === "HIGH_CPU_USAGE" ? "cpu" : "memory";
      const res = await apiClient.get(`/api/v1/devices/${issue.device_id}/processes/top?sort=${sort}`);
      setProcesses(res.data.processes || []);
    } catch (err) {
      console.error("Failed to load top processes", err);
    } finally {
      setProcessesLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh] font-mono text-white/50 text-xs">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        LOADING DIAGNOSTIC DOSSIER...
      </div>
    );
  }

  if (!issue) {
    return <div className="p-8 text-white font-mono text-xs">Issue not found.</div>;
  }

  const isResolved = issue.status === "RESOLVED";
  const isVerifying = issue.status === "VERIFYING";
  const isPersisting = issue.status === "PERSISTING" || issue.status === "ESCALATED";

  return (
    <div className="max-w-5xl mx-auto space-y-6 text-[#fafafa] font-manrope">
      <button 
        className="flex items-center gap-2 text-xs font-mono font-bold text-white/50 hover:text-white uppercase tracking-wider transition-colors" 
        onClick={() => router.push("/alerts")}
      >
        <ArrowLeft className="w-4 h-4" />
        <span>BACK TO INCIDENT DOCKET</span>
      </button>

      {isResolved && (
        <div className="bg-emerald-950/40 border border-emerald-500/40 p-6 rounded-2xl flex items-start space-x-4 shadow-xl">
          <CheckCircle className="w-7 h-7 text-emerald-400 mt-1 shrink-0" />
          <div>
            <h2 className="text-base font-bold font-mono text-emerald-400 uppercase tracking-wider mb-1">INCIDENT RESOLVED</h2>
            <p className="text-xs text-white/70 mb-3">
              The automated verification pipeline confirmed telemetry stability within threshold boundaries. Health index recalculated.
            </p>
            <div className="bg-black/50 p-3 rounded-xl border border-white/10 font-mono text-xs text-white/80">
              <span className="text-white/40 block text-[10px]">RESOLUTION DURATION</span>
              <span className="font-bold text-emerald-400">{issue.resolution_duration_seconds} seconds verified</span>
            </div>
          </div>
        </div>
      )}

      {isPersisting && (
        <div className="bg-swiss-red/15 border border-swiss-red/40 p-6 rounded-2xl flex items-start space-x-4 shadow-xl">
          <AlertTriangle className="w-7 h-7 text-swiss-red mt-1 shrink-0" />
          <div className="space-y-3">
            <div>
              <h2 className="text-base font-bold font-mono text-swiss-red uppercase tracking-wider mb-1">INCIDENT PERSISTS</h2>
              <p className="text-xs text-white/80">
                The verification target was not sustained within the required test window. 
                {issue.status === "ESCALATED" && " This incident has been escalated to Tier-2 response."}
              </p>
            </div>
            {!isResolved && issue.status !== "ESCALATED" && (
              <div className="flex space-x-3 pt-1">
                <button 
                  onClick={() => handleAction("VERIFY")} 
                  disabled={actionLoading}
                  className="rounded-full bg-white text-black font-bold text-xs uppercase px-4 py-2 hover:bg-white/90 transition-all cursor-pointer"
                >
                  RETRY VERIFICATION
                </button>
                <button 
                  onClick={() => handleAction("DISMISS")}
                  disabled={actionLoading}
                  className="rounded-full bg-white/10 text-white font-bold text-xs uppercase px-4 py-2 hover:bg-white/20 transition-all border border-white/15 cursor-pointer"
                >
                  DISMISS
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white uppercase font-geist">
            {issue.issue_type.replace(/_/g, " ")}
          </h1>
          <p className="text-xs font-mono text-white/50 uppercase tracking-widest mt-1">Detected at {new Date(issue.detected_at).toLocaleString()}</p>
        </div>
        <div className={`px-4 py-1.5 rounded-full font-mono text-xs font-black uppercase tracking-wider w-fit ${
          issue.severity === 'CRITICAL' || issue.severity === 'HIGH' ? 'bg-swiss-red text-white' : 'bg-white/20 text-white'
        }`}>
          {issue.severity} SEVERITY
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#0d0d0d] border border-white/15 p-6 rounded-2xl shadow-xl">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-white flex items-center mb-4">
              <Activity className="w-4 h-4 mr-2 text-white" />
              DIAGNOSTIC EVIDENCE DOSSIER
            </h2>
            <div className="whitespace-pre-wrap text-white/90 font-mono text-xs bg-[#141414] p-4 rounded-xl border border-white/10 leading-relaxed">
              {issue.explanation}
            </div>
            
            {issue.likely_causes && issue.likely_causes.length > 0 && (
              <div className="mt-6">
                <h3 className="text-[10px] font-mono font-bold text-white/50 mb-3 uppercase tracking-widest">LIKELY ROOT CAUSES</h3>
                <ul className="space-y-2">
                  {issue.likely_causes.map((cause, idx) => (
                    <li key={idx} className="flex items-start text-xs text-white/80 font-mono">
                      <span className="text-swiss-red mr-2 font-bold">›</span>
                      <span>{cause}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {issue.evidence_level && (
              <div className="mt-6 pt-5 border-t border-white/10">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-white/50 uppercase">CONFIDENCE LEVEL</span>
                  <span className="font-bold text-white uppercase bg-white/10 px-2.5 py-1 rounded-sm">
                    {issue.evidence_level.replace(/_/g, " ")}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="bg-[#0d0d0d] border border-white/15 p-6 rounded-2xl shadow-xl">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-white mb-4">ACTIONABLE REMEDIATION PROTOCOL</h2>
            <div className="mb-6 space-y-2 font-mono text-xs">
              {issue.recommendation ? (
                <div className="text-white/80 leading-relaxed whitespace-pre-wrap bg-[#141414] p-4 rounded-xl border border-white/10">
                  {issue.recommendation}
                </div>
              ) : (
                <p className="text-white/40 text-xs font-mono">No recommendation available.</p>
              )}
            </div>

            {(issue.issue_type === "HIGH_CPU_USAGE" || issue.issue_type === "MEMORY_PRESSURE") && (
              <Dialog>
                <DialogTrigger asChild>
                  <button 
                    onClick={fetchTopProcesses} 
                    className="w-full rounded-full bg-white/10 hover:bg-white text-white hover:text-black border border-white/15 py-3 text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <List className="w-4 h-4" />
                    <span>VIEW TOP {issue.issue_type === "HIGH_CPU_USAGE" ? "CPU" : "MEMORY"} PROCESS FOOTPRINT</span>
                  </button>
                </DialogTrigger>
                <DialogContent className="bg-[#121212] border border-white/20 text-white sm:max-w-2xl font-mono">
                  <DialogHeader>
                    <DialogTitle className="text-sm font-bold uppercase tracking-wider text-white">Top {issue.issue_type === "HIGH_CPU_USAGE" ? "CPU" : "Memory"} Consumers</DialogTitle>
                  </DialogHeader>
                  <div className="mt-4">
                    {processesLoading ? (
                      <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-white" /></div>
                    ) : processes.length > 0 ? (
                      <div className="space-y-1.5">
                        <div className="grid grid-cols-4 gap-4 px-4 py-2 bg-[#181818] rounded-lg text-[10px] font-bold text-white/50 uppercase">
                          <div className="col-span-2">PROCESS NAME</div>
                          <div>PID</div>
                          <div>{issue.issue_type === "HIGH_CPU_USAGE" ? "CPU %" : "MEM %"}</div>
                        </div>
                        {processes.map((p, idx) => (
                          <div key={idx} className="grid grid-cols-4 gap-4 px-4 py-2.5 bg-white/[0.03] rounded-lg text-xs items-center border border-white/5">
                            <div className="col-span-2 font-bold truncate text-white">{p.process_name}</div>
                            <div className="text-white/50">{p.pid}</div>
                            <div className="font-bold text-swiss-red">{issue.issue_type === "HIGH_CPU_USAGE" ? p.cpu_percent.toFixed(1) : p.memory_percent.toFixed(1)}%</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center p-8 text-white/40 text-xs">Process telemetry unavailable on node.</div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-[#0d0d0d] border border-white/15 p-6 rounded-2xl shadow-xl font-mono">
            <h3 className="text-[10px] font-bold text-white/50 mb-4 uppercase tracking-widest">STATE SNAPSHOT</h3>
            <div className="space-y-4">
              <div className="bg-[#141414] p-3 rounded-xl border border-white/5">
                <span className="text-[10px] text-white/40 block mb-1">OBSERVED VALUE</span>
                <span className="text-3xl font-black text-swiss-red">{issue.current_value?.toFixed(1) || 'N/A'}%</span>
              </div>
              <div className="bg-[#141414] p-3 rounded-xl border border-white/5">
                <span className="text-[10px] text-white/40 block mb-1">THRESHOLD</span>
                <span className="text-xl font-bold text-white">{issue.threshold}%</span>
              </div>
              <div className="bg-[#141414] p-3 rounded-xl border border-white/5">
                <span className="text-[10px] text-white/40 block mb-1">DURATION</span>
                <span className="text-xl font-bold text-white">~{issue.duration_seconds} seconds</span>
              </div>
            </div>
          </div>

          <div className="bg-[#0d0d0d] border border-white/15 p-6 rounded-2xl shadow-xl font-mono">
            <h3 className="text-[10px] font-bold text-white/50 mb-4 uppercase tracking-widest">VERIFICATION GATE</h3>
            
            {issue.verification_target !== null ? (
              <div className="space-y-4">
                <div className="bg-[#141414] p-3 rounded-xl border border-white/5">
                  <span className="text-[10px] text-white/40 block mb-1">VERIFICATION TARGET</span>
                  <span className="text-sm font-bold text-white">
                    {issue.verification_metric} {issue.verification_operator} {issue.verification_target}
                  </span>
                </div>
                <div className="bg-[#141414] p-3 rounded-xl border border-white/5">
                  <span className="text-[10px] text-white/40 block mb-1">STABILITY WINDOW</span>
                  <span className="text-sm font-bold text-white">{issue.verification_duration_seconds} seconds</span>
                </div>
                
                {isVerifying && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="flex justify-between text-xs mb-2">
                      <span className="text-white font-bold">Verifying telemetry...</span>
                      <span className="text-white font-bold">{elapsed} / {issue.verification_duration_seconds}s</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-white h-2 rounded-full transition-all duration-1000 ease-linear shadow-[0_0_8px_rgba(255,255,255,0.8)]"
                        style={{ width: `${Math.min(100, (elapsed / (issue.verification_duration_seconds || 1)) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                {!isResolved && !isVerifying && issue.status !== "ESCALATED" && (
                  <button 
                    className="w-full mt-4 rounded-full bg-white text-black font-bold text-xs uppercase tracking-wider py-3.5 hover:bg-white/90 transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                    onClick={() => handleAction("VERIFY")}
                    disabled={actionLoading}
                  >
                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    START VERIFICATION
                  </button>
                )}
              </div>
            ) : (
              <div className="text-xs text-white/40">No verification target defined.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
