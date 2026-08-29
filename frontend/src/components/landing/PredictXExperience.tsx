'use client';

import LandingNavbar from './LandingNavbar';
import LandingFooter from './LandingFooter';

import Chapter01Pulse from './chapters/Chapter01Pulse';
import Chapter02Drift from './chapters/Chapter02Drift';
import Chapter03Cognition from './chapters/Chapter03Cognition';
import Chapter04Crucible from './chapters/Chapter04Crucible';
import Chapter05Restoration from './chapters/Chapter05Restoration';

/**
 * PredictXExperience — Flat Animated Swiss International Storytelling Platform.
 * 5 Chapters: THE PULSE → THE DRIFT → THE COGNITION → THE CRUCIBLE → THE RESTORATION
 */
export default function PredictXExperience() {
  return (
    <div className="bg-white text-black min-h-screen relative font-sans selection:bg-swiss-red selection:text-white pt-16">
      {/* Swiss Navbar */}
      <LandingNavbar />

      {/* 5 Cinematic Sequential Chapters */}
      <main className="w-full flex flex-col">
        <Chapter01Pulse />
        <Chapter02Drift />
        <Chapter03Cognition />
        <Chapter04Crucible />
        <Chapter05Restoration />
      </main>

      {/* Swiss Footer */}
      <LandingFooter />
    </div>
  );
}
