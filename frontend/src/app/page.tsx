import type { Metadata } from 'next';
import LandingClient from '@/components/landing/LandingClient';

export const metadata: Metadata = {
  title: 'PredictX — AI-Powered Windows System Health & Predictive Maintenance',
  description:
    'PredictX monitors Windows telemetry, analyzes system behavior using Machine Learning and anomaly detection, and provides actionable insights for system health and predictive maintenance.',
  openGraph: {
    title: 'PredictX — AI-Powered Windows System Health & Predictive Maintenance',
    description:
      'PredictX monitors Windows telemetry, analyzes system behavior using Machine Learning and anomaly detection, and provides actionable insights for system health and predictive maintenance.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PredictX — AI-Powered Windows System Health & Predictive Maintenance',
    description:
      'PredictX monitors Windows telemetry, analyzes system behavior using Machine Learning and anomaly detection, and provides actionable insights for system health and predictive maintenance.',
  },
};

export default function HomePage() {
  return <LandingClient />;
}
