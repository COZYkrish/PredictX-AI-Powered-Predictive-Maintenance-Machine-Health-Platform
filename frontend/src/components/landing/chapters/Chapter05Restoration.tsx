'use client';

import { useState } from 'react';
import Link from 'next/link';
import { DEMO_RESTORATION } from '@/lib/landing/demo-data';
import { PROJECT_CONFIG } from '@/lib/landing/project-config';
import ScrollReveal from '../ui/ScrollReveal';

export default function Chapter05Restoration() {
  const [activeStage, setActiveStage] = useState(3);
  const res = DEMO_RESTORATION;
  const cfg = PROJECT_CONFIG;

  return (
    <section
      id="chapter-05"
      className="relative border-b-4 border-black bg-white min-h-[calc(100vh-4rem)] flex items-center py-12 lg:py-16 px-6 md:px-12 lg:px-16 swiss-grid-pattern overflow-hidden"
    >
      <div className="max-w-5xl mx-auto w-full flex flex-col items-center text-center gap-8">
        
        {/* Chapter Prefix */}
        <ScrollReveal delay={0} direction="down" distance={16}>
          <div className="flex items-center gap-3">
            <span className="bg-swiss-red text-white text-xs font-black px-3 py-1 tracking-widest uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              {cfg.sceneLabels.restoration}
            </span>
            <span className="text-black/50 text-xs font-mono tracking-widest uppercase font-bold">
              EQUILIBRIUM.05
            </span>
          </div>
        </ScrollReveal>

        {/* Staggered Display Title */}
        <div className="max-w-3xl space-y-1">
          <ScrollReveal delay={80} direction="up" distance={24}>
            <h2 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black uppercase tracking-tighter text-black leading-none">
              CLOSED-LOOP
            </h2>
          </ScrollReveal>
          <ScrollReveal delay={140} direction="up" distance={24}>
            <h2 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black uppercase tracking-tighter text-swiss-red leading-none">
              RESOLUTION.
            </h2>
          </ScrollReveal>
          <ScrollReveal delay={220} direction="up" distance={20}>
            <p className="mt-5 text-base sm:text-lg md:text-xl font-bold text-black/80 max-w-xl mx-auto uppercase tracking-tight leading-snug">
              Remediation without verification is guesswork. PredictX validates telemetry stability over a 120-second window before declaring the system healthy.
            </p>
          </ScrollReveal>
        </div>

        {/* 4-Stage Drain Cascade Blocks with Staggered Visuals */}
        <ScrollReveal delay={280} direction="up" distance={20} className="w-full max-w-2xl">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 border-4 border-black bg-black p-2 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            {res.stages.map((stage, i) => {
              const isSelected = activeStage === i;
              const isFinal = i === res.stages.length - 1;
              return (
                <div
                  key={stage.time}
                  onClick={() => setActiveStage(i)}
                  className={`p-3.5 text-center cursor-pointer transition-all duration-200 hover:-translate-y-0.5 ${
                    isSelected
                      ? isFinal
                        ? 'bg-swiss-red text-white'
                        : 'bg-black text-white'
                      : 'bg-white text-black hover:bg-[#F2F2F2]'
                  }`}
                >
                  <span className="font-mono text-[10px] font-bold block uppercase mb-1 opacity-70">
                    {stage.time}
                  </span>
                  <span className="font-mono text-2xl sm:text-3xl font-black block">
                    {stage.value}%
                  </span>
                  <span className="font-mono text-[9px] uppercase tracking-wider block opacity-80 mt-1 font-bold">
                    {stage.state}
                  </span>
                </div>
              );
            })}
          </div>
        </ScrollReveal>

        {/* Verification Success Matrix */}
        <ScrollReveal delay={340} direction="up" distance={20} className="w-full max-w-2xl">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="border-2 border-black p-3.5 bg-white text-left shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-transform duration-200 hover:-translate-y-0.5">
              <span className="text-[9px] font-black uppercase tracking-widest text-black/50 block font-mono">VERIFICATION</span>
              <span className="text-sm font-mono font-black text-black">{res.verificationDuration}S CONFIRMED</span>
            </div>
            <div className="border-2 border-black p-3.5 bg-white text-left shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-transform duration-200 hover:-translate-y-0.5">
              <span className="text-[9px] font-black uppercase tracking-widest text-black/50 block font-mono">INCIDENT STATE</span>
              <span className="text-sm font-mono font-black text-swiss-red">✓ {res.alertStatus}</span>
            </div>
            <div className="border-2 border-black p-3.5 bg-white text-left shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-transform duration-200 hover:-translate-y-0.5">
              <span className="text-[9px] font-black uppercase tracking-widest text-black/50 block font-mono">HEALTH INDEX</span>
              <span className="text-sm font-mono font-black text-black">
                {res.healthScoreBefore} <span className="text-black/40">→</span> <span className="text-swiss-red">{res.healthScoreAfter}/100</span>
              </span>
            </div>
          </div>
        </ScrollReveal>

        {/* 5-Stage Operating Doctrine Ribbon */}
        <ScrollReveal delay={400} direction="up" distance={16} className="w-full max-w-3xl">
          <div className="flex flex-wrap justify-center items-center gap-2 md:gap-4 py-2.5 border-y-2 border-black/10">
            {cfg.workflowStages.map((stg, i) => (
              <div key={stg.num} className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-swiss-red">{stg.num}.</span>
                <span className="font-black text-xs sm:text-sm uppercase tracking-wider text-black">{stg.label}</span>
                {i < cfg.workflowStages.length - 1 && (
                  <span className="text-black/30 mx-1 hidden sm:inline">/</span>
                )}
              </div>
            ))}
          </div>
        </ScrollReveal>

        {/* Action CTAs */}
        <ScrollReveal delay={460} direction="up" distance={20} className="w-full max-w-md">
          <div className="flex flex-col sm:flex-row items-center gap-3.5">
            <Link href={cfg.routes.register} className="w-full sm:w-1/2">
              <button className="w-full h-14 bg-black text-white font-black text-sm uppercase tracking-widest hover:bg-swiss-red hover:text-white transition-all duration-200 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5">
                DEPLOY AGENT
              </button>
            </Link>
            <Link href={cfg.routes.dashboard} className="w-full sm:w-1/2">
              <button className="w-full h-14 bg-white text-black font-black text-sm uppercase tracking-widest hover:bg-black hover:text-white transition-all duration-200 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5">
                LAUNCH DEMO
              </button>
            </Link>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={520} direction="up" distance={12}>
          <div className="flex items-center gap-3 text-xs font-mono font-bold text-black/60 uppercase tracking-widest">
            <Link href={cfg.routes.login} className="hover:text-swiss-red underline decoration-2 underline-offset-4">
              LOGIN TO WORKSPACE
            </Link>
            <span>•</span>
            <span>{cfg.verificationLabel}</span>
          </div>
        </ScrollReveal>

      </div>
    </section>
  );
}
