import { ProtectedRoute } from '@/components/layout/protected-route';

export default function DevicesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
