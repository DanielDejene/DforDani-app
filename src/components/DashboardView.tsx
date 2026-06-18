/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Globe, Layers, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { Product, PurchaseTransaction, SaleTransaction, FinanceRecord, Account } from '../types';
import AppLogo from './AppLogo';

interface DashboardViewProps {
  products: Product[];
  purchases: PurchaseTransaction[];
  sales: SaleTransaction[];
  financeRecords: FinanceRecord[];
  accounts: Account[];
  onSetTab: (tab: string) => void;
  lang: 'en' | 'am';
  onSetLang: (lang: 'en' | 'am') => void;
}

const GRAINS = [
  { key: 'waliya', en: 'Waliya', am: 'ዋሊያ' },
  { key: 'evoniy', en: 'Evoniy', am: 'ኤቮኒ' },
  { key: 'atar', en: 'Atar', am: 'አተር' },
  { key: 'bakela', en: 'Bakela', am: 'ባቄላ' },
  { key: 'sinde', en: 'Sinde', am: 'ስንዴ' },
  { key: 'ashile', en: 'Ashile', am: 'አሽሌ' },
];

export default function DashboardView({
  products,
  purchases,
  sales,
  lang,
  onSetLang
}: DashboardViewProps) {

  // Helper selectors - case-insensitive
  const getStockForGrain = (grainNameEn: string) => {
    const match = products.find(p => p.name.toLowerCase() === grainNameEn.toLowerCase());
    return match ? match.quantity : 0;
  };

  const getSourcedForGrain = (grainNameEn: string) => {
    return purchases
      .filter(p => p.productName.toLowerCase() === grainNameEn.toLowerCase())
      .reduce((sum, p) => sum + p.quantity, 0);
  };

  const getSoldForGrain = (grainNameEn: string) => {
    return sales
      .filter(s => s.productName.toLowerCase() === grainNameEn.toLowerCase())
      .reduce((sum, s) => sum + s.quantity, 0);
  };

  // Grand totals
  const totalStock = GRAINS.reduce((sum, g) => sum + getStockForGrain(g.en), 0);
  const totalSourced = GRAINS.reduce((sum, g) => sum + getSourcedForGrain(g.en), 0);
  const totalSold = GRAINS.reduce((sum, g) => sum + getSoldForGrain(g.en), 0);

  return (
    <div className="space-y-6">
      
      {/* 1. Language Selection & Title Panel */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-[#111827] border border-[#1f2937] p-5 rounded-2xl shadow-xl" id="dashboard-bilingual-banner">
        <div className="flex items-center gap-4 flex-1">
          <AppLogo showText={false} size="lg" className="hidden sm:inline-flex" />
          <div>
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              <span className="sm:hidden"><AppLogo showText={false} size="sm" /></span>
              {lang === 'en' ? 'Operational Overview & Insights' : 'የአጠቃላይ ስራዎች ክትትልና ግንዛቤዎች'}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {lang === 'en' 
                ? 'Real-time indicators across six primary grain storage and commerce channels' 
                : 'ስድስት ዋና ዋና የእህል አይነቶች የክምችትና የንግድ እንቅስቃሴ እውነተኛ መረጃ'}
            </p>
          </div>
        </div>
        
        {/* Language selector toggle buttons */}
        <div className="flex items-center gap-1 bg-[#161d2b] p-1 rounded-xl border border-[#1f2937] shrink-0 self-stretch sm:self-auto justify-between sm:justify-start" id="dashboard-lang-selector">
          <span className="text-xs font-semibold px-2 text-slate-400 flex items-center gap-1">
            <Globe className="w-3.5 h-3.5 text-indigo-400" />
            {lang === 'en' ? 'Language:' : 'ቋንቋ፦'}
          </span>
          <div className="flex items-center gap-1">
            <button 
              type="button"
              onClick={() => onSetLang('en')}
              className={`px-3 py-1 text-xs font-black rounded-lg transition-all cursor-pointer ${
                lang === 'en' 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'text-slate-400 hover:text-white hover:bg-[#111827]'
              }`}
              id="lang-btn-en"
            >
              English
            </button>
            <button 
              type="button"
              onClick={() => onSetLang('am')}
              className={`px-3 py-1 text-xs font-black rounded-lg transition-all cursor-pointer ${
                lang === 'am' 
                  ? 'bg-indigo-600 text-white shadow-md font-bold' 
                  : 'text-slate-400 hover:text-white hover:bg-[#111827]'
              }`}
              id="lang-btn-am"
            >
              አማርኛ
            </button>
          </div>
        </div>
      </div>

      {/* 2. Three Critical Operational Registers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="dashboard-critical-registers">
        
        {/* Registration 1: STOCKS AND STORAGE */}
        <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-5 shadow-lg flex flex-col justify-between space-y-5">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-indigo-400 uppercase tracking-widest font-sans flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                {lang === 'en' ? 'Stocks & Storage' : 'ክምችትና መጋዘን'}
              </span>
              <Layers className="w-4 h-4 text-indigo-400" />
            </div>
            <h3 className="text-base font-extrabold text-white">
              {lang === 'en' ? 'Total Grains in Stock' : 'በመጋዘን ውስጥ ያለ ጠቅላላ እህል'}
            </h3>
            <p className="text-[11px] text-slate-400">
              {lang === 'en' 
                ? 'Current physical grain reserves active in the granary storage cabins' 
                : 'በአሁኑ ጊዜ በመጋዘን ውስጥ በክምችት የሚገኝ የእህል ክምችት መጠን'}
            </p>
          </div>

          {/* Grand single metric representation */}
          <div className="bg-[#161d2b] border border-[#1f2937]/60 rounded-lg p-4 text-center">
            <span className="block text-3xl font-black font-mono text-indigo-400 tracking-tight">
              {totalStock.toLocaleString('en-US')} <span className="text-xs font-sans text-slate-400">qt</span>
            </span>
            <span className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold block mt-1">
              {lang === 'en' ? 'Combined Storage Volume' : 'የተጠቃለለ የክምችት መጠን'}
            </span>
          </div>

          {/* Individual listings for the 6 types of grains */}
          <div className="space-y-2.5 pt-1">
            {GRAINS.map(g => {
              const qty = getStockForGrain(g.en);
              return (
                <div key={g.key} className="flex items-center justify-between border-b border-[#1f2937]/40 pb-2 last:border-b-0 last:pb-0">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400/80"></div>
                    <span className="text-xs font-extrabold text-slate-200">
                      {g.en} <span className="font-normal text-[10px] text-slate-500 font-sans">({g.am})</span>
                    </span>
                  </div>
                  <span className="text-xs font-bold font-mono text-white bg-indigo-950/20 px-2 py-0.5 rounded border border-indigo-500/10">
                    {qty.toLocaleString('en-US')} qt
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Registration 2: Sourcing Orders Aggregates */}
        <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-5 shadow-lg flex flex-col justify-between space-y-5">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-violet-400 uppercase tracking-widest font-sans flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-violet-500"></span>
                {lang === 'en' ? 'Sourcing Orders' : 'ግዢ ማዘዣዎች'}
              </span>
              <ArrowDownLeft className="w-4 h-4 text-violet-400" />
            </div>
            <h3 className="text-base font-extrabold text-white">
              {lang === 'en' ? 'Sourcing Aggregates' : 'ጠቅላላ የተገዛ እህል'}
            </h3>
            <p className="text-[11px] text-slate-400">
              {lang === 'en' 
                ? 'Cumulative intake raw sourcing aggregate volume of transactions' 
                : 'ካለፉት የግዢ እንቅስቃሴዎች በአጠቃላይ የተገዛው እህል መጠን ማጠቃለያ'}
            </p>
          </div>

          {/* Grand single metric representation */}
          <div className="bg-[#161d2b] border border-[#1f2937]/60 rounded-lg p-4 text-center">
            <span className="block text-3xl font-black font-mono text-violet-400 tracking-tight">
              {totalSourced.toLocaleString('en-US')} <span className="text-xs font-sans text-slate-400">qt</span>
            </span>
            <span className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold block mt-1">
              {lang === 'en' ? 'Total Sourced Volume' : 'የተጠቃለለ የግዢ መጠን'}
            </span>
          </div>

          {/* Individual listings for the 6 types of grains */}
          <div className="space-y-2.5 pt-1">
            {GRAINS.map(g => {
              const qty = getSourcedForGrain(g.en);
              return (
                <div key={g.key} className="flex items-center justify-between border-b border-[#1f2937]/40 pb-2 last:border-b-0 last:pb-0">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-violet-400/80"></div>
                    <span className="text-xs font-extrabold text-slate-200">
                      {g.en} <span className="font-normal text-[10px] text-slate-500 font-sans">({g.am})</span>
                    </span>
                  </div>
                  <span className="text-xs font-bold font-mono text-white bg-violet-950/20 px-2 py-0.5 rounded border border-violet-500/10">
                    {qty.toLocaleString('en-US')} qt
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Registration 3: Sales Registry Sold Volume */}
        <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-5 shadow-lg flex flex-col justify-between space-y-5">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-emerald-400 uppercase tracking-widest font-sans flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                {lang === 'en' ? 'Sales Registry' : 'የሽያጭ መዝገብ'}
              </span>
              <ArrowUpRight className="w-4 h-4 text-emerald-400" />
            </div>
            <h3 className="text-base font-extrabold text-white">
              {lang === 'en' ? 'Overall Grains Sold Volume' : 'ጠቅላላ የተሸጠ እህል'}
            </h3>
            <p className="text-[11px] text-slate-400">
              {lang === 'en' 
                ? 'Consolidated trade outflows and total volume sold to date' 
                : 'ከሽያጭ መዛግብት የተጠቃለለ እና እስካሁን ድረስ ለደንበኞች የተሸጠ የእህል መጠን'}
            </p>
          </div>

          {/* Grand single metric representation */}
          <div className="bg-[#161d2b] border border-[#1f2937]/60 rounded-lg p-4 text-center">
            <span className="block text-3xl font-black font-mono text-emerald-400 tracking-tight">
              {totalSold.toLocaleString('en-US')} <span className="text-xs font-sans text-slate-400">qt</span>
            </span>
            <span className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold block mt-1">
              {lang === 'en' ? 'Total Grains Sold' : 'የተጠቃለለ የሽያጭ መጠን'}
            </span>
          </div>

          {/* Individual listings for the 6 types of grains */}
          <div className="space-y-2.5 pt-1">
            {GRAINS.map(g => {
              const qty = getSoldForGrain(g.en);
              return (
                <div key={g.key} className="flex items-center justify-between border-b border-[#1f2937]/40 pb-2 last:border-b-0 last:pb-0">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400/80"></div>
                    <span className="text-xs font-extrabold text-slate-200">
                      {g.en} <span className="font-normal text-[10px] text-slate-500 font-sans">({g.am})</span>
                    </span>
                  </div>
                  <span className="text-xs font-bold font-mono text-white bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-500/10">
                    {qty.toLocaleString('en-US')} qt
                  </span>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}
