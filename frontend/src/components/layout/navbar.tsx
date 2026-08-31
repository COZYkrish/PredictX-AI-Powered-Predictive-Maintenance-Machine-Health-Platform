'use client';

import Link from 'next/link';
import { LogOut, Settings } from 'lucide-react';
import { DeviceSelector } from '@/components/device-selector';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/use-auth';

interface NavbarProps {
  onMenuClick?: () => void;
}

export function Navbar({ onMenuClick }: NavbarProps) {
  const { logout, user } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-white/10 bg-[#080808]/90 backdrop-blur-xl px-4 sm:px-8">
      {/* Brand Logo & Name */}
      <div className="flex items-center gap-6">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <svg className="w-5 h-5 fill-white transition-transform group-hover:scale-105" viewBox="0 0 256 256">
            <path d="M 128 128 C 128 198.692 70.692 256 0 256 C 0 185.308 57.308 128 128 128 Z M 128 128 C 198.692 128 256 185.308 256 256 C 185.308 256 128 198.692 128 128 Z M 0 0 C 70.692 0 128 57.308 128 128 C 57.308 128 0 70.692 0 0 Z M 256 0 C 256 70.692 198.692 128 128 128 C 128 57.308 185.308 0 256 0 Z" />
          </svg>
          <span className="text-base font-bold text-white tracking-tight flex items-center gap-1.5 font-geist">
            <span>predictx</span>
            <span className="w-1.5 h-1.5 rounded-full bg-swiss-red animate-pulse" />
          </span>
        </Link>

        {/* Device Selector Pill */}
        <div className="hidden sm:block">
          <DeviceSelector />
        </div>
      </div>

      {/* Center on mobile: device selector */}
      <div className="sm:hidden">
        <DeviceSelector />
      </div>

      {/* User Account Controls */}
      <div className="flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-black font-bold text-xs shadow-md hover:scale-105 transition-transform cursor-pointer outline-none">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-[#121212] border border-white/15 text-white shadow-2xl rounded-xl p-1.5 w-48 font-mono">
            <DropdownMenuLabel className="text-xs text-white/60 uppercase px-2 py-1.5">
              {user?.email || 'My Account'}
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-white/10 my-1" />
            <DropdownMenuItem className="rounded-lg text-xs font-medium text-white/90 hover:bg-white/10 hover:text-white cursor-pointer px-2 py-2">
              <Settings className="mr-2 h-3.5 w-3.5" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/10 my-1" />
            <DropdownMenuItem onClick={logout} className="rounded-lg text-xs font-medium text-swiss-red hover:bg-swiss-red/10 cursor-pointer px-2 py-2">
              <LogOut className="mr-2 h-3.5 w-3.5" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
