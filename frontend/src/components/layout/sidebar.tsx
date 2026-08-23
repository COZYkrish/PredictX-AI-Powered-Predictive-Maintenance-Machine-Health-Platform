'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, LayoutDashboard, Cpu, LineChart, Wrench, X, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';

interface SidebarProps {
  onClose: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'ENGINEER', 'OPERATOR', 'VIEWER'] },
    { name: 'Devices', href: '/devices', icon: Cpu, roles: ['ADMIN', 'ENGINEER', 'OPERATOR', 'VIEWER'] },
    { name: 'Predict', href: '/predict', icon: Activity, roles: ['ADMIN', 'ENGINEER'] },
    { name: 'Analytics', href: '/analytics', icon: LineChart, roles: ['ADMIN', 'ENGINEER', 'VIEWER'] },
    { name: 'Maintenance', href: '/maintenance', icon: Wrench, roles: ['ADMIN', 'ENGINEER', 'OPERATOR'] },
    { name: 'Alerts', href: '/alerts', icon: ShieldAlert, roles: ['ADMIN', 'ENGINEER', 'OPERATOR', 'VIEWER'] },
  ];

  // Filter based on roles if user is loaded
  const navItems = navigation.filter(item => {
    if (!user) return false;
    return item.roles.includes(user.role);
  });

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center justify-between border-b px-4 lg:h-[60px]">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <Activity className="h-6 w-6 text-healthy" />
          <span className="text-lg">PredictX</span>
        </Link>
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={onClose}>
          <X className="h-5 w-5" />
          <span className="sr-only">Close sidebar</span>
        </Button>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive 
                  ? "bg-primary/10 text-primary" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              onClick={() => onClose()}
            >
              <item.icon className={cn("h-4 w-4", isActive ? "text-primary" : "text-muted-foreground")} />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-4">
        <div className="flex items-center gap-3 rounded-md bg-muted/50 px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary">
            {user?.email?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium truncate w-32">{user?.email || 'User'}</span>
            <span className="text-xs text-muted-foreground capitalize">{user?.role?.toLowerCase() || 'Viewer'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
