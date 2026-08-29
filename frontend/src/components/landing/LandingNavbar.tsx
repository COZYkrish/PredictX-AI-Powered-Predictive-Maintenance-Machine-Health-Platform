'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PROJECT_CONFIG } from '@/lib/landing/project-config';

export default function LandingNavbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (totalScroll > 0) {
        setScrollProgress((window.scrollY / totalScroll) * 100);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b-4 border-black">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          
          {/* Brand Logo: Swiss Bold Box */}
          <Link href="/" className="flex items-center gap-3">
            <div className="bg-black text-white px-2.5 py-1 font-black text-sm tracking-tighter uppercase flex items-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(255,48,0,1)]">
              <span>PREDICTX</span>
              <span className="w-2 h-2 bg-swiss-red inline-block animate-pulse" />
            </div>
            <span className="text-[10px] font-mono font-bold tracking-widest text-black/50 hidden sm:inline uppercase">
              SYS-WIN-ML
            </span>
          </Link>

          {/* Desktop Nav Links (Numbered Swiss System) */}
          <div className="hidden lg:flex items-center space-x-6">
            {PROJECT_CONFIG.navLinks.map((link) => (
              <a
                key={link.num}
                href={link.href}
                className="text-xs font-mono font-bold uppercase tracking-wider text-black hover:text-swiss-red transition-colors duration-150"
              >
                <span className="text-swiss-red mr-1">{link.num}.</span>
                {link.label}
              </a>
            ))}
          </div>

          {/* Right Action Group */}
          <div className="hidden sm:flex items-center gap-4">
            <Link
              href={PROJECT_CONFIG.routes.login}
              className="text-xs font-mono font-bold uppercase tracking-wider text-black hover:text-swiss-red transition-colors duration-150"
            >
              LOGIN
            </Link>
            <Link href={PROJECT_CONFIG.routes.register}>
              <button className="h-10 px-5 bg-black text-white font-black text-xs uppercase tracking-widest hover:bg-swiss-red hover:text-white transition-colors duration-150 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                GET STARTED
              </button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="lg:hidden p-2 bg-black text-white font-mono text-xs font-bold uppercase"
            aria-label="Toggle menu"
          >
            {menuOpen ? '[ CLOSE ]' : '[ MENU ]'}
          </button>
        </div>

        {/* Scroll Progress Indicator Bar */}
        <div className="w-full h-1 bg-black/10 absolute bottom-0 left-0">
          <div
            className="h-full bg-swiss-red transition-all duration-100 ease-out"
            style={{ width: `${scrollProgress}%` }}
          />
        </div>
      </nav>

      {/* Mobile Drawer (Swiss Brutalist Overlay) */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 bg-white pt-20 px-8 flex flex-col justify-between pb-8 border-b-4 border-black lg:hidden">
          <div className="flex flex-col space-y-6">
            {PROJECT_CONFIG.navLinks.map((link) => (
              <a
                key={link.num}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="text-2xl font-black uppercase tracking-tighter text-black hover:text-swiss-red"
              >
                <span className="text-swiss-red mr-2 font-mono text-lg">{link.num}.</span>
                {link.label}
              </a>
            ))}
          </div>

          <div className="space-y-4 pt-6 border-t-4 border-black">
            <Link
              href={PROJECT_CONFIG.routes.login}
              onClick={() => setMenuOpen(false)}
              className="block text-center font-mono font-bold text-sm uppercase py-3 border-2 border-black"
            >
              LOGIN TO DASHBOARD
            </Link>
            <Link
              href={PROJECT_CONFIG.routes.register}
              onClick={() => setMenuOpen(false)}
              className="block text-center bg-swiss-red text-white font-black text-sm uppercase py-4 tracking-widest"
            >
              GET STARTED NOW
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
