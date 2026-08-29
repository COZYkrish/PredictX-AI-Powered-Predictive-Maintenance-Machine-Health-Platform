'use client';

import { PROJECT_CONFIG } from '@/lib/landing/project-config';
import { DEMO_ML_BENCHMARK } from '@/lib/landing/demo-data';
import ScrollReveal from '../ui/ScrollReveal';

export default function Chapter03Cognition() {
  const m = DEMO_ML_BENCHMARK;

  return (
    <section
      id="chapter-03"
      className="relative border-b-4 border-black bg-white min-h-[calc(100vh-4rem)] flex items-center py-10 lg:py-14 px-6 md:px-12 lg:px-16 swiss-grid-pattern overflow-hidden"
    >
      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        
        {/* Left Column: 7 Columns */}
        <div className="lg:col-span-7 text-left">
          
          <ScrollReveal delay={0} direction="down" distance={16}>
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-swiss-red text-white text-xs font-black px-3 py-1 tracking-widest uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                {PROJECT_CONFIG.sceneLabels.cognition}
              </span>
              <span className="text-black/50 text-xs font-mono tracking-widest uppercase font-bold">
                AI-ENGINE.03
              </span>
            </div>
          </ScrollReveal>

          <div className="space-y-1">
            <ScrollReveal delay={80} direction="up" distance={24}>
              <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black uppercase tracking-tighter leading-[0.88] text-black">
                TWO ML ENGINES.
              </h2>
            </ScrollReveal>
            <ScrollReveal delay={160} direction="up" distance={24}>
              <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black uppercase tracking-tighter leading-[0.88] text-swiss-red">
                ZERO GUESSWORK.
              </h2>
            </ScrollReveal>
          </div>

          <ScrollReveal delay={240} direction="up" distance={20}>
            <p className="mt-6 text-base sm:text-lg md:text-xl font-bold text-black/80 uppercase tracking-tight leading-snug">
              PredictX unites supervised gradient-boosted classification (XGBoost, {PROJECT_CONFIG.trainingSamples} samples) with unsupervised behavioral anomaly clustering (Isolation Forest) across 48 engineered temporal features.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={320} direction="up" distance={16}>
            <div className="mt-5 inline-block border-2 border-black px-3.5 py-1.5 bg-white font-mono text-xs uppercase tracking-widest text-black/80 font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              {PROJECT_CONFIG.cognitionLabel}
            </div>
          </ScrollReveal>

          {/* System State Indices */}
          <ScrollReveal delay={380} direction="up" distance={16}>
            <div className="mt-6 border-4 border-black p-4 bg-white grid grid-cols-3 gap-3 text-center shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <div className="border-r-2 border-black pr-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-black/50 block font-mono">HEALTH</span>
                <span className="text-2xl sm:text-3xl font-mono font-black text-black">{m.systemState.healthScore}/100</span>
              </div>
              <div className="border-r-2 border-black pr-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-black/50 block font-mono">RISK LEVEL</span>
                <span className="text-2xl sm:text-3xl font-mono font-black text-swiss-red">{m.systemState.riskLevel}</span>
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-black/50 block font-mono">ISO FOREST</span>
                <span className="text-2xl sm:text-3xl font-mono font-black text-black">ANOMALOUS</span>
              </div>
            </div>
          </ScrollReveal>
        </div>

        {/* Right Column: 5 Columns */}
        <ScrollReveal delay={180} direction="left" distance={36} className="lg:col-span-5 w-full">
          <div className="border-4 border-black bg-white flex flex-col shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-transform duration-300 hover:-translate-y-1">
            
            {/* Header */}
            <div className="bg-black text-white px-4 py-3 flex justify-between items-center border-b-2 border-black font-mono text-xs font-bold">
              <span className="uppercase">MODEL EVALUATION BENCHMARK</span>
              <span className="uppercase">F1 / PR-AUC</span>
            </div>

            {/* Leaderboard Table with Staggered Elements */}
            <div className="divide-y-2 divide-black/10">
              {m.models.map((item, idx) => (
                <div
                  key={item.name}
                  className={`px-4 py-2.5 flex justify-between items-center font-mono text-xs transition-colors duration-150 ${
                    item.active ? 'bg-swiss-red/10 border-l-4 border-swiss-red' : 'hover:bg-[#F9F9F9]'
                  }`}
                >
                  <div>
                    <div className="font-black text-black flex items-center gap-1.5 text-xs sm:text-sm">
                      <span>{item.name}</span>
                      {item.active && (
                        <span className="bg-black text-white text-[9px] px-1.5 py-0.5 uppercase font-black">ACTIVE</span>
                      )}
                    </div>
                    <span className="text-[10px] text-black/60 uppercase font-bold">{item.status}</span>
                  </div>
                  <div className="text-right">
                    <span className={`font-black text-sm sm:text-base ${item.active ? 'text-swiss-red' : 'text-black'}`}>
                      {item.f1}
                    </span>
                    <span className="text-[10px] text-black/60 block font-bold">AUC {item.auc}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Top Feature Importances */}
            <div className="p-4 bg-[#F8F8F8] border-t-2 border-black">
              <span className="text-[10px] font-mono font-black uppercase tracking-widest text-black/70 block mb-2.5">
                TOP FEATURE ATTRIBUTION (48 FEATURES)
              </span>
              <div className="space-y-2 font-mono text-xs">
                {m.topFeatures.slice(0, 4).map((f) => (
                  <div key={f.name} className="flex flex-col gap-0.5">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-black/80 font-bold">{f.name}</span>
                      <span className="font-black text-black">{f.weight}%</span>
                    </div>
                    <div className="w-full bg-black/10 h-1.5 overflow-hidden">
                      <div
                        className="bg-black h-full transition-all duration-700 ease-out"
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
