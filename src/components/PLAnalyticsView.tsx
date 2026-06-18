/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Trash2, 
  Edit3, 
  Plus, 
  Minus, 
  Phone, 
  X, 
  ChevronRight, 
  ArrowLeft,
  Calendar, 
  DollarSign, 
  AlertCircle,
  FileText,
  UserCheck,
  TrendingDown,
  TrendingUp,
  Coins
} from 'lucide-react';

// Unified interfaces for the database structure
export interface TransactionRecord {
  id: string;
  type: 'borrow' | 'repay' | 'lend' | 'collect'; // borrow/repay for Debt; lend/collect for Loan
  amount: number;
  date: string;
  note: string;
}

export interface FinancialProfile {
  id: string;
  name: string;
  phone: string;
  type: 'debt' | 'loan'; // debt = My Debt (User owes); loan = My Loan (Others owe to user)
  records: TransactionRecord[];
}

interface PLAnalyticsViewProps {
  products: any[];
  purchases: any[];
  salesDetails: any[];
  financeRecords: any[];
  lang?: 'en' | 'am';
  onSetLang?: (l: 'en' | 'am') => void;
}

const DEFAULT_PROFILES: FinancialProfile[] = [
  {
    id: 'p-1',
    name: 'አቶ ደምስ',
    phone: '0911002233',
    type: 'debt',
    records: [
      { id: 't-1-1', type: 'borrow', amount: 2000, date: '2026-06-10', note: 'የመጀመሪያ ብድር' },
      { id: 't-1-2', type: 'repay', amount: 1000, date: '2026-06-18', note: 'ግማሹን ከፍያለሁ' }
    ]
  },
  {
    id: 'p-2',
    name: 'ወ/ሮ ማርታ (Martha)',
    phone: '0912445566',
    type: 'loan',
    records: [
      { id: 't-2-1', type: 'lend', amount: 5000, date: '2026-06-12', note: 'በቆሎ ግዢ ማስፋፊያ ያበደርኩት' },
      { id: 't-2-2', type: 'collect', amount: 1500, date: '2026-06-15', note: 'ከፊል ክፍያ በባንክ የተመለሰ' }
    ]
  }
];

export default function PLAnalyticsView({
  lang = 'am',
  onSetLang
}: PLAnalyticsViewProps) {
  // Database State with localStorage persistence
  const [profiles, setProfiles] = useState<FinancialProfile[]>(() => {
    const saved = localStorage.getItem('p_loan_debt_profiles');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse financial profiles', e);
      }
    }
    return DEFAULT_PROFILES;
  });

  // Save changes to db
  useEffect(() => {
    localStorage.setItem('p_loan_debt_profiles', JSON.stringify(profiles));
  }, [profiles]);

  // Selected Profile for Drill-down Workflow
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);

  // Tab views within the main dashboard
  const [filterType, setFilterType] = useState<'all' | 'debt' | 'loan'>('all');

  // Modal forms states
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [modalProfileType, setModalProfileType] = useState<'debt' | 'loan'>('debt');
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);

  // Profile Form field states
  const [profName, setProfName] = useState('');
  const [profPhone, setProfPhone] = useState('');
  const [profDate, setProfDate] = useState(new Date().toISOString().substring(0, 10));
  const [profAmount, setProfAmount] = useState('');
  const [profNote, setProfNote] = useState('');

  // Transaction Modal / Overlay state (adding record)
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txType, setTxType] = useState<'borrow' | 'repay' | 'lend' | 'collect'>('borrow');
  const [txDate, setTxDate] = useState(new Date().toISOString().substring(0, 10));
  const [txAmount, setTxAmount] = useState('');
  const [txNote, setTxNote] = useState('');
  const [editingTxId, setEditingTxId] = useState<string | null>(null);

  // Localized dictionary
  const t = {
    title: lang === 'en' ? 'My Loan & Debt Ledger Engine' : 'የእኔ ብድር እና እዳ የሂሳብ መተግበሪያ',
    tagline: lang === 'en' 
      ? 'Strict central cloud tracking for personal loans, passive creditor balances, and repayment audits' 
      : 'የግል ብድሮች፣ የሰው እዳዎች እና የተመላሽ ክፍያ የሂሳብ መዝገብ መቆጣጠሪያ ማዕከል',
    totalLended: lang === 'en' ? 'Total Money Lended Out' : 'እኔ ለሰው ያበደርኩት ጠቅላላ ብር (የእኔ ብድር)',
    totalDebts: lang === 'en' ? 'Total Debts Owed to Others' : 'የሰው ብድር እኔ ላይ ያለ (የእኔ እዳ)',
    debtorCreditorDir: lang === 'en' ? 'Debtor & Creditor Profiles Directory' : 'የተበዳሪዎች እና አበዳሪዎች የስም ማውጫ Directory',
    searchPlaceholder: lang === 'en' ? 'Search profile by name...' : 'ስም በመጻፍ ይፈልጉ...',
    addNewDebtBtn: lang === 'en' ? '➕ Register Owed Debt' : '➕ አዲስ እዳ መዝግብ',
    addNewLoanBtn: lang === 'en' ? '➕ Register Lended Loan' : '➕ አዲስ ብድር መዝግብ',
    allProfiles: lang === 'en' ? 'All Profiles' : 'ყველა የስም ዝርዝር',
    onlyDebts: lang === 'en' ? 'My Debts (የእኔ እዳ)' : 'የእኔ እዳ (እኔ ያለብኝ)',
    onlyLoans: lang === 'en' ? 'My Loans (የእኔ ብድር)' : 'የእኔ ብድር (ለሰው የሰጠሁት)',
    fullName: lang === 'en' ? 'Full Name' : 'ሙሉ ስም',
    phoneNum: lang === 'en' ? 'Phone Number' : 'ስልክ ቁጥር',
    initialAmount: lang === 'en' ? 'Initial Amount' : 'የመጀመሪያው የገንዘብ መጠን',
    entryDate: lang === 'en' ? 'Date' : 'ቀን',
    noteLabel: lang === 'en' ? 'Note' : 'ማስታወሻ',
    saveBtn: lang === 'en' ? 'Save Record' : 'መዝግብ',
    cancelBtn: lang === 'en' ? 'Cancel' : 'ተመለስ',
    backBtn: lang === 'en' ? '← Back to Directory' : '← ወደ ስም ማውጫ ይመለሱ',
    remainingDebt: lang === 'en' ? 'Remaining Debt Balance' : 'ቀሪ እዳ',
    remainingLoan: lang === 'en' ? 'Remaining Loan Balance' : 'ቀሪ ብድር',
    originalDebt: lang === 'en' ? 'Original Debt' : 'የመጀመሪያው እዳ',
    originalLoan: lang === 'en' ? 'Original Loan' : 'የመጀመሪያው ብድር',
    totalRepaid: lang === 'en' ? 'Total Paid' : 'ጠቅላላ የተከፈለ',
    totalCollect: lang === 'en' ? 'Total Collected' : 'ጠቅላላ የተመለሰ',
    addDebtBtn: lang === 'en' ? '➕ Add More Debt' : '➕ ተጨማሪ እዳ ጨምር',
    repayDebtBtn: lang === 'en' ? '💸 Log Repayment (ክፍያ)' : '💸 ክፍያ መዝግብ (Log Repayment)',
    addLoanBtn: lang === 'en' ? '➕ Add More Loan' : '➕ ተጨማሪ ብድር ስጥ',
    collectLoanBtn: lang === 'en' ? '💵 Log Collection (ተመላሽ)' : '💵 ተመላሽ ስብስብ መዝግብ',
    deleteProfile: lang === 'en' ? '🗑️ Delete Profile' : '🗑️ ፕሮፋይሉን ሰርዝ',
    editProfile: lang === 'en' ? '✏️ Edit Profile' : '✏️ መረጃ ቀይር',
    timelineTitle: lang === 'en' ? '📜 Permanent Timeline History' : '📜 ቋሚ የቀን-ተቀን የክፍያ ታሪክ መዝገብ',
    addTxTitle: lang === 'en' ? 'Add Transaction Entry' : 'የግብይት መረጃ ማስገቢያ',
    editTxTitle: lang === 'en' ? 'Edit Transaction Entry' : 'የግብይት መረጃ ማስተካከያ',
    amountLabel: lang === 'en' ? 'Amount (ETB)' : 'የብር መጠን (በኢትዮጵያ ብር)',
    activeCapital: lang === 'en' ? 'Active Capital' : 'በስራ ላይ ያለ ካፒታል',
    actionLog: lang === 'en' ? 'Transaction Log' : 'የድርጊት መዝገብ'
  };

  // Aggregates for Component A
  const aggregates = useMemo(() => {
    let totalLendedOut = 0; // Total Remaining Loan amount lended to others
    let totalDebtsOwed = 0; // Total Remaining Debt amount owed to others

    profiles.forEach(p => {
      if (p.type === 'loan') {
        const lendedSum = p.records
          .filter(r => r.type === 'lend')
          .reduce((sum, r) => sum + r.amount, 0);
        const collectedSum = p.records
          .filter(r => r.type === 'collect')
          .reduce((sum, r) => sum + r.amount, 0);
        totalLendedOut += (lendedSum - collectedSum);
      } else {
        const borrowedSum = p.records
          .filter(r => r.type === 'borrow')
          .reduce((sum, r) => sum + r.amount, 0);
        const repaidSum = p.records
          .filter(r => r.type === 'repay')
          .reduce((sum, r) => sum + r.amount, 0);
        totalDebtsOwed += (borrowedSum - repaidSum);
      }
    });

    return {
      totalLendedOut,
      totalDebtsOwed
    };
  }, [profiles]);

  // Selected Profile Detail
  const selectedProfile = useMemo(() => {
    if (!selectedProfileId) return null;
    return profiles.find(p => p.id === selectedProfileId) || null;
  }, [selectedProfileId, profiles]);

  // Profiles alphabetized list
  const filteredAndSortedProfiles = useMemo(() => {
    const list = profiles.filter(p => {
      if (filterType === 'all') return true;
      return p.type === filterType;
    });

    // Alphabetical Order by Name (Amharic sorting works fine natively, English works nicely as localeCompare)
    return [...list].sort((a, b) => a.name.localeCompare(b.name, lang === 'am' ? 'am' : 'en'));
  }, [profiles, filterType, lang]);

  // Compute profile balance variables
  const profileBalances = useMemo(() => {
    if (!selectedProfile) return { originalTot: 0, repaidOrCollectedTot: 0, remainingBalance: 0 };
    
    if (selectedProfile.type === 'debt') {
      const originalTot = selectedProfile.records
        .filter(r => r.type === 'borrow')
        .reduce((sum, r) => sum + r.amount, 0);
      const repaidOrCollectedTot = selectedProfile.records
        .filter(r => r.type === 'repay')
        .reduce((sum, r) => sum + r.amount, 0);
      const remainingBalance = originalTot - repaidOrCollectedTot;
      return { originalTot, repaidOrCollectedTot, remainingBalance };
    } else {
      const originalTot = selectedProfile.records
        .filter(r => r.type === 'lend')
        .reduce((sum, r) => sum + r.amount, 0);
      const repaidOrCollectedTot = selectedProfile.records
        .filter(r => r.type === 'collect')
        .reduce((sum, r) => sum + r.amount, 0);
      const remainingBalance = originalTot - repaidOrCollectedTot;
      return { originalTot, repaidOrCollectedTot, remainingBalance };
    }
  }, [selectedProfile]);

  // Create or Update Profile Action
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profName.trim()) {
      alert(lang === 'en' ? 'Full name is required!' : 'እባክዎ ሙሉ ስም ያስገቡ!');
      return;
    }

    if (editingProfileId) {
      // Editing existing name and phone only
      setProfiles(prev => prev.map(p => {
        if (p.id === editingProfileId) {
          return {
            ...p,
            name: profName.trim(),
            phone: profPhone.trim()
          };
        }
        return p;
      }));
      setEditingProfileId(null);
    } else {
      // New Profile registration
      const newId = 'p-' + Date.now();
      const firstAmount = parseFloat(profAmount) || 0;
      const initialRecord: TransactionRecord = {
        id: 't-' + Date.now() + '-1',
        type: modalProfileType === 'debt' ? 'borrow' : 'lend',
        amount: firstAmount,
        date: profDate,
        note: profNote.trim() || (modalProfileType === 'debt' ? 'የመጀመሪያ እዳ' : 'የመጀመሪያ ብድር')
      };

      const newProfile: FinancialProfile = {
        id: newId,
        name: profName.trim(),
        phone: profPhone.trim(),
        type: modalProfileType,
        records: [initialRecord]
      };

      setProfiles(prev => [...prev, newProfile]);
      setSelectedProfileId(newId); // open drill-down instantly
    }

    // Reset inputs
    setProfName('');
    setProfPhone('');
    setProfAmount('');
    setProfNote('');
    setIsProfileModalOpen(false);
  };

  const handleEditProfileInit = (p: FinancialProfile) => {
    setEditingProfileId(p.id);
    setProfName(p.name);
    setProfPhone(p.phone);
    setModalProfileType(p.type);
    setIsProfileModalOpen(true);
  };

  const handleDeleteProfile = (profileId: string) => {
    const confirmationText = lang === 'en'
      ? 'Are you sure you want to completely delete this profile and all its transaction histories?'
      : 'ይህንን የሰው ፕሮፋይል ከነሙሉ የግብይትና ክፍያ ታሪኩ ሙሉ በሙሉ መሰረዝ ይፈልጋሉ? ይህ ድርጊት አይመለስም።';
    if (window.confirm(confirmationText)) {
      setProfiles(prev => prev.filter(p => p.id !== profileId));
      setSelectedProfileId(null);
    }
  };

  // Transaction Records CRUD
  const handleSaveTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(txAmount);
    if (isNaN(amountVal) || amountVal <= 0) {
      alert(lang === 'en' ? 'Please enter a valid positive amount!' : 'እባክዎ ትክክለኛ አዎንታዊ የብር መጠን ያስገቡ!');
      return;
    }
    if (!selectedProfileId) return;

    if (editingTxId) {
      // Edit existing transaction record
      setProfiles(prev => prev.map(p => {
        if (p.id === selectedProfileId) {
          const updatedTxList = p.records.map(r => {
            if (r.id === editingTxId) {
              return {
                ...r,
                amount: amountVal,
                date: txDate,
                note: txNote.trim()
              };
            }
            return r;
          });
          return { ...p, records: updatedTxList };
        }
        return p;
      }));
      setEditingTxId(null);
    } else {
      // Add new transaction record
      const newRecord: TransactionRecord = {
        id: 't-' + Date.now(),
        type: txType,
        amount: amountVal,
        date: txDate,
        note: txNote.trim()
      };

      setProfiles(prev => prev.map(p => {
        if (p.id === selectedProfileId) {
          return {
            ...p,
            records: [...p.records, newRecord]
          };
        }
        return p;
      }));
    }

    // Reset inputs
    setTxAmount('');
    setTxNote('');
    setIsTxModalOpen(false);
  };

  const handleEditTxInit = (record: TransactionRecord) => {
    setEditingTxId(record.id);
    setTxType(record.type);
    setTxDate(record.date);
    setTxAmount(record.amount.toString());
    setTxNote(record.note);
    setIsTxModalOpen(true);
  };

  const handleDeleteTx = (recordId: string) => {
    const confirmationText = lang === 'en'
      ? 'Are you sure you want to delete this specific timeline transaction record?'
      : 'ይህንን የተወሰነ የተመላሽ ክፍያ ወይም የብድር ግብይት መዝገብ በእርግጠኝነት መሰረዝ ይፈልጋሉ?';
    if (window.confirm(confirmationText)) {
      setProfiles(prev => prev.map(p => {
        if (p.id === selectedProfileId) {
          return {
            ...p,
            records: p.records.filter(r => r.id !== recordId)
          };
        }
        return p;
      }));
    }
  };

  return (
    <div className="space-y-6" id="loan-debt-main-workspace">
      
      {/* 1. Dynamic Header with Custom Brand Styling */}
      <div className="bg-[#111827] border border-[#1f2937] rounded-3xl p-6 relative overflow-hidden shadow-2xl" id="loan-debt-header-banner">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-1 rounded-full font-mono font-bold uppercase tracking-widest inline-flex items-center gap-1">
              <Coins className="w-3 h-3" /> {lang === 'en' ? 'Central Database Core' : 'የእኔ ብድርና እዳ ማዕከላዊ የሂሳብ ሞጁል'}
            </span>
            <h2 className="text-xl md:text-2xl font-black text-white font-sans tracking-tight" id="header-system-title">
              {t.title}
            </h2>
            <p className="text-xs text-slate-400 max-w-2xl font-sans" id="header-system-tagline">
              {t.tagline}
            </p>
          </div>

          {/* Quick Dual Language Switcher button in scope constraint */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onSetLang && onSetLang('en')}
              className={`px-3 py-1.5 text-xs font-black rounded-lg transition-all border ${
                lang === 'en' 
                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-md' 
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
              id="lang-selector-en"
            >
              English
            </button>
            <button
              onClick={() => onSetLang && onSetLang('am')}
              className={`px-3 py-1.5 text-xs font-black rounded-lg transition-all border ${
                lang === 'am' 
                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-md' 
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
              id="lang-selector-am"
            >
              አማርኛ
            </button>
          </div>
        </div>
      </div>

      {!selectedProfile ? (
        <>
          {/* ======================================================================
              MODULE 1: SUMMARY TABLE DASHBOARD (አጠቃላይ ማጠቃለያ ዳሽቦርድ)
              ====================================================================== */}
          
          {/* Component A: High-level aggregates cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="aggregates-banner-panel">
            
            {/* Lended Out Card (የእኔ ብድር) */}
            <div className="bg-[#111827] border border-[#1f2937]/80 rounded-2xl p-5 flex items-center justify-between shadow-lg relative overflow-hidden group hover:border-[#10b981]/30 transition-all">
              <div className="space-y-1.5 relative z-10">
                <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase flex items-center gap-1.5 font-sans">
                  <span className="inline-block w-2 h-2 rounded-full bg-[#10b981] animate-pulse"></span>
                  {t.totalLended}
                </p>
                <h3 className="text-2xl md:text-3xl font-black font-mono text-[#10b981]" id="total-lended-number">
                  {aggregates.totalLendedOut.toLocaleString()} <span className="text-xs font-sans font-bold text-slate-450">ETB</span>
                </h3>
                <p className="text-[9px] text-slate-500 font-sans">
                  {lang === 'en' ? 'Asset capital currently held by external third-parties' : 'በስማቸው የተመዘገበ ከሌሎች ሰዎች መሰብሰብ ያለበት በእጅ ያለ ብር ጠቅላላ ድምር'}
                </p>
              </div>
              <div className="p-4 bg-[#10b981]/10 text-[#10b981] rounded-2xl border border-[#10b981]/15 group-hover:scale-105 transition-transform" id="aggregate-lended-icon">
                <TrendingUp className="w-8 h-8" />
              </div>
            </div>

            {/* Debts Owed Card (የእኔ እዳ) */}
            <div className="bg-[#111827] border border-[#1f2937]/80 rounded-2xl p-5 flex items-center justify-between shadow-lg relative overflow-hidden group hover:border-rose-500/30 transition-all">
              <div className="space-y-1.5 relative z-10">
                <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase flex items-center gap-1.5 font-sans">
                  <span className="inline-block w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                  {t.totalDebts}
                </p>
                <h3 className="text-2xl md:text-3xl font-black font-mono text-rose-500" id="total-debts-number">
                  {aggregates.totalDebtsOwed.toLocaleString()} <span className="text-xs font-sans font-bold text-slate-450">ETB</span>
                </h3>
                <p className="text-[9px] text-slate-500 font-sans">
                  {lang === 'en' ? 'Passive operational liabilities that need immediate clearance' : 'እኔ የተበደርኩትና ለአበዳሪዎች በሂደት መመለስ ያለብኝ ቀሪ ጠቅላላ የእዳ ክፍያ'}
                </p>
              </div>
              <div className="p-4 bg-rose-500/10 text-rose-500 rounded-2xl border border-rose-500/15 group-hover:scale-105 transition-transform" id="aggregate-debts-icon">
                <TrendingDown className="w-8 h-8" />
              </div>
            </div>

          </div>

          {/* Component B: Directory list with strict controls */}
          <div className="bg-[#111827] border border-[#1f2937] rounded-3xl p-6 shadow-xl space-y-6" id="directory-panel-root">
            
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4" id="directory-panel-header">
              <div className="space-y-1">
                <h3 className="text-sm font-black text-white uppercase tracking-wider font-sans flex items-center gap-2" id="directory-heading">
                  <Users className="w-4 h-4 text-indigo-400 shrink-0" /> {t.debtorCreditorDir}
                </h3>
                <p className="text-[10px] text-slate-400 font-sans">
                  {lang === 'en'
                    ? 'Strict alphabetical indexation of all human profiles registered under My Debt and My Loan modules.'
                    : 'በእኔ እዳ (Liability) እና በእኔ ብድር (Asset) ስር የተመዘገቡ የሰዎች ስም በፊደል ቅደም ተከተል የተቀመጠ ማውጫ።'}
                </p>
              </div>

              {/* Strict actions to open Modal creation */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setModalProfileType('debt');
                    setEditingProfileId(null);
                    setProfName('');
                    setProfPhone('');
                    setProfAmount('');
                    setProfNote('');
                    setIsProfileModalOpen(true);
                  }}
                  className="px-4 py-2 bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-500/20 text-[11px] font-black rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                  id="add-owed-debt-profile-btn"
                >
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span>{t.addNewDebtBtn}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setModalProfileType('loan');
                    setEditingProfileId(null);
                    setProfName('');
                    setProfPhone('');
                    setProfAmount('');
                    setProfNote('');
                    setIsProfileModalOpen(true);
                  }}
                  className="px-4 py-2 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 text-[11px] font-black rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                  id="add-lended-loan-profile-btn"
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>{t.addNewLoanBtn}</span>
                </button>
              </div>
            </div>

            {/* Search and filter controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0d121f] p-3 rounded-2xl border border-[#1f2937]/70" id="dir-filters-bar">
              {/* Tabs for fast segregation */}
              <div className="flex items-center p-1 bg-slate-900 rounded-xl" id="filter-tabs-container">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-3.5 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
                    filterType === 'all' ? 'bg-[#1f2937] text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                  id="filter-tag-all"
                >
                  {t.allProfiles}
                </button>
                <button
                  onClick={() => setFilterType('debt')}
                  className={`px-3.5 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
                    filterType === 'debt' ? 'bg-rose-600/20 text-rose-300 shadow-sm border border-rose-500/10' : 'text-slate-400 hover:text-rose-400'
                  }`}
                  id="filter-tag-debts"
                >
                  {t.onlyDebts}
                </button>
                <button
                  onClick={() => setFilterType('loan')}
                  className={`px-3.5 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
                    filterType === 'loan' ? 'bg-emerald-600/20 text-emerald-300 shadow-sm border border-emerald-500/10' : 'text-slate-400 hover:text-emerald-400'
                  }`}
                  id="filter-tag-loans"
                >
                  {t.onlyLoans}
                </button>
              </div>

              {/* Alphabetical counter badge */}
              <span className="text-[10px] font-mono font-bold text-slate-500" id="alphabetical-indicator">
                {filteredAndSortedProfiles.length} {lang === 'en' ? 'profiles registered (A-Z sorted)' : 'መዝገቦች በቅደም ተከተል ተገኝተዋል'}
              </span>
            </div>

            {/* Profiles directory representation */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="profiles-alphabetical-grid">
              {filteredAndSortedProfiles.map(p => {
                // Compute current outstanding balance for the profile
                const isDebt = p.type === 'debt';
                const originalSum = p.records
                  .filter(r => r.type === (isDebt ? 'borrow' : 'lend'))
                  .reduce((sum, r) => sum + r.amount, 0);
                const processedSum = p.records
                  .filter(r => r.type === (isDebt ? 'repay' : 'collect'))
                  .reduce((sum, r) => sum + r.amount, 0);
                const currentBalance = originalSum - processedSum;

                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedProfileId(p.id)}
                    className={`bg-[#0d121f] rounded-2xl border p-4 hover:scale-[1.01] hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between h-40 group ${
                      isDebt 
                        ? 'border-rose-950/20 hover:border-rose-500/30' 
                        : 'border-emerald-950/20 hover:border-emerald-500/30'
                    }`}
                    id={`profile-card-${p.id}`}
                  >
                    <div>
                      {/* Badge and Title */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${
                          isDebt 
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/25' 
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                        }`} id={`profile-badge-${p.id}`}>
                          {isDebt ? (lang === 'en' ? 'My Debt' : 'የእኔ እዳ') : (lang === 'en' ? 'My Loan' : 'የእኔ ብድር')}
                        </span>
                        
                        <div className="flex items-center gap-1 text-[10px] text-slate-500 shrink-0">
                          <Phone className="w-3 h-3 text-slate-500" />
                          <span className="font-mono">{p.phone || 'N/A'}</span>
                        </div>
                      </div>

                      <h4 className="text-sm font-black text-white hover:text-indigo-400 transition-colors font-sans truncate" id={`profile-name-${p.id}`}>
                        👤 {p.name}
                      </h4>
                      <p className="text-[10px] text-slate-500 mt-1 font-sans truncate">
                        {lang === 'en' ? 'Total records:' : 'ጠቅላላ የግብይቶች ብዛት:'} <span className="font-mono text-slate-400 font-bold">{p.records.length}</span>
                      </p>
                    </div>

                    <div className="pt-3 border-t border-[#1f2937]/50 flex items-center justify-between" id={`profile-footer-${p.id}`}>
                      <div>
                        <p className="text-[8px] uppercase tracking-wider text-slate-400 font-sans">
                          {isDebt ? t.remainingDebt : t.remainingLoan}
                        </p>
                        <p className={`text-base font-black font-mono mt-0.5 ${isDebt ? 'text-rose-400' : 'text-emerald-400'}`} id={`profile-balance-${p.id}`}>
                          {currentBalance.toLocaleString()} <span className="text-[9px] font-sans font-bold text-slate-500">ETB</span>
                        </p>
                      </div>

                      <div className={`p-2 rounded-xl transition-all shrink-0 ${
                        isDebt ? 'bg-rose-500/5 group-hover:bg-rose-500/15 text-rose-400' : 'bg-emerald-500/5 group-hover:bg-emerald-500/15 text-emerald-400'
                      }`} id={`profile-drilldown-btn-${p.id}`}>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredAndSortedProfiles.length === 0 && (
                <div className="col-span-full py-16 text-center border-2 border-dashed border-[#1f2937] rounded-3xl bg-[#0d121f]/50 space-y-3" id="blank-directory-placeholder">
                  <div className="w-12 h-12 rounded-full bg-slate-800/60 text-slate-500 flex items-center justify-center mx-auto text-xl font-bold">🗒️</div>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-350 font-sans font-bold">
                      {lang === 'en' ? 'No profiles logged in this filter yet.' : 'ምንም የተመዘገቡ የሰው ስሞች በዚህ ክፍል ውስጥ የሉም።'}
                    </p>
                    <p className="text-[10px] text-slate-550 font-sans">
                      {lang === 'en' ? 'Please click the top buttons to register your debts or loans.' : 'እባክዎ አዳዲስ የብድር ወይም የእዳ መዝገቦች ለመፍጠር ከላይ ያሉትን አማራጮች ይጫኑ።'}
                    </p>
                  </div>
                </div>
              )}
            </div>

          </div>
        </>
      ) : (
        <>
          {/* ======================================================================
              WORKFLOW DRILL-DOWN: MODULE 2 & MODULE 3 - PROFILE DETAIL
              ====================================================================== */}
          
          <div className="space-y-6" id="profile-detailed-workflow">
            
            {/* Back button to Directory */}
            <div id="detailed-workflow-navigation">
              <button
                type="button"
                onClick={() => setSelectedProfileId(null)}
                className="px-4 py-2 bg-[#111827] hover:bg-[#1f2937] text-slate-300 hover:text-white border border-[#1f2937] hover:border-slate-700 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center gap-2"
                id="back-to-directory-btn"
              >
                <ArrowLeft className="w-4 h-4 text-indigo-400 shrink-0 animate-pulse" />
                <span>{t.backBtn}</span>
              </button>
            </div>

            {/* Profile Action Header Card */}
            <div className="bg-[#111827] border border-[#1f2937] rounded-3xl p-6 shadow-2xl relative overflow-hidden" id="profile-actions-header-panel">
              <div className="absolute top-0 right-0 w-36 h-36 bg-slate-700/5 rounded-full blur-2xl"></div>
              
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full border ${
                      selectedProfile.type === 'debt'
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/25'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                    }`} id="detail-profile-badge">
                      {selectedProfile.type === 'debt' ? (lang === 'en' ? 'MY DEBT' : 'የእኔ እዳ - የሰው ብድር እኔ ላይ ያለ') : (lang === 'en' ? 'MY LOAN LENDED' : 'የእኔ ብድር - እኔ ለሰው ያበደርኩት')}
                    </span>

                    {selectedProfile.phone && (
                      <span className="text-[10px] bg-slate-900 border border-slate-800 text-slate-400 px-3 py-1 rounded-full font-mono flex items-center gap-1 shrink-0">
                        <Phone className="w-3 h-3 text-slate-500" />
                        {selectedProfile.phone}
                      </span>
                    )}
                  </div>

                  <h3 className="text-xl md:text-2xl font-black text-white font-sans flex items-center gap-2" id="detail-profile-name">
                    👤 {selectedProfile.name}
                  </h3>
                </div>

                {/* WORKFLOW CONTROLS ACTIONS */}
                <div className="flex flex-wrap items-center gap-2 shrink-0 bg-[#0d121f] p-3 rounded-2xl border border-[#1f2937]" id="profile-control-actions-group">
                  {selectedProfile.type === 'debt' ? (
                    <>
                      {/* MODULE 2 Controls */}
                      <button
                        type="button"
                        onClick={() => {
                          setTxType('borrow');
                          setEditingTxId(null);
                          setTxDate(new Date().toISOString().substring(0, 10));
                          setTxAmount('');
                          setTxNote('');
                          setIsTxModalOpen(true);
                        }}
                        className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-black rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                        id="btn-add-more-debt"
                      >
                        <Plus className="w-3.5 h-3.5 shrink-0" />
                        <span>{t.addDebtBtn}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setTxType('repay');
                          setEditingTxId(null);
                          setTxDate(new Date().toISOString().substring(0, 10));
                          setTxAmount('');
                          setTxNote('');
                          setIsTxModalOpen(true);
                        }}
                        className="px-3.5 py-2 bg-[#1f2937] hover:bg-[#374151] hover:text-white text-rose-450 border border-rose-500/10 text-[11px] font-black rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                        id="btn-log-debt-repayment"
                      >
                        <Coins className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span>{t.repayDebtBtn}</span>
                      </button>
                    </>
                  ) : (
                    <>
                      {/* MODULE 3 Controls */}
                      <button
                        type="button"
                        onClick={() => {
                          setTxType('lend');
                          setEditingTxId(null);
                          setTxDate(new Date().toISOString().substring(0, 10));
                          setTxAmount('');
                          setTxNote('');
                          setIsTxModalOpen(true);
                        }}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                        id="btn-add-more-loan"
                      >
                        <Plus className="w-3.5 h-3.5 shrink-0" />
                        <span>{t.addLoanBtn}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setTxType('collect');
                          setEditingTxId(null);
                          setTxDate(new Date().toISOString().substring(0, 10));
                          setTxAmount('');
                          setTxNote('');
                          setIsTxModalOpen(true);
                        }}
                        className="px-3.5 py-2 bg-[#1f2937] hover:bg-[#374151] hover:text-white text-emerald-400 border border-emerald-500/10 text-[11px] font-black rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                        id="btn-log-loan-collection"
                      >
                        <Coins className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>{t.collectLoanBtn}</span>
                      </button>
                    </>
                  )}

                  {/* Profile Edit/Delete operations */}
                  <span className="w-px h-6 bg-slate-800 ml-1"></span>

                  <button
                    type="button"
                    onClick={() => handleEditProfileInit(selectedProfile)}
                    className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl transition-all border border-slate-800"
                    title={t.editProfile}
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteProfile(selectedProfile.id)}
                    className="p-2 bg-rose-900/10 hover:bg-rose-900/30 text-rose-400 border border-rose-500/20 rounded-xl transition-all"
                    title={t.deleteProfile}
                  >
                    <Trash2 className="w-4 h-4 text-rose-500" />
                  </button>
                </div>
              </div>

            </div>

            {/* Financial Status Summary box with auto compute (🧮 FINANCIAL ACCOUNT BALANCE) */}
            <div className="bg-[#0e1321] border border-[#1f2937] rounded-3xl p-6 shadow-xl space-y-4" id="workflow-financial-ledger">
              <h4 className="text-[11px] font-black text-white/90 uppercase tracking-widest font-sans flex items-center gap-2" id="finance-ledger-heading">
                <span>🧮</span> {lang === 'en' ? 'FINANCIAL ACCOUNT BALANCE WORKFLOW' : 'የአካውንት የሂሳብ አጠቃላይ መግለጫ (Financial Balance)'}
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="computed-aggregates-cards">
                
                {/* original sum field */}
                <div className="bg-[#111827] border border-[#1f2937]/70 rounded-2xl p-4 flex flex-col justify-between" id="original-sum-card">
                  <span className="text-[9px] uppercase font-bold text-slate-450 font-sans tracking-wide">
                    {selectedProfile.type === 'debt' ? t.originalDebt : t.originalLoan}
                  </span>
                  <span className="text-xl md:text-2xl font-black font-mono text-slate-100 mt-2" id="sum-original-number">
                    {profileBalances.originalTot.toLocaleString()} <span className="text-xs font-sans font-bold text-slate-450">ETB</span>
                  </span>
                  <span className="text-[9px] text-slate-500 mt-1 font-sans">
                    {selectedProfile.type === 'debt' ? 'Total accumulated liabilities' : 'Total money lended initially'}
                  </span>
                </div>

                {/* total processed repaid/collected */}
                <div className="bg-[#111827] border border-[#1f2937]/70 rounded-2xl p-4 flex flex-col justify-between" id="processed-sum-card">
                  <span className="text-[9px] uppercase font-bold text-slate-450 font-sans tracking-wide">
                    {selectedProfile.type === 'debt' ? t.totalRepaid : t.totalCollect}
                  </span>
                  <span className="text-xl md:text-2xl font-black font-mono text-indigo-400 mt-2" id="sum-collected-repaid-number">
                    {profileBalances.repaidOrCollectedTot.toLocaleString()} <span className="text-xs font-sans font-bold text-slate-450">ETB</span>
                  </span>
                  <span className="text-[9px] text-slate-500 mt-1 font-sans">
                    {lang === 'en' ? 'Sum of all documented repayment logs' : 'በስማቸው የተከፈለ ወይም የተቀናነሰ ክፍያ ጠቅላላ ድምር'}
                  </span>
                </div>

                {/* remaining balance highlight (🚨 Remaining Debt Balance / My Loan Remaining) */}
                <div className={`border rounded-2xl p-4 flex flex-col justify-between ${
                  selectedProfile.type === 'debt' 
                    ? 'bg-rose-500/5 border-rose-950/40' 
                    : 'bg-emerald-500/5 border-emerald-950/40'
                }`} id="remaining-balance-card">
                  <span className="text-[9px] uppercase font-bold text-slate-400 font-sans tracking-wide flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${selectedProfile.type === 'debt' ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500 animate-pulse'}`}></span>
                    {selectedProfile.type === 'debt' ? t.remainingDebt : t.remainingLoan}
                  </span>
                  <span className={`text-xl md:text-2xl font-black font-mono mt-2 ${
                    selectedProfile.type === 'debt' ? 'text-rose-400' : 'text-emerald-400'
                  }`} id="sum-remaining-number">
                    {profileBalances.remainingBalance.toLocaleString()} <span className="text-xs font-sans font-bold text-slate-450">ETB</span>
                  </span>
                  <span className="text-[9px] text-slate-450 mt-1 font-sans font-semibold">
                    {lang === 'en' ? 'Auto-computed balance ledger active' : 'በሲስተም በራስሰር የተሰላ ተነጻጻሪ ቀሪ የብር መጠን'}
                  </span>
                </div>

              </div>
            </div>

            {/* Permanent timeline history registry table (📜 PERMANENT TIMELINE HISTORY) */}
            <div className="bg-[#111827] border border-[#1f2937] rounded-3xl p-6 shadow-xl space-y-4" id="timeline-panel">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2" id="timeline-header">
                <h4 className="text-xs font-black text-white uppercase tracking-wider font-sans" id="timeline-heading">
                  {t.timelineTitle}
                </h4>
                <p className="text-[10px] text-slate-500 font-sans">
                  {lang === 'en' ? 'Permanent audit visible trace logs' : 'ማሻሻልና መሰረዝ የሚችሉ ታማኝ የክፍያ ታሪኮች ስብስብ'}
                </p>
              </div>

              <div className="overflow-x-auto rounded-3xl border border-[#1f2937]/70 bg-[#0d121f]" id="timeline-table-wrapper">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-[#111827] text-slate-400 border-b border-[#1f2937]" id="timeline-table-header">
                    <tr>
                      <th className="p-4 font-black text-[10px] uppercase font-sans">{t.entryDate}</th>
                      <th className="p-4 font-black text-[10px] uppercase font-sans">{t.actionLog}</th>
                      <th className="p-4 font-black text-[10px] uppercase font-sans">{t.amountLabel}</th>
                      <th className="p-4 font-black text-[10px] uppercase font-sans">{t.noteLabel}</th>
                      <th className="p-4 font-black text-[10px] uppercase font-sans text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1f2937]/50 font-sans text-slate-300" id="timeline-table-body">
                    {selectedProfile.records.length > 0 ? (
                      // Sort chronological: oldest first or newest first? Let's sort oldest first for traditional timeline ledger mapping
                      [...selectedProfile.records]
                        .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                        .map((rec, i) => {
                          const isOwedAddition = rec.type === 'borrow' || rec.type === 'lend';
                          const isRepaidSubtraction = rec.type === 'repay' || rec.type === 'collect';
                          
                          let actionLabel = '';
                          let actionStyle = '';
                          if (rec.type === 'borrow') {
                            actionLabel = lang === 'en' ? 'Borrowed Money (እዳ መውሰድ)' : 'ተጨማሪ እዳ (Borrowed)';
                            actionStyle = 'text-rose-450 bg-rose-500/10 border-rose-500/15';
                          } else if (rec.type === 'repay') {
                            actionLabel = lang === 'en' ? 'Paid Repayment (ክፍያ)' : 'የእዳ ክፍያ (Repayment)';
                            actionStyle = 'text-emerald-450 bg-emerald-500/10 border-emerald-500/15';
                          } else if (rec.type === 'lend') {
                            actionLabel = lang === 'en' ? 'Lended Out Money (ብድር መስጠት)' : 'ተጨማሪ ብድር (Lended)';
                            actionStyle = 'text-emerald-450 bg-emerald-500/10 border-emerald-500/15';
                          } else if (rec.type === 'collect') {
                            actionLabel = lang === 'en' ? 'Collected Repayment (ተመላሽ)' : 'ተመላሽ ክፍያ (Collection)';
                            actionStyle = 'text-blue-400 bg-blue-500/10 border-blue-500/15';
                          }

                          return (
                            <tr key={rec.id} className="hover:bg-slate-900/40 transition-colors" id={`timeline-row-${rec.id}`}>
                              <td className="p-4 font-mono font-bold text-slate-400 tracking-tight whitespace-nowrap">
                                📅 {rec.date}
                              </td>
                              <td className="p-4 whitespace-nowrap">
                                <span className={`text-[9px] font-black px-2.5 py-1 rounded-full border ${actionStyle}`}>
                                  {actionLabel}
                                </span>
                              </td>
                              <td className="p-4 font-mono font-black text-white shrink-0">
                                <span className={isRepaidSubtraction ? 'text-indigo-400' : 'text-slate-200'}>
                                  {isRepaidSubtraction ? '➖' : '➕'}{rec.amount.toLocaleString()} ETB
                                </span>
                              </td>
                              <td className="p-4 text-slate-350 max-w-xs truncate font-medium">
                                💬 {rec.note || '-'}
                              </td>
                              <td className="p-4 text-right whitespace-nowrap">
                                <div className="flex items-center gap-1 justify-end">
                                  <button
                                    type="button"
                                    onClick={() => handleEditTxInit(rec)}
                                    className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-all cursor-pointer"
                                    title="Edit this entry"
                                    id={`edit-tx-btn-${rec.id}`}
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteTx(rec.id)}
                                    className="p-1 text-slate-400 hover:text-rose-450 hover:bg-rose-950/20 rounded transition-all cursor-pointer"
                                    title="Delete this entry"
                                    id={`delete-tx-btn-${rec.id}`}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-slate-500 text-xs font-sans">
                          {lang === 'en' ? 'No history transaction records found.' : 'ምንም የክፍያ ታሪክ መዛግብት የሉም።'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </>
      )}

      {/* ======================================================================
          STYLISH MODAL A: CREATE / EDIT FINANCIAL PROFILE
          ====================================================================== */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="profile-modal-backdrop">
          <div className="bg-[#111827] rounded-2xl border border-[#1f2937] max-w-md w-full shadow-2xl p-6" id="profile-modal-body">
            
            <div className="flex items-center justify-between pb-3 border-b border-[#1f2937]" id="profile-modal-header">
              <h3 className="text-sm font-black text-white uppercase tracking-wider font-sans" id="profile-modal-title">
                {editingProfileId ? (lang === 'en' ? '✏️ Edit Profile Info' : '✏️ የሰው መረጃ ማስተካከያ') : (
                  modalProfileType === 'debt' ? (lang === 'en' ? '➕ Register Owed Debt' : '➕ አዲስ እዳ መመዝገቢያ') : (lang === 'en' ? '➕ Register Lended Loan' : '➕ አዲስ ብድር መመዝገቢያ')
                )}
              </h3>
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(false)}
                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-all"
                id="close-profile-modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 mt-4 font-sans text-xs">
              
              {/* Full Name field */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  {t.fullName} <span className="text-rose-500 shrink-0">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={profName}
                  onChange={(e) => setProfName(e.target.value)}
                  placeholder={lang === 'en' ? 'e.g. አቶ ደምስ' : 'ምሳሌ፡ አቶ ደምስ'}
                  className="w-full px-3 py-2 bg-[#0d121f] rounded-lg border border-[#1f2937] text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-sans font-semibold placeholder-slate-650 shrink-0"
                  id="profile-field-name"
                />
              </div>

              {/* Phone number field */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  {t.phoneNum}
                </label>
                <input
                  type="text"
                  value={profPhone}
                  onChange={(e) => setProfPhone(e.target.value)}
                  placeholder="e.g. 0911XXXXXX"
                  className="w-full px-3 py-2 bg-[#0d121f] rounded-lg border border-[#1f2937] text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono tracking-wide placeholder-slate-650 shrink-0"
                  id="profile-field-phone"
                />
              </div>

              {/* Initial items fields ONLY when registering a brand new profile */}
              {!editingProfileId && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    {/* Amount field */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        {t.initialAmount} (ETB) <span className="text-rose-500 shrink-0">*</span>
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="any"
                        value={profAmount}
                        onChange={(e) => setProfAmount(e.target.value)}
                        placeholder="e.g. 2000"
                        className="w-full px-3 py-2 bg-[#0d121f] rounded-lg border border-[#1f2937] text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono tracking-tight placeholder-slate-650 shrink-0"
                        id="profile-field-amount"
                      />
                    </div>

                    {/* Date field */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        {t.entryDate} <span className="text-rose-500 shrink-0">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={profDate}
                        onChange={(e) => setProfDate(e.target.value)}
                        className="w-full px-3 py-2 bg-[#0d121f] rounded-lg border border-[#1f2937] text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono shrink-0"
                        id="profile-field-date"
                      />
                    </div>
                  </div>

                  {/* Note block */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      {t.noteLabel}
                    </label>
                    <input
                      type="text"
                      value={profNote}
                      onChange={(e) => setProfNote(e.target.value)}
                      placeholder={modalProfileType === 'debt' ? 'e.g. የመጀመሪያ ብድር' : 'e.g. ለበቆሎ ግዢ ማስፋፊያ'}
                      className="w-full px-3 py-2 bg-[#0d121f] rounded-lg border border-[#1f2937] text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-sans font-medium placeholder-slate-650 shrink-0"
                      id="profile-field-note"
                    />
                  </div>
                </>
              )}

              {/* Actions submit */}
              <div className="flex items-center gap-2 justify-end pt-3 border-t border-[#1f2937]" id="profile-form-buttons">
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  className="px-4 py-2 bg-[#1f2937] hover:bg-[#374151] text-slate-350 hover:text-white rounded-xl transition-all cursor-pointer font-bold text-[11px]"
                  id="cancel-profile-modal-btn"
                >
                  {t.cancelBtn}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg transition-all cursor-pointer font-bold text-[11px]"
                  id="submit-profile-modal-btn"
                >
                  {t.saveBtn}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ======================================================================
          STYLISH MODAL B: DYNAMIC WORKFLOW BALANCE ADJUSTMENT (ADD / REMOVE TRANSACTION)
          ====================================================================== */}
      {isTxModalOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="tx-modal-backdrop">
          <div className="bg-[#111827] rounded-2xl border border-[#1f2937] max-w-sm w-full shadow-2xl p-6" id="tx-modal-body">
            
            <div className="flex items-center justify-between pb-3 border-b border-[#1f2937]" id="tx-modal-header">
              <h3 className="text-sm font-black text-white uppercase tracking-wider font-sans flex items-center gap-1.5" id="tx-modal-title">
                {editingTxId ? '✏️' : '➕'} {editingTxId ? t.editTxTitle : t.addTxTitle}
              </h3>
              <button
                type="button"
                onClick={() => setIsTxModalOpen(false)}
                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-all"
                id="close-tx-modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTransaction} className="space-y-4 mt-4 font-sans text-xs">
              
              {/* Type indicator */}
              <div className="p-3 bg-indigo-950/20 border border-indigo-500/10 rounded-xl space-y-1 block" id="tx-type-indicator">
                <span className="text-[10px] font-black uppercase text-indigo-400 tracking-wider">
                  {lang === 'en' ? 'Operation Type:' : 'የግብይት አይነት፡'}
                </span>
                <p className="text-[11px] font-sans font-bold text-slate-250">
                  {txType === 'borrow' && (lang === 'en' ? 'Borrowing Liability Add (ተጨማሪ እዳ መጨመሪያ)' : 'ተጨማሪ እዳ/ብድር መውሰድ')}
                  {txType === 'repay' && (lang === 'en' ? 'Debt Repayment Subtract (የእዳ ክፍያ)' : 'የእዳ ክፍያ መመለስ')}
                  {txType === 'lend' && (lang === 'en' ? 'Lending Asset Add (ተጨማሪ ብድር መስጠት)' : 'ተጨማሪ ለሰው ማበደር')}
                  {txType === 'collect' && (lang === 'en' ? 'Loan Collection Subtract (የብድር ተመላሽ)' : 'ተመላሽ ክፍያ መሰብሰብ')}
                </p>
              </div>

              {/* Amount input */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  {t.amountLabel} <span className="text-rose-500 shrink-0">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="any"
                  value={txAmount}
                  onChange={(e) => setTxAmount(e.target.value)}
                  placeholder="e.g. 1000"
                  className="w-full px-3 py-2 bg-[#0d121f] rounded-lg border border-[#1f2937] text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono tracking-tight placeholder-slate-650 shrink-0"
                  id="tx-field-amount"
                />
              </div>

              {/* Date Input */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  {t.entryDate} <span className="text-rose-500 shrink-0">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={txDate}
                  onChange={(e) => setTxDate(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0d121f] rounded-lg border border-[#1f2937] text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono shrink-0"
                  id="tx-field-date"
                />
              </div>

              {/* Note input */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  {t.noteLabel}
                </label>
                <input
                  type="text"
                  value={txNote}
                  onChange={(e) => setTxNote(e.target.value)}
                  placeholder={lang === 'en' ? 'e.g. ግማሹን ከፍያለሁ.' : 'ምሳሌ፡ ግማሹን ከፍያለሁ.'}
                  className="w-full px-3 py-2 bg-[#0d121f] rounded-lg border border-[#1f2937] text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-sans font-medium placeholder-slate-650 shrink-0"
                  id="tx-field-note"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center gap-2 justify-end pt-3 border-t border-[#1f2937]" id="tx-form-buttons">
                <button
                  type="button"
                  onClick={() => setIsTxModalOpen(false)}
                  className="px-4 py-2 bg-[#1f2937] hover:bg-[#374151] text-slate-350 hover:text-white rounded-xl transition-all cursor-pointer font-bold text-[11px]"
                  id="cancel-tx-modal-btn"
                >
                  {t.cancelBtn}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg transition-all cursor-pointer font-bold text-[11px] animate-pulse"
                  id="submit-tx-modal-btn"
                >
                  {t.saveBtn}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
