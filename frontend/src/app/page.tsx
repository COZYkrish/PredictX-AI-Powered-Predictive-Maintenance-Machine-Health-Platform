import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Activity, ShieldCheck, Cpu, ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2 font-bold text-xl">
            <Activity className="h-6 w-6 text-healthy" />
            <span>PredictX</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium hover:underline underline-offset-4">
              Login
            </Link>
            <Link href="/register">
              <Button>Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="w-full py-24 md:py-32 lg:py-48 flex items-center justify-center border-b">
          <div className="container px-4 md:px-6 flex flex-col items-center text-center space-y-8">
            <div className="space-y-4 max-w-3xl">
              <h1 className="text-4xl font-extrabold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
                AI-Powered <span className="text-healthy">Predictive</span> Maintenance
              </h1>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                Real-time system health monitoring and anomaly detection for your critical Windows infrastructure. 
                Identify hardware degradation before failure occurs.
              </p>
            </div>
            <div className="space-x-4">
              <Link href="/register">
                <Button size="lg" className="h-12 px-8">
                  Deploy Agent <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button size="lg" variant="outline" className="h-12 px-8">
                  View Demo
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="w-full py-16 md:py-24 bg-muted/40">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid gap-8 md:grid-cols-3">
              <div className="flex flex-col items-center space-y-4 text-center p-6 bg-card rounded-lg border shadow-sm">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Activity className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Real-Time Telemetry</h3>
                <p className="text-muted-foreground">
                  Continuous tracking of CPU, RAM, Disk, and GPU metrics with sub-second latency via WebSockets.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 text-center p-6 bg-card rounded-lg border shadow-sm">
                <div className="p-3 bg-healthy/10 rounded-full">
                  <ShieldCheck className="h-6 w-6 text-healthy" />
                </div>
                <h3 className="text-xl font-bold">Anomaly Detection</h3>
                <p className="text-muted-foreground">
                  Machine Learning models baseline your system performance and alert on deviations.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 text-center p-6 bg-card rounded-lg border shadow-sm">
                <div className="p-3 bg-warning/10 rounded-full">
                  <Cpu className="h-6 w-6 text-warning" />
                </div>
                <h3 className="text-xl font-bold">Hardware Lifecycle</h3>
                <p className="text-muted-foreground">
                  Predictive degradation tracking helps you schedule maintenance before catastrophic failure.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2026 PredictX. Open-source system telemetry platform.</p>
        </div>
      </footer>
    </div>
  );
}
