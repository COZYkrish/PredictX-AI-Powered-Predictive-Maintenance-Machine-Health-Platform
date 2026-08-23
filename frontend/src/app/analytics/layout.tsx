import { ProtectedRoute } from '@/components/layout/protected-route';

export default function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
