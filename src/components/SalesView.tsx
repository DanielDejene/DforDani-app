/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  DollarSign, 
  Search, 
  Plus, 
  TrendingUp, 
  User, 
  Activity, 
  X,
  CreditCard,
  ShoppingBag,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle,
  FileText,
  Globe
} from 'lucide-react';
import { Product, SaleTransaction, Account, PurchaseTransaction } from '../types';
import { formatDate } from '../utils/dateUtils';

interface SalesViewProps {
  sales: SaleTransaction[];
  products: Product[];
  accounts: Account[];
  onAddSale: (sale: Omit<SaleTransaction, 'id' | 'totalRevenue' | 'profit'>, linkToFinance: boolean) => void;
  onUpdateSale: (id: string, sale: Partial<Omit<SaleTransaction, 'id'>>) => void;
  onDeleteSale: (id: string) => void;
  purchases: PurchaseTransaction[];
  lang?: 'en' | 'am';
}

// 6 Core Grain varieties
const CORE_GRAINS = [
  { eng: 'Waliya', amh: 'ዋሊያ' },
  { eng: 'Evoniy', amh: 'ኤቮኒ' },
  { eng: 'Atar', amh: 'አተር' },
  { eng: 'Bakela', amh: 'ባቄላ' },
  { eng: 'Sinde', amh: 'ስንዴ' },
  { eng: 'Ashile', amh: 'አሺሌ' }
];

export default function SalesView({
  sales,
  products,
  accounts,
  onAddSale,
  onUpdateSale,
  onDeleteSale,
  purchases,
  lang: langProp
}: SalesViewProps) {
  
  // Localization State - Defaulting to English but synced with prop if provided
  const [localLang, setLocalLang] = useState<'en' | 'am'>('en');
  const lang = langProp || localLang;
  const setLang = setLocalLang;

  // Tab filtering state
  const [activeGrainTypeTab, setActiveGrainTypeTab] = useState<string>('All'); // 'All' or English grain name

  // Modal / Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSaleId, setEditingSaleId] = useState<string | null>(null);
  const [deletingSaleId, setDeletingSaleId] = useState<string | null>(null);

  // Form Inputs
  const [serialNumber, setSerialNumber] = useState('');
  const [selectedGrainEng, setSelectedGrainEng] = useState('Waliya');
  const [qtyQuintals, setQtyQuintals] = useState<number>(0);
  const [unitSellingPrice, setUnitSellingPrice] = useState<number>(0);
  const [unitCostPrice, setUnitCostPrice] = useState<number>(0);
  const [buyerName, setBuyerName] = useState('');
  const [note, setNote] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [saleDate, setSaleDate] = useState(() => {
    const today = new Date();
    return today.toISOString().substring(0, 10);
  });
  const [linkToFinance, setLinkToFinance] = useState(true);

  // Interlock dialog states
  const [showWarningPrompt, setShowWarningPrompt] = useState(false);
  const [pendingSaleData, setPendingSaleData] = useState<any>(null);

  // Search input state
  const [searchTerm, setSearchTerm] = useState('');

  // Normalize/Find matching product for current selection to retrieve inventory & cost default
  const activeProduct = useMemo(() => {
    return products.find(p => p.name.toLowerCase() === selectedGrainEng.toLowerCase());
  }, [products, selectedGrainEng]);

  // Handle select grain type change: update default unit cost / selling price
  const handleGrainChange = (grainEng: string) => {
    setSelectedGrainEng(grainEng);
    const prod = products.find(p => p.name.toLowerCase() === grainEng.toLowerCase());
    if (prod) {
      setUnitCostPrice(prod.unitCost);
      setUnitSellingPrice(prod.unitPrice);
    }
  };

  // Open Add Sale Modal
  const handleOpenAddModal = () => {
    setEditingSaleId(null);
    setSerialNumber(`SL-${String(sales.length + 1).padStart(3, '0')}`);
    const defaultGrain = CORE_GRAINS[0].eng;
    setSelectedGrainEng(defaultGrain);
    const prod = products.find(p => p.name.toLowerCase() === defaultGrain.toLowerCase());
    setQtyQuintals(10);
    setUnitCostPrice(prod ? prod.unitCost : 85);
    setUnitSellingPrice(prod ? prod.unitPrice : 110);
    setBuyerName('');
    setNote('');
    setSelectedAccountId(accounts[0]?.id || 'acc-1');
    setSaleDate(new Date().toISOString().substring(0, 10));
    setLinkToFinance(true);
    setShowWarningPrompt(false);
    setIsFormOpen(true);
  };

  // Open Edit Sale Modal
  const handleOpenEditModal = (sale: SaleTransaction) => {
    setEditingSaleId(sale.id);
    
    // Find matching serial number or generate one
    setSerialNumber(sale.id.toUpperCase());
    
    // Map productName back to core variety
    const foundGrain = CORE_GRAINS.find(cg => 
      sale.productName.toLowerCase().includes(cg.eng.toLowerCase()) || 
      sale.productName.toLowerCase().includes(cg.amh.toLowerCase())
    );
    const grainEngName = foundGrain ? foundGrain.eng : 'Waliya';
    setSelectedGrainEng(grainEngName);
    
    setQtyQuintals(sale.quantity);
    setUnitSellingPrice(sale.unitPrice);
    
    // Find unit cost from corresponding product, saved transaction cost, or try to infer from profit
    const inferredCost = sale.quantity > 0 ? (sale.unitPrice - (sale.profit / sale.quantity)) : 0;
    const resolvedUnitCost = sale.unitCost !== undefined 
      ? sale.unitCost 
      : (inferredCost > 0 ? inferredCost : (products.find(p => p.name.toLowerCase() === grainEngName.toLowerCase())?.unitCost || 85));
    setUnitCostPrice(resolvedUnitCost);
    
    setBuyerName(sale.customer);
    setNote(sale.note || '');
    setSelectedAccountId(sale.paymentAccount);
    setSaleDate(sale.date);
    setLinkToFinance(true);
    setShowWarningPrompt(false);
    setIsFormOpen(true);
  };

  // Form Live Calculations
  const revenueCalculations = useMemo(() => {
    const totalRev = qtyQuintals * unitSellingPrice;
    const totalCost = qtyQuintals * unitCostPrice;
    const netProfitPerQuintal = unitSellingPrice - unitCostPrice;
    const totalNetProfit = netProfitPerQuintal * qtyQuintals;
    return {
      totalRev,
      totalCost,
      netProfitPerQuintal,
      totalNetProfit
    };
  }, [qtyQuintals, unitSellingPrice, unitCostPrice]);

  // Inventory Limits calculations to inspect warnings/blocks
  const sourcingOrdersCapacity = useMemo(() => {
    const sourcedQty = purchases
      .filter(p => p.productName.trim().toLowerCase() === selectedGrainEng.trim().toLowerCase())
      .reduce((sum, p) => sum + p.quantity, 0);
      
    const soldQtyExceptThis = sales
      .filter(s => s.id !== editingSaleId && s.productName.trim().toLowerCase() === selectedGrainEng.trim().toLowerCase())
      .reduce((sum, s) => sum + s.quantity, 0);
      
    return Math.max(0, sourcedQty - soldQtyExceptThis);
  }, [purchases, sales, selectedGrainEng, editingSaleId]);

  // Stocks & Storage Volume (Absolute Warehouse Stock + Current Editing Quantity)
  const physicalStorageCapacity = useMemo(() => {
    const prod = products.find(p => p.name.trim().toLowerCase() === selectedGrainEng.trim().toLowerCase());
    const currentStock = prod ? prod.quantity : 0;
    
    // If editing, the quantity currently "sold" is added back to available capacity
    if (editingSaleId) {
      const originalSale = sales.find(s => s.id === editingSaleId);
      if (originalSale && originalSale.productName.trim().toLowerCase() === selectedGrainEng.trim().toLowerCase()) {
        return currentStock + originalSale.quantity;
      }
    }
    return currentStock;
  }, [products, sales, selectedGrainEng, editingSaleId]);

  // Hard Limit & Warning Trigger flags
  const isHardLimitBlocked = qtyQuintals > physicalStorageCapacity;
  const isSourcingLimitExceeded = qtyQuintals > sourcingOrdersCapacity;

  // Submit Handler for New & Updated sales
  const handleSaveSaleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedGrainEng) {
      alert(lang === 'en' ? 'Please select a grain type!' : 'እባክዎ የእህል አይነት ይምረጡ!');
      return;
    }

    if (qtyQuintals <= 0 || unitSellingPrice < 0 || unitCostPrice < 0) {
      alert(lang === 'en' ? 'Please enter valid quantity and price metrics!' : 'እባክዎ ትክክለኛ የብዛት እና የዋጋ መጠን ያስገቡ!');
      return;
    }

    // RULE B: Stock & Storage Hard Limit - CRITICAL
    if (isHardLimitBlocked) {
      alert(lang === 'en' 
        ? `❌ TRANSACTION BLOCKED: Cannot sell. Quantity exceeds total physical Stocks & Storage. (${qtyQuintals} > ${physicalStorageCapacity})`
        : `❌ TRANSACTION BLOCKED: Cannot sell. Quantity exceeds total physical Stocks & Storage. (${qtyQuintals} > ${physicalStorageCapacity})`
      );
      return;
    }

    const matchedProduct = products.find(p => p.name.toLowerCase() === selectedGrainEng.toLowerCase());
    if (!matchedProduct) {
      alert(lang === 'en' ? 'Selected grain could not be located in your product catalog!' : 'የተመረጠውን እህል በካታሎግ ውስጥ ማግኘት አልተቻለም!');
      return;
    }

    // RULE A: Sourcing Order Limit Warning
    if (isSourcingLimitExceeded && !showWarningPrompt) {
      // Trigger warning confirmation state to prompt user
      setPendingSaleData({
        productId: matchedProduct.id,
        productName: matchedProduct.name,
        quantity: qtyQuintals,
        unitPrice: unitSellingPrice,
        unitCost: unitCostPrice,
        date: saleDate,
        customer: buyerName.trim() || 'General Customer / Cash Sale',
        paymentAccount: selectedAccountId || accounts[0]?.id || 'acc-1',
        note: note.trim()
      });
      setShowWarningPrompt(true);
      return;
    }

    // Normal Proceed
    executeAuthorization({
      productId: matchedProduct.id,
      productName: matchedProduct.name,
      quantity: qtyQuintals,
      unitPrice: unitSellingPrice,
      unitCost: unitCostPrice,
      date: saleDate,
      customer: buyerName.trim() || 'General Customer / Cash Sale',
      paymentAccount: selectedAccountId || accounts[0]?.id || 'acc-1',
      note: note.trim()
    });
  };

  // Perform actual execution
  const executeAuthorization = (data: any) => {
    if (editingSaleId) {
      onUpdateSale(editingSaleId, data);
    } else {
      onAddSale(data, linkToFinance);
    }
    setIsFormOpen(false);
    setShowWarningPrompt(false);
    setPendingSaleData(null);
  };

  // Delete Action with safe check
  const handleDeleteClick = (saleId: string) => {
    setDeletingSaleId(saleId);
  };

  // Metric Aggregates shown in the Top Banner
  const statsSummary = useMemo(() => {
    const activeSales = sales.sort((a,b) => b.date.localeCompare(a.date));
    const totalRev = activeSales.reduce((sum, s) => sum + s.totalRevenue, 0);
    const totalProfit = activeSales.reduce((sum, s) => sum + s.profit, 0);
    const avgInvoice = activeSales.length > 0 ? (totalRev / activeSales.length) : 0;
    return {
      totalRev,
      totalProfit,
      avgInvoice,
      count: activeSales.length
    };
  }, [sales]);

  // Isolate / filter logs across selected grain variety & search input
  const processedSales = useMemo(() => {
    return sales.filter(s => {
      const term = searchTerm.toLowerCase();
      const matchesSearch = s.productName.toLowerCase().includes(term) || 
                            s.customer.toLowerCase().includes(term) ||
                            s.id.toLowerCase().includes(term);

      if (!matchesSearch) return false;

      if (activeGrainTypeTab === 'All') return true;
      
      const sName = s.productName.toLowerCase();
      const activeFilter = activeGrainTypeTab.toLowerCase();
      return sName.includes(activeFilter) || activeFilter.includes(sName);
    });
  }, [sales, searchTerm, activeGrainTypeTab]);

  // Calculate overall/total number of grains sold in each type of grain
  const grainSoldTotals = useMemo(() => {
    return CORE_GRAINS.map(g => {
      const totalSold = sales
        .filter(s => {
          const sName = s.productName.toLowerCase();
          const gName = g.eng.toLowerCase();
          return sName.includes(gName) || gName.includes(sName);
        })
        .reduce((sum, s) => sum + s.quantity, 0);
      return {
        ...g,
        totalSold
      };
    });
  }, [sales]);

  return (
    <div className="space-y-6" id="sales-registry-module">
      
      {/* LOCALIZED HEADER BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1f2937] pb-4">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400 animate-pulse" />
            {lang === 'en' ? 'Sales Registry & Controller' : 'የሽያጭ መመዝገቢያና መቆጣጠሪያ'}
            <span className="text-xs font-normal text-slate-400 bg-slate-800/60 border border-slate-700/60 py-0.5 px-2 rounded-full font-mono">
              Sales Registry
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {lang === 'en' 
              ? 'Register sales transactions, verify stock deductions, and manage net profit summary analytics.'
              : 'የሽያጭ ግብይቶችን መመዝገብ፣ የእህል ክምችት መቀነስ ማረጋገጥ እና የተጣራ ትርፍ ማጠቃለያ ማስተዳደርያ።'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Language Switcher */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5" id="sales-lang-selector">
            <button
              onClick={() => setLang('en')}
              className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                lang === 'en' 
                  ? 'bg-emerald-600 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Globe className="w-3 h-3" />
              English
            </button>
            <button
              onClick={() => setLang('am')}
              className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                lang === 'am' 
                  ? 'bg-emerald-600 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Globe className="w-3 h-3" />
              አማርኛ
            </button>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 bg-emerald-600 font-bold hover:bg-emerald-500 text-white text-xs py-2.5 px-4 rounded-xl transition-all shadow-md transform active:scale-95 cursor-pointer"
            id="btn-add-sales-new"
          >
            <Plus className="w-4 h-4" />
            {lang === 'en' ? 'Register New Sale' : 'አዲስ ሽያጭ መዝግብ'}
          </button>
        </div>
      </div>

      {/* OVERALL GRAINS SOLD DISPLAY PANEL */}
      <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-4 space-y-3" id="grains-overall-sold-panel">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1f2937] pb-2">
          <span className="text-xs uppercase font-extrabold text-slate-300 tracking-wider flex items-center gap-1.5 font-sans">
            <ShoppingBag className="w-4 h-4 text-emerald-450" />
            {lang === 'en' ? 'Overall Grains Sold Volume (by Type)' : 'በእያንዳንዱ የእህል አይነት የተሸጠ ጠቅላላ መጠን'}
          </span>
          <span className="text-[10px] font-mono text-slate-500">
            {lang === 'en' ? 'Displays total quantity sold' : 'ጠቅላላ የተሸጠውን መጠን ያሳያል'}
          </span>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {grainSoldTotals.map(g => (
            <div 
              key={g.eng} 
              className="bg-[#161d2b]/60 border border-[#1f2937] hover:border-emerald-500/20 rounded-lg p-3 text-center transition-all duration-300 hover:shadow-xs"
            >
              <div className="text-[11px] font-bold text-slate-400 font-sans block truncate mb-1">
                {lang === 'en' ? g.eng : g.amh}
              </div>
              <div className="text-base font-black font-mono text-emerald-400">
                {g.totalSold.toLocaleString('en-US')} <span className="text-[9px] text-slate-500 font-normal">{lang === 'en' ? 'qt' : 'ኩንታል'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. GRAIN SEPARATION RULE TABS */}
      <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-1.5 flex flex-wrap gap-1" id="grain-separation-tabs-row">
        <button
          onClick={() => setActiveGrainTypeTab('All')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeGrainTypeTab === 'All' 
              ? 'bg-emerald-600 text-white shadow-md' 
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          {lang === 'en' ? 'Show All' : 'ሁሉንም አሳይ'}
        </button>
        {CORE_GRAINS.map(g => (
          <button
            key={g.eng}
            onClick={() => setActiveGrainTypeTab(g.eng)}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeGrainTypeTab === g.eng 
                ? 'bg-[#4f46e5] text-white shadow-md' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            {lang === 'en' ? g.eng : g.amh}
          </button>
        ))}
      </div>

      {/* 3. SALES LOGS TABLE & CONTROLS */}
      <div className="bg-[#111827] border border-[#1f2937] rounded-xl shadow-lg overflow-hidden">
        
        {/* Search & Tool Strip */}
        <div className="p-4 border-b border-[#1f2937] flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#161d2b]/60">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-450" />
            <input
              type="text"
              placeholder={lang === 'en' ? 'Search by grain type, buyer name or SN...' : 'በእህል አይነት ወይም በገዢ ስም ይፈልጉ (Search invoice or client)...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-[#1f2937] rounded-lg bg-[#111827] text-white focus:outline-hidden focus:border-indigo-500 transition-colors font-sans"
            />
          </div>
          <span className="text-[10px] text-slate-400 font-mono tracking-wider bg-slate-800/40 border border-slate-705 py-1 px-2 rounded-md">
            {lang === 'en' ? 'Filtered: ' : 'የተጣሩ መዛግብት: '} <strong>{processedSales.length}</strong>
          </span>
        </div>

        {/* Log table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#1f2937] bg-[#161d2b] text-[10px] font-bold text-slate-400 uppercase tracking-wider font-sans">
                <th className="py-3 px-4">{lang === 'en' ? 'Serial Number (ተ.ቁ)' : 'ተ.ቁ (Serial Number)'}</th>
                <th className="py-3 px-4">{lang === 'en' ? 'Grain Type (የእህል አይነት)' : 'የእህል አይነት (Grain Type)'}</th>
                <th className="py-3 px-4 text-right">{lang === 'en' ? 'Quantity (የእህል ብዛት በኩንታል)' : 'የእህል ብዛት በኩንታል (Qty)'}</th>
                <th className="py-3 px-4 text-right">{lang === 'en' ? 'Selling Price (የአንዱ ዋጋ)' : 'የአንዱ ዋጋ (Price)'}</th>
                <th className="py-3 px-4 text-right">{lang === 'en' ? 'Overall Price' : 'ጠቅላላ ሽያጭ ዋጋ (Overall Price)'}</th>
                <th className="py-3 px-4 text-right">{lang === 'en' ? 'Cost Price (የአንዱ ወጪ)' : 'የአንዱ ወጪ (Cost)'}</th>
                <th className="py-3 px-4 text-right">{lang === 'en' ? 'Overall Cost' : 'ጠቅላላ ወጪ (Overall Cost)'}</th>
                <th className="py-3 px-4">{lang === 'en' ? 'Buyer Name (የገዢ ስም)' : 'የገዢ ስም (Buyer)'}</th>
                <th className="py-3 px-4">{lang === 'en' ? 'Note (ማስታወሻ)' : 'ማስታወሻ (Note)'}</th>
                <th className="py-3 px-4 text-right">{lang === 'en' ? 'Actions' : 'እርምጃዎች'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f2937] text-xs">
              {processedSales.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-16 text-slate-500 font-sans">
                    {lang === 'en' 
                      ? 'No sales records found matching the current search filters.'
                      : 'በተመረጠው የእህል ምድብ ምንም የሽያጭ ደረሰኝ አልተገኘም።'}
                  </td>
                </tr>
              ) : (
                processedSales.map((s, idx) => {
                  const depositAccountObj = accounts.find(a => a.id === s.paymentAccount);
                  
                  // Extract grain label
                  const cgMatch = CORE_GRAINS.find(cg => 
                    s.productName.toLowerCase().includes(cg.eng.toLowerCase()) || 
                    s.productName.toLowerCase().includes(cg.amh.toLowerCase())
                  );
                  const displayGrainLabel = cgMatch 
                    ? (lang === 'en' ? cgMatch.eng : `${cgMatch.amh} (${cgMatch.eng})`) 
                    : s.productName;

                  // Use saved transaction cost if available, otherwise infer unit cost from registered profit
                  const sCostPrice = s.unitCost !== undefined 
                    ? s.unitCost 
                    : (s.quantity > 0 ? (s.unitPrice - (s.profit / s.quantity)) : 0);

                  return (
                    <tr key={s.id} className="hover:bg-[#161d2b]/40 transition-colors" id={`sales-row-${s.id}`}>
                      {/* 1. ተ.ቁ (Serial Number) */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-400">
                        {s.id.toUpperCase().substring(0, 10)}
                      </td>
                      
                      {/* 2. የእህል አይነት (Grain Type) */}
                      <td className="py-3.5 px-4 font-bold text-white">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-555 shrink-0"></span>
                          <span>{displayGrainLabel}</span>
                        </div>
                      </td>

                      {/* 3. የእህል ብዛት በኩንታል (Quantity) */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-200">
                        {s.quantity.toLocaleString('en-US')} {lang === 'en' ? 'qt' : 'ኩንታል'}
                      </td>

                      {/* 4. የአንዱ ዋጋ (Selling Price of one kuntal) */}
                      <td className="py-3.5 px-4 text-right font-mono text-amber-300 font-bold">
                        {s.unitPrice.toLocaleString('en-US')} ETB
                      </td>

                      {/* 5. overall price (quantity * unit price) */}
                      <td className="py-3.5 px-4 text-right font-black font-mono text-emerald-450">
                        {s.totalRevenue.toLocaleString('en-US')} ETB
                      </td>

                      {/* 6. የአንዱ ወጪ (Cost of one kuntal) */}
                      <td className="py-3.5 px-4 text-right font-mono text-slate-300">
                        {sCostPrice.toLocaleString('en-US')} ETB
                      </td>

                      {/* 7. overall cost (cost of one kuntal * quantity) */}
                      <td className="py-3.5 px-4 text-right font-bold font-mono text-rose-400 text-[13px]">
                        {(sCostPrice * s.quantity).toLocaleString('en-US')} ETB
                      </td>

                      {/* 8. የገዢ ስም (Buyer Name) */}
                      <td className="py-3.5 px-4 text-slate-300 font-semibold">
                        <div className="flex items-center gap-1.5 font-medium">
                          <User className="w-3 h-3 text-slate-500" />
                          <span>{s.customer}</span>
                        </div>
                      </td>

                      {/* 9. ማስታወሻ (Note) */}
                      <td className="py-3.5 px-4 text-slate-400 italic max-w-xs truncate" title={s.note || ''}>
                        {s.note || '-'}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(s)}
                            className="p-1 px-2 text-[10px] font-bold text-indigo-400 hover:text-white bg-[#4f46e5]/10 hover:bg-[#4f46e5] border border-indigo-500/20 rounded-md transition-all inline-flex items-center gap-0.5 cursor-pointer"
                            title={lang === 'en' ? 'Edit' : 'አስተካክል'}
                            id={`edit-sale-${s.id}`}
                          >
                            <Edit className="w-2.5 h-2.5" />
                            <span>{lang === 'en' ? 'Edit' : 'አስተካክል'}</span>
                          </button>
                          <button
                            onClick={() => handleDeleteClick(s.id)}
                            className="p-1 px-2 text-[10px] font-bold text-rose-400 hover:text-rose-100 bg-rose-500/10 hover:bg-rose-600 border border-[#1f2937] rounded-md transition-all inline-flex items-center gap-0.5 cursor-pointer"
                            title={lang === 'en' ? 'Delete' : 'ሰርዝ'}
                            id={`delete-sale-${s.id}`}
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                            <span>{lang === 'en' ? 'Delete' : 'ሰርዝ'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* 4. NEW/EDIT SALES REGISTRATION CREATION MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-[#111827] rounded-xl border border-[#1f2937] max-w-xl w-full shadow-2xl overflow-hidden my-8">
            
            {/* Modal Header */}
            <div className="p-4 md:p-5 border-b border-[#1f2937] flex items-center justify-between bg-[#1f2937]/30">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-emerald-400 animate-pulse" />
                <h3 className="text-sm font-black text-white font-sans uppercase">
                  {editingSaleId 
                    ? (lang === 'en' ? 'Edit Sales Record' : 'ሽያጭ ማስተካከያ') 
                    : (lang === 'en' ? 'New Sales Registration' : 'አዲስ ሽያጭ መመዝገቢያ')}
                </h3>
              </div>
              <button 
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-[#1f2937] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Warning Interlock Box Rule A */}
            {showWarningPrompt && pendingSaleData && (
              <div className="m-5 p-4 bg-amber-500/10 border border-amber-500/40 rounded-xl space-y-3">
                <div className="flex items-start gap-2 text-amber-400">
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <strong className="block text-amber-300 text-sm">
                      {lang === 'en' ? '⚠️ WARNING: Sourcing Quantity Threshold Exceeded' : '⚠️ ALERT: Sourcing Limit Exceeded / የግዢ ገደብ ማስጠንቀቂያ'}
                    </strong>
                    <p className="mt-1 font-sans leading-relaxed text-slate-300">
                      {lang === 'en' 
                        ? 'The requested sales quantity is higher than the available balance in your active Sourcing purchase contract aggregates. Do you want to authorize this sale regardless?'
                        : 'የገለጹት ሽያጭ ብዛት በቀሪው የግዥ ትዕዛዝ ክምችት ላይ ካለው መጠን ይበልጣል። ሽያጩን ለማረጋገጥ እርግጠኛ ነዎት?'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 justify-end pt-2 border-t border-amber-500/20">
                  <button
                    type="button"
                    onClick={() => setShowWarningPrompt(false)}
                    className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    {lang === 'en' ? 'No, Go Back' : 'ተመለስ'}
                  </button>
                  <button
                    type="button"
                    onClick={() => executeAuthorization(pendingSaleData)}
                    className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    {lang === 'en' ? 'Yes, Authorize and Process' : 'አዎ፣ ቀጥል'}
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleSaveSaleSubmit} className="p-5 space-y-4 text-xs">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* ተ.ቁ Serial Number */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-300 font-sans">
                    {lang === 'en' ? '1. Serial Number / SN *' : '1. ተ.ቁ (Serial Number) *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value)}
                    placeholder="e.g. SL-001"
                    className="w-full bg-[#0a0f18] border border-[#1f2937] rounded-lg p-2.5 focus:outline-hidden focus:border-emerald-555 font-mono text-white text-xs font-semibold"
                  />
                </div>

                {/* የገዢ ስም Buyer Name */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-300 font-sans">
                    {lang === 'en' ? '6. Buyer Name *' : '6. የገዢ ስም (Buyer Name) *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    placeholder={lang === 'en' ? "Customer's name" : "የገዢ ስም"}
                    className="w-full bg-[#0a0f18] border border-[#1f2937] rounded-lg p-2.5 focus:outline-hidden focus:border-emerald-555 text-slate-200 text-xs font-medium"
                  />
                </div>

              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                {/* የእህል አይነት Select Grain */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-300 font-sans">
                    {lang === 'en' ? '2. Grain Type *' : '2. የእህል አይነት (Grain Type) *'}
                  </label>
                  <select
                    value={selectedGrainEng}
                    onChange={(e) => handleGrainChange(e.target.value)}
                    className="w-full bg-[#0a0f18] border border-[#1f2937] rounded-lg p-2.5 focus:outline-hidden focus:border-indigo-505 font-sans font-bold text-slate-100"
                  >
                    {CORE_GRAINS.map(g => (
                      <option key={g.eng} value={g.eng} className="bg-[#111827] text-white font-bold">
                        {lang === 'en' ? `${g.eng} (${g.amh})` : `${g.amh} (${g.eng})`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* የእህል ብዛት በኩንታል Quantity */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-300 font-sans">
                      {lang === 'en' ? '3. Quantity in Quintals *' : '3. የእህል ብዛት በኩንታል (Quantity) *'}
                    </label>
                    <span className="text-[10px] text-slate-400 font-bold font-mono">
                      {lang === 'en' ? 'In Stock: ' : 'በመጋዘን ያለው: '} <strong className="text-emerald-400">{physicalStorageCapacity} qt</strong>
                    </span>
                  </div>
                  <input
                    type="number"
                    min="1"
                    required
                    value={qtyQuintals || ''}
                    onChange={(e) => setQtyQuintals(Number(e.target.value))}
                    placeholder="Volume in qt"
                    className={`w-full border rounded-lg p-2.5 focus:outline-hidden text-xs font-bold font-mono bg-[#0a0f18] ${isHardLimitBlocked ? 'border-rose-555 text-rose-400 focus:border-rose-500' : 'border-[#1f2937] text-white focus:border-emerald-550'}`}
                  />
                </div>

              </div>

              {/* Sourcing & Storage Reference Indicator Panel */}
              <div className="bg-[#161d2b]/60 border border-[#1f2937] p-3 rounded-lg grid grid-cols-2 gap-4 text-[11px]">
                <div>
                  <span className="text-slate-400 block font-medium">
                    {lang === 'en' ? 'Sourcing Contract Stock Balance:' : 'የተገኘ የSourcing Orders ክምችት:'}
                  </span>
                  <strong className="text-amber-300 font-mono text-xs">{sourcingOrdersCapacity} qt</strong>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">
                    {lang === 'en' ? 'Warehouse Physical Balance:' : 'ጠቅላላ የStocks & Storage መጠን:'}
                  </span>
                  <strong className="text-emerald-400 font-mono text-xs">{physicalStorageCapacity} qt <span className="text-[9px] font-normal text-slate-400">({lang === 'en' ? 'Max limit' : 'ከፍተኛው ወሰን'})</span></strong>
                </div>
              </div>

              {/* RULE B BLOCK PROMPT */}
              {isHardLimitBlocked && (
                <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-[11.5px] font-bold flex items-start gap-1.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    {lang === 'en' 
                      ? '❌ TRANSACTION BLOCKED: Cannot sell. Quantity exceeds total physical Stocks & Storage balance.' 
                      : '❌ TRANSACTION BLOCKED: Cannot sell. Quantity exceeds total physical Stocks & Storage.'}
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                {/* የአንዱ ዋጋ Unit Selling Price */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-300 font-sans">
                    {lang === 'en' ? '4. Selling Price per Quintal *' : '4. የአንዱ ዋጋ (Selling Price per Quintal) *'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    placeholder="Unit selling rate"
                    value={unitSellingPrice || ''}
                    onChange={(e) => setUnitSellingPrice(Number(e.target.value))}
                    className="w-full border border-[#1f2937] bg-[#0a0f18] text-white rounded-lg p-2.5 focus:outline-hidden focus:border-emerald-550 font-mono text-xs font-semibold"
                  />
                </div>

                {/* የአንዱ ወጪ Cost Price */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-300 font-sans">
                    {lang === 'en' ? '5. Cost Price per Quintal *' : '5. የአንዱ ወጪ (Cost Price per Quintal) *'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    placeholder="Reference cost price"
                    value={unitCostPrice || ''}
                    onChange={(e) => setUnitCostPrice(Number(e.target.value))}
                    className="w-full border border-[#1f2937] bg-[#0a0f18] text-white rounded-lg p-2.5 focus:outline-hidden focus:border-[#4f46e5] font-mono text-xs font-semibold"
                  />
                </div>

              </div>

              {/* AUTOMATED MATH CALCULATION DISPLAY */}
              <div className="p-3.5 bg-[#161d2b]/80 border border-[#1f2937] rounded-xl space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block border-b border-[#1f2937] pb-1">
                  {lang === 'en' ? 'Automated Calculations' : 'ራስ-ሰር የሂሳብ ስሌቶች (Automated Calculations)'}
                </span>
                
                <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-[11px] font-sans">
                  
                  {/* Overall Price */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">{lang === 'en' ? 'overall price (Qty * Selling Price):' : 'ጠቅላላ የሽያጭ ዋጋ (Overall Price):'}</span>
                    <strong className="text-emerald-400 font-black font-mono text-xs">{revenueCalculations.totalRev.toLocaleString('en-US', { minimumFractionDigits: 2 })} ETB</strong>
                  </div>

                  {/* Overall Cost */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">{lang === 'en' ? 'overall cost (Qty * Cost Price):' : 'ጠቅላላ ወጪ (Overall Cost):'}</span>
                    <strong className="text-rose-400 font-bold font-mono text-xs">{revenueCalculations.totalCost.toLocaleString('en-US', { minimumFractionDigits: 2 })} ETB</strong>
                  </div>

                </div>
              </div>

              {/* ማስታወሻ Note */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-300 font-sans">
                  {lang === 'en' ? '7. Note / Memo' : '7. ማስታወሻ (Note)'}
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={lang === 'en' ? 'Add details like cheque number, trade references...' : 'ተጨማሪ መግለጫ እዚህ ይጻፉ... e.g., በባንክ የተደረገ ክፍያ'}
                  rows={2}
                  className="w-full bg-[#0a0f18] border border-[#1f2937] rounded-lg p-2.5 focus:outline-hidden focus:border-[#4f46e5] text-slate-200 font-sans"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Wallet Account Selection */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-300 font-sans">
                    {lang === 'en' ? 'Receiving Wallet / Account *' : 'የባንክ ቦርሳ ማከማቻ (Receiving Account / Wallet) *'}
                  </label>
                  <select
                    value={selectedAccountId}
                    onChange={(e) => setSelectedAccountId(e.target.value)}
                    className="w-full bg-[#0a0f18] border border-[#1f2937] rounded-lg p-2.5 focus:outline-hidden focus:border-emerald-550 font-sans text-slate-200 font-bold"
                  >
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id} className="bg-[#111827] text-white font-semibold">
                        {acc.name} ({lang === 'en' ? 'Bal: ' : 'ቀሪ: '}{acc.balance.toLocaleString('en-US')} ETB)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-300 font-sans">
                    {lang === 'en' ? 'Transaction Date *' : 'በሽያጭ የተከናወነበት ቀን *'}
                  </label>
                  <input
                    type="date"
                    required
                    value={saleDate}
                    onChange={(e) => setSaleDate(e.target.value)}
                    className="w-full bg-[#0a0f18] border border-[#1f2937] rounded-lg p-2.5 focus:outline-hidden focus:border-emerald-550 text-white font-mono"
                  />
                </div>

              </div>

              {/* Finance Bookkeeping Toggle */}
              {!editingSaleId && (
                <div className="p-3 bg-[#111827] border border-[#1f2937] rounded-lg flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    id="linkFinanceCheckbox"
                    checked={linkToFinance}
                    onChange={(e) => setLinkToFinance(e.target.checked)}
                    className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-550 border-[#1f2937] bg-[#0f1115] w-4 h-4 cursor-pointer shrink-0"
                  />
                  <label htmlFor="linkFinanceCheckbox" className="font-sans text-[11px] text-slate-300 select-none cursor-pointer leading-tight">
                    <strong>
                      {lang === 'en' 
                        ? 'Link transaction to Financial Ledger (Double-entry journaling)' 
                        : 'ሂሳቡን ከፋይናንስ መዝገብ ጋር አገናኝ (Link to Personal Finance ledger)'}
                    </strong>
                    <span className="block text-slate-500 mt-1">
                      {lang === 'en' 
                        ? `This will log the revenue of ${revenueCalculations.totalRev.toLocaleString('en-US')} ETB under "Inventory Sale" category directly to your wallet balance.`
                        : `የሽያጩን ጠቅላላ ገቢ ${revenueCalculations.totalRev.toLocaleString('en-US')} ETB በ "Inventory Sale" ምድብ ወደ ተመረጠው የባንክ ቦርሳ ገቢ ያደርጋል።`}
                    </span>
                  </label>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#1f2937]">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2 px-4 rounded-xl transition-all font-sans text-xs cursor-pointer"
                >
                  {lang === 'en' ? 'Cancel' : 'ሰርዝ'}
                </button>
                <button
                  type="submit"
                  disabled={isHardLimitBlocked}
                  className={`font-black py-2 px-5 rounded-xl transition-all font-sans text-xs shadow-md cursor-pointer ${
                    isHardLimitBlocked 
                      ? 'bg-slate-700 text-slate-400 cursor-not-allowed border border-rose-900/30' 
                      : 'bg-emerald-600 hover:bg-emerald-555 text-white transform active:scale-95'
                  }`}
                >
                  {editingSaleId 
                    ? (lang === 'en' ? 'Save Changes' : 'ለውጦችን መዝግብ') 
                    : (lang === 'en' ? 'Authorize Sale' : 'ሽያጩን አረጋግጥ')}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* STUNNING INLINE DELETE CONFIRMATION DIALOG */}
      {deletingSaleId && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="delete-confirmation-backdrop">
          <div className="bg-[#111827] rounded-xl border border-[#1f2937] max-w-sm w-full shadow-2xl p-6 space-y-4" id="delete-confirmation-modal">
            <div className="flex items-center gap-3 text-rose-400" id="delete-modal-header">
              <div className="p-3 bg-rose-500/10 text-rose-400 rounded-full border border-rose-500/20">
                <Trash2 className="w-5 h-5 text-rose-500 shrink-0" />
              </div>
              <div>
                <h4 className="text-sm font-black text-white font-sans uppercase">
                  {lang === 'en' ? 'Confirm Deletion' : 'መሰረዝ ማረጋገጫ'}
                </h4>
                <p className="text-[10px] text-slate-500 font-sans">
                  {lang === 'en' ? 'Operation is irreversible' : 'ይህ እርምጃ ወደ ኋላ ሊመለስ አይችልም'}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-sans font-medium">
              {lang === 'en'
                ? 'Are you sure you want to delete this sales record? This will automatically revert physical inventory stock and ledger accounts.'
                : 'ይህን የሽያጭ መዝገብ መሰረዝ እንደሚፈልጉ እርግጠኛ ነዎት? ይህ ክምችቱንና ሂሳቡን በራስሰር ይመልሳል።'}
            </p>

            <div className="flex items-center gap-2 justify-end pt-3 border-t border-[#1f2937]" id="delete-modal-buttons">
              <button
                type="button"
                onClick={() => setDeletingSaleId(null)}
                className="px-4 py-2 bg-[#1f2937] hover:bg-[#374151] text-slate-300 hover:text-white text-[11px] font-bold rounded-lg transition-all cursor-pointer"
                id="cancel-delete-modal-btn"
              >
                {lang === 'en' ? 'Cancel' : 'ተመለስ'}
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteSale(deletingSaleId);
                  setDeletingSaleId(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold rounded-lg transition-all cursor-pointer animate-pulse"
                id="confirm-delete-modal-btn"
              >
                {lang === 'en' ? 'Delete Record' : 'ቀሪውን ሰርዝ'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
