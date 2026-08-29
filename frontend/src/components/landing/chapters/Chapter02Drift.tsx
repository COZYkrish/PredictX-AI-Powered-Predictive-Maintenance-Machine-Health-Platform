'use client';

import { useState } from 'react';
import { PROJECT_CONFIG } from '@/lib/landing/project-config';
import { DEMO_FORECAST } from '@/lib/landing/demo-data';
import ScrollReveal from '../ui/ScrollReveal';

export default function Chapter02Drift() {
  const [activeMetric, setActiveMetric] = useState<'ram' | 'cpu' | 'disk'>('ram');
  const f = DEMO_FORECAST;

  return (
    <section
      id="chapter-02"
      className="relative border-b-4 border-black bg-[#F8F8F8] min-h-[calc(100vh-4rem)] flex items-center py-10 lg:py-14 px-6 md:px-12 lg:px-16 swiss-dots overflow-hidden"
    >
      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        
        {/* Left Column: 7 Columns */}
        <div className="lg:col-span-7 text-left">
          
          <ScrollReveal delay={0} direction="down" distance={16}>
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-swiss-red text-white text-xs font-black px-3 py-1 tracking-widest uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                {PROJECT_CONFIG.sceneLabels.drift}
              </span>
              <span className="text-black/50 text-xs font-mono tracking-widest uppercase font-bold">
                VECTOR.02
              </span>
            </div>
          </ScrollReveal>

          <div className="space-y-1">
            <ScrollReveal delay={80} direction="up" distance={24}>
              <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black uppercase tracking-tighter leading-[0.88] text-black">
                ENTROPY IS INVISIBLE.
              </h2>
            </ScrollReveal>
            <ScrollReveal delay={160} direction="up" distance={24}>
              <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black uppercase tracking-tighter leading-[0.88] text-black/40">
                PREDICTX MAPS THE TRAJECTORY.
              </h2>
            </ScrollReveal>
          </div>

          <ScrollReveal delay={240} direction="up" distance={20}>
            <p className="mt-6 text-base sm:text-lg md:text-xl font-bold text-black/80 uppercase tracking-tight leading-snug">
              Conventional dashboards alert only after a threshold is shattered. PredictX fits rolling linear regression across 180 telemetry snapshots to project system state 30 minutes into the future.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={320} direction="up" distance={16}>
            <div className="mt-5 inline-block border-2 border-black px-3.5 py-1.5 bg-white font-mono text-xs uppercase tracking-widest text-black/80 font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              {PROJECT_CONFIG.forecastLabel}
            </div>
          </ScrollReveal>

          {/* Metric Selector Buttons */}
          <ScrollReveal delay={380} direction="up" distance={16}>
            <div className="mt-6 flex flex-wrap gap-2.5 font-mono text-xs">
              {(['ram', 'cpu', 'disk'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setActiveMetric(m)}
                  className={`px-4 py-2 uppercase font-black border-2 border-black transition-all duration-200 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 ${
                    activeMetric === m ? 'bg-black text-white' : 'bg-white text-black hover:bg-black/10'
                  }`}
                >
                  {m.toUpperCase()} TRAJECTORY
                </button>
              ))}
            </div>
          </ScrollReveal>
        </div>

        {/* Right Column: 5 Columns */}
        <ScrollReveal delay={180} direction="left" distance={36} className="lg:col-span-5 w-full">
          <div className="border-4 border-black bg-white flex flex-col shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-transform duration-300 hover:-translate-y-1">
            
            {/* Header Banner */}
            <div className="bg-black text-white px-5 py-3.5 flex justify-between items-center border-b-4 border-black">
              <div>
                <span className="text-[10px] font-mono tracking-widest text-white/60 uppercase block font-bold">LINEAR REGRESSION MODEL</span>
                <span className="text-sm font-black uppercase tracking-wider">{f.metric}</span>
              </div>
              <span className="bg-swiss-red text-white font-mono text-xs font-black px-2.5 py-1 uppercase animate-pulse">
                {f.trend} ↑
              </span>
            </div>

            {/* Graphical Projection Vector Canvas */}
            <div className="p-5 bg-white border-b-2 border-black">
              <div className="flex justify-between items-center text-xs font-mono mb-2">
                <span className="text-black/60 uppercase font-bold">TIME HORIZON (T+00M → T+30M)</span>
                <span className="text-swiss-red font-black">BREACH AT T+7.9M</span>
              </div>

              {/* Flat SVG Linear Vector Graphic */}
              <svg className="w-full h-24 stroke-black fill-none" viewBox="0 0 300 80">
                <line x1="0" y1="28" x2="300" y2="28" stroke="#ff3000" strokeWidth="2" strokeDasharray="6 4" />
                <text x="200" y="24" fill="#ff3000" fontSize="9" fontWeight="900" fontFamily="monospace">75% THRESHOLD</text>
                
                <line x1="0" y1="55" x2="100" y2="50" stroke="#000000" strokeWidth="2.5" />
                <line x1="100" y1="50" x2="300" y2="12" stroke="#ff3000" strokeWidth="3" />
                
                <circle cx="178" cy="35" r="5" fill="#ff3000" />
                <circle cx="178" cy="35" r="9" stroke="#ff3000" strokeWidth="1.5" fill="none" opacity="0.5" />
                
                <line x1="100" y1="0" x2="100" y2="80" stroke="#000000" strokeWidth="0.5" strokeDasharray="2 2" opacity="0.3" />
                <text x="95" y="76" fill="#000000" fontSize="8" fontWeight="bold" fontFamily="monospace">NOW</text>
              </svg>
            </div>

            {/* Numeric Trajectory Matrix */}
            <div className="grid grid-cols-2 border-b-2 border-black bg-black">
              <div className="bg-white p-4 border-r-2 border-black">
                <span className="text-[10px] font-bold text-black/50 uppercase block font-mono">NOW (OBSERVED)</span>
                <span className="text-3xl sm:text-4xl font-black font-mono text-black">{f.current}%</span>
                <span className="text-[10px] font-mono text-black/60 block mt-1 font-bold">129 SAMPLES</span>
              </div>
              <div className="bg-[#F8F8F8] p-4">
                <span className="text-[10px] font-bold text-swiss-red uppercase block font-mono">PROJECTED (T+30M)</span>
                <span className="text-3xl sm:text-4xl font-black font-mono text-swiss-red">{f.projected30m}%</span>
                <span className="text-[10px] font-mono text-swiss-red font-bold block mt-1">SLOPE: {f.slopePerMin}</span>
              </div>
            </div>

            {/* Breach Advisory */}
            <div className="p-4 bg-white flex flex-col gap-1.5 font-mono text-xs">
              <div className="flex justify-between items-center">
                <span className="text-black/60 uppercase font-bold">TIME TO THRESHOLD:</span>
                <span className="font-black text-swiss-red text-sm">~{f.etaThresholdMinutes} MIN</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-black/60 uppercase font-bold">ADVISORY STATUS:</span>
                <span className="font-black text-black uppercase">{f.status}</span>
              </div>
            </div>

          </div>
        </ScrollReveal>

      </div>
    </section>
  );
}
