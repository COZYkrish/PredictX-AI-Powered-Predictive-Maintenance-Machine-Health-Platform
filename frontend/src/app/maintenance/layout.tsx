import { ProtectedRoute } from '@/components/layout/protected-route';

export default function MaintenanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
