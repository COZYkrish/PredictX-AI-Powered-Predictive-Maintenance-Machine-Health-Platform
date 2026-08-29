'use client';

import { useState } from 'react';

/**
 * Detects whether the browser supports WebGL.
 * Returns false if Canvas/WebGL context creation fails.
 */
export function useWebGLAvailability(): boolean {
  const [available] = useState(() => {
    if (typeof window === 'undefined') return true;
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      return !!gl;
    } catch {
      return false;
    }
  });

  return available;
}
