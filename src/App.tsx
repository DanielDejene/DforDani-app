/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Boxes, 
  DollarSign, 
  Layers, 
  ShoppingBag, 
  TrendingUp, 
  Calendar,
  Sparkles,
  Users,
  FileText,
  Settings
} from 'lucide-react';

import DashboardView from './components/DashboardView';
import FinanceView from './components/FinanceView';
import InventoryView from './components/InventoryView';
import PLAnalyticsView from './components/PLAnalyticsView';
import PurchasingView from './components/PurchasingView';
import SalesView from './components/SalesView';
import NotesView from './components/NotesView';
import SettingsView from './components/SettingsView';
import ErrorBoundary from './components/ErrorBoundary';
import AppLogo from './components/AppLogo';

import { Product, PurchaseTransaction, SaleTransaction, FinanceRecord, Account, ProviderDeposit } from './types';
import { 
  INITIAL_PRODUCTS, 
  INITIAL_ACCOUNTS, 
  INITIAL_PURCHASES, 
  INITIAL_SALES, 
  INITIAL_FINANCE_RECORDS,
  INITIAL_PROVIDER_DEPOSITS
} from './mockData';

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('p_inv_active_tab') || 'sales';
  });

  // Localization State
  const [lang, setLang] = useState<'en' | 'am'>(() => {
    return (localStorage.getItem('p_inv_lang') as 'en' | 'am') || 'en';
  });

  // State Management
  const [products, setProducts] = useState<Product[]>(() => {
    const local = localStorage.getItem('p_inv_products');
    return local ? JSON.parse(local) : INITIAL_PRODUCTS;
  });

  const [purchases, setPurchases] = useState<PurchaseTransaction[]>(() => {
    const local = localStorage.getItem('p_inv_purchases');
    return local ? JSON.parse(local) : INITIAL_PURCHASES;
  });

  const [sales, setSales] = useState<SaleTransaction[]>(() => {
    const local = localStorage.getItem('p_inv_sales');
    return local ? JSON.parse(local) : INITIAL_SALES;
  });

  const [financeRecords, setFinanceRecords] = useState<FinanceRecord[]>(() => {
    const local = localStorage.getItem('p_inv_finance_records');
    return local ? JSON.parse(local) : INITIAL_FINANCE_RECORDS;
  });

  const [accounts, setAccounts] = useState<Account[]>(() => {
    const local = localStorage.getItem('p_inv_accounts');
    return local ? JSON.parse(local) : INITIAL_ACCOUNTS;
  });

  const [providerDeposits, setProviderDeposits] = useState<ProviderDeposit[]>(() => {
    const local = localStorage.getItem('p_inv_provider_deposits');
    return local ? JSON.parse(local) : INITIAL_PROVIDER_DEPOSITS;
  });

  // Synchronize state with storage upon updates
  useEffect(() => {
    localStorage.setItem('p_inv_active_tab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem('p_inv_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('p_inv_purchases', JSON.stringify(purchases));
  }, [purchases]);

  useEffect(() => {
    localStorage.setItem('p_inv_sales', JSON.stringify(sales));
  }, [sales]);

  useEffect(() => {
    localStorage.setItem('p_inv_finance_records', JSON.stringify(financeRecords));
  }, [financeRecords]);

  useEffect(() => {
    localStorage.setItem('p_inv_accounts', JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    localStorage.setItem('p_inv_provider_deposits', JSON.stringify(providerDeposits));
  }, [providerDeposits]);

  useEffect(() => {
    localStorage.setItem('p_inv_lang', lang);
  }, [lang]);

  // Handlers: Product Catalog manipulation
  const handleAddProduct = (newProd: Omit<Product, 'id'>) => {
    const id = `prod-${Date.now()}`;
    const product: Product = { ...newProd, id };
    setProducts(prev => [...prev, product]);
  };

  const handleUpdateProduct = (updated: Product) => {
    setProducts(prev => prev.map(p => p.id === updated.id ? updated : p));
  };

  const handleDeleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  // Handlers: Purchasing and Sourcing intake flow
  const handleAddPurchase = (purchase: Omit<PurchaseTransaction, 'id' | 'totalCost'>, deductFromFinance: boolean) => {
    const id = `pur-${Date.now()}`;
    const totalCost = purchase.quantity * purchase.unitCost;
    const newPurchase: PurchaseTransaction = { ...purchase, id, totalCost };

    // Update Purchases
    setPurchases(prev => [newPurchase, ...prev]);

    // Reassign stock Room values if received
    if (purchase.status === 'Received') {
      setProducts(prev => prev.map(p => p.id === purchase.productId ? { ...p, quantity: p.quantity + purchase.quantity } : p));
    }

    // Bookkeeping ledgers deduct operation
    if (deductFromFinance) {
      const finId = `fin-pur-${id}`;
      const finRecord: FinanceRecord = {
        id: finId,
        type: 'expense',
        category: 'Inventory Purchase',
        amount: totalCost,
        date: purchase.date,
        description: `Procurement: ${purchase.quantity}x ${purchase.productName}`,
        linkedId: id,
        account: purchase.paymentAccount
      };
      setFinanceRecords(prev => [finRecord, ...prev]);
      
      // Debit active wallet of bank
      setAccounts(prev => prev.map(a => a.id === purchase.paymentAccount ? { ...a, balance: a.balance - totalCost } : a));
    }
  };

  const handleReceivePurchase = (id: string) => {
    const pur = purchases.find(p => p.id === id);
    if (!pur || pur.status !== 'Ordered') return;

    // Increment stock quantities
    setProducts(pList => pList.map(p => p.id === pur.productId ? { ...p, quantity: p.quantity + pur.quantity } : p));
    
    // Set status to Received
    setPurchases(prev => prev.map(p => p.id === id ? { ...p, status: 'Received' } : p));
  };

  const handleUpdatePurchase = (id: string, quantity: number, overallPrice: number, date: string) => {
    const pur = purchases.find(p => p.id === id);
    if (!pur) return;

    // Compute delta mapping for Received items
    if (pur.status === 'Received') {
      const delta = quantity - pur.quantity;
      setProducts(pList => pList.map(p => p.id === pur.productId ? { ...p, quantity: Math.max(0, p.quantity + delta) } : p));
    }
    
    // Check linked ledger records and update them
    const linked = financeRecords.find(f => f.linkedId === id);
    if (linked) {
      // Revert original impact to account and add new overallPrice
      setAccounts(accts => accts.map(a => a.id === linked.account ? { ...a, balance: a.balance + linked.amount - overallPrice } : a));
      
      setFinanceRecords(fRecords => fRecords.map(f => {
        if (f.linkedId === id) {
          return {
            ...f,
            amount: overallPrice,
            date: date,
            description: `Procurement: ${quantity}x ${pur.productName} updated`
          };
        }
        return f;
      }));
    }

    setPurchases(prev => prev.map(p => {
      if (p.id === id) {
        return {
          ...p,
          quantity: quantity,
          unitCost: quantity > 0 ? (overallPrice / quantity) : 0,
          totalCost: overallPrice,
          date: date
        };
      }
      return p;
    }));
  };

  const handleDeletePurchase = (id: string) => {
    const targeted = purchases.find(p => p.id === id);
    if (!targeted) return;

    if (targeted.status === 'Received') {
      // Revert stock volume added
      setProducts(pList => pList.map(p => p.id === targeted.productId ? { ...p, quantity: Math.max(0, p.quantity - targeted.quantity) } : p));
    }

    // Revert related ledgers bookkeeping
    const linked = financeRecords.find(f => f.linkedId === id);
    if (linked) {
      setAccounts(accts => accts.map(a => a.id === linked.account ? { ...a, balance: a.balance + linked.amount } : a));
      setFinanceRecords(fRecords => fRecords.filter(f => f.linkedId !== id));
    }

    setPurchases(prev => prev.filter(p => p.id !== id));
  };

  // Handlers: Commercial sales receipts registry pipeline
  const handleAddSale = (sale: Omit<SaleTransaction, 'id' | 'totalRevenue' | 'profit'>, linkToFinance: boolean) => {
    const id = `sal-${Date.now()}`;
    const prod = products.find(p => p.id === sale.productId);
    const unitCostVal = sale.unitCost !== undefined ? sale.unitCost : (prod ? prod.unitCost : 0);
    
    // Revenue calculations
    const totalRevenue = sale.quantity * sale.unitPrice;
    const profit = totalRevenue - (unitCostVal * sale.quantity);

    const newSale: SaleTransaction = {
      ...sale,
      id,
      totalRevenue,
      profit
    };

    setSales(prev => [newSale, ...prev]);

    // Subtract from physical warehouse units
    setProducts(prev => prev.map(p => p.id === sale.productId ? { ...p, quantity: Math.max(0, p.quantity - sale.quantity) } : p));

    // Register to financial ledger logs
    if (linkToFinance) {
      const finId = `fin-sal-${id}`;
      const finRecord: FinanceRecord = {
        id: finId,
        type: 'income',
        category: 'Inventory Sale',
        amount: totalRevenue,
        date: sale.date,
        description: `Trade Sale: ${sale.quantity}x ${sale.productName} units sold`,
        linkedId: id,
        account: sale.paymentAccount
      };

      setFinanceRecords(prev => [finRecord, ...prev]);

      // Credit corresponding account card
      setAccounts(prev => prev.map(a => a.id === sale.paymentAccount ? { ...a, balance: a.balance + totalRevenue } : a));
    }
  };

  const handleUpdateSale = (id: string, updatedFields: Partial<Omit<SaleTransaction, 'id'>>) => {
    const sale = sales.find(s => s.id === id);
    if (!sale) return;

    const oldQty = sale.quantity;
    const oldRev = sale.totalRevenue;
    const oldProdId = sale.productId;
    
    const newProduct = products.find(p => p.id === (updatedFields.productId || sale.productId));
    const newUnitCost = updatedFields.unitCost !== undefined 
      ? updatedFields.unitCost 
      : (sale.unitCost !== undefined ? sale.unitCost : (newProduct ? newProduct.unitCost : 0));
    
    const newQty = updatedFields.quantity !== undefined ? updatedFields.quantity : sale.quantity;
    const newUnitPrice = updatedFields.unitPrice !== undefined ? updatedFields.unitPrice : sale.unitPrice;
    const newTotalRevenue = newQty * newUnitPrice;
    const newProfit = newTotalRevenue - (newUnitCost * newQty);
    
    // Update product inventory: add back old qty and subtract new qty
    setProducts(pList => pList.map(p => {
      const targetProdId = updatedFields.productId || sale.productId;
      if (p.id === oldProdId && oldProdId === targetProdId) {
        return { ...p, quantity: Math.max(0, p.quantity + oldQty - newQty) };
      }
      if (p.id === oldProdId) {
        return { ...p, quantity: p.quantity + oldQty };
      }
      if (p.id === targetProdId) {
        return { ...p, quantity: Math.max(0, p.quantity - newQty) };
      }
      return p;
    }));
    
    // Update connected financial records
    const linked = financeRecords.find(f => f.linkedId === id);
    if (linked) {
      setAccounts(accts => accts.map(a => {
        const targetAccount = updatedFields.paymentAccount || sale.paymentAccount;
        if (a.id === linked.account && linked.account === targetAccount) {
          return { ...a, balance: a.balance - oldRev + newTotalRevenue };
        }
        if (a.id === linked.account) {
          return { ...a, balance: a.balance - oldRev };
        }
        if (a.id === targetAccount) {
          return { ...a, balance: a.balance + newTotalRevenue };
        }
        return a;
      }));

      setFinanceRecords(fRecords => fRecords.map(f => {
        if (f.linkedId === id) {
          return {
            ...f,
            amount: newTotalRevenue,
            date: updatedFields.date || sale.date,
            description: `Trade Sale: ${newQty}x ${updatedFields.productName || sale.productName} units sold (updated)`,
            account: updatedFields.paymentAccount || sale.paymentAccount
          };
        }
        return f;
      }));
    }
    
    setSales(prevSales => prevSales.map(s => {
      if (s.id === id) {
        return {
          ...s,
          ...updatedFields,
          totalRevenue: newTotalRevenue,
          profit: newProfit
        };
      }
      return s;
    }));
  };

  const handleDeleteSale = (id: string) => {
    setSales(prevSales => {
      const targeted = prevSales.find(s => s.id === id);
      if (!targeted) return prevSales;

      // Revert product inventory subtraction
      setProducts(pList => pList.map(p => 
        p.id === targeted.productId 
          ? { ...p, quantity: p.quantity + targeted.quantity } 
          : p
      ));

      // Revert linked finance record and account balance
      setFinanceRecords(prevFinance => {
        const linked = prevFinance.find(f => f.linkedId === id);
        if (linked) {
          setAccounts(accts => accts.map(a => 
            a.id === linked.account 
              ? { ...a, balance: a.balance - linked.amount } 
              : a
          ));
          return prevFinance.filter(f => f.linkedId !== id);
        }
        return prevFinance;
      });

      return prevSales.filter(s => s.id !== id);
    });
  };

  // Handlers: Finance ledger entries and Account wallets setup
  const handleAddFinanceRecord = (record: Omit<FinanceRecord, 'id'>) => {
    const id = `fin-${Date.now()}`;
    const finalRecord: FinanceRecord = { ...record, id };
    setFinanceRecords(prev => [finalRecord, ...prev]);

    // Mutate wallet balance
    setAccounts(prev => prev.map(a => {
      if (a.id === record.account) {
        const delta = record.type === 'income' ? record.amount : -record.amount;
        return { ...a, balance: a.balance + delta };
      }
      return a;
    }));
  };

  const handleAddAccount = (acc: Omit<Account, 'id'>) => {
    const id = `acc-${Date.now()}`;
    const account: Account = { ...acc, id };
    setAccounts(prev => [...prev, account]);
  };

  const handleAdjustBalance = (accountId: string, newBalance: number) => {
    setAccounts(prev => prev.map(a => a.id === accountId ? { ...a, balance: newBalance } : a));
  };

  const handleDeleteFinanceRecord = (id: string) => {
    setFinanceRecords(prev => {
      const targeted = prev.find(f => f.id === id);
      if (targeted) {
        // Revert ledger effects
        setAccounts(accts => accts.map(a => {
          if (a.id === targeted.account) {
            const revertDelta = targeted.type === 'income' ? -targeted.amount : targeted.amount;
            return { ...a, balance: a.balance + revertDelta };
          }
          return a;
        }));
      }
      return prev.filter(f => f.id !== id);
    });
  };

  // Handlers: Providers storage consignments intake
  const handleAddProviderDeposit = (deposit: Omit<ProviderDeposit, 'id'>) => {
    const id = `prov-dep-${Date.now()}`;
    const newDeposit: ProviderDeposit = { ...deposit, id };
    setProviderDeposits(prev => [newDeposit, ...prev]);

    // Reflect inventory increase inside catalog of grains matching label
    setProducts(prev => prev.map(p => {
      if (p.name.toLowerCase() === deposit.grainType.toLowerCase()) {
        return { ...p, quantity: p.quantity + deposit.quantity };
      }
      return p;
    }));
  };

  const handleDeleteProviderDeposit = (id: string) => {
    setProviderDeposits(prev => {
      const targeted = prev.find(item => item.id === id);
      if (targeted) {
        // Subtract from matching product catalog item
        setProducts(pList => pList.map(p => {
          if (p.name.toLowerCase() === targeted.grainType.toLowerCase()) {
            return { ...p, quantity: Math.max(0, p.quantity - targeted.quantity) };
          }
          return p;
        }));
      }
      return prev.filter(item => item.id !== id);
    });
  };

  const handleRestoreState = (newState: {
    products?: Product[];
    purchases?: PurchaseTransaction[];
    sales?: SaleTransaction[];
    financeRecords?: FinanceRecord[];
    accounts?: Account[];
    providerDeposits?: ProviderDeposit[];
  }) => {
    if (newState.products) setProducts(newState.products);
    if (newState.purchases) setPurchases(newState.purchases);
    if (newState.sales) setSales(newState.sales);
    if (newState.financeRecords) setFinanceRecords(newState.financeRecords);
    if (newState.accounts) setAccounts(newState.accounts);
    if (newState.providerDeposits) setProviderDeposits(newState.providerDeposits);
  };

  // Switch between view sections
  const renderViewContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardView 
            products={products}
            purchases={purchases}
            sales={sales}
            financeRecords={financeRecords}
            accounts={accounts}
            onSetTab={setActiveTab}
            lang={lang}
            onSetLang={setLang}
          />
        );
      case 'inventory':
        return (
          <InventoryView 
            products={products}
            onAddProduct={handleAddProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
            providerDeposits={providerDeposits}
            onAddProviderDeposit={handleAddProviderDeposit}
            onDeleteProviderDeposit={handleDeleteProviderDeposit}
            onAddPurchase={handleAddPurchase}
            accounts={accounts}
            lang={lang}
            onSetLang={setLang}
          />
        );
      case 'purchasing':
        return (
          <PurchasingView 
            purchases={purchases}
            products={products}
            accounts={accounts}
            onAddPurchase={handleAddPurchase}
            onReceivePurchase={handleReceivePurchase}
            onUpdatePurchase={handleUpdatePurchase}
            onDeletePurchase={handleDeletePurchase}
            sales={sales}
          />
        );
      case 'sales':
        return (
          <SalesView 
            sales={sales}
            products={products}
            accounts={accounts}
            onAddSale={handleAddSale}
            onUpdateSale={handleUpdateSale}
            onDeleteSale={handleDeleteSale}
            purchases={purchases} // Let's also pass purchases so that we can check Sourcing Orders volume!
            lang={lang}
          />
        );
      case 'finance':
        return (
          <FinanceView 
            financeRecords={financeRecords}
            accounts={accounts}
            onAddFinanceRecord={handleAddFinanceRecord}
            onAddAccount={handleAddAccount}
            onAdjustBalance={handleAdjustBalance}
            onDeleteFinanceRecord={handleDeleteFinanceRecord}
            sales={sales}
            purchases={purchases}
            products={products}
            lang={lang}
          />
        );
      case 'analytics':
        return (
          <PLAnalyticsView 
            products={products}
            purchases={purchases}
            salesDetails={sales}
            financeRecords={financeRecords}
            lang={lang}
            onSetLang={setLang}
          />
        );
      case 'notes':
        return (
          <NotesView 
            lang={lang}
          />
        );
      case 'settings':
        return (
          <SettingsView 
            products={products}
            purchases={purchases}
            sales={sales}
            financeRecords={financeRecords}
            accounts={accounts}
            providerDeposits={providerDeposits}
            onRestoreState={handleRestoreState}
            lang={lang}
            onSetLang={setLang}
          />
        );
      default:
        return <div className="text-center py-20 text-slate-400">Loading Section View...</div>;
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f17] text-[#d1d5db] font-sans flex flex-col justify-between" id="app-root-workspace">
      
      {/* Top Banner Navigation Header */}
      <header className="bg-[#0f1422] border-b border-[#1f293d] sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between py-4 gap-4">
            
            {/* Slogan Identity */}
            <div className="flex items-center gap-4">
              <AppLogo showText={true} size="md" />
              <div className="hidden lg:block h-8 w-px bg-slate-850 bg-slate-800"></div>
              <p className="hidden lg:block text-xs text-slate-400 max-w-[420px] leading-relaxed">
                {lang === 'en'
                  ? 'Dual tracking for commercial grain inventories, supplier consignments, and personal finance ledgers'
                  : 'የንግድ እህል ክምችት፣ የአቅራቢዎች አደራ እና የግል ፋይናንስ ሂሳቦች የተቀናጀ መቆጣጠሪያ'}
              </p>
            </div>

            {/* Navigation Tabs bar */}
            <nav className="flex flex-wrap items-center gap-1.5" id="navigation-rail">
              {[
                { id: 'dashboard', label: lang === 'en' ? 'Dashboard' : 'ዳሽቦርድ', icon: BarChart3 },
                { id: 'inventory', label: lang === 'en' ? 'Stocks & Storage' : 'ክምችትና መጋዘን', icon: Boxes },
                { id: 'purchasing', label: lang === 'en' ? 'Sourcing Orders' : 'የግዢ ማዘዣዎች', icon: ShoppingBag },
                { id: 'sales', label: lang === 'en' ? 'Sales Registry' : 'የሽያጭ መዝገብ', icon: TrendingUp },
                { id: 'finance', label: lang === 'en' ? 'Profit and Loss' : 'ትርፍ እና ኪሳራ', icon: DollarSign },
                { id: 'analytics', label: lang === 'en' ? 'My Loan & Debt' : 'የእኔ ብድር እና እዳ', icon: Users },
                { id: 'notes', label: lang === 'en' ? 'Notepad' : 'ማስታወሻ', icon: FileText },
                { id: 'settings', label: lang === 'en' ? 'Settings' : 'ቅንብሮች', icon: Settings }
              ].map(tab => {
                const IconComponent = tab.icon;
                const isSelected = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isSelected 
                        ? 'bg-indigo-600 text-white shadow-md' 
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                    id={`nav-tab-btn-${tab.id}`}
                  >
                    <IconComponent className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>

          </div>
        </div>
      </header>

      {/* Main viewport Container dashboard layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full">
        <ErrorBoundary>
          {renderViewContent()}
        </ErrorBoundary>
      </main>

      {/* Bottom styled footer */}
      <footer className="bg-[#0f1422] border-t border-[#1f293d] py-4 text-[11px] text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-2">
          <span>DforDani © 2026. {lang === 'en' ? 'All rights secured.' : 'መብቱ በህግ የተጠበቀ ነው።'}</span>
          <div className="flex items-center gap-2">
            <span>{lang === 'en' ? 'Client Sourcing Agreement' : 'የደንበኛ ግዢ ስምምነት'}</span>
            <span>•</span>
            <span className="font-mono text-slate-400">Environment: Stable Multi-View Workspace</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
