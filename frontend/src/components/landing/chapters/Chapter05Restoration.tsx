'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle2, Shield, Cpu, Activity } from 'lucide-react';
import { PROJECT_CONFIG } from '@/lib/landing/project-config';
import ScrollReveal from '../ui/ScrollReveal';

export default function Chapter05Restoration() {
  const cfg = PROJECT_CONFIG;

  return (
    <section
      id="chapter-05"
      className="relative bg-[#050505] text-[#fafafa] h-screen min-h-screen w-full flex flex-col justify-between overflow-hidden font-manrope pt-20 pb-8"
      style={{ background: '#050505' }}
    >
      {/* Background Video — Fully visible at 100% opacity without dark gradient blocking */}
      <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden">
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover opacity-100"
        >
          <source
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260808_112712_da9d53df-6d27-4b12-bdf6-aa9dc2622bdf.mp4"
            type="video/mp4"
          />
        </video>

        {/* Minimal bottom edge blend for smooth footer transition */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(to bottom, transparent 80%, rgba(5,5,5,0.7) 94%, #050505 100%)',
          }}
        />
      </div>

      {/* Main Foreground Composition */}
      <div className="relative z-10 max-w-7xl mx-auto w-full px-6 md:px-12 lg:px-16 flex flex-col justify-between h-full pt-8 pb-4">
        
        {/* Top/Middle Block: Brand Mark + Headline + Narrative + CTAs */}
        <div className="my-auto max-w-2xl text-left space-y-5">
          
          {/* Brand Mark: Angular Lightning S-Mark with Metallic Gradient */}
          <ScrollReveal delay={0} direction="down" distance={16}>
            <div className="flex items-center gap-4">
              <svg className="w-7 h-11 drop-shadow-lg" viewBox="0 0 31.5 48.5" fill="none">
                <defs>
                  <linearGradient id="ch5-bg1" x1="8" y1="0" x2="34.1" y2="28.9" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stopColor="#9e9e9e"/>
                    <stop offset="0.28" stopColor="#a6a6a6"/>
                    <stop offset="0.34" stopColor="#a3a3a3"/>
                    <stop offset="0.40" stopColor="#3a3a3a"/>
                    <stop offset="0.55" stopColor="#414141"/>
                    <stop offset="0.60" stopColor="#7a7a7a"/>
                    <stop offset="0.68" stopColor="#8e8e8e"/>
                    <stop offset="0.80" stopColor="#a9a9a9"/>
                    <stop offset="0.95" stopColor="#c4c4c4"/>
                    <stop offset="1" stopColor="#cccccc"/>
                  </linearGradient>
                </defs>
                <path d="M21.5 0 L21.5 19.5 L31.5 19.5 L31.5 29 L10 48.5 L10 28.5 L0.5 28.5 L0.5 18.5 Z" fill="url(#ch5-bg1)"/>
                <rect x="0.5" y="18.5" width="9" height="10" fill="#fdfdfd"/>
                <rect x="22" y="19.5" width="9.5" height="9.5" fill="#fdfdfd"/>
              </svg>
              <div className="flex flex-col">
                <span className="text-xs uppercase tracking-[0.25em] text-[#e0e0e0] font-semibold [text-shadow:_0_2px_8px_rgba(0,0,0,0.9)]">
                  PREDICTX · RESTORATION
                </span>
                <span className="text-[10px] uppercase font-mono tracking-widest text-[#a0a0a0] [text-shadow:_0_1px_6px_rgba(0,0,0,0.9)]">
                  EQUILIBRIUM PROTOCOL.05
                </span>
              </div>
            </div>
          </ScrollReveal>

          {/* Headline with High-Clarity Contrast */}
          <div className="space-y-1">
            <ScrollReveal delay={80} direction="up" distance={20}>
              <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-normal tracking-tight text-[#fafafa] leading-[1.08] [text-shadow:_0_4px_24px_rgba(0,0,0,0.95)]">
                The Next Layer
              </h2>
            </ScrollReveal>
            <ScrollReveal delay={140} direction="up" distance={20}>
              <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight text-white leading-[1.08] [text-shadow:_0_4px_24px_rgba(0,0,0,0.95)]">
                of System Intelligence.
              </h2>
            </ScrollReveal>
          </div>

          {/* Subcopy */}
          <ScrollReveal delay={200} direction="up" distance={16}>
            <p className="text-base sm:text-lg md:text-xl font-normal text-white/90 leading-relaxed max-w-xl [text-shadow:_0_2px_12px_rgba(0,0,0,0.95)]">
              A unified predictive maintenance platform to help engineering teams detect anomalies, protect kernel stability, and scale AI operations with confidence.
            </p>
          </ScrollReveal>

          {/* Action CTAs: White Pill + Ghost Link */}
          <ScrollReveal delay={260} direction="up" distance={16}>
            <div className="pt-2 flex items-center gap-6 flex-wrap">
              <Link
                href={cfg.routes.register}
                className="inline-flex items-center justify-center rounded-full px-8 py-3.5 bg-white text-[#050505] font-semibold text-sm sm:text-base hover:opacity-90 transition-all duration-200 shadow-[0_0_30px_rgba(255,255,255,0.4)] hover:scale-[1.02]"
              >
                Get Started
              </Link>
              <Link
                href={cfg.routes.dashboard}
                className="inline-flex items-center gap-2 text-sm sm:text-base font-semibold text-white hover:text-white/80 transition-colors group [text-shadow:_0_2px_10px_rgba(0,0,0,0.9)]"
              >
                <span>View Architecture</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </ScrollReveal>

        </div>

        {/* Bottom Status / Verification Strip with Subtle Glass Backing */}
        <ScrollReveal delay={340} direction="up" distance={12}>
          <div className="pt-4 border-t border-white/20 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-[#d0d0d0] tracking-wider uppercase [text-shadow:_0_1px_8px_rgba(0,0,0,0.9)]">
            
            <div className="flex items-center gap-6 flex-wrap">
              <div className="flex items-center gap-2 text-white">
                <CheckCircle2 className="w-3.5 h-3.5 text-swiss-red" />
                <span className="font-bold">120S VERIFICATION CONFIRMED</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-white/80" />
                <span>INC-8924 RESOLVED</span>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-white/80" />
                <span>HEALTH 74 → 91/100</span>
              </div>
              <div className="flex items-center gap-2 hidden lg:flex">
                <Cpu className="w-3.5 h-3.5 text-white/80" />
                <span>ZERO FALSE OPTIMISMS</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link href={cfg.routes.login} className="text-white/80 hover:text-white transition-colors underline underline-offset-4">
                Login to Console
              </Link>
            </div>

          </div>
        </ScrollReveal>

      </div>
    </section>
  );
}
