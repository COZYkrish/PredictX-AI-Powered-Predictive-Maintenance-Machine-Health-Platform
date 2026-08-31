'use client';

import { Flower2, Sparkles } from 'lucide-react';
import { PROJECT_CONFIG } from '@/lib/landing/project-config';
import { DEMO_ML_BENCHMARK } from '@/lib/landing/demo-data';
import ScrollReveal from '../ui/ScrollReveal';

export default function Chapter03Cognition() {
  const m = DEMO_ML_BENCHMARK;

  return (
    <section
      id="chapter-03"
      className="relative bg-black text-white h-screen min-h-screen w-full flex items-center justify-center overflow-hidden pt-20 pb-8 px-6 md:px-12 lg:px-16"
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
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260819_212700_3bb9329b-5c50-4257-a09b-ca85cf3654a3.mp4"
            type="video/mp4"
          />
        </video>
      </div>

      {/* Main Content Grid */}
      <div className="relative z-10 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
        
        {/* Left Column: 7 Columns */}
        <div className="lg:col-span-7 text-left">
          
          {/* Luxury Eyebrow Pill */}
          <ScrollReveal delay={0} direction="down" distance={12}>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-2 rounded-full bg-black/40 backdrop-blur-md px-3.5 py-1 border border-white/20 text-white text-xs font-mono shadow-lg">
                <Flower2 className="w-3.5 h-3.5 text-white animate-spin" style={{ animationDuration: '12s' }} />
                <span className="font-bold tracking-widest uppercase">{PROJECT_CONFIG.sceneLabels.cognition}</span>
              </div>
              <span className="text-white/70 text-xs font-mono tracking-widest uppercase font-semibold [text-shadow:_0_1px_8px_rgba(0,0,0,0.8)]">
                AI-ENGINE.03
              </span>
            </div>
          </ScrollReveal>

          {/* Instrument Serif Luxury Headline */}
          <div className="space-y-0.5">
            <ScrollReveal delay={80} direction="up" distance={20}>
              <h2 className="font-instrument text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-white leading-[0.92] tracking-tight [text-shadow:_0_4px_24px_rgba(0,0,0,0.9)]">
                Two ML Engines.
              </h2>
            </ScrollReveal>
            <ScrollReveal delay={140} direction="up" distance={20}>
              <h2 className="font-instrument italic text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-white leading-[0.92] tracking-tight [text-shadow:_0_4px_24px_rgba(0,0,0,0.9)]">
                Zero Guesswork.
              </h2>
            </ScrollReveal>
          </div>

          {/* Subcopy with high-clarity backdrop text shadow */}
          <ScrollReveal delay={200} direction="up" distance={16}>
            <p className="mt-5 text-base sm:text-lg md:text-xl font-normal text-white/90 leading-relaxed max-w-xl [text-shadow:_0_2px_12px_rgba(0,0,0,0.9)]">
              PredictX unites supervised gradient-boosted classification (XGBoost, {PROJECT_CONFIG.trainingSamples} samples) with unsupervised behavioral anomaly clustering (Isolation Forest) across 48 engineered temporal features.
            </p>
          </ScrollReveal>

          {/* System State Glass Matrix */}
          <ScrollReveal delay={280} direction="up" distance={12}>
            <div className="mt-6 rounded-2xl bg-black/50 backdrop-blur-xl border border-white/20 p-4 grid grid-cols-3 gap-3 text-center shadow-[0_8px_32px_rgba(0,0,0,0.6)] max-w-lg">
              <div className="border-r border-white/15 pr-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/60 block font-mono">HEALTH</span>
                <span className="text-2xl sm:text-3xl font-mono font-bold text-white">{m.systemState.healthScore}/100</span>
              </div>
              <div className="border-r border-white/15 pr-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/60 block font-mono">RISK LEVEL</span>
                <span className="text-2xl sm:text-3xl font-mono font-bold text-swiss-red">{m.systemState.riskLevel}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/60 block font-mono">ISO FOREST</span>
                <span className="text-2xl sm:text-3xl font-mono font-bold text-white">ANOMALOUS</span>
              </div>
            </div>
          </ScrollReveal>

        </div>

        {/* Right Column: 5 Columns — Glassmorphic ML Benchmark Leaderboard */}
        <ScrollReveal delay={180} direction="left" distance={30} className="lg:col-span-5 w-full">
          <div className="rounded-2xl bg-black/60 backdrop-blur-2xl border border-white/20 flex flex-col shadow-[0_16px_48px_rgba(0,0,0,0.8)] overflow-hidden transition-transform duration-300 hover:scale-[1.01]">
            
            {/* Header */}
            <div className="bg-white/10 px-5 py-3.5 flex justify-between items-center border-b border-white/15 font-mono text-xs font-semibold text-white">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-white/90" />
                <span className="uppercase tracking-wider">MODEL EVALUATION BENCHMARK</span>
              </div>
              <span className="uppercase text-white/70">F1 / PR-AUC</span>
            </div>

            {/* Leaderboard Table with Glass Accent */}
            <div className="divide-y divide-white/10">
              {m.models.map((item) => (
                <div
                  key={item.name}
                  className={`px-4 py-2.5 flex justify-between items-center font-mono text-xs transition-colors duration-150 ${
                    item.active ? 'bg-white/15 border-l-2 border-white' : 'hover:bg-white/5'
                  }`}
                >
                  <div>
                    <div className="font-bold text-white flex items-center gap-1.5 text-xs sm:text-sm">
                      <span>{item.name}</span>
                      {item.active && (
                        <span className="bg-white text-black text-[9px] px-1.5 py-0.5 uppercase font-bold rounded-sm">ACTIVE</span>
                      )}
                    </div>
                    <span className="text-[10px] text-white/60 uppercase">{item.status}</span>
                  </div>
                  <div className="text-right">
                    <span className={`font-bold text-sm sm:text-base ${item.active ? 'text-white' : 'text-white/90'}`}>
                      {item.f1}
                    </span>
                    <span className="text-[10px] text-white/60 block">AUC {item.auc}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Top Feature Importances */}
            <div className="p-4 bg-white/[0.04] border-t border-white/15">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-white/80 block mb-2.5">
                TOP FEATURE ATTRIBUTION (48 FEATURES)
              </span>
              <div className="space-y-2 font-mono text-xs">
                {m.topFeatures.slice(0, 4).map((f) => (
                  <div key={f.name} className="flex flex-col gap-0.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-white/90 font-medium">{f.name}</span>
                      <span className="font-bold text-white">{f.weight}%</span>
                    </div>
                    <div className="w-full bg-white/15 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-white h-full rounded-full transition-all duration-700 ease-out shadow-[0_0_8px_rgba(255,255,255,0.8)]"
                        style={{ width: `${f.weight * 1.8}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </ScrollReveal>

      </div>
    </section>
  );
}
