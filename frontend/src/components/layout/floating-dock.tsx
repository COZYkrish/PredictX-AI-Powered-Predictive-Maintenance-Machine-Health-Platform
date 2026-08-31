'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, Cpu, LineChart, ShieldAlert, 
  Wrench, LogOut, Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';

export function FloatingCommandDock() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isHovered, setIsHovered] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const dockRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isExpanded = isHovered || isLocked;

  // All Primary Navigation Items
  const navigationItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'ENGINEER', 'OPERATOR', 'VIEWER'] },
    { name: 'Devices', href: '/devices', icon: Cpu, roles: ['ADMIN', 'ENGINEER', 'OPERATOR', 'VIEWER'] },
    { name: 'Analytics', href: '/analytics', icon: LineChart, roles: ['ADMIN', 'ENGINEER', 'VIEWER'] },
    { name: 'Alerts', href: '/alerts', icon: ShieldAlert, roles: ['ADMIN', 'ENGINEER', 'OPERATOR', 'VIEWER'] },
    { name: 'Predict', href: '/predict', icon: Activity, roles: ['ADMIN', 'ENGINEER'] },
    { name: 'Maintenance', href: '/maintenance', icon: Wrench, roles: ['ADMIN', 'ENGINEER', 'OPERATOR'] },
  ];

  // Filter based on user roles
  const filteredNav = navigationItems.filter(item => !user || item.roles.includes(user.role));

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 220);
  };

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dockRef.current && !dockRef.current.contains(event.target as Node)) {
        setIsLocked(false);
        setIsHovered(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div
      ref={dockRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="fixed bottom-6 left-1/2 z-50 flex items-center justify-center font-mono pointer-events-auto select-none py-3 -my-3 px-8 -mx-8"
      style={{
        transform: 'translate3d(-50%, 0, 0)',
        willChange: 'transform',
      }}
    >
      {/* Symmetrical Outer Pill Shell with Luxury 600ms Easing */}
      <div
        className={cn(
          "relative flex items-center justify-center overflow-hidden",
          "transition-all duration-600 ease-[cubic-bezier(0.19,1,0.22,1)]",
          "bg-[#0a0a0a]/95 backdrop-blur-2xl border border-white/20 rounded-full",
          "shadow-[0_20px_50px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(255,255,255,0.2)]",
          isExpanded 
            ? "p-2 hover:border-white/35 max-w-[95vw]" 
            : "px-5 py-2.5 cursor-pointer hover:border-white/40 hover:scale-[1.03] max-w-[150px]"
        )}
      >
        {/* ================= 1. COLLAPSED STATE (Smoothly Fades Out on Hover) ================= */}
        <div
          className={cn(
            "flex items-center justify-center gap-2 whitespace-nowrap",
            "transition-all duration-500 ease-[cubic-bezier(0.19,1,0.22,1)]",
            isExpanded
              ? "max-w-0 opacity-0 scale-75 pointer-events-none overflow-hidden -mx-1"
              : "max-w-[120px] opacity-100 scale-100 pointer-events-auto"
          )}
          style={{ willChange: 'max-width, opacity, transform' }}
        >
          <span className="text-white text-xs">⌘</span>
          <span className="text-[11px] font-black uppercase tracking-widest text-white">
            MENU
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-swiss-red animate-pulse ml-0.5" />
        </div>

        {/* ================= 2. EXPANDED STATE (Smoothly Glides In from Center) ================= */}
        <div
          className={cn(
            "flex items-center justify-center gap-1.5 overflow-hidden",
            "transition-all duration-600 ease-[cubic-bezier(0.19,1,0.22,1)]",
            isExpanded
              ? "max-w-[950px] opacity-100 scale-100 pointer-events-auto"
              : "max-w-0 opacity-0 scale-90 pointer-events-none"
          )}
          style={{ willChange: 'max-width, opacity, transform' }}
        >
          {/* Navigation Links */}
          {filteredNav.map((item, idx) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => {
                  setIsLocked(false);
                  setIsHovered(false);
                }}
                className={cn(
                  "flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-semibold uppercase tracking-wider transition-all duration-200 whitespace-nowrap",
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

          {/* Account Profile & Logout Control */}
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
