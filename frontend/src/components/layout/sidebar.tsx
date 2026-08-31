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
    <div className="flex h-full flex-col bg-[#080808] text-white">
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <svg className="w-5 h-5 fill-white transition-transform group-hover:scale-105" viewBox="0 0 256 256">
            <path d="M 128 128 C 128 198.692 70.692 256 0 256 C 0 185.308 57.308 128 128 128 Z M 128 128 C 198.692 128 256 185.308 256 256 C 185.308 256 128 198.692 128 128 Z M 0 0 C 70.692 0 128 57.308 128 128 C 57.308 128 0 70.692 0 0 Z M 256 0 C 256 70.692 198.692 128 128 128 C 128 57.308 185.308 0 256 0 Z" />
          </svg>
          <span className="text-base font-semibold text-white tracking-tight flex items-center gap-1.5 font-geist">
            <span>predictx</span>
            <span className="w-1.5 h-1.5 rounded-full bg-swiss-red animate-pulse" />
          </span>
        </Link>
        <Button variant="ghost" size="icon" className="lg:hidden text-white/70 hover:text-white" onClick={onClose}>
          <X className="h-5 w-5" />
          <span className="sr-only">Close sidebar</span>
        </Button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 space-y-1.5 overflow-y-auto p-4 font-geist">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all duration-150",
                isActive 
                  ? "bg-white/10 text-white border-l-2 border-swiss-red shadow-sm" 
                  : "text-white/60 hover:bg-white/5 hover:text-white"
              )}
              onClick={() => onClose()}
            >
              <item.icon className={cn("h-4 w-4", isActive ? "text-swiss-red" : "text-white/50")} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Info Footer */}
      <div className="border-t border-white/10 p-4">
        <div className="flex items-center gap-3 rounded-xl bg-white/[0.04] border border-white/10 px-3.5 py-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-black font-bold text-xs">
            {user?.email?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-semibold text-white truncate">{user?.email || 'User'}</span>
            <span className="text-[10px] font-mono text-white/50 uppercase tracking-wider">{user?.role?.toLowerCase() || 'Viewer'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
