/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface AppLogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function AppLogo({ className = '', showText = true, size = 'md' }: AppLogoProps) {
  // Determine appropriate heights
  const hClass = size === 'sm' ? 'h-8' : size === 'lg' ? 'h-16' : 'h-12';

  return (
    <div className={`flex items-center select-none ${className}`} id="app-logo-container">
      <svg
        viewBox={showText ? "0 0 240 80" : "0 0 80 80"}
        className={`${hClass} w-auto object-contain`}
        id="app-logo-media"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Blue/Teal Ring Gradient */}
          <linearGradient id="blueTealGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0284c7" />
            <stop offset="50%" stopColor="#00add4" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
          
          {/* Orange/Yellow Ring Gradient */}
          <linearGradient id="orangeYellowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ea580c" />
            <stop offset="60%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#eab308" />
          </linearGradient>
        </defs>
        
        {/* Left Graphics Core Loop (80x80) */}
        <g transform="translate(5, 5)">
          {/* Orange Loop - Underlapping but interlocking orbital ring */}
          <path 
            d="M 45 15 C 65 25, 75 52, 55 67 C 35 82, 12 65, 22 43 C 27 32, 45 15, 45 15 Z" 
            fill="none" 
            stroke="url(#orangeYellowGrad)" 
            strokeWidth="11" 
            strokeLinecap="round"
            opacity="0.95"
          />
          
          {/* Blue Loop - Main front orbital ring */}
          <path 
            d="M 23 11 C 3 26, -3 55, 17 68 C 37 80, 60 59, 49 34 C 44 24, 23 11, 23 11 Z" 
            fill="none" 
            stroke="url(#blueTealGrad)" 
            strokeWidth="11.5" 
            strokeLinecap="round"
          />
          
          {/* Deep Teal/Blue Core Badge backing the Amharic letter for optimal contrast */}
          <circle cx="34" cy="38" r="15" fill="#0072aa" />

          {/* Amharic letter 'ደ' (Noto Sans Ethiopic/Nyala compatible system font stack) */}
          <text 
            x="34" 
            y="45" 
            fill="#ffffff" 
            fontSize="23" 
            fontWeight="900" 
            fontFamily="'Abyssinica SIL', 'Nyala', 'Kefa', 'Noto Sans Ethiopic', 'Segoe UI', system-ui, sans-serif"
            textAnchor="middle"
          >
            ደ
          </text>
        </g>
        
        {/* Right Slogan Wordmark (Displayed only if showText is true) */}
        {showText && (
          <g transform="translate(90, 42)">
            <text 
              fill="#ffffff" 
              fontSize="28" 
              fontWeight="800" 
              fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
              letterSpacing="-0.5"
            >
              Dfor<tspan fill="#00add4">Dani</tspan>
            </text>
            <text 
              y="22" 
              fill="#94a3b8" 
              fontSize="12.5" 
              fontWeight="700" 
              fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
              letterSpacing="4"
            >
              APP
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}

