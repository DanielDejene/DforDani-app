/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Plus, 
  Search, 
  Scale,
  DollarSign,
  X,
  Edit2,
  Trash2,
  Calendar,
  Grid,
  Layers,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Product, PurchaseTransaction, Account, SaleTransaction } from '../types';
import { formatDate } from '../utils/dateUtils';

interface PurchasingViewProps {
  purchases: PurchaseTransaction[];
  products: Product[];
  accounts: Account[];
  onAddPurchase: (purchase: Omit<PurchaseTransaction, 'id' | 'totalCost'>, deductFromFinance: boolean) => void;
  onReceivePurchase: (id: string) => void;
  onDeletePurchase: (id: string) => void;
  onUpdatePurchase: (id: string, quantity: number, overallPrice: number, date: string) => void;
  sales: SaleTransaction[];
}

const GRAIN_ITEMS = ['Waliya', 'Evoniy', 'Atar', 'Bakela', 'Sinde', 'Ashile'];

export default function PurchasingView({
  purchases,
  products,
  accounts,
  onAddPurchase,
  onDeletePurchase,
  onUpdatePurchase,
  sales,
}: PurchasingViewProps) {
  
  // View mode states: 'tabs' (show one separate table at a time) or 'all' (show all 6 separate tables on screen)
  const [viewMode, setViewMode] = useState<'tabs' | 'all'>('tabs');
  const [activeItemTab, setActiveItemTab] = useState<string>('Waliya');

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Create Form States
  const [selectedGrain, setSelectedGrain] = useState('');
  const [quantity, setQuantity] = useState<number>(0);
  const [overallPrice, setOverallPrice] = useState<number>(0);
  const [date, setDate] = useState(() => {
    const today = new Date();
    return today.toISOString().substring(0, 10);
  });

  // Edit Form States
  const [editingPurchase, setEditingPurchase] = useState<PurchaseTransaction | null>(null);
  const [editQuantity, setEditQuantity] = useState<number>(0);
  const [editOverallPrice, setEditOverallPrice] = useState<number>(0);
  const [editDate, setEditDate] = useState<string>('');

  // Delete Confirmation State
  const [deleteConfirmPurchase, setDeleteConfirmPurchase] = useState<PurchaseTransaction | null>(null);

  // Collapsed states for All-Separate view
  const [collapsedTables, setCollapsedTables] = useState<Record<string, boolean>>({});

  const toggleTableCollapse = (itemName: string) => {
    setCollapsedTables(prev => ({
      ...prev,
      [itemName]: !prev[itemName]
    }));
  };

  // Handle grain selection
  const handleGrainChange = (grainName: string) => {
    setSelectedGrain(grainName);
  };

  // Submit handler (Enter Sourcing Data)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGrain) {
      alert('Please select a grain item!');
      return;
    }
    if (quantity <= 0) {
      alert('Please enter a valid quantity in kuntals!');
      return;
    }
    if (overallPrice <= 0) {
      alert('Please enter a valid overall price!');
      return;
    }

    const calculatedUnitCost = Number((overallPrice / quantity).toFixed(4));
    if (calculatedUnitCost <= 0) {
      alert('Calculated single price is invalid!');
      return;
    }

    const linkedProduct = products.find(p => p.name.toLowerCase() === selectedGrain.toLowerCase());
    const productId = linkedProduct ? linkedProduct.id : `prod-${selectedGrain.toLowerCase()}`;
    const productName = linkedProduct ? linkedProduct.name : selectedGrain;

    onAddPurchase({
      productId,
      productName,
      quantity,
      unitCost: calculatedUnitCost,
      date,
      supplier: 'Local Supplier',
      status: 'Received', // automatically receive right away
      paymentAccount: accounts[0]?.id || 'acc-1'
    }, true); // link with finance ledgers automatically

    // Reset State
    setSelectedGrain('');
    setQuantity(0);
    setOverallPrice(0);
    setShowAddModal(false);
  };

  // Edit dialog handler open
  const handleStartEdit = (purchase: PurchaseTransaction) => {
    setEditingPurchase(purchase);
    setEditQuantity(purchase.quantity);
    setEditOverallPrice(purchase.totalCost);
    setEditDate(purchase.date);
  };

  // Submit edit handler
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPurchase) return;
    if (editQuantity <= 0) {
      alert('Please enter a valid quantity in kuntals!');
      return;
    }
    if (editOverallPrice <= 0) {
      alert('Please enter a valid overall price!');
      return;
    }

    onUpdatePurchase(editingPurchase.id, editQuantity, editOverallPrice, editDate);
    setEditingPurchase(null);
  };

  // Delete transaction handler
  const handleDeleteClick = (purchase: PurchaseTransaction) => {
    setDeleteConfirmPurchase(purchase);
  };

  // Sorted list of all purchases
  const sortedPurchases = React.useMemo(() => {
    return [...purchases].sort((a, b) => b.date.localeCompare(a.date));
  }, [purchases]);

  // Metric aggregates separately for all 6 items with deduction of sold quantities
  const itemMetrics = React.useMemo(() => {
    return GRAIN_ITEMS.map(item => {
      const itemPurchases = purchases.filter(p => p.productName.toLowerCase() === item.toLowerCase());
      const totalBought = itemPurchases.reduce((sum, p) => sum + p.quantity, 0);
      const soldQty = (sales || []).filter(s => {
        const sName = s.productName.toLowerCase();
        const itemLower = item.toLowerCase();
        return sName.includes(itemLower) || itemLower.includes(sName);
      }).reduce((sum, s) => sum + s.quantity, 0);
      const currentlyInStock = Math.max(0, totalBought - soldQty);
      const totalSpent = itemPurchases.reduce((sum, p) => sum + p.totalCost, 0);
      return {
        name: item,
        totalBought,
        currentlyInStock,
        totalSpent
      };
    });
  }, [purchases, sales]);

  // Custom JSX for the table row
  const renderPurchaseRow = (p: PurchaseTransaction) => {
    return (
      <tr key={p.id} className="hover:bg-[#161d2b]/40 transition-colors" id={`pur-record-row-${p.id}`}>
        {/* Selected Item */}
        <td className="py-3 px-4">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
            <span className="font-bold text-slate-200 font-sans">{p.productName}</span>
          </div>
        </td>

        {/* Date */}
        <td className="py-3 px-4 text-slate-400 font-mono font-medium">
          {formatDate(p.date)}
        </td>

        {/* No. of Grain in Kuntal */}
        <td className="py-3 px-4 text-right font-mono text-slate-100 font-semibold">
          {p.quantity.toLocaleString('en-US')} kuntal
        </td>

        {/* Single (one) Price */}
        <td className="py-3 px-4 text-right font-mono text-slate-300">
          ${p.unitCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </td>

        {/* Overall Price */}
        <td className="py-3 px-4 text-right font-bold font-mono text-rose-400">
          -${p.totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </td>

        {/* Actions (Edit and Delete) */}
        <td className="py-3 px-4 text-right">
          <div className="flex items-center justify-end gap-1.5">
            <button
              onClick={() => handleStartEdit(p)}
              className="p-1 px-2 text-[11px] font-semibold text-slate-400 hover:text-white bg-[#1f2937]/50 hover:bg-[#1f2937] border border-[#1f2937] rounded-md transition-colors inline-flex items-center gap-1"
              title="Edit record"
              id={`edit-btn-${p.id}`}
            >
              <Edit2 className="w-3 h-3 text-indigo-400" />
              <span>Edit</span>
            </button>
            <button
              onClick={() => handleDeleteClick(p)}
              className="p-1 px-2 text-[11px] font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 rounded-md transition-colors inline-flex items-center gap-1"
              title="Delete record"
              id={`delete-btn-${p.id}`}
            >
              <Trash2 className="w-3 h-3" />
              <span>Delete</span>
            </button>
          </div>
        </td>
      </tr>
    );
  };

  // Helper to render Table header
  const renderTableHeader = () => {
    return (
      <thead>
        <tr className="border-b border-[#1f2937] bg-[#161d2b]/80 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-sans">
          <th className="py-2.5 px-4">Selected Item</th>
          <th className="py-2.5 px-4">Date</th>
          <th className="py-2.5 px-4 text-right">No. of Grain (Kuntal)</th>
          <th className="py-2.5 px-4 text-right">Single Price ($/Kuntal)</th>
          <th className="py-2.5 px-4 text-right">Overall Price ($)</th>
          <th className="py-2.5 px-4 text-right">Actions</th>
        </tr>
      </thead>
    );
  };

  return (
    <div className="space-y-6" id="purchasing-view">

      {/* 1. Grain Purchasing Individual Summary Metrics */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-sans">Sourcing Aggregates By Grain</h3>
          <span className="text-[10px] text-slate-500 font-mono">Running calculated totals</span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3.5" id="purchase-metrics-six-items">
          {itemMetrics.map(item => (
            <div 
              key={item.name} 
              className="bg-[#111827] border border-[#1f2937] rounded-xl p-3.5 shadow-sm hover:border-indigo-500/20 transition-all flex flex-col justify-between space-y-2"
              id={`metric-card-${item.name.toLowerCase()}`}
            >
              <div className="flex items-center justify-between border-b border-[#1f2937] pb-1">
                <span className="text-xs font-bold text-white font-sans">{item.name}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
              </div>
              
              <div className="space-y-1.5">
                {/* Total Grain Bought */}
                <div>
                  <span className="text-[8px] uppercase font-bold text-slate-400 block tracking-wide">Total Bought</span>
                  <span className="text-[11px] font-bold font-mono text-emerald-400 block">
                    {item.totalBought.toLocaleString('en-US')} kuntal
                  </span>
                </div>

                {/* Currently in Stock */}
                <div>
                  <span className="text-[8px] uppercase font-bold text-cyan-400 block tracking-wide">Currently in Stock</span>
                  <span className="text-[11px] font-bold font-mono text-cyan-400 block">
                    {item.currentlyInStock.toLocaleString('en-US')} kuntal
                  </span>
                </div>

                {/* Total Purchase Value */}
                <div>
                  <span className="text-[8px] uppercase font-bold text-slate-400 block tracking-wide">Total Spent</span>
                  <span className="text-[11px] font-bold font-mono text-indigo-400 block">
                    ${item.totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                {/* Average Sourcing Price */}
                <div>
                  <span className="text-[8px] uppercase font-bold text-slate-400 block tracking-wide">Avg Price</span>
                  <span className="text-[11px] font-bold font-mono text-amber-400 block">
                    ${(item.totalBought > 0 ? item.totalSpent / item.totalBought : 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/kn
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Top Bar Controls with Layout View Toggle */}
      <div className="flex flex-col sm:flex-row items-center justify-between bg-[#111827] border border-[#1f2937] p-3.5 rounded-xl gap-4">
        
        {/* Toggle to view one separate tab or all 6 separate tables stacked */}
        <div className="flex items-center gap-1 bg-[#161d2b] p-1 rounded-lg border border-[#1f2937]">
          <button
            onClick={() => setViewMode('tabs')}
            className={`px-3 py-1.5 rounded-md text-[11px] font-bold font-sans transition-all flex items-center gap-1.5 ${
              viewMode === 'tabs' 
                ? 'bg-indigo-600 text-white shadow-xs' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Tabbed Separation
          </button>
          <button
            onClick={() => setViewMode('all')}
            className={`px-3 py-1.5 rounded-md text-[11px] font-bold font-sans transition-all flex items-center gap-1.5 ${
              viewMode === 'all' 
                ? 'bg-indigo-600 text-white shadow-xs' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            All 6 Tables Separated
          </button>
        </div>

        {/* Global Filter / Search */}
        <div className="flex-1 max-w-sm relative">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Quick search tables..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-[#1f2937] rounded-lg bg-[#161d2b] text-white focus:outline-hidden focus:border-indigo-500 transition-colors font-sans"
            id="pur-search-input"
          />
        </div>

        {/* Enter new purchase */}
        <button
          onClick={() => {
            setSelectedGrain('');
            setQuantity(0);
            setOverallPrice(0);
            setShowAddModal(true);
          }}
          className="inline-flex items-center gap-1.5 bg-indigo-600 text-white hover:bg-indigo-500 text-xs font-bold py-2 px-4 rounded-lg transition-colors shadow-lg font-sans"
          id="register-purchase-btn"
        >
          <Plus className="w-3.5 h-3.5" />
          Enter Sourcing Data
        </button>

      </div>

      {/* --- RENDER OPTION A: TABBED SEPARATION VIEW --- */}
      {viewMode === 'tabs' && (
        <div className="space-y-4">
          {/* Sub-tab selection row */}
          <div className="flex items-center overflow-x-auto border-b border-[#1f2937] pb-1 select-none no-scrollbar gap-1">
            {GRAIN_ITEMS.map(item => {
              const count = purchases.filter(p => p.productName.toLowerCase() === item.toLowerCase()).length;
              const isActive = activeItemTab === item;
              return (
                <button
                  key={item}
                  onClick={() => setActiveItemTab(item)}
                  className={`py-2 px-4 rounded-t-lg text-xs font-bold font-sans whitespace-nowrap transition-all border-b-2 flex items-center gap-1.5 ${
                    isActive 
                      ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' 
                      : 'border-transparent text-slate-400 hover:text-white hover:bg-[#111827]/30'
                  }`}
                >
                  <span>{item}</span>
                  {count > 0 && (
                    <span className="text-[9px] bg-[#1f2937] px-1.5 py-0.2 rounded-full font-sans text-slate-300">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Table for specifically the selected sub-tab item */}
          <div className="bg-[#111827] border border-[#1f2937] rounded-xl overflow-hidden shadow-lg">
            <div className="p-3 bg-[#161d2b]/60 border-b border-[#1f2937] flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-200 uppercase tracking-wider font-sans">
                {activeItemTab} Sourcing Ledger Table
              </span>
              <span className="text-[10px] text-slate-400 font-mono font-bold">
                Item-specific separate table
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                {renderTableHeader()}
                <tbody className="divide-y divide-[#1f2937] text-xs">
                  {(() => {
                    const rowItems = sortedPurchases.filter(
                      p => p.productName.toLowerCase() === activeItemTab.toLowerCase() &&
                           p.productName.toLowerCase().includes(searchTerm.toLowerCase())
                    );
                    if (rowItems.length === 0) {
                      return (
                        <tr>
                          <td colSpan={6} className="text-center py-10 text-slate-500 font-sans">
                            No separate purchase records found for "{activeItemTab}".
                          </td>
                        </tr>
                      );
                    }
                    return rowItems.map(p => renderPurchaseRow(p));
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- RENDER OPTION B: ALL 6 SEPARATE TABLES VIEW (STACKED MODULES) --- */}
      {viewMode === 'all' && (
        <div className="grid grid-cols-1 gap-6" id="all-six-separated-tables">
          {GRAIN_ITEMS.map(item => {
            const rowItems = sortedPurchases.filter(
              p => p.productName.toLowerCase() === item.toLowerCase() &&
                   p.productName.toLowerCase().includes(searchTerm.toLowerCase())
            );
            const isCollapsed = collapsedTables[item] || false;

            return (
              <div 
                key={item} 
                className="bg-[#111827] border border-[#1f2937] rounded-xl overflow-hidden shadow-md"
                id={`separate-table-panel-${item.toLowerCase()}`}
              >
                {/* Panel Header */}
                <div 
                  onClick={() => toggleTableCollapse(item)}
                  className="p-4 bg-[#161d2b]/80 border-b border-[#1f2937] flex items-center justify-between cursor-pointer group hover:bg-[#161d2b] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 ring-4 ring-indigo-950"></span>
                    <div>
                      <h4 className="text-xs font-extrabold text-white uppercase tracking-wider font-sans group-hover:text-indigo-400 transition-colors">
                        {item} Sourcing Data Table
                      </h4>
                      <p className="text-[10px] text-slate-400 font-sans mt-0.5">
                        Separated transactions for {item} spec
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-bold font-mono text-slate-300 bg-[#1f2937] px-2.5 py-0.5 rounded-full">
                      {rowItems.length} records
                    </span>
                    {isCollapsed ? (
                      <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-white" />
                    ) : (
                      <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-white" />
                    )}
                  </div>
                </div>

                {/* Table details when expanded */}
                {!isCollapsed && (
                  <div className="overflow-x-auto transition-all animate-fade-in">
                    <table className="w-full text-left border-collapse">
                      {renderTableHeader()}
                      <tbody className="divide-y divide-[#1f2937] text-xs">
                        {rowItems.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="text-center py-8 text-slate-500 font-sans">
                              No separate purchase transactions recorded for "{item}".
                            </td>
                          </tr>
                        ) : (
                          rowItems.map(p => renderPurchaseRow(p))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* --- ENTER NEW GRAIN SOURCING DATA MODAL --- */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="add-purchase-modal">
          <div className="bg-[#111827] rounded-xl border border-[#1f2937] max-w-sm w-full shadow-2xl overflow-hidden animate-slide-up">
            
            <div className="p-4 md:p-5 border-b border-[#1f2937] flex items-center justify-between bg-[#1f2937]/30">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white font-sans">Enter Grain Sourcing Data</h3>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-[#1f2937]"
                id="close-add-modal-btn"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
              
              {/* Product selector restricted to exactly these 6 items */}
              <div className="space-y-1">
                <label className="block font-semibold text-slate-300 font-sans" htmlFor="grain-selector">Select Grain Item *</label>
                <select
                  id="grain-selector"
                  value={selectedGrain}
                  required
                  onChange={(e) => handleGrainChange(e.target.value)}
                  className="w-full bg-[#111827] border border-[#1f2937] rounded-lg p-2.5 focus:outline-hidden focus:border-indigo-500 font-sans text-slate-200 font-medium"
                >
                  <option value="" className="text-slate-500">-- Choose Grain Item --</option>
                  {GRAIN_ITEMS.map(item => (
                    <option key={item} value={item} className="bg-[#111827] text-white">
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date of Purchase */}
              <div className="space-y-1">
                <label className="block font-semibold text-slate-300 font-sans" htmlFor="date-input">Date of Purchase *</label>
                <input
                  id="date-input"
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full border border-[#1f2937] bg-[#0f1115] text-white rounded-lg p-2.5 focus:outline-hidden focus:border-indigo-500 font-mono"
                />
              </div>

              {/* Number of Grain in Kuntal */}
              <div className="space-y-1">
                <label className="block font-semibold text-slate-300 font-sans" htmlFor="kuntal-qty-input">No. of Grain in Kuntal *</label>
                <input
                  id="kuntal-qty-input"
                  type="number"
                  min="1"
                  required
                  value={quantity || ''}
                  placeholder="e.g. 150"
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full border border-[#1f2937] bg-[#0f1115] text-white rounded-lg p-2.5 focus:outline-hidden focus:border-indigo-500 font-mono"
                />
              </div>

              {/* Overall Price with dynamic explanation */}
              <div className="space-y-1">
                <label className="block font-semibold text-slate-300 font-sans" htmlFor="overall-price-input">Overall Price ($) *</label>
                <input
                  id="overall-price-input"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={overallPrice || ''}
                  placeholder="e.g. 12750.00"
                  onChange={(e) => setOverallPrice(Number(e.target.value))}
                  className="w-full border border-[#1f2937] bg-[#0f1115] text-white rounded-lg p-2.5 focus:outline-hidden focus:border-indigo-500 font-mono"
                />
              </div>

              {/* Auto-calculated Single Price display */}
              <div className="p-3 bg-[#161d2b]/60 border border-[#1f2937] rounded-lg" id="calculated-single-price-box">
                <span className="text-[10px] text-slate-400 font-sans uppercase tracking-wider block">Auto-Calculated Single Price:</span>
                <span className="block text-base font-bold font-mono text-emerald-400 mt-1" id="single-price-val">
                  ${(quantity > 0 ? (overallPrice / quantity) : 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} / kuntal
                </span>
                <p className="text-[10px] text-slate-500 mt-1 font-sans leading-relaxed">
                  Calculated dynamically: <span className="font-mono">Overall Price / No. of Grain in Kuntal</span>
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#1f2937]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="bg-[#1f2937]/80 hover:bg-[#1f2937] border border-[#1f2937] text-slate-300 font-bold py-2 px-4 rounded-lg transition-colors font-sans"
                  id="cancel-sourcing-btn"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-lg transition-colors shadow-lg font-sans"
                  id="submit-sourcing-btn"
                >
                  Apply Purchase
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* --- EDIT / MODIFY GRAIN SOURCING DATA MODAL --- */}
      {editingPurchase && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="edit-purchase-modal">
          <div className="bg-[#111827] rounded-xl border border-[#1f2937] max-w-sm w-full shadow-2xl overflow-hidden animate-slide-up">
            
            <div className="p-4 md:p-5 border-b border-[#1f2937] flex items-center justify-between bg-[#1f2937]/30">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white font-sans">Modify Sourcing Record</h3>
              </div>
              <button 
                onClick={() => setEditingPurchase(null)}
                className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-[#1f2937]"
                id="close-edit-modal-btn"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-5 space-y-4 text-xs">
              
              {/* Product Info (Read-only as we are editing a specific item's entry) */}
              <div className="space-y-1">
                <label className="block font-semibold text-slate-400 font-sans">Selected Grain Item</label>
                <div className="w-full bg-[#161d2b]/80 border border-[#1f2937] text-slate-300 rounded-lg p-2.5 font-bold font-sans">
                  {editingPurchase.productName}
                </div>
              </div>

              {/* Date of Purchase */}
              <div className="space-y-1">
                <label className="block font-semibold text-slate-300 font-sans" htmlFor="edit-date-input">Date of Purchase *</label>
                <input
                  id="edit-date-input"
                  type="date"
                  required
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full border border-[#1f2937] bg-[#0f1115] text-white rounded-lg p-2.5 focus:outline-hidden focus:border-indigo-500 font-mono"
                />
              </div>

              {/* Number of Grain in Kuntal */}
              <div className="space-y-1">
                <label className="block font-semibold text-slate-300 font-sans" htmlFor="edit-kuntal-qty-input">No. of Grain in Kuntal *</label>
                <input
                  id="edit-kuntal-qty-input"
                  type="number"
                  min="1"
                  required
                  value={editQuantity || ''}
                  placeholder="e.g. 150"
                  onChange={(e) => setEditQuantity(Number(e.target.value))}
                  className="w-full border border-[#1f2937] bg-[#0f1115] text-white rounded-lg p-2.5 focus:outline-hidden focus:border-indigo-500 font-mono"
                />
              </div>

              {/* Overall Price */}
              <div className="space-y-1">
                <label className="block font-semibold text-slate-300 font-sans" htmlFor="edit-overall-price-input">Overall Price ($) *</label>
                <input
                  id="edit-overall-price-input"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={editOverallPrice || ''}
                  placeholder="e.g. 12750.00"
                  onChange={(e) => setEditOverallPrice(Number(e.target.value))}
                  className="w-full border border-[#1f2937] bg-[#0f1115] text-white rounded-lg p-2.5 focus:outline-hidden focus:border-indigo-500 font-mono"
                />
              </div>

              {/* Auto-calculated Single Price display */}
              <div className="p-3 bg-[#161d2b]/60 border border-[#1f2937] rounded-lg" id="edit-calculated-single-price-box">
                <span className="text-[10px] text-slate-400 font-sans uppercase tracking-wider block">Auto-Calculated Single Price:</span>
                <span className="block text-base font-bold font-mono text-emerald-400 mt-1" id="edit-single-price-val">
                  ${(editQuantity > 0 ? (editOverallPrice / editQuantity) : 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} / kuntal
                </span>
                <p className="text-[10px] text-slate-500 mt-1 font-sans leading-relaxed">
                  Calculated dynamically: <span className="font-mono">Overall Price / No. of Grain in Kuntal</span>
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#1f2937]">
                <button
                  type="button"
                  onClick={() => setEditingPurchase(null)}
                  className="bg-[#1f2937]/80 hover:bg-[#1f2937] border border-[#1f2937] text-slate-300 font-bold py-2 px-4 rounded-lg transition-colors font-sans"
                  id="cancel-edit-btn"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-lg transition-colors shadow-lg font-sans"
                  id="submit-edit-btn"
                >
                  Save Changes
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* --- DELETE CONFIRMATION MODAL --- */}
      {deleteConfirmPurchase && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="delete-confirmation-modal">
          <div className="bg-[#111827] rounded-xl border border-rose-900/40 max-w-sm w-full shadow-2xl overflow-hidden animate-slide-up">
            
            <div className="p-4 md:p-5 border-b border-[#1f2937] flex items-center justify-between bg-rose-950/20">
              <div className="flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-rose-400" />
                <h3 className="text-sm font-bold text-white font-sans">Delete Sourcing Record?</h3>
              </div>
              <button 
                onClick={() => setDeleteConfirmPurchase(null)}
                className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-[#1f2937]"
                id="close-delete-modal-btn"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <p className="text-slate-300 leading-relaxed font-sans">
                Are you sure you want to delete the purchase entry of <strong className="text-white text-medium">{deleteConfirmPurchase.quantity.toLocaleString()} kuntal</strong> of <strong className="text-indigo-400 text-medium">{deleteConfirmPurchase.productName}</strong> sourced on <span className="font-mono text-slate-400">{formatDate(deleteConfirmPurchase.date)}</span>?
              </p>

              <div className="p-3 bg-rose-500/5 border border-rose-950/40 rounded-lg space-y-1.5" id="delete-effects-box">
                <span className="text-[10px] text-slate-400 font-sans uppercase tracking-wider block font-bold">Automatic Reversion Effects:</span>
                <ul className="list-disc pl-4 space-y-1 text-slate-400 font-sans">
                  <li>Inventory stock goes down by <strong className="text-amber-400 font-bold font-mono">{deleteConfirmPurchase.quantity} kuntal</strong></li>
                  <li>Account balance restored by <strong className="text-emerald-400 font-bold font-mono">+${deleteConfirmPurchase.totalCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></li>
                </ul>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#1f2937]">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmPurchase(null)}
                  className="bg-[#1f2937]/80 hover:bg-[#1f2937] border border-[#1f2937] text-slate-300 font-bold py-2 px-4 rounded-lg transition-colors font-sans"
                  id="cancel-delete-action-btn"
                >
                  Keep Record
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDeletePurchase(deleteConfirmPurchase.id);
                    setDeleteConfirmPurchase(null);
                  }}
                  className="bg-rose-600 hover:bg-rose-500 text-white font-bold py-2 px-4 rounded-lg transition-colors shadow-lg font-sans"
                  id="confirm-delete-action-btn"
                >
                  Yes, Revert & Delete
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
