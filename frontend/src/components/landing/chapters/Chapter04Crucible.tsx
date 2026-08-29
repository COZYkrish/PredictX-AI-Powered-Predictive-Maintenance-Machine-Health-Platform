'use client';

import { useState } from 'react';
import { PROJECT_CONFIG } from '@/lib/landing/project-config';
import { DEMO_INCIDENT } from '@/lib/landing/demo-data';
import ScrollReveal from '../ui/ScrollReveal';

export default function Chapter04Crucible() {
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const inc = DEMO_INCIDENT;

  const toggleStep = (idx: number) => {
    setCompletedSteps((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  return (
    <section
      id="chapter-04"
      className="relative border-b-4 border-black bg-[#F8F8F8] min-h-[calc(100vh-4rem)] flex items-center py-10 lg:py-14 px-6 md:px-12 lg:px-16 swiss-diagonal overflow-hidden"
    >
      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        
        {/* Left Column: 7 Columns */}
        <div className="lg:col-span-7 text-left">
          
          <ScrollReveal delay={0} direction="down" distance={16}>
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-swiss-red text-white text-xs font-black px-3 py-1 tracking-widest uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                {PROJECT_CONFIG.sceneLabels.crucible}
              </span>
              <span className="text-black/50 text-xs font-mono tracking-widest uppercase font-bold">
                {inc.id}
              </span>
            </div>
          </ScrollReveal>

          <div className="space-y-1">
            <ScrollReveal delay={80} direction="up" distance={24}>
              <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black uppercase tracking-tighter leading-[0.88] text-black">
                ANOMALY DETECTED.
              </h2>
            </ScrollReveal>
            <ScrollReveal delay={160} direction="up" distance={24}>
              <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black uppercase tracking-tighter leading-[0.88] text-swiss-red">
                CONTRIBUTORS EXPOSED.
              </h2>
            </ScrollReveal>
          </div>

          <ScrollReveal delay={240} direction="up" distance={20}>
            <p className="mt-6 text-base sm:text-lg md:text-xl font-bold text-black/80 uppercase tracking-tight leading-snug">
              PredictX rejects opaque alert noise. When anomalous resource pressure occurs, the system surfaces an evidence docket: process footprints, memory delta trajectories, and exact remediation steps.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={320} direction="up" distance={16}>
            <div className="mt-5 inline-block border-2 border-black px-3.5 py-1.5 bg-white font-mono text-xs uppercase tracking-widest text-black/80 font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              {PROJECT_CONFIG.incidentLabel}
            </div>
          </ScrollReveal>

          <ScrollReveal delay={380} direction="up" distance={16}>
            <div className="mt-6 p-4 bg-white border-2 border-black font-mono text-xs text-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex items-center gap-2 text-swiss-red font-bold uppercase mb-1 text-sm">
                <span>⚠ AUTOMATED THRESHOLD DEFENSE ENGAGED</span>
              </div>
              <p className="text-black/70 uppercase text-xs">
                Memory working set exceeds threshold boundary by {inc.deltaFromNormal} above rolling baseline.
              </p>
            </div>
          </ScrollReveal>
        </div>

        {/* Right Column: 5 Columns */}
        <ScrollReveal delay={180} direction="left" distance={36} className="lg:col-span-5 w-full">
          <div className="border-4 border-black bg-white flex flex-col shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-transform duration-300 hover:-translate-y-1">
            
            {/* Swiss Red Alert Header */}
            <div className="bg-swiss-red text-white px-5 py-3.5 flex justify-between items-center border-b-4 border-black">
              <div>
                <span className="font-mono text-[10px] tracking-widest text-white/80 uppercase block font-bold">{inc.id}</span>
                <span className="text-sm sm:text-base font-black uppercase tracking-wider">{inc.condition}</span>
              </div>
              <span className="bg-black text-white font-mono text-xs font-bold px-2 py-1 uppercase">
                {inc.severity}
              </span>
            </div>

            {/* Telemetry Matrix Bar with Big Numbers */}
            <div className="grid grid-cols-3 border-b-2 border-black bg-black">
              <div className="bg-white p-3 text-center border-r-2 border-black">
                <span className="text-[9px] font-bold text-black/50 uppercase block font-mono">OBSERVED</span>
                <span className="text-xl sm:text-2xl font-black font-mono text-swiss-red">{inc.observed}%</span>
              </div>
              <div className="bg-white p-3 text-center border-r-2 border-black">
                <span className="text-[9px] font-bold text-black/50 uppercase block font-mono">DELTA</span>
                <span className="text-xl sm:text-2xl font-black font-mono text-black">{inc.deltaFromNormal}</span>
              </div>
              <div className="bg-white p-3 text-center">
                <span className="text-[9px] font-bold text-black/50 uppercase block font-mono">DURATION</span>
                <span className="text-xl sm:text-2xl font-black font-mono text-black">{inc.duration}</span>
              </div>
            </div>

            {/* Likely Contributors List */}
            <div className="p-4 border-b-2 border-black bg-[#F8F8F8]">
              <span className="text-[10px] font-black uppercase tracking-widest text-black/70 block mb-2 font-mono">
                IDENTIFIED WORKING SET PROCESSES
              </span>
              <div className="space-y-1.5 font-mono text-xs">
                {inc.likelyContributors.map((c) => (
                  <div key={c.rank} className="flex justify-between items-center bg-white p-2 border border-black/20">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-swiss-red text-xs">{c.rank}</span>
                      <span className="font-bold text-black text-xs uppercase truncate max-w-[200px]">{c.process}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-black/70 font-bold">{c.impact}</span>
                      <span className={`text-[8px] font-black px-1.5 py-0.5 uppercase ${
                        c.confidence === 'SUPPORTED' ? 'bg-black text-white' : 'bg-black/10 text-black'
                      }`}>
                        {c.confidence}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Interactive Action Protocol Checklist */}
            <div className="p-4 bg-white font-mono">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-black/70 block">
                  REMEDIATION PROTOCOL (INTERACTIVE)
                </span>
                <span className="text-xs font-bold text-swiss-red">
                  {completedSteps.length}/{inc.remediationProtocol.length} COMPLETED
                </span>
              </div>
              
              <div className="space-y-1.5">
                {inc.remediationProtocol.map((step, idx) => {
                  const isChecked = completedSteps.includes(idx);
                  return (
                    <div
                      key={idx}
                      onClick={() => toggleStep(idx)}
                      className={`flex items-start gap-2.5 p-2 border cursor-pointer transition-all duration-150 ${
                        isChecked ? 'bg-black text-white border-black' : 'bg-white text-black border-black/20 hover:border-black'
                      }`}
                    >
                      <span className={`font-bold text-xs ${isChecked ? 'text-swiss-red' : 'text-swiss-red'}`}>
                        {isChecked ? '✓' : `0${idx + 1}.`}
                      </span>
                      <span className={`text-[11px] uppercase font-bold ${isChecked ? 'line-through opacity-80' : ''}`}>
                        {step}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </ScrollReveal>

      </div>
    </section>
  );
}
