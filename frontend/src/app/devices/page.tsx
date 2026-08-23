'use client';

import { Activity, Cpu, Monitor, Tag } from 'lucide-react';
import { useDeviceContext } from '@/hooks/use-device';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';

export default function DevicesPage() {
  const { devices, selectedDeviceId, setSelectedDeviceId, isLoading } = useDeviceContext();
  const { user } = useAuth();

  const getStatusColor = (health_score?: number) => {
    if (health_score === undefined) return 'bg-neutral';
    if (health_score >= 90) return 'bg-healthy text-primary-foreground';
    if (health_score >= 70) return 'bg-warning text-primary-foreground';
    if (health_score >= 40) return 'bg-high-risk text-primary-foreground';
    return 'bg-critical text-primary-foreground';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Devices</h2>
          <p className="text-muted-foreground">
            Manage and view all monitored Windows devices.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Device Inventory</CardTitle>
          <CardDescription>All agents currently reporting telemetry.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hostname</TableHead>
                  <TableHead>MAC Address</TableHead>
                  <TableHead>OS Version</TableHead>
                  <TableHead>Architecture</TableHead>
                  <TableHead>Health Score</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      Loading devices...
                    </TableCell>
                  </TableRow>
                ) : devices && devices.length > 0 ? (
                  devices.map((device) => (
                    <TableRow key={device.id} className={selectedDeviceId === device.id ? "bg-accent/50" : ""}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Monitor className="h-4 w-4 text-muted-foreground" />
                          {device.hostname}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground font-mono text-xs">{device.mac_address}</TableCell>
                      <TableCell>{device.os_version}</TableCell>
                      <TableCell>{device.cpu_architecture}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(device.health_score)}>
                          {device.health_score ? `${Math.round(device.health_score)}%` : 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant={selectedDeviceId === device.id ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedDeviceId(device.id)}
                        >
                          {selectedDeviceId === device.id ? 'Selected' : 'Select'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      No devices found. Install the PredictX Windows agent to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
