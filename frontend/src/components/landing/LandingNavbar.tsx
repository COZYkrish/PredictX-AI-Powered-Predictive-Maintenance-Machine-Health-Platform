'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronDown, Menu, X } from 'lucide-react';
import { PROJECT_CONFIG } from '@/lib/landing/project-config';

export default function LandingNavbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const navLinks = [
    { label: '01. Telemetry', href: '#chapter-01' },
    { label: '02. 30m Forecast', href: '#chapter-02' },
    { label: '03. Dual AI Engine', href: '#chapter-03', hasDropdown: true },
    { label: '04. Incident Docket', href: '#chapter-04' },
    { label: '05. Restoration', href: '#chapter-05' },
  ];

  return (
    <>
      {/* Floating Transparent Header (No full-width solid bar) */}
      <header className="fixed top-0 left-0 right-0 z-50 w-full py-5 sm:py-6 px-5 sm:px-8 lg:px-12 pointer-events-none transition-all duration-300">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Logo (Exact SVG) + PredictX Wordmark inside Glass Capsule */}
          <Link
            href="/"
            className="pointer-events-auto flex items-center gap-2.5 group rounded-full bg-black/40 backdrop-blur-lg px-3.5 py-1.5 border border-white/15 shadow-lg transition-transform duration-200 hover:scale-[1.02]"
          >
            <svg
              className="w-5 h-5 fill-white transition-colors"
              viewBox="0 0 256 256"
            >
              <path d="M 128 128 C 128 198.692 70.692 256 0 256 C 0 185.308 57.308 128 128 128 Z M 128 128 C 198.692 128 256 185.308 256 256 C 185.308 256 128 198.692 128 128 Z M 0 0 C 70.692 0 128 57.308 128 128 C 57.308 128 0 70.692 0 0 Z M 256 0 C 256 70.692 198.692 128 128 128 C 128 57.308 185.308 0 256 0 Z" />
            </svg>
            <span className="text-base font-semibold text-white tracking-tight flex items-center gap-1.5 font-geist">
              <span>predictx</span>
              <span className="w-1.5 h-1.5 rounded-full bg-swiss-red animate-pulse" />
            </span>
          </Link>

          {/* Desktop Navigation Cluster (hidden md:flex) */}
          <div className="hidden md:flex items-center gap-3">
            {/* Glass Pill Nav Cluster */}
            <nav className="pointer-events-auto flex items-center gap-1 rounded-full bg-black/40 backdrop-blur-lg px-1.5 py-1.5 border border-white/15 shadow-lg">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="flex items-center gap-1 rounded-full px-3.5 py-1.5 text-sm font-medium text-white/85 hover:bg-white/15 hover:text-white transition-colors font-geist"
                >
                  <span>{link.label}</span>
                  {link.hasDropdown && <ChevronDown className="w-3.5 h-3.5 opacity-80" />}
                </a>
              ))}
            </nav>

            {/* Separate Get Started / Deploy Agent Glass Pill */}
            <Link
              href={PROJECT_CONFIG.routes.register}
              className="pointer-events-auto flex items-center justify-center self-stretch rounded-full px-5 text-sm font-medium text-white hover:opacity-90 transition-all duration-200 font-geist border border-white/15 shadow-lg hover:scale-[1.02]"
              style={{ background: 'linear-gradient(to bottom, #2B2B2B, #101010)' }}
            >
              Deploy Agent
            </Link>
          </div>

          {/* Mobile Hamburger Button (md:hidden) */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="pointer-events-auto md:hidden relative h-10 w-10 rounded-full bg-black/40 backdrop-blur-lg flex items-center justify-center z-50 text-white border border-white/15 shadow-lg"
            aria-label="Toggle menu"
          >
            <Menu
              className={`w-5 h-5 absolute transition-all duration-300 ${
                menuOpen ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'
              }`}
            />
            <X
              className={`w-5 h-5 absolute transition-all duration-300 ${
                menuOpen ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'
              }`}
            />
          </button>
        </div>
      </header>

      {/* Mobile Menu Glass Overlay + Drawer */}
      <div
        className={`fixed inset-0 z-40 bg-black/80 backdrop-blur-md transition-opacity duration-300 md:hidden ${
          menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setMenuOpen(false)}
      />
      <div
        className={`fixed right-0 top-0 z-40 h-full w-72 bg-black/95 backdrop-blur-xl flex flex-col justify-between transition-transform duration-500 md:hidden border-l border-white/10 ${
          menuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        <div className="px-6 pt-24 flex flex-col gap-2">
          {navLinks.map((link, idx) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="flex items-center justify-between rounded-xl px-4 py-3.5 text-base font-medium text-white/80 hover:bg-white/10 hover:text-white transition-all font-geist"
              style={{
                transitionDelay: menuOpen ? `${(idx + 1) * 60}ms` : '0ms',
                transform: menuOpen ? 'translateX(0)' : 'translateX(24px)',
                opacity: menuOpen ? 1 : 0,
              }}
            >
              <span>{link.label}</span>
              {link.hasDropdown && <ChevronDown className="w-4 h-4" />}
            </a>
          ))}
        </div>

        <div className="mt-auto px-6 pb-10 flex flex-col gap-3 font-geist">
          <Link
            href={PROJECT_CONFIG.routes.login}
            onClick={() => setMenuOpen(false)}
            className="flex w-full items-center justify-center rounded-full py-3 text-sm font-medium text-white/80 border border-white/20 hover:bg-white/10 transition-colors"
          >
            Sign In
          </Link>
          <Link
            href={PROJECT_CONFIG.routes.register}
            onClick={() => setMenuOpen(false)}
            className="flex w-full items-center justify-center rounded-full py-3.5 text-sm font-medium text-white hover:opacity-90 transition-all duration-400 border border-white/20"
            style={{
              background: 'linear-gradient(to bottom, #2B2B2B, #101010)',
              transform: menuOpen ? 'translateY(0)' : 'translateY(16px)',
              opacity: menuOpen ? 1 : 0,
              transitionDelay: menuOpen ? '300ms' : '0ms',
            }}
          >
            Deploy Agent
          </Link>
        </div>
      </div>
    </>
  );
}
