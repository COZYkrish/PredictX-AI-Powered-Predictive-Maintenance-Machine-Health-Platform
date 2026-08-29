'use client';

import React, { ReactNode } from 'react';
import { useScrollReveal } from '../hooks/useScrollReveal';

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number; // delay in milliseconds
  duration?: number; // duration in milliseconds
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  distance?: number; // distance in pixels
  threshold?: number;
  triggerOnce?: boolean;
  scale?: boolean;
  blur?: boolean;
}

export default function ScrollReveal({
  children,
  className = '',
  delay = 0,
  duration = 700,
  direction = 'up',
  distance = 28,
  threshold = 0.1,
  triggerOnce = false, // Animate continuously on scroll up/down
  scale = true,
  blur = true,
}: ScrollRevealProps) {
  const { ref, isVisible } = useScrollReveal<HTMLDivElement>({ threshold, triggerOnce });

  const getTransform = () => {
    const scaleTransform = scale ? (isVisible ? 'scale(1)' : 'scale(0.97)') : '';
    if (isVisible) return `translate3d(0, 0, 0) ${scaleTransform}`.trim();
    
    switch (direction) {
      case 'up':
        return `translate3d(0, ${distance}px, 0) ${scaleTransform}`.trim();
      case 'down':
        return `translate3d(0, -${distance}px, 0) ${scaleTransform}`.trim();
      case 'left':
        return `translate3d(${distance}px, 0, 0) ${scaleTransform}`.trim();
      case 'right':
        return `translate3d(-${distance}px, 0, 0) ${scaleTransform}`.trim();
      case 'none':
        return `${scaleTransform}`.trim() || 'translate3d(0, 0, 0)';
    }
  };

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: getTransform(),
        filter: blur ? (isVisible ? 'blur(0px)' : 'blur(4px)') : 'none',
        transitionProperty: 'opacity, transform, filter',
        transitionDuration: `${duration}ms`,
        transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
        transitionDelay: `${delay}ms`,
        willChange: 'opacity, transform, filter',
      }}
    >
      {children}
    </div>
  );
}
