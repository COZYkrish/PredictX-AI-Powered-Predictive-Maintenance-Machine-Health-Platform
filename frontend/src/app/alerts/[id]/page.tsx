"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiClient } from "@/lib/api/client";
import { 
  AlertTriangle, CheckCircle, Clock, Cpu, HardDrive, Battery, 
  Activity, ArrowLeft, Loader2, Info, List
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Issue {
  id: string;
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
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!issue) {
    return <div className="p-8 text-white">Issue not found.</div>;
  }

  const isResolved = issue.status === "RESOLVED";
  const isVerifying = issue.status === "VERIFYING";
  const isPersisting = issue.status === "PERSISTING" || issue.status === "ESCALATED";

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6 text-slate-200">
      <Button variant="ghost" className="mb-4 text-slate-400 hover:text-white" onClick={() => router.push("/alerts")}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Alerts
      </Button>

      {isResolved && (
        <div className="bg-emerald-900/40 border border-emerald-500/50 p-6 rounded-lg flex items-start space-x-4">
          <CheckCircle className="w-8 h-8 text-emerald-400 mt-1" />
          <div>
            <h2 className="text-xl font-semibold text-emerald-400 mb-2">ISSUE RESOLVED</h2>
            <p className="text-emerald-200/80 mb-4">
              The system has verified that the issue has been corrected. Health score has been recalculated.
            </p>
            <div className="grid grid-cols-2 gap-4 text-sm bg-emerald-950/50 p-4 rounded">
              <div>
                <span className="text-emerald-500/80 block">Resolution Time</span>
                <span className="text-emerald-100">{issue.resolution_duration_seconds} seconds</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {isPersisting && (
        <div className="bg-red-900/40 border border-red-500/50 p-6 rounded-lg flex items-start space-x-4">
          <AlertTriangle className="w-8 h-8 text-red-400 mt-1" />
          <div>
            <h2 className="text-xl font-semibold text-red-400 mb-2">ISSUE PERSISTS</h2>
            <p className="text-red-200/80 mb-4">
              The verification target was not met within the required duration. 
              {issue.status === "ESCALATED" && " This issue has been escalated."}
            </p>
            {!isResolved && issue.status !== "ESCALATED" && (
              <div className="flex space-x-3">
                <Button 
                  onClick={() => handleAction("VERIFY")} 
                  disabled={actionLoading}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  RETRY VERIFICATION
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleAction("DISMISS")}
                  disabled={actionLoading}
                  className="border-red-500/30 text-red-400 hover:bg-red-950/50"
                >
                  DISMISS
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white capitalize">
            {issue.issue_type.replace(/_/g, " ")}
          </h1>
          <p className="text-slate-400 mt-1">Detected at {new Date(issue.detected_at).toLocaleString()}</p>
        </div>
        <div className={`px-4 py-2 rounded-full font-semibold ${
          issue.severity === 'CRITICAL' ? 'bg-red-900/50 text-red-400' :
          issue.severity === 'HIGH' ? 'bg-orange-900/50 text-orange-400' :
          'bg-yellow-900/50 text-yellow-400'
        }`}>
          {issue.severity} SEVERITY
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
            <h2 className="text-lg font-semibold text-white flex items-center mb-4">
              <Activity className="w-5 h-5 mr-2 text-blue-400" />
              Diagnostic Evidence
            </h2>
            <div className="whitespace-pre-wrap text-slate-300 font-mono text-sm bg-slate-950 p-4 rounded-lg border border-slate-800/50">
              {issue.explanation}
            </div>
            
            {issue.likely_causes && issue.likely_causes.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-slate-400 mb-3 uppercase tracking-wider">Likely Causes</h3>
                <ul className="space-y-2">
                  {issue.likely_causes.map((cause, idx) => (
                    <li key={idx} className="flex items-start">
                      <Info className="w-4 h-4 text-slate-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-200">{cause}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {issue.evidence_level && (
              <div className="mt-6 pt-6 border-t border-slate-800/50">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">Confidence Level</span>
                  <span className={`text-sm font-medium px-2 py-1 rounded bg-slate-800 ${
                    issue.evidence_level === 'CONFIRMED_BY_TELEMETRY' ? 'text-emerald-400' :
                    issue.evidence_level === 'SUPPORTED' ? 'text-blue-400' : 'text-slate-300'
                  }`}>
                    {issue.evidence_level.replace(/_/g, " ")}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
            <h2 className="text-lg font-semibold text-white mb-4">Actionable Recommendation</h2>
            <div className="mb-6 space-y-1">
              {issue.recommendation
                ? issue.recommendation.split('\n').map((line, idx) => {
                    const trimmed = line.trim();
                    // Section headers: ALL CAPS ending with colon
                    if (/^[A-Z0-9 _/-]+:$/.test(trimmed) && trimmed.length > 3) {
                      return (
                        <p key={idx} className="text-blue-400 text-xs font-bold uppercase tracking-widest mt-4 mb-1">
                          {trimmed}
                        </p>
                      );
                    }
                    // Numbered steps: "  1. Do something"
                    if (/^\s*\d+\.\s/.test(line)) {
                      const match = line.match(/^(\s*)(\d+\.\s)(.+)$/);
                      if (match) {
                        return (
                          <p key={idx} className="text-slate-200 text-sm flex items-start">
                            <span className="text-blue-500 font-semibold mr-2 shrink-0">{match[2].trim()}</span>
                            <span>{match[3]}</span>
                          </p>
                        );
                      }
                    }
                    // Bullet lines: "  • Process — CPU 12.3%"
                    if (/^\s*•\s/.test(line) || /^\s*-\s/.test(line)) {
                      return (
                        <p key={idx} className="text-emerald-300 text-sm font-mono pl-4">
                          {trimmed}
                        </p>
                      );
                    }
                    // First line (summary sentence) — slightly larger
                    if (idx === 0 && trimmed.length > 0) {
                      return (
                        <p key={idx} className="text-slate-100 text-sm font-medium">
                          {trimmed}
                        </p>
                      );
                    }
                    // Empty line
                    if (trimmed === '') return <div key={idx} className="h-1" />;
                    // Default
                    return (
                      <p key={idx} className="text-slate-300 text-sm pl-1">
                        {trimmed}
                      </p>
                    );
                  })
                : <p className="text-slate-500 text-sm">No recommendation available.</p>
              }
            </div>

            {(issue.issue_type === "HIGH_CPU_USAGE" || issue.issue_type === "MEMORY_PRESSURE") && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" onClick={fetchTopProcesses} className="w-full bg-slate-950 border-slate-800 text-slate-300 hover:text-white">
                    <List className="w-4 h-4 mr-2" />
                    VIEW TOP {issue.issue_type === "HIGH_CPU_USAGE" ? "CPU" : "MEMORY"} PROCESSES
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-900 border-slate-800 text-white sm:max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Top {issue.issue_type === "HIGH_CPU_USAGE" ? "CPU" : "Memory"} Consumers</DialogTitle>
                  </DialogHeader>
                  <div className="mt-4">
                    {processesLoading ? (
                      <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>
                    ) : processes.length > 0 ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-4 gap-4 px-4 py-2 bg-slate-950 rounded text-xs font-semibold text-slate-400 uppercase">
                          <div className="col-span-2">Process Name</div>
                          <div>PID</div>
                          <div>{issue.issue_type === "HIGH_CPU_USAGE" ? "CPU %" : "Mem %"}</div>
                        </div>
                        {processes.map((p, idx) => (
                          <div key={idx} className="grid grid-cols-4 gap-4 px-4 py-3 bg-slate-800/50 rounded text-sm items-center">
                            <div className="col-span-2 font-mono truncate">{p.process_name}</div>
                            <div className="text-slate-400">{p.pid}</div>
                            <div className="font-semibold">{issue.issue_type === "HIGH_CPU_USAGE" ? p.cpu_percent.toFixed(1) : p.memory_percent.toFixed(1)}%</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center p-8 text-slate-500">Process data is currently unavailable on this device.</div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
            <h3 className="text-sm font-medium text-slate-400 mb-4 uppercase tracking-wider">Current State</h3>
            <div className="space-y-4">
              <div>
                <span className="text-xs text-slate-500 block">OBSERVED VALUE</span>
                <span className="text-2xl font-semibold text-white">{issue.current_value?.toFixed(1) || 'N/A'}%</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">THRESHOLD</span>
                <span className="text-lg text-slate-300">{issue.threshold}%</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">DURATION</span>
                <span className="text-lg text-slate-300">~{issue.duration_seconds} seconds</span>
              </div>
              {issue.baseline_value && (
                <div>
                  <span className="text-xs text-slate-500 block">BASELINE</span>
                  <span className="text-lg text-slate-300">{issue.baseline_value.toFixed(1)}%</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-blue-950/30 border border-blue-900/50 p-6 rounded-xl">
            <h3 className="text-sm font-medium text-blue-400 mb-4 uppercase tracking-wider">Verification</h3>
            
            {issue.verification_target !== null ? (
              <div className="space-y-4">
                <div>
                  <span className="text-xs text-blue-400/60 block">TARGET</span>
                  <span className="text-lg text-blue-100 font-mono">
                    {issue.verification_metric} {issue.verification_operator} {issue.verification_target}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-blue-400/60 block">REQUIRED DURATION</span>
                  <span className="text-lg text-blue-100">{issue.verification_duration_seconds} seconds</span>
                </div>
                
                {isVerifying && (
                  <div className="mt-4 pt-4 border-t border-blue-900/50">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-blue-300">Verifying...</span>
                      <span className="text-blue-100 font-mono">{elapsed} / {issue.verification_duration_seconds}s</span>
                    </div>
                    <div className="w-full bg-blue-950 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-1000 ease-linear"
                        style={{ width: `${Math.min(100, (elapsed / (issue.verification_duration_seconds || 1)) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {!isResolved && !isVerifying && issue.status !== "ESCALATED" && (
                  <Button 
                    className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => handleAction("VERIFY")}
                    disabled={actionLoading}
                  >
                    {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    START VERIFICATION
                  </Button>
                )}
              </div>
            ) : (
              <div className="text-sm text-slate-400">No verification target set.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
