'use client';

import React, { useRef, useEffect } from 'react';
import { Renderer, Program, Mesh, Triangle } from 'ogl';
import { cn } from '@/lib/utils';
import './DitherWave.css';

export interface DitherWaveProps extends React.HTMLAttributes<HTMLDivElement> {
  color1?: string; // Background Color (e.g. #050505)
  color2?: string; // Foreground / Wave Peak Color (e.g. #ff3000 or #ffffff)
  speed?: number;
  waveFrequency?: number;
  waveAmplitude?: number;
  ditherScale?: number; // Pixel/Dither grid step
  interactive?: boolean;
}

const hexToRGB = (hex: string): [number, number, number] => {
  const c = hex.replace('#', '').padEnd(6, '0');
  const r = parseInt(c.slice(0, 2), 16) / 255;
  const g = parseInt(c.slice(2, 4), 16) / 255;
  const b = parseInt(c.slice(4, 6), 16) / 255;
  return [r, g, b];
};

export const DitherWave: React.FC<DitherWaveProps> = ({
  color1 = '#050505',
  color2 = '#ff3000',
  speed = 1.0,
  waveFrequency = 2.5,
  waveAmplitude = 0.5,
  ditherScale = 3.0,
  interactive = true,
  className,
  ...props
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    let renderer: Renderer | null = null;

    try {
      renderer = new Renderer({ antialias: false, alpha: true });
    } catch (e) {
      console.warn('WebGL not supported for DitherWave', e);
      return;
    }

    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);

    const vertexShader = `
      attribute vec2 position;
      attribute vec2 uv;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    const fragmentShader = `
      precision highp float;
      uniform float uTime;
      uniform vec3 uResolution;
      uniform vec3 uColor1;
      uniform vec3 uColor2;
      uniform float uSpeed;
      uniform float uWaveFrequency;
      uniform float uWaveAmplitude;
      uniform float uDitherScale;
      uniform vec2 uMouse;
      varying vec2 vUv;

      // 4x4 Bayer Dithering Matrix
      float bayer4(vec2 p) {
          vec2 b = floor(mod(p, 4.0));
          int x = int(b.x);
          int y = int(b.y);
          if (y == 0) {
              if (x == 0) return 0.0 / 16.0;
              if (x == 1) return 8.0 / 16.0;
              if (x == 2) return 2.0 / 16.0;
              return 10.0 / 16.0;
          } else if (y == 1) {
              if (x == 0) return 12.0 / 16.0;
              if (x == 1) return 4.0 / 16.0;
              if (x == 2) return 14.0 / 16.0;
              return 6.0 / 16.0;
          } else if (y == 2) {
              if (x == 0) return 3.0 / 16.0;
              if (x == 1) return 11.0 / 16.0;
              if (x == 2) return 1.0 / 16.0;
              return 9.0 / 16.0;
          } else {
              if (x == 0) return 15.0 / 16.0;
              if (x == 1) return 7.0 / 16.0;
              if (x == 2) return 13.0 / 16.0;
              return 5.0 / 16.0;
          }
      }

      void main() {
          vec2 fragCoord = vUv * uResolution.xy;
          vec2 pixelCoord = floor(fragCoord / max(uDitherScale, 1.0));
          vec2 uv = (pixelCoord * max(uDitherScale, 1.0)) / uResolution.xy;

          float aspect = uResolution.x / uResolution.y;
          vec2 p = uv * 2.0 - 1.0;
          p.x *= aspect;

          // Mouse interaction ripple
          vec2 mouseUV = (uMouse * 2.0 - 1.0);
          mouseUV.x *= aspect;
          float mDist = length(p - mouseUV);
          float mRipple = sin(mDist * 12.0 - uTime * 3.0) * exp(-mDist * 3.5) * 0.25;

          // Procedural sinusoidal wave interference pattern
          float t = uTime * uSpeed;
          float wave1 = sin(p.x * uWaveFrequency + t + mRipple);
          float wave2 = cos(p.y * uWaveFrequency * 1.3 - t * 0.8 + wave1 * 0.5);
          float wave3 = sin((p.x + p.y) * uWaveFrequency * 0.8 + t * 1.2);
          
          float wave = (wave1 + wave2 + wave3) / 3.0;
          float intensity = clamp(wave * uWaveAmplitude + 0.5, 0.0, 1.0);

          // Apply Bayer matrix dither
          float threshold = bayer4(pixelCoord);
          float ditherResult = step(threshold, intensity);

          vec3 finalColor = mix(uColor1, uColor2, ditherResult);
          gl_FragColor = vec4(finalColor, 1.0);
      }
    `;

    const geometry = new Triangle(gl);
    const program = new Program(gl, {
      vertex: vertexShader,
      fragment: fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uResolution: {
          value: new Float32Array([gl.canvas.width || 1, gl.canvas.height || 1, (gl.canvas.width || 1) / (gl.canvas.height || 1)])
        },
        uColor1: { value: new Float32Array(hexToRGB(color1)) },
        uColor2: { value: new Float32Array(hexToRGB(color2)) },
        uSpeed: { value: speed },
        uWaveFrequency: { value: waveFrequency },
        uWaveAmplitude: { value: waveAmplitude },
        uDitherScale: { value: ditherScale },
        uMouse: { value: new Float32Array([0.5, 0.5]) }
      }
    });
    const mesh = new Mesh(gl, { geometry, program });

    function resize() {
      if (!container || !renderer) return;
      const width = container.offsetWidth || window.innerWidth;
      const height = container.offsetHeight || window.innerHeight;
      renderer.setSize(width, height);
      const resUniform = program.uniforms.uResolution.value as Float32Array;
      resUniform[0] = gl.canvas.width;
      resUniform[1] = gl.canvas.height;
      resUniform[2] = gl.canvas.width / (gl.canvas.height || 1);
    }
    window.addEventListener('resize', resize);
    resize();

    function handleMouseMove(event: MouseEvent) {
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = 1 - (event.clientY - rect.top) / rect.height;
      const mouseUniform = program.uniforms.uMouse.value as Float32Array;
      mouseUniform[0] = x;
      mouseUniform[1] = y;
    }

    if (interactive) {
      window.addEventListener('mousemove', handleMouseMove);
    }

    let animationId: number;
    function update(t: number) {
      animationId = requestAnimationFrame(update);
      program.uniforms.uTime.value = t * 0.001;
      renderer?.render({ scene: mesh });
    }
    animationId = requestAnimationFrame(update);

    container.appendChild(gl.canvas);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
      if (interactive) {
        window.removeEventListener('mousemove', handleMouseMove);
      }
      if (gl.canvas.parentElement) {
        gl.canvas.parentElement.removeChild(gl.canvas);
      }
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, [color1, color2, speed, waveFrequency, waveAmplitude, ditherScale, interactive]);

  return <div ref={containerRef} className={cn('dither-wave-container', className)} {...props} />;
};

export default DitherWave;
