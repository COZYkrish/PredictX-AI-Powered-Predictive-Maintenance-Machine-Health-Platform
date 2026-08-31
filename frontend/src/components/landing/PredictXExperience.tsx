'use client';

import LandingNavbar from './LandingNavbar';
import LandingFooter from './LandingFooter';
import SmoothScroll from './ui/SmoothScroll';

import Chapter01Pulse from './chapters/Chapter01Pulse';
import Chapter02Drift from './chapters/Chapter02Drift';
import Chapter03Cognition from './chapters/Chapter03Cognition';
import Chapter04Crucible from './chapters/Chapter04Crucible';
import Chapter05Restoration from './chapters/Chapter05Restoration';

/**
 * PredictXExperience — Cinematic AI Landing Platform.
 * Features Lenis 120 FPS inertial smooth scrolling, hardware acceleration, and dynamic video decode optimization.
 */
export default function PredictXExperience() {
  return (
    <SmoothScroll>
      <div className="bg-white text-black min-h-screen relative font-geist selection:bg-swiss-red selection:text-white">
        {/* Floating Glass Navbar */}
        <LandingNavbar />

        {/* Chapters Flow with Inertial Smooth Scrolling */}
        <main className="w-full flex flex-col">
          <Chapter01Pulse />
          <Chapter02Drift />
          <Chapter03Cognition />
          <Chapter04Crucible />
          <Chapter05Restoration />
          <LandingFooter />
        </main>
      </div>
    </SmoothScroll>
  );
}
