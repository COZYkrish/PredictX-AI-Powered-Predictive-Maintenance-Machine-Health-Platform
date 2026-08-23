import { ProtectedRoute } from '@/components/layout/protected-route';

export default function AlertsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
