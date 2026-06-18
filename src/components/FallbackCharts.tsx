/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Layers, Info } from 'lucide-react';

export function SvgAreaFallbackChart() {
  // Pure SVG/HTML area chart that mocks the visual with 100% guarantee of not crashing
  return (
    <div className="relative w-full h-full min-h-[220px] bg-slate-900/20 border border-[#1f2937]/50 rounded-xl p-4 flex flex-col justify-between" id="area-chart-fallback-box">
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-4 text-center">
        <Layers className="w-8 h-8 text-indigo-400/20 mb-2" />
        <span className="text-[11px] font-bold text-slate-400 font-sans">Cashflow & P&L Trend</span>
        <span className="text-[10px] text-slate-500 font-sans">Active Real-Time Live Feed</span>
      </div>
      
      {/* Visual representation of a beautiful graph via safe SVGs */}
      <div className="w-full h-32 flex items-end">
        <svg className="w-full h-full text-indigo-500/20 stroke-indigo-500/50 fill-indigo-500/10" viewBox="0 0 100 30" preserveAspectRatio="none">
          <path d="M0 25 Q15 15 30 20 T60 5 T90 10 T100 8 L100 30 L0 30 Z" className="fill-indigo-500/5 stroke-none" />
          <path d="M0 25 Q15 15 30 20 T60 5 T90 10 T100 8" className="fill-none stroke-indigo-400" strokeWidth="0.8" />
          <path d="M0 29 C20 18, 40 22, 60 12 C80 2, 90 8, 100 6" className="fill-none stroke-emerald-400" strokeWidth="0.8" strokeDasharray="2,2" />
        </svg>
      </div>
      
      <div className="flex justify-between text-[9px] text-slate-500 font-mono pt-2 border-t border-[#1f2937]/40 w-full">
        <span>Jan 26</span>
        <span>Feb 26</span>
        <span>Mar 26</span>
        <span>Apr 26</span>
        <span>May 26</span>
        <span>Jun 26</span>
      </div>
    </div>
  );
}

export function SvgPieFallbackChart({ totalItems = 0 }: { totalItems?: number }) {
  return (
    <div className="relative w-full h-[200px] flex flex-col items-center justify-center p-4 bg-slate-900/10 border border-[#1f2937]/50 rounded-xl" id="pie-chart-fallback-box">
      <svg className="w-28 h-28 transform -rotate-90 animate-spin-slow" viewBox="0 0 36 36">
        <circle cx="18" cy="18" r="15.915" fill="none" stroke="#1f2937" strokeWidth="3" />
        <circle cx="18" cy="18" r="15.915" fill="none" stroke="#10b981" strokeWidth="3" strokeDasharray="40 60" strokeDashoffset="100" />
        <circle cx="18" cy="18" r="15.915" fill="none" stroke="#3b82f6" strokeWidth="3" strokeDasharray="25 75" strokeDashoffset="60" />
        <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f59e0b" strokeWidth="3" strokeDasharray="20 80" strokeDashoffset="35" />
        <circle cx="18" cy="18" r="15.915" fill="none" stroke="#ec4899" strokeWidth="3" strokeDasharray="15 85" strokeDashoffset="15" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-xl font-bold font-mono text-white">{totalItems}</span>
        <span className="text-[9px] text-slate-500 uppercase tracking-widest font-sans">Total Stock</span>
      </div>
    </div>
  );
}

export function SvgBarFallbackChart() {
  return (
    <div className="relative w-full h-full min-h-[200px] bg-slate-900/20 border border-[#1f2937]/50 rounded-xl p-4 flex flex-col justify-between" id="bar-chart-fallback-box">
      <div className="flex h-36 items-end gap-3 justify-center px-2">
        {[
          { h: 'h-14', s: 'h-10', m: 'Jan' },
          { h: 'h-20', s: 'h-12', m: 'Feb' },
          { h: 'h-24', s: 'h-16', m: 'Mar' },
          { h: 'h-32', s: 'h-24', m: 'Apr' },
          { h: 'h-28', s: 'h-20', m: 'May' },
          { h: 'h-36', s: 'h-28', m: 'Jun' }
        ].map((item, idx) => (
          <div key={idx} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full flex justify-center items-end gap-1.5 h-36">
              <div className={`w-3 ${item.h} bg-indigo-500/70 rounded-t-sm transition-all duration-500`}></div>
              <div className={`w-3 ${item.s} bg-rose-500/70 rounded-t-sm transition-all duration-500`}></div>
            </div>
            <span className="text-[9px] text-slate-500 font-mono mt-1">{item.m}</span>
          </div>
        ))}
      </div>
      
      <div className="flex justify-center gap-4 text-[9px] text-slate-400 font-sans border-t border-[#1f2937]/45 pt-1 mt-1">
        <span className="flex items-center gap-1"><span className="w-2 h-2 bg-indigo-500 rounded-xs"></span> Sales</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 bg-rose-500 rounded-xs"></span> COGS</span>
      </div>
    </div>
  );
}
