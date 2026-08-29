/**
 * demo-data.ts — Centralized demonstration telemetry and cinematic incident narratives.
 */

export const DEMO_TELEMETRY = {
  cpu: { code: 'CPU.01', label: 'CPU LOAD', value: 14.7, unit: '%' },
  memory: { code: 'MEM.02', label: 'RAM WORKING SET', value: 75.2, unit: '%' },
  disk: { code: 'DSK.03', label: 'DISK ACTIVE TIME', value: 83.6, unit: '%' },
  uptime: { code: 'SYS.04', label: 'SYSTEM UPTIME', value: '49H 18M', unit: '' },
} as const;

export const DEMO_FORECAST = {
  metric: 'RAM OCCUPANCY',
  current: 73.5,
  projected30m: 78.2,
  trend: 'RISING',
  slopePerMin: '+0.15%/MIN',
  threshold: 75.0,
  etaThresholdMinutes: 7.9,
  samplePoints: 129,
  status: 'THRESHOLD BREACH IMMINENT',
} as const;

export const DEMO_ML_BENCHMARK = {
  models: [
    { name: 'XGBOOST CLASSIFIER', f1: '1.000', auc: '1.000', status: 'ACTIVE INFERENCE', active: true },
    { name: 'RANDOM FOREST', f1: '1.000', auc: '1.000', status: 'CANDIDATE', active: false },
    { name: 'LIGHTGBM', f1: '1.000', auc: '1.000', status: 'CANDIDATE', active: false },
    { name: 'LOGISTIC REGRESSION', f1: '0.900', auc: '0.945', status: 'EVALUATED', active: false },
    { name: 'MAJORITY BASELINE', f1: '0.574', auc: '0.402', status: 'FLOOR BASELINE', active: false },
  ],
  topFeatures: [
    { name: 'MEMORY_USED_BYTES', weight: 50.7 },
    { name: 'MEMORY_PERCENT', weight: 39.3 },
    { name: 'MEMORY_AVAILABLE_BYTES', weight: 4.9 },
    { name: 'COLLECTION_DURATION_MS', weight: 0.6 },
    { name: 'CPU_USAGE_60S_STD', weight: 0.6 },
  ],
  systemState: {
    healthScore: 80,
    healthMax: 100,
    riskLevel: 'MEDIUM' as const,
    anomalyScore: -0.042,
  },
} as const;

export const DEMO_INCIDENT = {
  id: 'INC-8924',
  condition: 'SUSTAINED MEMORY PRESSURE',
  severity: 'WARNING' as const,
  observed: 83.4,
  threshold: 75.0,
  duration: '~4 MIN',
  rollingAverage5m: 81.2,
  historicalBaseline: 68.5,
  deltaFromNormal: '+14.9%',
  likelyContributors: [
    { rank: '01', process: 'chrome.exe (Tabs Working Set)', impact: '3.4 GB', confidence: 'SUPPORTED' as const },
    { rank: '02', process: 'node.exe (Dev Server Subprocess)', impact: '1.8 GB', confidence: 'SUPPORTED' as const },
    { rank: '03', process: 'System Background Search Indexer', impact: '0.6 GB', confidence: 'POSSIBLE' as const },
  ],
  remediationProtocol: [
    'INSPECT ACTIVE PROCESS LIST VIA TASK MANAGER',
    'ISOLATE NON-CRITICAL BROWSER WORKLOADS',
    'TRIGGER RECOVERY OF UNCOMMITTED HEAP PAGES',
    'MONITOR TELEMETRY FOR THRESHOLD CLEARANCE',
  ],
  verificationTarget: { metric: 'RAM', condition: '< 75.0%', durationSeconds: 120 },
} as const;

export const DEMO_RESTORATION = {
  stages: [
    { time: 'T+00s', value: 83.4, state: 'ELEVATED' },
    { time: 'T+30s', value: 78.1, state: 'DRAINING' },
    { time: 'T+60s', value: 73.8, state: 'BELOW THRESHOLD' },
    { time: 'T+120s', value: 68.9, state: 'VERIFIED STABLE' },
  ],
  verificationDuration: 120,
  healthScoreBefore: 74,
  healthScoreAfter: 91,
  alertStatus: 'CLOSED / RESOLVED' as const,
} as const;
