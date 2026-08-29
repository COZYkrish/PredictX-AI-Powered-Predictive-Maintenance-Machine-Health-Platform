'use client';

import { useState, useEffect } from 'react';
import { PROJECT_CONFIG } from '@/lib/landing/project-config';
import { DEMO_TELEMETRY } from '@/lib/landing/demo-data';
import ScrollReveal from '../ui/ScrollReveal';

export default function Chapter01Pulse() {
  const [pulseTick, setPulseTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulseTick((prev) => (prev + 1) % 100);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section
      id="chapter-01"
      className="relative border-b-4 border-black bg-white min-h-[calc(100vh-4rem)] flex items-center py-10 lg:py-14 px-6 md:px-12 lg:px-16 swiss-grid-pattern overflow-hidden"
    >
      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        
        {/* Left Column: 7 Columns */}
        <div className="lg:col-span-7 text-left">
          
          {/* Chapter Prefix */}
          <ScrollReveal delay={0} direction="down" distance={16}>
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-swiss-red text-white text-xs font-black px-3 py-1 tracking-widest uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                {PROJECT_CONFIG.sceneLabels.pulse}
              </span>
              <span className="text-black/50 text-xs font-mono tracking-widest uppercase font-bold">
                SYS-WIN-ML.2026
              </span>
            </div>
          </ScrollReveal>

          {/* Staggered Display Title */}
          <div className="space-y-1">
            <ScrollReveal delay={80} direction="up" distance={24}>
              <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black uppercase tracking-tighter leading-[0.88] text-black">
                THE LIVING
              </h1>
            </ScrollReveal>
            <ScrollReveal delay={140} direction="up" distance={24}>
              <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black uppercase tracking-tighter leading-[0.88] text-black">
                <span className="text-swiss-red underline decoration-4 underline-offset-8">PULSE</span> OF YOUR
              </h1>
            </ScrollReveal>
            <ScrollReveal delay={200} direction="up" distance={24}>
              <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black uppercase tracking-tighter leading-[0.88] text-black">
                MACHINE.
              </h1>
            </ScrollReveal>
          </div>

          {/* Staggered Narrative */}
          <ScrollReveal delay={260} direction="up" distance={20}>
            <p className="mt-6 text-base sm:text-lg md:text-xl font-bold text-black/80 max-w-xl uppercase tracking-tight leading-snug">
              A computer does not fail in an instant. It whispers through micro-oscillations in clock cycles, memory pages, thermal gradients, and thread queues.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={320} direction="up" distance={20}>
            <div className="mt-5 flex items-center gap-3">
              <div className="w-4 h-4 bg-black animate-pulse" />
              <p className="text-lg sm:text-xl md:text-2xl font-black uppercase tracking-tight text-black">
                PredictX listens to the heartbeat.
              </p>
            </div>
          </ScrollReveal>

          {/* Staggered Telemetry Sensor Bus Tags */}
          <ScrollReveal delay={380} direction="up" distance={16}>
            <div className="mt-6 flex flex-wrap gap-2.5 font-mono text-xs">
              <span className="border-2 border-black bg-black text-white px-3.5 py-1.5 uppercase font-black shadow-[2px_2px_0px_0px_rgba(255,48,0,1)] hover:bg-swiss-red transition-colors duration-200 cursor-default">
                48 SENSOR VECTORS
              </span>
              <span className="border-2 border-black bg-white text-black px-3.5 py-1.5 uppercase font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-black hover:text-white transition-colors duration-200 cursor-default">
                10.0S KERNEL INGEST
              </span>
              <span className="border-2 border-black bg-[#F2F2F2] text-black px-3.5 py-1.5 uppercase font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-black hover:text-white transition-colors duration-200 cursor-default">
                &lt;0.4% OVERHEAD
              </span>
            </div>
          </ScrollReveal>
        </div>

        {/* Right Column: 5 Columns with Slide-in Transition */}
        <ScrollReveal delay={180} direction="left" distance={36} className="lg:col-span-5 w-full">
          <div className="border-4 border-black bg-white flex flex-col shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-transform duration-300 hover:-translate-y-1">
            
            {/* Header */}
            <div className="bg-black text-white px-5 py-3.5 flex justify-between items-center border-b-4 border-black">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-swiss-red animate-ping" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider">HARDWARE TELEMETRY BUS</span>
              </div>
              <span className="text-[11px] font-mono text-white/70 uppercase font-bold">SYNC: T+{pulseTick}s</span>
            </div>

            {/* Animated Cardiac Oscillator Wave SVG */}
            <div className="p-5 bg-[#F8F8F8] border-b-2 border-black relative overflow-hidden">
              <div className="flex justify-between items-center mb-2 font-mono text-[10px] uppercase text-black/60 font-black">
                <span>FREQUENCY OSCILLATOR</span>
                <span className="text-swiss-red font-black">ACTIVE CADENCE</span>
              </div>

              <svg className="w-full h-20 stroke-black fill-none" viewBox="0 0 300 70">
                <path
                  d="M 0 35 L 40 35 L 50 15 L 65 55 L 75 35 L 110 35 L 120 18 L 135 52 L 145 35 L 180 35 L 190 10 L 205 60 L 215 35 L 250 35 L 260 22 L 275 48 L 285 35 L 300 35"
                  strokeWidth="2.5"
                  strokeLinecap="square"
                  strokeLinejoin="miter"
                />
                <line x1="0" y1="35" x2="300" y2="35" stroke="#000000" strokeWidth="0.5" strokeDasharray="4 4" opacity="0.3" />
              </svg>
            </div>

            {/* 4 Core Ingest Channels with Bold Numbers */}
            <div className="grid grid-cols-2 divide-x-2 divide-black divide-y-2 divide-black bg-white">
              <div className="p-4 transition-colors duration-200 hover:bg-[#F9F9F9]">
                <span className="text-[10px] font-mono font-bold text-black/50 uppercase block">CPU LOAD</span>
                <span className="text-3xl sm:text-4xl font-mono font-black text-black">{DEMO_TELEMETRY.cpu.value}%</span>
                <span className="text-[10px] font-mono text-black/60 block mt-1 font-bold">8C / 16T</span>
              </div>
              <div className="p-4 transition-colors duration-200 hover:bg-[#F9F9F9]">
                <span className="text-[10px] font-mono font-bold text-black/50 uppercase block">RAM WORKING SET</span>
                <span className="text-3xl sm:text-4xl font-mono font-black text-swiss-red">{DEMO_TELEMETRY.memory.value}%</span>
                <span className="text-[10px] font-mono text-black/60 block mt-1 font-bold">12.1 GB COMMITTED</span>
              </div>
              <div className="p-4 border-t-2 border-black transition-colors duration-200 hover:bg-[#F9F9F9]">
                <span className="text-[10px] font-mono font-bold text-black/50 uppercase block">DISK ACTIVE TIME</span>
                <span className="text-3xl sm:text-4xl font-mono font-black text-black">{DEMO_TELEMETRY.disk.value}%</span>
                <span className="text-[10px] font-mono text-black/60 block mt-1 font-bold">NVMe 4.0</span>
              </div>
              <div className="p-4 border-t-2 border-black transition-colors duration-200 hover:bg-[#F9F9F9]">
                <span className="text-[10px] font-mono font-bold text-black/50 uppercase block">UPTIME RECORD</span>
                <span className="text-2xl sm:text-3xl font-mono font-black text-black">{DEMO_TELEMETRY.uptime.value}</span>
                <span className="text-[10px] font-mono text-black/60 block mt-1 font-bold">KERNEL STABLE</span>
              </div>
            </div>

          </div>
        </ScrollReveal>

      </div>
    </section>
  );
}
