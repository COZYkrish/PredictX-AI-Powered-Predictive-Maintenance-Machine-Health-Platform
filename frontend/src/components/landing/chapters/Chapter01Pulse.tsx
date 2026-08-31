'use client';

import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { PROJECT_CONFIG } from '@/lib/landing/project-config';

export default function Chapter01Pulse() {
  const [email, setEmail] = useState('');

  return (
    <section
      id="chapter-01"
      className="relative h-screen w-full overflow-hidden bg-black font-geist antialiased"
    >
      {/* Background Video — full-bleed continuous loop */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 h-full w-full object-cover pointer-events-none"
      >
        <source
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260803_192301_9231ed6b-c55c-4a48-909c-4ebe11cf2e11.mp4"
          type="video/mp4"
        />
      </video>

      {/* Foreground Content Container */}
      <div className="relative z-10 flex flex-col h-full justify-end">
        
        {/* Bottom-Anchored Main Content */}
        <main className="flex flex-col lg:flex-row lg:items-end lg:justify-between px-5 pb-8 sm:px-8 sm:pb-12 lg:px-12 lg:pb-16 gap-6 sm:gap-8">
          
          {/* Left Column: Headline + Email CTA */}
          <div className="max-w-xl">
            <h1 className="text-3xl sm:text-4xl lg:text-[3.5rem] font-semibold leading-[1.1] tracking-tight text-[#010101] lg:text-white">
              Predict system failures before your machine halts
            </h1>

            {/* Email CTA */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (email) window.location.href = `${PROJECT_CONFIG.routes.register}?email=${encodeURIComponent(email)}`;
              }}
              className="mt-6 sm:mt-8 flex flex-col sm:flex-row sm:inline-flex sm:items-center rounded-full sm:bg-white sm:p-1.5 gap-3 sm:gap-0"
            >
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Type your work email"
                className="rounded-full bg-white px-5 py-3 text-sm text-gray-900 placeholder-gray-400 sm:w-64 sm:rounded-none sm:bg-transparent sm:px-4 sm:py-2 outline-none"
              />
              <button
                type="submit"
                className="rounded-full px-6 py-3 sm:py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity border border-white/10"
                style={{ background: 'linear-gradient(to bottom, #2B2B2B, #101010)' }}
              >
                Deploy Agent
              </button>
            </form>
          </div>

          {/* Right Column: Two Glass Cards */}
          <div className="flex flex-col gap-4 sm:flex-row lg:w-auto lg:gap-5">
            
            {/* Stats Card: 30-Min Linear Trajectory Forecast */}
            <div className="rounded-2xl bg-white/10 backdrop-blur-lg p-5 sm:p-6 border border-white/10 sm:w-64 flex flex-col justify-between shadow-xl">
              <div>
                <div
                  className="font-silkscreen text-3xl sm:text-4xl font-normal tracking-tight text-[#010101] lg:text-white"
                  style={{ fontFamily: "'Silkscreen', cursive" }}
                >
                  30 MIN+
                </div>
                <p className="text-sm leading-relaxed mt-3 sm:mt-4 text-[#010101]/70 lg:text-white/70">
                  Early breach horizon via rolling regression & dual-engine ML classification.
                </p>
              </div>
            </div>

            {/* Testimonial Card: Systems Reliability Quote */}
            <div className="rounded-2xl bg-white/10 backdrop-blur-lg p-5 sm:p-6 border border-white/10 sm:w-64 flex flex-col justify-between shadow-xl">
              <div>
                {/* Header row with PredictX Kernel badge */}
                <div className="flex items-center gap-2 mb-3 sm:mb-4">
                  <div className="w-6 h-6 rounded-md bg-black flex items-center justify-center text-white text-xs font-black">
                    <ShieldCheck className="w-3.5 h-3.5 text-swiss-red" />
                  </div>
                  <span className="text-sm font-semibold text-[#010101] lg:text-white">
                    PredictX Ops
                  </span>
                </div>

                <p className="text-sm leading-relaxed text-[#010101]/80 lg:text-white/80">
                  &quot;With PredictX we eliminated sudden panic crashes with real-time 48-vector telemetry and closed-loop verification.&quot;
                </p>
              </div>

              {/* Footer Author Row */}
              <div className="mt-4 sm:mt-5 flex items-center gap-3">
                <img
                  src="https://i.pravatar.cc/72?img=68"
                  alt="Alex Rivera"
                  className="w-9 h-9 rounded-full object-cover bg-white/20"
                />
                <div>
                  <div className="text-sm font-semibold text-[#010101] lg:text-white">
                    Alex Rivera
                  </div>
                  <div className="text-xs text-[#010101]/60 lg:text-white/60">
                    Lead Systems Architect
                  </div>
                </div>
              </div>
            </div>

          </div>

        </main>
      </div>
    </section>
  );
}
