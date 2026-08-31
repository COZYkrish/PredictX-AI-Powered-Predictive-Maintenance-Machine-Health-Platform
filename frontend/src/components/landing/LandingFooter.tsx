'use client';

import { PROJECT_CONFIG } from '@/lib/landing/project-config';
import ScrollReveal from './ui/ScrollReveal';

export default function LandingFooter() {
  return (
    <footer className="relative z-20 bg-[#050505] border-t border-white/10 text-[#fafafa] font-manrope">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-12 border-b border-white/10">
          
          {/* Col 1: Brand & Philosophy */}
          <ScrollReveal delay={0} direction="up" distance={20} className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <span className="bg-white text-[#050505] font-black text-sm px-2.5 py-1 uppercase tracking-tight rounded-sm shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                {PROJECT_CONFIG.name}
              </span>
              <span className="text-xs font-mono font-bold text-[#a7a6a6] uppercase tracking-wider">
                AUTONOMOUS SYSTEM INTELLIGENCE
              </span>
            </div>
            <p className="text-xs font-medium text-[#a7a6a6] uppercase tracking-tight max-w-md leading-relaxed">
              Objective Windows telemetry analysis through supervised XGBoost classification, temporal feature engineering, and automated remediation verification.
            </p>
          </ScrollReveal>

          {/* Col 2: Pipeline Specs */}
          <ScrollReveal delay={100} direction="up" distance={20} className="space-y-2 font-mono text-xs">
            <span className="font-black uppercase tracking-widest text-[#fafafa] block mb-3">PIPELINE SPEC</span>
            <div className="text-[#a7a6a6] font-bold">FEATURES: 48 TEMPORAL</div>
            <div className="text-[#a7a6a6] font-bold">MODEL: XGBOOST + ISO FOREST</div>
            <div className="text-[#a7a6a6] font-bold">VERIFICATION: 120s WINDOW</div>
          </ScrollReveal>

          {/* Col 3: System Reference */}
          <ScrollReveal delay={200} direction="up" distance={20} className="space-y-2 font-mono text-xs">
            <span className="font-black uppercase tracking-widest text-[#fafafa] block mb-3">SYSTEM REF</span>
            <div className="text-[#a7a6a6] font-bold">HOST: WINDOWS x64</div>
            <div className="text-[#a7a6a6] font-bold">STATUS: PRODUCTION ACTIVE</div>
            <div className="text-swiss-red font-black">ZERO FALSE OPTIMISMS</div>
          </ScrollReveal>

        </div>

        {/* Bottom Metadata Bar */}
        <ScrollReveal delay={300} direction="up" distance={10}>
          <div className="pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] font-mono text-[#8b8a8a] uppercase tracking-widest font-bold">
            <div>© {new Date().getFullYear()} PREDICTX PLATFORM. ALL RIGHTS RESERVED.</div>
            <div>AUTONOMOUS SYSTEM HEALTH & PREDICTIVE MAINTENANCE SPECIFICATION</div>
          </div>
        </ScrollReveal>
      </div>
    </footer>
  );
}
