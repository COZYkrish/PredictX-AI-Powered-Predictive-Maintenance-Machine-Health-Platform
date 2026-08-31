'use client';

import { ReactNode } from 'react';
import { Navbar } from './navbar';
import { FloatingCommandDock } from './floating-dock';

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#050505] text-[#fafafa] font-manrope selection:bg-white selection:text-black">
      {/* Top sticky brand header with device selector & user menu */}
      <Navbar onMenuClick={() => {}} />

      {/* Full-width main dashboard content area */}
      <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-6 pb-32">
        {children}
      </main>

      {/* Floating Expandable Bottom-Center Command Dock */}
      <FloatingCommandDock />
    </div>
  );
}
