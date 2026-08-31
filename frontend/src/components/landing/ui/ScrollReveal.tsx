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
}

export default function ScrollReveal({
  children,
  className = '',
  delay = 0,
  duration = 600,
  direction = 'up',
  distance = 24,
  threshold = 0.1,
  triggerOnce = false, // Animate smoothly on scroll
  scale = false, // Keep default false for pure hardware transform performance
}: ScrollRevealProps) {
  const { ref, isVisible } = useScrollReveal<HTMLDivElement>({ threshold, triggerOnce });

  const getTransform = () => {
    const scaleTransform = scale ? (isVisible ? 'scale(1)' : 'scale(0.98)') : '';
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
        transitionProperty: 'opacity, transform',
        transitionDuration: `${duration}ms`,
        transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
        transitionDelay: `${delay}ms`,
        willChange: 'opacity, transform',
        backfaceVisibility: 'hidden',
      }}
    >
      {children}
    </div>
  );
}
