import { ProtectedRoute } from '@/components/layout/protected-route';

export default function PredictLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
