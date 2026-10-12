'use client';

import React from 'react';

export interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

export function LogoMark({ size = 'md', className = '' }: { size?: LogoProps['size']; className?: string }) {
  const pixelSize = size === 'sm' ? 28 : size === 'md' ? 36 : size === 'lg' ? 48 : 64;

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 transition-transform duration-300 hover:scale-105 active:scale-95 ${className}`}
      style={{ width: pixelSize, height: pixelSize }}
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-md"
      >
        <defs>
          {/* Top 3D Facet */}
          <linearGradient id="emTopFacet" x1="50" y1="12" x2="50" y2="52" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="50%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>

          {/* Left 3D Facet */}
          <linearGradient id="emLeftFacet" x1="16" y1="32" x2="50" y2="88" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#059669" />
            <stop offset="60%" stopColor="#047857" />
            <stop offset="100%" stopColor="#064e3b" />
          </linearGradient>

          {/* Right 3D Facet */}
          <linearGradient id="emRightFacet" x1="84" y1="32" x2="50" y2="88" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="50%" stopColor="#065f46" />
            <stop offset="100%" stopColor="#022c22" />
          </linearGradient>

          {/* Core Inner Node Glow */}
          <radialGradient id="emCoreGlow" cx="50" cy="50" r="28" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#a7f3d0" stopOpacity="0.9" />
            <stop offset="40%" stopColor="#34d399" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </radialGradient>

          {/* 3D Specular Highlight */}
          <linearGradient id="emHighlight" x1="50" y1="10" x2="50" y2="50" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Ambient shadow disc */}
        <ellipse cx="50" cy="90" rx="32" ry="7" fill="rgba(16, 185, 129, 0.22)" filter="blur(3px)" />

        {/* Isometric Hexagon Facets */}
        {/* Top Facet */}
        <path
          d="M50 14 L82 32.5 L50 51 L18 32.5 Z"
          fill="url(#emTopFacet)"
          stroke="rgba(255, 255, 255, 0.45)"
          strokeWidth="1.2"
        />

        {/* Left Facet */}
        <path
          d="M18 32.5 L50 51 L50 87.5 L18 69 Z"
          fill="url(#emLeftFacet)"
          stroke="rgba(0, 0, 0, 0.15)"
          strokeWidth="1"
        />

        {/* Right Facet */}
        <path
          d="M50 51 L82 32.5 L82 69 L50 87.5 Z"
          fill="url(#emRightFacet)"
          stroke="rgba(0, 0, 0, 0.25)"
          strokeWidth="1"
        />

        {/* Floating Core Holographic Node */}
        <circle cx="50" cy="51" r="14" fill="url(#emCoreGlow)" />
        <circle cx="50" cy="51" r="5.5" fill="#ffffff" filter="drop-shadow(0 0 4px #34d399)" />

        {/* Top Edge Specular Shimmer */}
        <path
          d="M50 15 L80 32 L50 49 L20 32 Z"
          fill="url(#emHighlight)"
          style={{ mixBlendMode: 'overlay' }}
        />
      </svg>
    </div>
  );
}

export function Logo({ size = 'md', showText = true, className = '' }: LogoProps) {
  const textClass =
    size === 'sm'
      ? 'text-sm'
      : size === 'md'
        ? 'text-base'
        : size === 'lg'
          ? 'text-xl'
          : 'text-2xl';

  return (
    <div className={`inline-flex items-center gap-2.5 font-display select-none ${className}`}>
      <LogoMark size={size} />
      {showText && (
        <span className={`font-bold tracking-tight text-foreground flex items-center ${textClass}`}>
          <span>Executive</span>
          <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent ml-1 font-black">
            Match
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 ml-1 inline-block animate-pulse shadow-xs" />
        </span>
      )}
    </div>
  );
}
