/**
 * project-config.ts — Swiss International Cinematic Storytelling Configuration.
 * 5 Chapters: THE PULSE → THE DRIFT → THE COGNITION → THE CRUCIBLE → THE RESTORATION
 */

export const PROJECT_CONFIG = {
  name: 'PREDICTX',
  tagline: 'AUTONOMOUS SYSTEM HEALTH & PREDICTIVE TELEMETRY INTELLIGENCE',
  systemCode: 'SYS-WIN-ML.2026',
  
  // ML Pipeline Specification
  featureCount: 48,
  activeModel: 'XGBOOST CLASSIFIER',
  anomalyModel: 'ISOLATION FOREST',
  modelVersion: 'V1.0.0-PROD',
  trainingSamples: 1253,
  activeF1: '1.000',
  baselineF1: '0.574',
  
  // 5-Stage Operating Doctrine
  workflowStages: [
    { num: '01', label: 'MONITOR', desc: 'CONTINUOUS 10S SAMPLING' },
    { num: '02', label: 'DETECT', desc: '48-FEATURE VECTOR INFERENCE' },
    { num: '03', label: 'DIAGNOSE', desc: 'EVIDENCE DOCKET & CONTRIBUTORS' },
    { num: '04', label: 'SOLVE', desc: 'ACTIONABLE REMEDIATION' },
    { num: '05', label: 'VERIFY', desc: '120S RESOLUTION CONFIRMATION' },
  ] as const,
  
  // 5 Story Chapter Labels
  sceneLabels: {
    pulse: 'CHAPTER I — THE PULSE',
    drift: 'CHAPTER II — THE DRIFT',
    cognition: 'CHAPTER III — THE COGNITION',
    crucible: 'CHAPTER IV — THE CRUCIBLE',
    restoration: 'CHAPTER V — THE RESTORATION',
  },
  
  // Badges & Labels
  demoLabel: '[ 00. REAL-TIME SIMULATED STREAM ]',
  forecastLabel: '[ 02. 30-MIN LINEAR TRAJECTORY ]',
  cognitionLabel: '[ 03. DUAL-ENGINE INFERENCE AUDIT ]',
  incidentLabel: '[ 04. TACTICAL INCIDENT DOCKET ]',
  verificationLabel: '[ 05. CLOSED-LOOP VERIFICATION SCENARIO ]',
  
  // Numbered Chapter Navigation
  navLinks: [
    { num: '01', label: 'THE PULSE', href: '#chapter-01' },
    { num: '02', label: 'THE DRIFT', href: '#chapter-02' },
    { num: '03', label: 'COGNITION', href: '#chapter-03' },
    { num: '04', label: 'CRUCIBLE', href: '#chapter-04' },
    { num: '05', label: 'RESTORATION', href: '#chapter-05' },
  ],
  
  // Action Routes
  routes: {
    register: '/register',
    login: '/login',
    dashboard: '/dashboard',
  },
  
  // Swiss Color Tokens
  colors: {
    background: '#FFFFFF',
    foreground: '#000000',
    muted: '#F2F2F2',
    swissRed: '#FF3000',
    border: '#000000',
    gridLine: 'rgba(0, 0, 0, 0.06)',
  },
} as const;
