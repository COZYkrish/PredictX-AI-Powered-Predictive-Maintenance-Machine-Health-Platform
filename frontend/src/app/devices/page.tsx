'use client';

import { Monitor, Wifi, WifiOff, Clock } from 'lucide-react';
import { useDeviceContext } from '@/hooks/use-device';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const RISK_COLORS: Record<string, string> = {
  LOW: 'bg-green-100 text-green-800 border border-green-300',
  MEDIUM: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
  HIGH: 'bg-orange-100 text-orange-800 border border-orange-300',
  CRITICAL: 'bg-red-100 text-red-800 border border-red-300',
};

export default function DevicesPage() {
  const { devices, selectedDeviceId, setSelectedDeviceId, isLoading } = useDeviceContext();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Devices</h2>
        <p className="text-muted-foreground">
          All Windows devices currently reporting telemetry.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Device Inventory</CardTitle>
          <CardDescription>
            {devices?.length ?? 0} device(s) found.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Device</TableHead>
                  <TableHead>Operating System</TableHead>
                  <TableHead>Architecture</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Health</TableHead>
                  <TableHead>Last Seen</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      Loading devices...
                    </TableCell>
                  </TableRow>
                ) : devices && devices.length > 0 ? (
                  devices.map((device: any) => (
                    <TableRow
                      key={device.device_id}
                      className={selectedDeviceId === device.device_id ? 'bg-accent/50' : ''}
                    >
                      {/* Device Name + hostname */}
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Monitor className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div className="flex flex-col">
                            <span>{device.hostname ?? 'Unknown'}</span>
                            <span className="text-xs text-muted-foreground font-mono truncate max-w-[140px]">
                              {device.device_id}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      {/* OS — os_version field */}
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{device.operating_system ?? 'N/A'}</span>
                          {device.os_version && (
                            <span className="text-xs text-muted-foreground">{device.os_version}</span>
                          )}
                        </div>
                      </TableCell>

                      {/* Architecture */}
                      <TableCell>
                        {device.architecture ?? (
                          <span className="text-xs text-muted-foreground">N/A</span>
                        )}
                      </TableCell>

                      {/* Online Status */}
                      <TableCell>
                        {device.is_online ? (
                          <div className="flex items-center gap-1 text-green-600">
                            <Wifi className="h-3.5 w-3.5" />
                            <span className="text-xs font-medium">Online</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <WifiOff className="h-3.5 w-3.5" />
                            <span className="text-xs">Offline</span>
                          </div>
                        )}
                      </TableCell>

                      {/* Health Score from latest prediction */}
                      <TableCell>
                        {device.health_score != null ? (
                          <Badge
                            variant="outline"
                            className={RISK_COLORS[device.risk_level ?? 'LOW']}
                          >
                            {device.health_score}/100
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">NO_PREDICTION_YET</span>
                        )}
                      </TableCell>

                      {/* Last Seen */}
                      <TableCell>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {device.last_seen_at
                            ? new Date(device.last_seen_at).toLocaleString()
                            : 'Never'}
                        </div>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <Button
                          variant={selectedDeviceId === device.device_id ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSelectedDeviceId(device.device_id)}
                        >
                          {selectedDeviceId === device.device_id ? 'Selected' : 'Select'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
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
