'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, Cpu, LineChart, ShieldAlert, 
  Wrench, LogOut, Activity, Sparkles 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';

export function FloatingCommandDock() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isHovered, setIsHovered] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const dockRef = useRef<HTMLDivElement>(null);

  // Expanded state: either hovered (desktop) or toggled (mobile)
  const isExpanded = isHovered || isMobileOpen;

  // Left Wing Navigation Items (reveal towards left)
  const leftNavItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'ENGINEER', 'OPERATOR', 'VIEWER'] },
    { name: 'Devices', href: '/devices', icon: Cpu, roles: ['ADMIN', 'ENGINEER', 'OPERATOR', 'VIEWER'] },
    { name: 'Analytics', href: '/analytics', icon: LineChart, roles: ['ADMIN', 'ENGINEER', 'VIEWER'] },
  ];

  // Right Wing Navigation Items (reveal towards right)
  const rightNavItems = [
    { name: 'Alerts', href: '/alerts', icon: ShieldAlert, roles: ['ADMIN', 'ENGINEER', 'OPERATOR', 'VIEWER'] },
    { name: 'Maintenance', href: '/maintenance', icon: Wrench, roles: ['ADMIN', 'ENGINEER', 'OPERATOR'] },
    { name: 'Predict', href: '/predict', icon: Activity, roles: ['ADMIN', 'ENGINEER'] },
  ];

  // Filter based on user roles
  const filteredLeft = leftNavItems.filter(item => !user || item.roles.includes(user.role));
  const filteredRight = rightNavItems.filter(item => !user || item.roles.includes(user.role));

  // Determine active route name
  const allRoutes = [...leftNavItems, ...rightNavItems];
  const activeRoute = allRoutes.find(item => pathname === item.href || pathname.startsWith(`${item.href}/`))?.name || 'Dashboard';

  // Handle outside click to collapse on mobile
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dockRef.current && !dockRef.current.contains(event.target as Node)) {
        setIsMobileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div
      ref={dockRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center justify-center font-mono pointer-events-auto select-none"
      style={{
        transform: 'translate3d(-50%, 0, 0)',
        willChange: 'transform',
      }}
    >
      {/* Symmetrical Center-Anchored Dock Shell */}
      <div
        className={cn(
          "relative flex items-center justify-center transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)]",
          "bg-[#0a0a0a]/92 backdrop-blur-2xl border border-white/20 rounded-full",
          "shadow-[0_20px_50px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(255,255,255,0.2)]",
          isExpanded 
            ? "p-2 hover:border-white/30" 
            : "px-5 py-2.5 cursor-pointer hover:border-white/40 hover:scale-[1.02]"
        )}
        onClick={() => {
          if (!isExpanded) setIsMobileOpen(true);
        }}
      >
        {/* ================= 1. LEFT WING (Expands outward to the left) ================= */}
        <div
          className={cn(
            "flex items-center justify-end gap-1.5 overflow-hidden transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] origin-right",
            isExpanded
              ? "max-w-[340px] opacity-100 pr-2 translate-x-0"
              : "max-w-0 opacity-0 pr-0 translate-x-3 pointer-events-none"
          )}
          style={{ willChange: 'max-width, opacity, transform' }}
        >
          {filteredLeft.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={cn(
                  "flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-semibold uppercase tracking-wider transition-all duration-150 whitespace-nowrap",
                  isActive
                    ? "bg-white/15 text-white border border-swiss-red/50 shadow-sm"
                    : "text-white/60 hover:text-white hover:bg-white/10"
                )}
              >
                <item.icon className={cn("h-3.5 w-3.5", isActive ? "text-swiss-red" : "text-white/60")} />
                <span className="hidden sm:inline">{item.name}</span>
              </Link>
            );
          })}
        </div>

        {/* ================= 2. CENTER COMMAND ANCHOR (Zero X-Shift) ================= */}
        <div
          className={cn(
            "flex items-center justify-center shrink-0 rounded-full transition-all duration-300",
            isExpanded
              ? "bg-white/10 px-4 py-2 border border-white/15 cursor-pointer hover:bg-white/20 text-white"
              : "bg-transparent px-0 py-0 text-white"
          )}
          onClick={(e) => {
            if (isExpanded) {
              e.stopPropagation();
              setIsMobileOpen(false);
              setIsHovered(false);
            }
          }}
        >
          <div className="flex items-center gap-2">
            <span className="text-white text-xs font-mono">✦</span>
            <span className="text-[11px] font-black uppercase tracking-widest text-white whitespace-nowrap">
              {isExpanded ? 'COMMAND' : `✦ ${activeRoute.toUpperCase()}`}
            </span>
          </div>

          {!isExpanded && (
            <span className="w-1.5 h-1.5 rounded-full bg-swiss-red animate-pulse ml-1" />
          )}
        </div>

        {/* ================= 3. RIGHT WING (Expands outward to the right) ================= */}
        <div
          className={cn(
            "flex items-center justify-start gap-1.5 overflow-hidden transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] origin-left",
            isExpanded
              ? "max-w-[340px] opacity-100 pl-2 translate-x-0"
              : "max-w-0 opacity-0 pl-0 -translate-x-3 pointer-events-none"
          )}
          style={{ willChange: 'max-width, opacity, transform' }}
        >
          {filteredRight.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={cn(
                  "flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-semibold uppercase tracking-wider transition-all duration-150 whitespace-nowrap",
                  isActive
                    ? "bg-white/15 text-white border border-swiss-red/50 shadow-sm"
                    : "text-white/60 hover:text-white hover:bg-white/10"
                )}
              >
                <item.icon className={cn("h-3.5 w-3.5", isActive ? "text-swiss-red" : "text-white/60")} />
                <span className="hidden sm:inline">{item.name}</span>
              </Link>
            );
          })}

          {/* Account Profile & Logout Icon */}
          <div className="flex items-center gap-1.5 pl-1 shrink-0">
            <div className="h-4 w-px bg-white/20 mx-1 shrink-0" />
            <button
              onClick={() => logout()}
              title="Sign Out"
              className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 hover:bg-swiss-red text-white hover:text-white transition-colors cursor-pointer"
            >
              <LogOut className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
