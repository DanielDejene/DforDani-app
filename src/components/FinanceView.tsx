/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Settings, 
  Layers, 
  Search, 
  Calendar, 
  CheckCircle,
  HelpCircle,
  Briefcase,
  AlertCircle,
  Sliders,
  DollarSign,
  Cpu,
  ArrowUpRight,
  Info
} from 'lucide-react';
import { Product, SaleTransaction, PurchaseTransaction, Account, FinanceRecord } from '../types';
import { formatDate } from '../utils/dateUtils';

interface FinanceViewProps {
  sales: SaleTransaction[];
  purchases: PurchaseTransaction[];
  products: Product[];
  lang?: 'en' | 'am';
  financeRecords?: FinanceRecord[];
  accounts?: Account[];
  onAddFinanceRecord?: (record: Omit<FinanceRecord, 'id'>) => void;
  onAddAccount?: (account: Omit<Account, 'id'>) => void;
  onAdjustBalance?: (accountId: string, newBalance: number) => void;
  onDeleteFinanceRecord?: (id: string) => void;
}

export default function FinanceView({
  sales = [],
  purchases = [],
  products = [],
  lang = 'am'
}: FinanceViewProps) {
  
  // 1. GLOBAL FIXED COST REGISTRATION (ቋሚ ወጪ መመዝገቢያ)
  const [fixedCostInput, setFixedCostInput] = useState<string>(() => {
    const saved = localStorage.getItem('p_global_fixed_cost_per_quintal');
    return saved ? saved : '50';
  });

  const [globalFixedCost, setGlobalFixedCost] = useState<number>(() => {
    const saved = localStorage.getItem('p_global_fixed_cost_per_quintal');
    return saved ? parseFloat(saved) : 50;
  });

  const [saveSuccessMsg, setSaveSuccessMsg] = useState<boolean>(false);

  const handleSaveFixedCost = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(fixedCostInput);
    if (isNaN(val) || val < 0) {
      alert(lang === 'en' ? 'Please enter a valid positive number!' : 'እባክዎ ትክክለኛ የቁጥር እሴት ያስገቡ!');
      return;
    }
    localStorage.setItem('p_global_fixed_cost_per_quintal', val.toString());
    setGlobalFixedCost(val);
    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 3000);
  };

  // State for search query
  const [searchQuery, setSearchQuery] = useState('');
  // State for active grain type filter tab
  const [activeGrainTab, setActiveGrainTab] = useState<'All' | 'Waliya' | 'Evoniy' | 'Atar' | 'Bakela' | 'Sinde' | 'Ashile'>('All');
  // State for currently selected sale to show detail statement
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);

  // Core Grain categories mapping helper
  const mapToCoreKey = (name: string): string => {
    const n = name.toLowerCase().trim();
    if (n.includes('waliya') || n.includes('ዋሊያ')) return 'Waliya';
    if (n.includes('evoniy') || n.includes('ኤቮኒ')) return 'Evoniy';
    if (n.includes('atar') || n.includes('አተር')) return 'Atar';
    if (n.includes('bakela') || n.includes('ባቄላ')) return 'Bakela';
    if (n.includes('sinde') || n.includes('ስንዴ')) return 'Sinde';
    if (n.includes('ashile') || n.includes('አሺሌ')) return 'Ashile';
    return name;
  };

  // Localized Grain display names
  const getGrainDisplayName = (name: string) => {
    const key = mapToCoreKey(name);
    if (lang === 'en') return key;
    const amharicMap: Record<string, string> = {
      Waliya: 'ዋሊያ (Waliya)',
      Evoniy: 'ኤቮኒ (Evoniy)',
      Atar: 'አተር (Atar)',
      Bakela: 'ባቄላ (Bakela)',
      Sinde: 'ስንዴ (Sinde)',
      Ashile: 'አሺሌ (Ashile)'
    };
    return amharicMap[key] || name;
  };

  // STEP A: Calculate Dynamic Average Purchase Price per Quintal based on specific Grain Type
  const calculateAveragePurchasePrice = (grainType: string): number => {
    const targetKey = mapToCoreKey(grainType).toLowerCase();
    const matches = purchases.filter(p => {
      const pKey = mapToCoreKey(p.productName).toLowerCase();
      return pKey === targetKey;
    });

    const totalQty = matches.reduce((sum, p) => sum + p.quantity, 0);
    const totalSpent = matches.reduce((sum, p) => sum + p.totalCost, 0);

    if (totalQty > 0) {
      return totalSpent / totalQty;
    }

    // Fallback to average product cost standard
    const prod = products.find(p => mapToCoreKey(p.name).toLowerCase() === targetKey);
    return prod ? prod.unitCost : 0;
  };

  // Persistent snapshot configuration parameters for each sale (permanently locks metrics at checkout/view time)
  const [saleSnapshots, setSaleSnapshots] = useState<Record<string, { fixedCost: number; avgPurchasePrice: number }>>(() => {
    const saved = localStorage.getItem('p_sale_snapshot_params');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse sale snapshot params', e);
      }
    }
    return {};
  });

  // Automatically lock parameter snapshots for any transaction records that lack them
  React.useEffect(() => {
    let changed = false;
    const updatedSnapshots = { ...saleSnapshots };

    sales.forEach(s => {
      if (!updatedSnapshots[s.id]) {
        // Capture snapshot at this specific date/time context
        const avgPurchasePrice = calculateAveragePurchasePrice(s.productName);
        updatedSnapshots[s.id] = {
          fixedCost: globalFixedCost,
          avgPurchasePrice: avgPurchasePrice
        };
        changed = true;
      }
    });

    if (changed) {
      setSaleSnapshots(updatedSnapshots);
      localStorage.setItem('p_sale_snapshot_params', JSON.stringify(updatedSnapshots));
    }
  }, [sales, globalFixedCost, purchases, products]);

  // Computations block for each sale with frozen snapshot lookup fallback
  const pAndLStatements = useMemo(() => {
    return sales.map(s => {
      const grainType = mapToCoreKey(s.productName);
      
      // Get frozen snapshot parameters or fallback if not yet registered
      const snapshot = saleSnapshots[s.id] || {
        fixedCost: globalFixedCost,
        avgPurchasePrice: calculateAveragePurchasePrice(s.productName)
      };

      // STEP A: Frozen Average Sourcing Cost per Quintal
      const avgPurchasePrice = snapshot.avgPurchasePrice;

      // STEP B: Frozen Total Purchase Value
      const totalPurchaseValue = s.quantity * avgPurchasePrice;

      // STEP C: Frozen Allocated Fixed Cost (ሽያጭ ቋሚ ወጪ)
      const allocatedFixedCost = s.quantity * snapshot.fixedCost;

      // STEP D: Comprehensive Total Cost (Allocated Fixed Cost + overall cost from sales registry)
      const recordedOverallCost = s.totalRevenue - s.profit;
      const comprehensiveTotalCost = allocatedFixedCost + recordedOverallCost;

      // 4. TRIPLE-STATE P&L METRIC ENGINE (corrected formula: revenue - (purchase value + comprehensive cost))
      const netResult = s.totalRevenue - (totalPurchaseValue + comprehensiveTotalCost);

      let statusMsg = '';
      let statusLabelAmh = '';
      let statusColor = '';

      if (netResult > 0) {
        statusMsg = '📈 ትርፍ (Net Profit)';
        statusLabelAmh = 'ትርፍ';
        statusColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      } else if (netResult < 0) {
        statusMsg = '📉 ኪሳራ (Net Loss)';
        statusLabelAmh = 'ኪሳራ';
        statusColor = 'text-rose-450 bg-rose-500/10 border-rose-500/20';
      } else {
        statusMsg = '⚖️ ዋናውን ችሏል (Breakeven)';
        statusLabelAmh = 'ዋናውን ችሏል';
        statusColor = 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      }

      return {
        id: s.id,
        date: s.date,
        grainType,
        quantity: s.quantity,
        totalRevenue: s.totalRevenue, // overall price
        recordedOverallCost, // total direct cost
        comprehensiveTotalCost, // comprehensive total cost (Allocated Fixed Cost + recordedOverallCost)
        avgPurchasePrice,
        totalPurchaseValue,
        allocatedFixedCost,
        netResult,
        statusMsg,
        statusLabelAmh,
        statusColor,
        buyer: s.customer,
        note: s.note,
        fixedCostUsed: snapshot.fixedCost
      };
    });
  }, [sales, purchases, products, globalFixedCost, saleSnapshots]);

  // Aggregate stats across all computed statements
  const analyticsTotals = useMemo(() => {
    const totalRevenue = pAndLStatements.reduce((sum, s) => sum + s.totalRevenue, 0);
    const totalCost = pAndLStatements.reduce((sum, s) => sum + (s.totalPurchaseValue + s.comprehensiveTotalCost), 0);
    const netProfit = totalRevenue - totalCost;

    return {
      totalRevenue,
      totalCost,
      netProfit,
      count: pAndLStatements.length,
      profitCount: pAndLStatements.filter(s => s.netResult > 0).length,
      lossCount: pAndLStatements.filter(s => s.netResult < 0).length,
    };
  }, [pAndLStatements]);

  // Filter items matching active filters & search query
  const filteredStatements = useMemo(() => {
    return pAndLStatements.filter(s => {
      const matchSearch = s.buyer.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.grainType.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          getGrainDisplayName(s.grainType).toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchGrain = activeGrainTab === 'All' ? true : s.grainType === activeGrainTab;
      return matchSearch && matchGrain;
    });
  }, [pAndLStatements, searchQuery, activeGrainTab]);

  // Find currently selected detailed statement object
  const activeDetailedStatement = useMemo(() => {
    if (selectedSaleId) {
      return pAndLStatements.find(s => s.id === selectedSaleId);
    }
    return pAndLStatements[0] || null;
  }, [pAndLStatements, selectedSaleId]);

  return (
    <div className="space-y-6" id="profit-loss-workspace">
      
      {/* 2-Column top workspace showing banner and direct parameter configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Banner with modern glassmorphism slate theme */}
        <div className="lg:col-span-2 bg-[#111827] border border-[#1f2937] rounded-3xl p-6 relative overflow-hidden shadow-2xl flex flex-col justify-between" id="pl-module-banner">
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-60 h-60 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>

          <div className="space-y-2 relative">
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full font-mono font-bold uppercase tracking-widest inline-flex items-center gap-1.5 animate-pulse">
              <Cpu className="w-3.5 h-3.5" /> CENTRAL FINANCIAL INTELLIGENCE ENGINE
            </span>
            <h2 className="text-xl md:text-2xl font-black text-white font-sans tracking-tight" id="pl-dashboard-title">
              {lang === 'en' ? 'Profit & Loss (P&L) Module' : 'የትርፍ እና ኪሳራ መግለጫ ክፍል (P&L)'}
            </h2>
            <p className="text-xs text-slate-400 max-w-xl font-sans leading-relaxed">
              {lang === 'en' 
                ? 'Automated pipeline extracting metrics from Sales and Sourcing modules. Dynamically cross-references fixed parameters & calculates localized company performance.'
                : 'ከሽያጭ እና ግዢ ማዘዣዎች መረጃዎችን በመሰብሰብ፣ ቋሚ ወጪዎችን በማስላት እና የመስቀለኛ ስሌት በማከናወን የተጣራ የኩባንያውን ትርፍና ኪሳራ በራስ-ሰር የሚያሳይ የሂሳብ መጋቢያ።'}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 border-t border-[#1f2937]/60 pt-4 mt-6 relative" id="quick-analytical-bento">
            <div>
              <span className="text-[9px] uppercase font-bold text-slate-450 block">{lang === 'en' ? 'Total Sales Captures' : 'አጠቃላይ የሽያጭ መዛግብት'}</span>
              <span className="text-sm font-extrabold text-white font-mono mt-0.5 block">{analyticsTotals.count} Transactions</span>
            </div>
            <div>
              <span className="text-[9px] uppercase font-bold text-slate-450 block">{lang === 'en' ? 'Total Company Sales' : 'ጠቅላላ የሽያጭ የገቢ ድምር'}</span>
              <span className="text-sm font-extrabold text-cyan-400 font-mono mt-0.5 block">{analyticsTotals.totalRevenue.toLocaleString('en-US')} ETB</span>
            </div>
            <div>
              <span className="text-[9px] uppercase font-bold text-slate-450 block">{lang === 'en' ? 'Combined Net Profit' : 'የኩባንያው የተጣራ ትርፍ ድምር'}</span>
              <span className={`text-sm font-black font-mono mt-0.5 block ${analyticsTotals.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {analyticsTotals.netProfit >= 0 ? '+' : ''}{analyticsTotals.netProfit.toLocaleString('en-US')} ETB
              </span>
            </div>
          </div>
        </div>

        {/* 1. INITIALIZATION: GLOBAL FIXED COST REGISTRATION (ቋሚ ወጪ መመዝገቢያ) */}
        <div className="bg-[#111827] border border-[#1f2937]/90 rounded-3xl p-5 shadow-2xl flex flex-col justify-between" id="fixed-cost-param-box">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#1f2937]/80 pb-2.5">
              <h3 className="text-xs font-black text-white font-sans uppercase tracking-widest flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                <span>{lang === 'en' ? '1. Fixed Cost Setup' : '1. ቋሚ ወጪ መመዝገቢያ'}</span>
              </h3>
              <span className="p-1 bg-amber-500/10 text-amber-400 rounded-lg text-[9px] font-mono font-bold">CONFIG</span>
            </div>
            
            <p className="text-[11px] text-slate-450 font-medium leading-relaxed font-sans">
              {lang === 'en' 
                ? 'Enter the universal Fixed Cost per Quintal multiplier applied once to every recorded grain sale across the workspace.'
                : 'ለእያንዳንዱ አንድ ኩንታል እህል የሚሆን አጠቃላይ ቋሚ ወጪ እዚህ ያስገቡ። ይህ ዋጋ በጠቅላላው የሥራ አካባቢ ለሽያጭ ስሌቶች በቋሚነት ያገለግላል።'}
            </p>

            <form onSubmit={handleSaveFixedCost} className="space-y-3 pt-2" id="fixed-cost-multiplier-form">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase font-sans tracking-wider block">
                  {lang === 'en' ? 'Global Fixed Cost per Quintal (ETB)' : 'የአንዱ ኩንታል ቋሚ ወጪ (በየኩንታሉ)'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    value={fixedCostInput}
                    onChange={(e) => setFixedCostInput(e.target.value)}
                    placeholder="e.g., 50"
                    className="w-full bg-[#0d121f] border border-[#1f2937] focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs font-black font-mono text-emerald-400 focus:outline-none transition-all placeholder-slate-750"
                    id="fixed-cost-quintal-input"
                  />
                  <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-[10px] text-slate-500 font-mono font-bold">
                    ETB / QUINTAL
                  </span>
                </div>
              </div>

              {saveSuccessMsg && (
                <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-lg p-2 flex items-center gap-2 text-[10px] text-emerald-400 font-bold" id="saved-success-pill">
                  <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{lang === 'en' ? 'Configuration saved successfully!' : 'ወጪው በስኬት ተመዝግቧል!'}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition-all shadow-md hover:shadow-indigo-600/10 cursor-pointer"
                id="save-fixed-cost-btn"
              >
                {lang === 'en' ? 'Apply & Register Multiplier' : 'እሴቱን መዝግብና ተግብር'}
              </button>
            </form>
          </div>

          <div className="bg-[#0e1321] border border-slate-800/40 p-2.5 rounded-xl flex items-start gap-2 mt-4" id="param-active-badge">
            <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
            <div className="text-[10px] leading-relaxed">
              <span className="text-slate-450 font-bold">{lang === 'en' ? 'Active Multiplier: ' : 'በአሁኑ ሰዓት የሚሰራበት ቋሚ ወጪ: '}</span>
              <span className="text-emerald-400 font-black font-mono underline">{globalFixedCost.toLocaleString()} ETB / {lang === 'en' ? 'Quintal' : 'ኩንታል'}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Main Ledger workspace showing Automated Pipeline & Cross-Module Calculations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="real-time-pipeline-grid">
        
        {/* Left Side: 2. AUTOMATED DATA PIPELINE & INGUSTION (Sales List & Filter control) */}
        <div className="lg:col-span-7 bg-[#111827] border border-[#1f2937] rounded-3xl p-5 space-y-4 shadow-xl" id="pl-pipeline-captures">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1f2937]/80 pb-3" id="pipeline-header-flex">
            <div className="space-y-0.5">
              <h3 className="text-xs font-black text-white font-sans uppercase tracking-widest flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span>{lang === 'en' ? '2. Automated Data Pipeline' : '2. የመረጃ ትስስርና መዛግብት ማውጫ'}</span>
              </h3>
              <p className="text-[10px] text-slate-500 font-sans font-semibold">
                {lang === 'en' ? 'In real-time from [Sales and Registry]' : 'ከሽያጭ እና መዝገብ በቀጥታ የሚመጡ መረጃዎች'}
              </p>
            </div>

            {/* Quick search input */}
            <div className="relative max-w-xs" id="quick-input-group">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-600">
                <Search className="w-3 h-3" />
              </span>
              <input
                type="text"
                placeholder={lang === 'en' ? 'Search buyer/grain...' : 'አቅራቢ/እህል ይፈልጉ...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#0d121f] border border-[#1f2937] rounded-lg pl-8 pr-3 py-1 text-[11px] font-sans text-white focus:outline-none focus:border-emerald-500 placeholder-slate-650 transition-all"
                id="live-search-filter"
              />
            </div>
          </div>

          {/* Core Grain type selector tabs */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-900/60 p-1 rounded-xl" id="grain-filter-rail-tabs">
            <button
              onClick={() => setActiveGrainTab('All')}
              className={`px-2.5 py-1 text-[9px] font-extrabold rounded-lg transition-all ${
                activeGrainTab === 'All' ? 'bg-[#1f2937] text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              {lang === 'en' ? 'All Grains' : 'ሁሉም እህሎች'}
            </button>
            {(['Waliya', 'Evoniy', 'Atar', 'Bakela', 'Sinde', 'Ashile'] as const).map(grainKey => (
              <button
                key={grainKey}
                onClick={() => setActiveGrainTab(grainKey)}
                className={`px-2.5 py-1 text-[9px] font-extrabold rounded-lg transition-all ${
                  activeGrainTab === grainKey ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-450 hover:text-white'
                }`}
              >
                {getGrainDisplayName(grainKey)}
              </button>
            ))}
          </div>

          {/* Captured list rendered as responsive table/row cards */}
          {filteredStatements.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-[#1f2937] rounded-2xl bg-[#0d121f]/50 space-y-2" id="no-pipeline-sales-placeholder">
              <span className="text-2xl block">📂</span>
              <p className="text-xs text-slate-400 font-sans font-bold">
                {lang === 'en' ? 'No automated sales pipelines matched filtering.' : 'ከላኪው ሞጁል ወደዚህ የተሳሰረ የሽያጭ መረጃ አልተገኘም።'}
              </p>
              <p className="text-[10px] text-slate-550 font-sans">
                {lang === 'en' ? 'Go to Sourcing and Sales modules to add grain sales registries first.' : 'አዲስ የሽያጭ Registry ለመመዝገብ መጀመሪያ ወደ "የሽያጭ መዝገብ" ይሂዱ።'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto" id="pipeline-table-scroller">
              <table className="w-full text-left border-collapse text-xs font-sans">
                <thead>
                  <tr className="border-b border-[#1f2937] bg-[#161d2b]/80 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <th className="py-2.5 px-3">ቀን (Date)</th>
                    <th className="py-2.5 px-3">የእህል አይነት</th>
                    <th className="py-2.5 px-3 text-right">የእህል ብዛት (Qty)</th>
                    <th className="py-2.5 px-3 text-right">አጠቃላይ ሽያጭ</th>
                    <th className="py-2.5 px-3 text-right">{lang === 'en' ? 'Profit/Loss' : 'ትርፍ/ኪሳራ'}</th>
                    <th className="py-2.5 px-3 text-right">ውጤት</th>
                    <th className="py-2.5 px-3 text-center">ድርጊት</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1f2937]/50">
                  {filteredStatements.map(stmt => {
                    const isActive = stmt.id === selectedSaleId || (!selectedSaleId && activeDetailedStatement?.id === stmt.id);
                    return (
                      <tr 
                        key={stmt.id} 
                        onClick={() => setSelectedSaleId(stmt.id)}
                        className={`cursor-pointer transition-colors group ${
                          isActive ? 'bg-indigo-650/10' : 'hover:bg-[#161d2b]/30'
                        }`}
                        id={`pipeline-row-${stmt.id}`}
                      >
                        <td className="py-3 px-3 font-mono font-bold text-slate-350">
                          {formatDate(stmt.date)}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-white group-hover:text-indigo-400 transition-colors">
                            {getGrainDisplayName(stmt.grainType)}
                          </div>
                          <div className="text-[9px] text-slate-500 font-medium">To: {stmt.buyer}</div>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-extrabold text-slate-100">
                          {stmt.quantity.toLocaleString()} <span className="text-[9px] font-sans text-slate-500">{lang === 'en' ? 'qt' : 'ኩንታል'}</span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-black text-cyan-400">
                          {stmt.totalRevenue.toLocaleString()} ETB
                        </td>
                        <td className={`py-3 px-3 text-right font-mono font-black ${
                          stmt.netResult > 0 ? 'text-emerald-400' : stmt.netResult < 0 ? 'text-rose-400' : 'text-blue-400'
                        }`}>
                          {stmt.netResult > 0 ? '+' : ''}{stmt.netResult.toLocaleString('en-US')} ETB
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black font-sans uppercase block text-center truncate ${stmt.statusColor}`}>
                            {lang === 'en' ? stmt.statusMsg.split(' ')[1] : stmt.statusLabelAmh}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            className={`px-2 py-1 rounded text-[10px] font-black font-sans cursor-pointer transition-colors ${
                              isActive ? 'bg-indigo-600 text-white' : 'bg-[#1f2937]/80 text-slate-350 hover:bg-[#1f2937]'
                            }`}
                          >
                            {lang === 'en' ? 'View' : 'አሳይ'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

        </div>

        {/* Right Side: 3. CROSS-MODULE INTERLOCK CALCULATIONS & 4. TRIPLE-STATE P&L METRIC ENGINE (Statement Output Card) */}
        <div className="lg:col-span-5 space-y-4" id="pl-analytical-statement-panel">
          
          <div className="bg-[#111827] border border-[#1f2937] rounded-3xl p-5 space-y-4 shadow-xl" id="interlock-calculations-box">
            
            <div className="flex items-center justify-between border-b border-[#1f2937]/80 pb-2.5">
              <h3 className="text-xs font-black text-white font-sans uppercase tracking-widest flex items-center gap-1.5 animate-pulse text-indigo-400">
                <Cpu className="w-3.5 h-3.5" />
                <span>{lang === 'en' ? '3 & 4. Performance Statement' : '3 እና 4. የትርፍና ኪሳራ መግለጫ ወረቀት'}</span>
              </h3>
              <span className="p-1 px-2 bg-[#10b981]/15 text-[#10b981] rounded-full text-[8px] font-black font-sans animate-fade-in uppercase">
                REAL-TIME STATEMENT
              </span>
            </div>

            {activeDetailedStatement ? (
              <div 
                className="bg-[#0b0f19] border border-[#1f2937] p-5 rounded-2xl relative shadow-2xl space-y-4" 
                id={`detailed-statement-canvas-${activeDetailedStatement.id}`}
              >
                
                {/* Visual design like a printed physical/ledger receipt ticket */}
                <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-br from-indigo-500/5 to-transparent rounded-full pointer-events-none"></div>
                
                {/* Header title */}
                <div className="text-center font-sans space-y-1 pb-3 border-b border-dashed border-[#1f2937]">
                  <span className="text-lg block tracking-wider" id="statement-icon">📊</span>
                  <h4 className="text-[11px] font-black text-slate-100 tracking-widest uppercase">
                    REAL-TIME PROFIT & LOSS STATEMENT
                  </h4>
                  <h5 className="text-[12px] font-black text-slate-350 tracking-wider">
                    የትርፍና ኪሳራ መግለጫ
                  </h5>
                  <div className="text-[9px] text-indigo-400 font-mono font-bold mt-1">
                    TRANSACTION REF: {activeDetailedStatement.id.toUpperCase()}
                  </div>
                </div>

                {/* Section 2: Ingested basic values */}
                <div className="space-y-2 text-xs font-sans mt-3">
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-450 font-bold">📅 ቀን (Date):</span>
                    <span className="font-mono font-black text-slate-200">
                      {formatDate(activeDetailedStatement.date)} <span className="text-[9px] text-[#10b981] p-0.5 bg-[#10b981]/10 rounded">Pulled</span>
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-450 font-bold">🌾 የእህል አይነት:</span>
                    <span className="font-bold text-white">
                      {getGrainDisplayName(activeDetailedStatement.grainType)} <span className="text-[9px] text-[#10b981] p-0.5 bg-[#10b981]/10 rounded">Pulled</span>
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-450 font-bold">📦 የእህል ብዛት በኩንታል:</span>
                    <span className="font-mono font-black text-slate-100">
                      {activeDetailedStatement.quantity.toLocaleString()} {lang === 'en' ? 'Quintal' : 'ኩንታል'} <span className="text-[9px] text-[#10b981] p-0.5 bg-[#10b981]/10 rounded">Pulled</span>
                    </span>
                  </div>
                </div>

                {/* Section 3: Cross-Module Cost breakdown details */}
                <div className="border-t border-dashed border-[#1f2937]/80 my-3"></div>
                
                <div className="space-y-2.5 text-xs font-sans">
                  <div className="text-[10px] font-black text-indigo-400 tracking-wider uppercase mb-1 flex items-center justify-between font-mono">
                    <span>🔄 CROSS-MODULE COST BREAKDOWN:</span>
                    <span className="text-[8px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded-sm uppercase tracking-tight flex items-center gap-1">
                      🔒 locked snapshot
                    </span>
                  </div>
                  
                  {/* STEP A */}
                  <div className="flex justify-between items-start py-0.5">
                    <div className="text-slate-400 max-w-[65%] leading-relaxed font-bold">
                      💵 የግዢ የአንድ Average ዋጋ:
                      <div className="text-[9px] text-slate-500 font-medium">(Average Purchase Price per Quintal)</div>
                    </div>
                    <span className="font-mono font-black text-amber-400 text-right shrink-0">
                      {activeDetailedStatement.avgPurchasePrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ETB
                      <div className="text-[9px] text-cyan-400 font-bold font-sans">Sourcing Aggregates</div>
                    </span>
                  </div>

                  {/* STEP B */}
                  <div className="flex justify-between items-start py-0.5">
                    <div className="text-slate-400 max-w-[65%] leading-relaxed font-bold">
                      💰 የግዢ አጠቃላይ ዋጋ:
                      <div className="text-[9px] text-slate-500 font-medium">(Total Purchase Value)</div>
                    </div>
                    <span className="font-mono font-black text-rose-450 text-right shrink-0">
                      {activeDetailedStatement.totalPurchaseValue.toLocaleString('en-US')} ETB
                      <div className="text-[8px] text-slate-500 font-mono">({activeDetailedStatement.quantity} × {activeDetailedStatement.avgPurchasePrice.toLocaleString('en-US', { maximumFractionDigits: 1 })})</div>
                    </span>
                  </div>

                  {/* STEP C */}
                  <div className="flex justify-between items-start py-0.5">
                    <div className="text-slate-400 max-w-[65%] leading-relaxed font-bold">
                      🛠️ የሽያጭ ቋሚ ወጪ:
                      <div className="text-[9px] text-slate-500 font-medium">(Allocated Fixed Cost)</div>
                    </div>
                    <span className="font-mono font-black text-violet-400 text-right shrink-0">
                      {activeDetailedStatement.allocatedFixedCost.toLocaleString('en-US')} ETB
                      <div className="text-[8px] text-slate-500 font-mono">({activeDetailedStatement.quantity} × {activeDetailedStatement.fixedCostUsed} ቋሚ ወጪ)</div>
                    </span>
                  </div>

                  {/* STEP D */}
                  <div className="flex justify-between items-start py-0.5">
                    <div className="text-slate-400 max-w-[65%] leading-relaxed font-bold">
                      💸 መሰረታዊ የሽያጭ ወጪ:
                      <div className="text-[9px] text-slate-500 font-medium">(Registry Overall Cost)</div>
                    </div>
                    <span className="font-mono font-black text-slate-350 text-right shrink-0">
                      {activeDetailedStatement.recordedOverallCost.toLocaleString('en-US')} ETB
                    </span>
                  </div>

                  <div className="flex justify-between items-start py-0.5 border-t border-[#1f2937]/30 pt-2">
                    <div className="text-slate-400 max-w-[65%] leading-relaxed font-bold">
                      📉 አጠቃላይ ወጪ (Comprehensive Total Cost):
                      <div className="text-[9px] text-slate-500 font-medium">(Fixed Cost + Registry Cost)</div>
                    </div>
                    <span className="font-mono font-black text-rose-450 text-right shrink-0">
                      {activeDetailedStatement.comprehensiveTotalCost.toLocaleString('en-US')} ETB
                    </span>
                  </div>
                </div>

                {/* Section 5: Triple-state result indicator banner */}
                <div className="border-t border-dashed border-[#1f2937]/80 my-3"></div>

                <div className="p-3 bg-slate-900/60 rounded-xl space-y-1.5 border border-[#1f2937]" id="result-final-badge-box">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-450 font-bold uppercase">{lang === 'en' ? 'Metric Status:' : '👉 የሂሳብ ውጤት:'}</span>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-black font-sans uppercase block ${activeDetailedStatement.statusColor}`}>
                      {activeDetailedStatement.statusMsg}
                    </span>
                  </div>
                  <div className="flex flex-col pt-1.5 border-t border-slate-800/60">
                    <span className="text-[10px] text-slate-400 font-bold leading-relaxed">
                      {lang === 'en' ? 'Company Net Profit Sum:' : '💰 የኩባንያው የተጣራ ትርፍ ድምር:'}
                    </span>
                    <span className={`text-base font-black font-mono tracking-tight mt-0.5 ${
                      activeDetailedStatement.netResult >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {activeDetailedStatement.netResult >= 0 ? '➕' : ''}{activeDetailedStatement.netResult.toLocaleString('en-US')} ETB 
                      <span className="text-[9px] text-slate-500 font-normal font-sans ml-1 col-span-2 text-right block mt-1 leading-normal">
                        ({activeDetailedStatement.totalRevenue.toLocaleString()} - ({activeDetailedStatement.totalPurchaseValue.toLocaleString()} + {activeDetailedStatement.comprehensiveTotalCost.toLocaleString()}))
                      </span>
                    </span>
                  </div>
                </div>

              </div>
            ) : (
              <div className="text-center py-20 border border-dashed border-[#1f2937] rounded-3xl bg-[#0d121f]/30 space-y-2 text-slate-500" id="blank-details-placeholder">
                <span className="text-3xl block">📋</span>
                <p className="text-xs font-bold font-sans">
                  {lang === 'en' ? 'Select a transaction registry on the left side to calculate P&L receipt.' : 'የሂሳብ መግለጫ ወረቀቱን ለማየት በግራ በኩል ካለው ሰንጠረዥ አንድ የሽያጭ መዝገብ ይምረጡ።'}
                </p>
              </div>
            )}

          </div>

          {/* Quick info-card describing system interlock rules */}
          <div className="bg-[#111827] border border-[#1f2937] rounded-3xl p-4 flex gap-3 shadow-md" id="calculations-rules-legend">
            <HelpCircle className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h5 className="text-xs font-extrabold text-white font-sans uppercase tracking-wider">
                {lang === 'en' ? 'INTELLIGENT SYSTEM CALCULATIONS RULES' : 'የሲስተሙ የመስቀለኛ ስሌት ደንቦች'}
              </h5>
              <p className="text-[10px] text-slate-450 leading-relaxed font-sans">
                {lang === 'en' ? (
                  <>
                    • <b>STEP A:</b> Dynamically retrieves Average Sourcing Cost per Quintal from [Sourcing Orders] grain aggregates.<br />
                    • <b>STEP B:</b> Multiplies quantity with the dynamic average purchase price.<br />
                    • <b>STEP C:</b> Applies configured <b>Global Fixed Cost per Quintal</b> to the current sale quantity.<br />
                    • <b>STEP D:</b> Calculates Comprehensive Total Cost by adding Allocated Fixed Cost (Step C) and the original direct cost from Sales Registry. Overall Net Profit is calculated as: Overall Price - (Total Purchase Value + Comprehensive Total Cost).
                  </>
                ) : (
                  <>
                    • <b>ደረጃ ሀ:</b> የግዢ የአንድ Average ዋጋን ከ[procurement orders / ግዥ ማዘዣዎች ክፍል] በራስ-ሰር ይወስዳል።<br />
                    • <b>ደረጃ ለ:</b> የእጅህን ብዛት ከAverage የግዢ ዋጋ ጋር በማባዛት የግዢ አጠቃላይ ዋጋን ያሰላል。<br />
                    • <b>ደረጃ ሐ:</b> የእጅህን ብዛት በመጀመሪያው ክፍል ላይ ከተመዘገበው <b>ቋሚ ወጪ ጋር</b> በማባዛት የሽያጭ ቋሚ ወጪን ያሰላል።<br />
                    • <b>ደረጃ መ:</b> የሽያጭ ወጪንና ቋሚ ወጪን በመደመር አጠቃላይ ወጪን ያሰላል፤ የተጣራ ትርፍ ደግሞ: አጠቃላይ ሽያጭ - (የግዢ አጠቃላይ ዋጋ + አጠቃላይ ወጪ) ተደርጎ ይወጣል።
                  </>
                )}
              </p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
