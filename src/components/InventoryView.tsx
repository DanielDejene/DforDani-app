/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Trash2, 
  FileCheck2, 
  Clock, 
  Layers, 
  HelpCircle,
  Tag,
  AlertTriangle,
  Info,
  Edit2,
  CheckCircle2,
  ShoppingBag,
  ArrowRight,
  ChevronRight,
  Database,
  Globe
} from 'lucide-react';

interface BuyTransaction {
  id: string;
  grainType: string;
  date: string;
  quantity: number; // No. of Grain (Quintals / ኩንታል)
  pricePerQuintal: number;
  totalPrice: number; // calculated: quantity * pricePerQuintal
  note: string;
}

interface GrainDeposit {
  id: string;
  grainType: string;
  quantity: number;
  date: string;
  note: string;
}

interface GrainProfile {
  id: string;
  customerName: string;
  date: string;
  grainTypes: string[]; // List of varieties, e.g. ["Sinde / ስንዴ", "Waliya / ዋሊያ"]
  initialQuantity: number; // Stored (deposited) from farmer in merchant's warehouse
  note: string;
  buyTransactions: BuyTransaction[];
  deposits?: GrainDeposit[];
}

// Default initial data to seed the inventory mock environment based on the few-shot examples
const INITIAL_GRAIN_PROFILES: GrainProfile[] = [
  {
    id: 'prof-abebe',
    customerName: 'አበበ በቀለ',
    date: '2026-06-17',
    grainTypes: ['Sinde / ስንዴ', 'Waliya / ዋሊያ'],
    initialQuantity: 150, // Deposited 150 quintals
    note: 'በመጋዘን ቁጥር 2 ገብቷል።',
    deposits: [
      {
        id: 'dep-abebe-1',
        grainType: 'Sinde / ስንዴ',
        quantity: 100,
        date: '2026-06-17',
        note: 'በመጋዘን ቁጥር 2 ገብቷል።'
      },
      {
        id: 'dep-abebe-2',
        grainType: 'Waliya / ዋሊያ',
        quantity: 50,
        date: '2026-06-17',
        note: 'በመጋዘን ቁጥር 2 ገብቷል።'
      }
    ],
    buyTransactions: [
      {
        id: 'buy-1',
        grainType: 'Sinde / ስንዴ',
        date: '2026-06-17',
        quantity: 50,
        pricePerQuintal: 4000,
        totalPrice: 200000, // 50 * 4000
        note: 'Paid via bank transfer.'
      }
    ]
  },
  {
    id: 'prof-kasahun',
    customerName: 'ካሳሁን አሊ',
    date: '2026-06-16',
    grainTypes: ['Waliya / ዋሊያ'],
    initialQuantity: 200, // Deposited 200 quintals
    note: 'ከአርሲ ገበሬዎች ማህበር የመጣ',
    deposits: [
      {
        id: 'dep-kasahun-1',
        grainType: 'Waliya / ዋሊያ',
        quantity: 200,
        date: '2026-06-16',
        note: 'ከአርሲ ገበሬዎች ማህበር የመጣ'
      }
    ],
    buyTransactions: [
      {
        id: 'buy-2',
        grainType: 'Waliya / ዋሊያ',
        date: '2026-06-16',
        quantity: 120,
        pricePerQuintal: 3500,
        totalPrice: 420000,
        note: 'ክፍያ በመጠባበቅ ላይ'
      }
    ]
  },
  {
    id: 'prof-chala',
    customerName: 'ጫላ ደረጄ',
    date: '2026-06-15',
    grainTypes: ['Atar / አተር'],
    initialQuantity: 100, // Deposited 100 quintals
    note: 'በአዲስ መጋዘን የተከማቸ',
    deposits: [
      {
        id: 'dep-chala-1',
        grainType: 'Atar / አተር',
        quantity: 100,
        date: '2026-06-15',
        note: 'በአዲስ መጋዘን የተከማቸ'
      }
    ],
    buyTransactions: [
      {
        id: 'buy-3',
        grainType: 'Atar / አተር',
        date: '2026-06-15',
        quantity: 80,
        pricePerQuintal: 3800,
        totalPrice: 304000,
        note: 'Delivered successfully.'
      }
    ]
  }
];

interface InventoryViewProps {
  products?: any[];
  onAddProduct?: (newProd: any) => void;
  onUpdateProduct?: (updated: any) => void;
  onDeleteProduct?: (id: string) => void;
  providerDeposits?: any[];
  onAddProviderDeposit?: (deposit: any) => void;
  onDeleteProviderDeposit?: (id: string) => void;
  onAddPurchase?: (purchase: any, deductFromFinance: boolean) => void;
  accounts?: any[];
  lang?: 'en' | 'am';
  onSetLang?: (l: 'en' | 'am') => void;
}

export default function InventoryView({
  products,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  providerDeposits,
  onAddProviderDeposit,
  onDeleteProviderDeposit,
  onAddPurchase,
  accounts,
  lang: langProp,
  onSetLang: onSetLangProp
}: InventoryViewProps) {
  // Localization State - Toggle between English & Amharic
  const [localLang, setLocalLang] = useState<'en' | 'am'>('am'); // Default to Amharic to match interaction context
  const lang = langProp || localLang;
  const setLang = onSetLangProp || setLocalLang;

  // Helper: display name based on language choice for absolute stock card display
  const getGrainDisplayName = (name: string) => {
    const norm = name.trim().toLowerCase();
    if (norm.includes('waliya') || norm.includes('ዋሊያ')) {
      return lang === 'en' ? 'Waliya' : 'ዋሊያ';
    }
    if (norm.includes('evoniy') || norm.includes('ኤቮኒ')) {
      return lang === 'en' ? 'Evoniy' : 'ኤቮኒ';
    }
    if (norm.includes('atar') || norm.includes('አተር')) {
      return lang === 'en' ? 'Atar' : 'አተር';
    }
    if (norm.includes('bakela') || norm.includes('ባቄላ')) {
      return lang === 'en' ? 'Bakela' : 'ባቄላ';
    }
    if (norm.includes('sinde') || norm.includes('ስንዴ')) {
      return lang === 'en' ? 'Sinde' : 'ስንዴ';
    }
    if (norm.includes('ashile') || norm.includes('አሺሌ')) {
      return lang === 'en' ? 'Ashile' : 'አሺሌ';
    }
    
    if (name.includes('/')) {
      const parts = name.split('/');
      return lang === 'en' ? parts[0].trim() : parts[parts.length - 1].trim();
    }
    return name;
  };

  const getGrainIcon = (name: string) => {
    const norm = name.trim().toLowerCase();
    if (norm.includes('waliya') || norm.includes('ዋሊያ')) return '🌾';
    if (norm.includes('evoniy') || norm.includes('ኤቮኒ')) return '🌱';
    if (norm.includes('atar') || norm.includes('አተር')) return '🟢';
    if (norm.includes('bakela') || norm.includes('ባቄላ')) return '🟤';
    if (norm.includes('sinde') || norm.includes('ስንዴ')) return '🌾';
    if (norm.includes('ashile') || norm.includes('አሺሌ')) return '🌽';
    return '🌾';
  };

  const isCoreGrain = (name: string) => {
    const norm = name.trim().toLowerCase();
    return (
      norm.includes('waliya') || norm.includes('ዋሊያ') ||
      norm.includes('evoniy') || norm.includes('ኤቮኒ') ||
      norm.includes('atar') || norm.includes('አተር') ||
      norm.includes('bakela') || norm.includes('ባቄላ') ||
      norm.includes('sinde') || norm.includes('ስንዴ') ||
      norm.includes('ashile') || norm.includes('አሺሌ')
    );
  };

  // Core persistent State Management
  const [profiles, setProfiles] = useState<GrainProfile[]>(() => {
    const saved = localStorage.getItem('p_inv_grain_profiles');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse grain profiles from local storage, fallback to defaults.", e);
      }
    }
    return INITIAL_GRAIN_PROFILES;
  });

  // Save to local storage whenever profiles modify
  useEffect(() => {
    localStorage.setItem('p_inv_grain_profiles', JSON.stringify(profiles));
  }, [profiles]);

  // View Modules State Toggle
  // 'module1' = ADD NEW DATA, 'module2' = VIEW ENTERED DATA, 'module3' = DASHBOARD OF TOTAL DATA
  const [activeSubTab, setActiveSubTab] = useState<'module1' | 'module2' | 'module3'>('module3');

  // Selected Profile for Module 2 Drill-Down
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>('prof-abebe');

  // LAST RECORDED DATA SUCCESS HOOK (For Module 1 feedback summary block)
  const [lastRecordedData, setLastRecordedData] = useState<{
    customerName: string;
    date: string;
    grainType: string;
    quantity: number;
    note: string;
  } | null>(null);

  // --- FORM STATES FOR MODULE 1 ---
  const [m1Name, setM1Name] = useState('');
  const [m1Date, setM1Date] = useState(() => new Date().toISOString().split('T')[0]);
  const [m1GrainType, setM1GrainType] = useState('Waliya / ዋሊያ');
  const [m1Quantity, setM1Quantity] = useState('');
  const [m1Note, setM1Note] = useState('');

  // --- FORM STATES FOR MODULE 2: Add New Grain ---
  const [newGrainTypeSelected, setNewGrainTypeSelected] = useState('Waliya / ዋሊያ');
  const [newGrainQty, setNewGrainQty] = useState('');
  const [newGrainDate, setNewGrainDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [newGrainNote, setNewGrainNote] = useState('');
  const [showAddGrainForm, setShowAddGrainForm] = useState(false);

  // --- FORM STATES FOR MODULE 2: Edit Profile Data ---
  const [showEditProfileForm, setShowEditProfileForm] = useState(false);
  const [editProfileName, setEditProfileName] = useState('');
  const [editProfileDate, setEditProfileDate] = useState('');
  const [editProfileNote, setEditProfileNote] = useState('');

  // --- DESTRUCTIVE PLACEHOLDER TRIGGER ---
  const [profileDeleteConfirmId, setProfileDeleteConfirmId] = useState<string | null>(null);

  // --- FARMER DEPOSIT REGISTRY EDIT STATES ---
  const [editingDepositId, setEditingDepositId] = useState<string | null>(null);
  const [editDepositGrainType, setEditDepositGrainType] = useState('');
  const [editDepositDate, setEditDepositDate] = useState('');
  const [editDepositQuantity, setEditDepositQuantity] = useState('');
  const [editDepositNote, setEditDepositNote] = useState('');

  // --- FORM STATES FOR MODULE 2: Buy Grain ---
  const [showBuyGrainForm, setShowBuyGrainForm] = useState(false);
  const [buyGrainType, setBuyGrainType] = useState('');
  const [buyDate, setBuyDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [buyQuantity, setBuyQuantity] = useState(''); // No. of Grain (Quintals)
  const [buyPrice, setBuyPrice] = useState(''); // Price per Quintal
  const [buyNote, setBuyNote] = useState('');

  // --- BUY TRANSACTION EDIT HOOK ---
  const [editingBuyId, setEditingBuyId] = useState<string | null>(null);
  const [editBuyGrainType, setEditBuyGrainType] = useState('');
  const [editBuyDate, setEditBuyDate] = useState('');
  const [editBuyQuantity, setEditBuyQuantity] = useState('');
  const [editBuyPrice, setEditBuyPrice] = useState('');
  const [editBuyNote, setEditBuyNote] = useState('');

  // Sourcing Suggestions helper representing the six assigned grain types: Waliya, Evoniy, Atar, Bakela, Sinde, Ashile
  const grainSelectionSuggestions = [
    'Waliya / ዋሊያ',
    'Evoniy / ኤቮኒ',
    'Atar / አተር',
    'Bakela / ባቄላ',
    'Sinde / ስንዴ',
    'Ashile / አሺሌ'
  ];

  // Auto-calculated live values for Buy Grain Form
  const liveCalculatedTotalPrice = useMemo(() => {
    const qty = parseFloat(buyQuantity) || 0;
    const price = parseFloat(buyPrice) || 0;
    return qty * price;
  }, [buyQuantity, buyPrice]);

  // Auto-calculated live values for Editing Buy Form
  const liveCalculatedEditTotalPrice = useMemo(() => {
    const qty = parseFloat(editBuyQuantity) || 0;
    const price = parseFloat(editBuyPrice) || 0;
    return qty * price;
  }, [editBuyQuantity, editBuyPrice]);

  // Alphabetic sorted profile list for strict order rules
  const sortedProfiles = useMemo(() => {
    return [...profiles].sort((a, b) => a.customerName.localeCompare(b.customerName, undefined, { numeric: true, sensitivity: 'base' }));
  }, [profiles]);

  const sixGrainsList = useMemo(() => {
    const grains = [
      { key: 'Waliya', nameEn: 'Waliya', nameAm: 'ዋሊያ', icon: '🌾' },
      { key: 'Evoniy', nameEn: 'Evoniy', nameAm: 'ኤቮኒ', icon: '🌱' },
      { key: 'Atar', nameEn: 'Atar', nameAm: 'አተር', icon: '🟢' },
      { key: 'Bakela', nameEn: 'Bakela', nameAm: 'ባቄላ', icon: '🟤' },
      { key: 'Sinde', nameEn: 'Sinde', nameAm: 'ስንዴ', icon: '🌾' },
      { key: 'Ashile', nameEn: 'Ashile', nameAm: 'አሺሌ', icon: '🌽' }
    ];

    return grains.map(g => {
      const matchingProducts = (products || []).filter(prod => {
        const normProdName = prod.name.trim().toLowerCase();
        return normProdName.includes(g.key.toLowerCase()) || normProdName.includes(g.nameAm.toLowerCase());
      });

      const totalQty = matchingProducts.reduce((sum, p) => sum + p.quantity, 0);

      return {
        id: `core-grain-${g.key.toLowerCase()}`,
        name: g.key,
        displayName: lang === 'en' ? g.nameEn : g.nameAm,
        icon: g.icon,
        quantity: totalQty
      };
    });
  }, [products, lang]);

  // Aggregate sum totals of remaining quantities by grain types
  const aggregateGrainsData = useMemo(() => {
    const summary: Record<string, { deposited: number; bought: number }> = {
      'Waliya / ዋሊያ': { deposited: 0, bought: 0 },
      'Evoniy / ኤቮኒ': { deposited: 0, bought: 0 },
      'Atar / አተር': { deposited: 0, bought: 0 },
      'Bakela / ባቄላ': { deposited: 0, bought: 0 },
      'Sinde / ስንዴ': { deposited: 0, bought: 0 },
      'Ashile / አሺሌ': { deposited: 0, bought: 0 }
    };

    profiles.forEach(p => {
      // Dynamic mapping using deposits list if it exists, otherwise fallback to top-level fields
      const activeDeps = p.deposits || [
        {
          id: `dep-${p.id}`,
          grainType: p.grainTypes[0] || 'Waliya / ዋሊያ',
          quantity: p.initialQuantity || 0,
          date: p.date,
          note: p.note
        }
      ];

      activeDeps.forEach(dep => {
        const typeKey = dep.grainType.trim();
        const normKey = 
          typeKey.toLowerCase().includes('waliya') || typeKey.includes('ዋሊያ') ? 'Waliya / ዋሊያ' :
          typeKey.toLowerCase().includes('evoniy') || typeKey.includes('ኤቮኒ') ? 'Evoniy / ኤቮኒ' :
          typeKey.toLowerCase().includes('atar') || typeKey.includes('አተር') ? 'Atar / አተር' :
          typeKey.toLowerCase().includes('bakela') || typeKey.includes('ባቄላ') ? 'Bakela / ባቄላ' :
          typeKey.toLowerCase().includes('sinde') || typeKey.includes('ስንዴ') ? 'Sinde / ስንዴ' :
          typeKey.toLowerCase().includes('ashile') || typeKey.includes('አሺሌ') ? 'Ashile / አሺሌ' :
          typeKey;

        if (summary[normKey] !== undefined) {
          summary[normKey].deposited += (dep.quantity || 0);
        }
      });

      // Compile actual merchant purchase logs
      p.buyTransactions.forEach(t => {
        const transType = t.grainType.trim();
        const normTransKey = 
          transType.toLowerCase().includes('waliya') || transType.includes('ዋሊያ') ? 'Waliya / ዋሊያ' :
          transType.toLowerCase().includes('evoniy') || transType.includes('ኤቮኒ') ? 'Evoniy / ኤቮኒ' :
          transType.toLowerCase().includes('atar') || transType.includes('አተር') ? 'Atar / አተር' :
          transType.toLowerCase().includes('bakela') || transType.includes('ባቄላ') ? 'Bakela / ባቄላ' :
          transType.toLowerCase().includes('sinde') || transType.includes('ስንዴ') ? 'Sinde / ስንዴ' :
          transType.toLowerCase().includes('ashile') || transType.includes('አሺሌ') ? 'Ashile / አሺሌ' :
          transType;
          
        if (summary[normTransKey] !== undefined) {
          summary[normTransKey].bought += t.quantity;
        }
      });
    });

    return Object.entries(summary).map(([name, val]) => ({
      name,
      deposited: val.deposited,
      bought: val.bought,
      remaining: Math.max(0, val.deposited - val.bought)
    }));
  }, [profiles]);

  // --- HANDLER: MODULE 1 ADD NEW DATA ---
  const handleModule1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!m1Name.trim()) {
      alert(lang === 'am' ? 'እባክዎ የደንበኛ ስም ያስገቡ!' : 'Please enter a valid Customer Name!');
      return;
    }
    if (!m1GrainType.trim()) {
      alert(lang === 'am' ? 'እባክዎ የእህል አይነት ያስገቡ!' : 'Please enter a valid Grain Type!');
      return;
    }

    const qtyVal = parseFloat(m1Quantity);
    if (m1Quantity.trim() !== '' && (isNaN(qtyVal) || qtyVal < 0)) {
      alert(lang === 'am' ? 'እባክዎ ትክክለኛ የእህል መጠን ያስገቡ!' : 'Please enter a valid non-negative grain quantity!');
      return;
    }
    const qty = isNaN(qtyVal) ? 0 : qtyVal;

    // Check if customer with the same name already exists (case-insensitive, trimmed)
    const existingIndex = profiles.findIndex(
      p => p.customerName.trim().toLowerCase() === m1Name.trim().toLowerCase()
    );

    if (existingIndex !== -1) {
      // Farmer already has a profile! Group this new stock under their existing profile "according to grain type"
      const existingProfile = profiles[existingIndex];
      const newDepositId = `dep-${Date.now()}`;
      const newDeposit = {
        id: newDepositId,
        grainType: m1GrainType.trim(),
        quantity: qty,
        date: m1Date,
        note: m1Note.trim() || (lang === 'am' ? 'ተጨማሪ ክምችት' : 'Additional Stored Stock')
      };

      const updatedGrainTypes = existingProfile.grainTypes.includes(m1GrainType.trim())
        ? existingProfile.grainTypes
        : [...existingProfile.grainTypes, m1GrainType.trim()];

      const existingDeps = existingProfile.deposits || [
        {
          id: `dep-${existingProfile.id}`,
          grainType: existingProfile.grainTypes[0] || 'Waliya / ዋሊያ',
          quantity: existingProfile.initialQuantity || 0,
          date: existingProfile.date,
          note: existingProfile.note
        }
      ];

      const updatedProfile: GrainProfile = {
        ...existingProfile,
        grainTypes: updatedGrainTypes,
        initialQuantity: (existingProfile.initialQuantity || 0) + qty,
        deposits: [...existingDeps, newDeposit]
      };

      setProfiles(prev => {
        const copy = [...prev];
        copy[existingIndex] = updatedProfile;
        return copy;
      });

      setSelectedProfileId(existingProfile.id);

      // Save as last recorded data for UI dashboard confirmation
      setLastRecordedData({
        customerName: existingProfile.customerName,
        date: m1Date,
        grainType: m1GrainType.trim(),
        quantity: qty,
        note: m1Note.trim() || (lang === 'am' ? 'ተጨማሪ ክምችት' : 'Additional Stored Stock')
      });
    } else {
      // Farmer does not exist yet. Create a brand new profile with a first deposit
      const id = `prof-${Date.now()}`;
      const newDeposit = {
        id: `dep-${id}`,
        grainType: m1GrainType.trim(),
        quantity: qty,
        date: m1Date,
        note: m1Note.trim() || (lang === 'am' ? 'ቀዳሚ ክምችት' : 'Primary Storage')
      };

      const newProfile: GrainProfile = {
        id,
        customerName: m1Name.trim(),
        date: m1Date,
        grainTypes: [m1GrainType.trim()],
        initialQuantity: qty,
        note: m1Note.trim(),
        deposits: [newDeposit],
        buyTransactions: []
      };

      setProfiles(prev => [...prev, newProfile]);
      setSelectedProfileId(id);

      setLastRecordedData({
        customerName: m1Name.trim(),
        date: m1Date,
        grainType: m1GrainType.trim(),
        quantity: qty,
        note: m1Note.trim() || (lang === 'am' ? 'ማስታወሻ የለም' : 'No notes written')
      });
    }

    // Clear fields
    setM1Name('');
    setM1Quantity('');
    setM1Note('');
  };

  // --- HANDLERS: MODULE 2 ACTIONS ON SELECTED PROFILE ---
  const handleAddNewGrain = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfileId) return;

    const qtyVal = parseFloat(newGrainQty);
    if (newGrainQty.trim() !== '' && (isNaN(qtyVal) || qtyVal < 0)) {
      alert(lang === 'am' ? 'እባክዎ ትክክለኛ የኩንታል መጠን ያክሉ!' : 'Please enter a valid non-negative grain quantity!');
      return;
    }
    const qty = isNaN(qtyVal) ? 0 : qtyVal;

    const selectedVariety = newGrainTypeSelected.trim();

    setProfiles(prev => prev.map(p => {
      if (p.id === selectedProfileId) {
        // Prepare new deposit item
        const newDepId = `dep-${Date.now()}`;
        const newDep = {
          id: newDepId,
          grainType: selectedVariety,
          quantity: qty,
          date: newGrainDate,
          note: newGrainNote.trim() || (lang === 'am' ? 'በቀጥታ የተጨመረ' : 'Manually Added Storage')
        };

        const updatedGrainTypes = p.grainTypes.includes(selectedVariety)
          ? p.grainTypes
          : [...p.grainTypes, selectedVariety];

        const existingDeposits = p.deposits || [
          {
            id: `dep-${p.id}`,
            grainType: p.grainTypes[0] || 'Waliya / ዋሊያ',
            quantity: p.initialQuantity || 0,
            date: p.date,
            note: p.note
          }
        ];

        return {
          ...p,
          grainTypes: updatedGrainTypes,
          initialQuantity: (p.initialQuantity || 0) + qty,
          deposits: [...existingDeposits, newDep]
        };
      }
      return p;
    }));

    // Reset fields
    setNewGrainQty('');
    setNewGrainNote('');
    setShowAddGrainForm(false);
  };

  const startEditProfile = () => {
    const activeProf = profiles.find(p => p.id === selectedProfileId);
    if (!activeProf) return;
    setEditProfileName(activeProf.customerName);
    setEditProfileDate(activeProf.date);
    setEditProfileNote(activeProf.note);
    setShowEditProfileForm(true);
  };

  const handleSaveProfileEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProfileName.trim() || !selectedProfileId) return;

    setProfiles(prev => prev.map(p => {
      if (p.id === selectedProfileId) {
        return {
          ...p,
          customerName: editProfileName.trim(),
          date: editProfileDate,
          note: editProfileNote.trim()
        };
      }
      return p;
    }));

    setShowEditProfileForm(false);
  };

  const handleConfirmDeleteProfile = (id: string) => {
    setProfiles(prev => prev.filter(p => p.id !== id));
    setSelectedProfileId(null);
    setProfileDeleteConfirmId(null);
  };

  const handleAddBuyTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfileId) return;
    const qty = parseFloat(buyQuantity) || 0;
    const price = parseFloat(buyPrice) || 0;

    if (qty <= 0 || price <= 0) {
      alert(lang === 'am' ? 'እባክዎ አዎንታዊ የኩንታል ብዛት እና ዋጋ ያስገቡ!' : 'Please enter valid positive quantities and prices!');
      return;
    }

    const activeProf = profiles.find(p => p.id === selectedProfileId);
    if (!activeProf) return;

    const activeDeposits = activeProf.deposits || [
      {
        id: `dep-${activeProf.id}`,
        grainType: activeProf.grainTypes[0] || 'Waliya / ዋሊያ',
        quantity: activeProf.initialQuantity || 0,
        date: activeProf.date,
        note: activeProf.note
      }
    ];

    const selectedGrainType = buyGrainType || (activeProf.grainTypes[0] || 'Waliya / ዋሊያ');

    // Calculate total stored (deposited) for this specific grain type
    const totalDeposited = activeDeposits
      .filter(d => d.grainType === selectedGrainType)
      .reduce((sum, d) => sum + d.quantity, 0);

    // Calculate total purchased (sold) for this specific grain type
    const totalPurchased = activeProf.buyTransactions
      .filter(t => t.grainType === selectedGrainType)
      .reduce((sum, t) => sum + t.quantity, 0);

    const remainingAvailable = Math.max(0, totalDeposited - totalPurchased);

    if (qty > remainingAvailable) {
      alert(
        lang === 'am'
          ? `ያልተሳካ ግዢ፡ ደንበኛው ያከማቸው የዚህ እህል አይነት መጠን ${totalDeposited} ኩንታል ነው። ቀሪው ያልተሸጠ ${remainingAvailable} ኩንታል ብቻ ስለሆነ ${qty} ኩንታል መግዛት አይችሉም!`
          : `Insufficient stock! The farmer stored ${totalDeposited} quintals of ${selectedGrainType}. Since only ${remainingAvailable} quintals remain unsold, you cannot purchase ${qty} quintals!`
      );
      return;
    }

    const newBuy: BuyTransaction = {
      id: `buy-${Date.now()}`,
      grainType: selectedGrainType,
      date: buyDate,
      quantity: qty,
      pricePerQuintal: price,
      totalPrice: qty * price,
      note: buyNote.trim()
    };

    const matchedProd = (() => {
      const normLower = selectedGrainType.toLowerCase();
      let nameEng = 'Waliya';
      if (normLower.includes('waliya') || normLower.includes('ዋሊያ')) nameEng = 'Waliya';
      else if (normLower.includes('evoniy') || normLower.includes('ኤቮኒ') || normLower.includes('ኢቮኒ')) nameEng = 'Evoniy';
      else if (normLower.includes('atar') || normLower.includes('አተር')) nameEng = 'Atar';
      else if (normLower.includes('bakela') || normLower.includes('ባቄላ')) nameEng = 'Bakela';
      else if (normLower.includes('sinde') || normLower.includes('ስንዴ')) nameEng = 'Sinde';
      else if (normLower.includes('ashile') || normLower.includes('አሺሌ')) nameEng = 'Ashile';
      
      if (products && Array.isArray(products)) {
        return products.find(p => p.name.toLowerCase() === nameEng.toLowerCase()) || products[0];
      }
      return null;
    })();

    if (onAddPurchase) {
      const prodId = matchedProd ? matchedProd.id : 'prod-1';
      const prodName = matchedProd ? matchedProd.name : 'Waliya';
      onAddPurchase({
        productId: prodId,
        productName: prodName,
        quantity: qty,
        unitCost: price,
        date: buyDate,
        supplier: activeProf.customerName,
        status: 'Received',
        paymentAccount: (accounts && accounts.length > 0) ? (accounts[1]?.id || accounts[0]?.id) : 'acc-1'
      }, true);
    }

    setProfiles(prev => prev.map(p => {
      if (p.id === selectedProfileId) {
        return {
          ...p,
          buyTransactions: [newBuy, ...p.buyTransactions]
        };
      }
      return p;
    }));

    // Reset Buy form state
    setBuyQuantity('');
    setBuyPrice('');
    setBuyNote('');
    setShowBuyGrainForm(false);
  };

  const startEditingBuy = (buy: BuyTransaction) => {
    setEditingBuyId(buy.id);
    setEditBuyGrainType(buy.grainType);
    setEditBuyDate(buy.date);
    setEditBuyQuantity(buy.quantity.toString());
    setEditBuyPrice(buy.pricePerQuintal.toString());
    setEditBuyNote(buy.note);
  };

  const handleSaveBuyEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfileId || !editingBuyId) return;
    const qty = parseFloat(editBuyQuantity) || 0;
    const price = parseFloat(editBuyPrice) || 0;

    if (qty <= 0 || price <= 0) return;

    const activeProf = profiles.find(p => p.id === selectedProfileId);
    if (!activeProf) return;

    const activeDeposits = activeProf.deposits || [
      {
        id: `dep-${activeProf.id}`,
        grainType: activeProf.grainTypes[0] || 'Waliya / ዋሊያ',
        quantity: activeProf.initialQuantity || 0,
        date: activeProf.date,
        note: activeProf.note
      }
    ];

    const selectedGrainType = editBuyGrainType;

    // Calculate total stored (deposited) for this specific grain type
    const totalDeposited = activeDeposits
      .filter(d => d.grainType === selectedGrainType)
      .reduce((sum, d) => sum + d.quantity, 0);

    // Calculate total purchased (sold) for this specific grain type, EXCLUDING the current transaction being edited
    const totalPurchasedOthers = activeProf.buyTransactions
      .filter(t => t.grainType === selectedGrainType && t.id !== editingBuyId)
      .reduce((sum, t) => sum + t.quantity, 0);

    const remainingAvailable = Math.max(0, totalDeposited - totalPurchasedOthers);

    if (qty > remainingAvailable) {
      alert(
        lang === 'am'
          ? `ያልተሳካ ማሻሻያ፡ ደንበኛው ያከማቸው የዚህ እህል አይነት መጠን ${totalDeposited} ኩንታል ነው። ቀሪው ለመግዛት የሚቻለው ${remainingAvailable} ኩንታል ብቻ ስለሆነ ${qty} ኩንታል መግዛት አይችሉም!`
          : `Insufficient stock on edit! The farmer stored ${totalDeposited} quintals of ${selectedGrainType}. Since only ${remainingAvailable} quintals remain unsold, you cannot change the purchase to ${qty} quintals!`
      );
      return;
    }

    setProfiles(prev => prev.map(p => {
      if (p.id === selectedProfileId) {
        return {
          ...p,
          buyTransactions: p.buyTransactions.map(b => {
            if (b.id === editingBuyId) {
              return {
                ...b,
                grainType: editBuyGrainType,
                date: editBuyDate,
                quantity: qty,
                pricePerQuintal: price,
                totalPrice: qty * price,
                note: editBuyNote.trim()
              };
            }
            return b;
          })
        };
      }
      return p;
    }));

    setEditingBuyId(null);
  };

  const handleDeleteBuy = (buyId: string) => {
    if (!selectedProfileId) return;
    setProfiles(prev => prev.map(p => {
      if (p.id === selectedProfileId) {
        return {
          ...p,
          buyTransactions: p.buyTransactions.filter(b => b.id !== buyId)
        };
      }
      return p;
    }));
  };

  const startEditingDeposit = (dep: GrainDeposit) => {
    setEditingDepositId(dep.id);
    setEditDepositGrainType(dep.grainType);
    setEditDepositDate(dep.date);
    setEditDepositQuantity(dep.quantity.toString());
    setEditDepositNote(dep.note);
  };

  const handleSaveDepositEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfileId || !editingDepositId) return;

    const qty = parseFloat(editDepositQuantity);
    if (isNaN(qty) || qty < 0) {
      alert(lang === 'am' ? 'እባክዎ አዎንታዊ ወይም 0 የኩንታል ብዛት ያስገቡ!' : 'Please enter a valid non-negative quantity!');
      return;
    }

    const activeProf = profiles.find(p => p.id === selectedProfileId);
    if (!activeProf) return;

    const existingDeposits = activeProf.deposits || [
      {
        id: `dep-${activeProf.id}`,
        grainType: activeProf.grainTypes[0] || 'Waliya / ዋሊያ',
        quantity: activeProf.initialQuantity || 0,
        date: activeProf.date,
        note: activeProf.note
      }
    ];

    const targetDep = existingDeposits.find(d => d.id === editingDepositId);
    if (!targetDep) return;

    // Check compatibility when changing grain type or quantity
    const oldGrainType = targetDep.grainType;
    const newGrainType = editDepositGrainType;

    // Validate old grain type stock integrity
    if (oldGrainType !== newGrainType) {
      const oldDepositedOthers = existingDeposits
        .filter(d => d.grainType === oldGrainType && d.id !== editingDepositId)
        .reduce((sum, d) => sum + d.quantity, 0);

      const oldPurchasedSum = activeProf.buyTransactions
        .filter(t => t.grainType === oldGrainType)
        .reduce((sum, t) => sum + t.quantity, 0);

      if (oldDepositedOthers < oldPurchasedSum) {
        alert(
          lang === 'am'
            ? `ይህን የእህል ዝርያ መቀየር አይችሉም! ቀድሞውኑ ${oldPurchasedSum} ኩንታል የ${oldGrainType} እህል ተገዝቷል፣ መዝገቡን ሲቀይሩ ግን የተረፈው ክምችት ${oldDepositedOthers} ኩንታል ብቻ ስለሚሆን አይበቃም!`
            : `Cannot change variety! Already purchased: ${oldPurchasedSum} quintals of ${oldGrainType}. Changing this variety would leave only ${oldDepositedOthers} quintals deposited under ${oldGrainType}, which is insufficient!`
        );
        return;
      }
    }

    // Validate new grain type stock integrity
    const newDepositedOthers = existingDeposits
      .filter(d => d.grainType === newGrainType && d.id !== editingDepositId)
      .reduce((sum, d) => sum + d.quantity, 0);

    const newDepositedTotalAfter = newDepositedOthers + qty;

    const newPurchasedSum = activeProf.buyTransactions
      .filter(t => t.grainType === newGrainType)
      .reduce((sum, t) => sum + t.quantity, 0);

    if (newDepositedTotalAfter < newPurchasedSum) {
      alert(
        lang === 'am'
          ? `ያልተሳካ ማሻሻያ፡ የክምችት መጠን ከግብይት ያነሰ ነው! ቀድሞውኑ ${newPurchasedSum} ኩንታል ተገዝቷል፣ ማሻሻያው ግን አጠቃላይ የክምችት መጠንን ወደ ${newDepositedTotalAfter} ኩንታል ዝቅ ያደርገዋል!`
          : `Insufficient stock after edit! Already purchased: ${newPurchasedSum} quintals of ${newGrainType}. Your edit makes total quantity ${newDepositedTotalAfter} quintals, which cannot cover the purchases!`
      );
      return;
    }

    setProfiles(prev => prev.map(p => {
      if (p.id === selectedProfileId) {
        const fallbackDeposits = p.deposits || [
          {
            id: `dep-${p.id}`,
            grainType: p.grainTypes[0] || 'Waliya / ዋሊያ',
            quantity: p.initialQuantity || 0,
            date: p.date,
            note: p.note
          }
        ];

        const updatedDeposits = fallbackDeposits.map(d => {
          if (d.id === editingDepositId) {
            return {
              ...d,
              grainType: editDepositGrainType,
              date: editDepositDate,
              quantity: qty,
              note: editDepositNote.trim()
            };
          }
          return d;
        });

        const totalInitialQty = updatedDeposits.reduce((sum, d) => sum + d.quantity, 0);
        const distinctGrainTypes = Array.from(new Set(updatedDeposits.map(d => d.grainType)));

        return {
          ...p,
          initialQuantity: totalInitialQty,
          grainTypes: distinctGrainTypes,
          deposits: updatedDeposits
        };
      }
      return p;
    }));

    setEditingDepositId(null);
  };

  const handleDeleteDeposit = (depId: string) => {
    if (!selectedProfileId) return;

    const activeProf = profiles.find(p => p.id === selectedProfileId);
    if (!activeProf) return;

    const existingDeposits = activeProf.deposits || [
      {
        id: `dep-${activeProf.id}`,
        grainType: activeProf.grainTypes[0] || 'Waliya / ዋሊያ',
        quantity: activeProf.initialQuantity || 0,
        date: activeProf.date,
        note: activeProf.note
      }
    ];

    const targetDep = existingDeposits.find(d => d.id === depId);
    if (!targetDep) return;

    const selGrainType = targetDep.grainType;

    const otherDepositsSum = existingDeposits
      .filter(d => d.grainType === selGrainType && d.id !== depId)
      .reduce((sum, d) => sum + d.quantity, 0);

    const totalPurchased = activeProf.buyTransactions
      .filter(t => t.grainType === selGrainType)
      .reduce((sum, t) => sum + t.quantity, 0);

    if (otherDepositsSum < totalPurchased) {
      alert(
        lang === 'am'
          ? `ያልተሳካ ስረዛ፡ ደንበኛው ቀድሞውኑ ${totalPurchased} ኩንታል ስለተገዛለት ይህን የክምችት መዝገብ መሠረዝ አይችሉም (ቀሪው አጠቃላይ ክምችት ${otherDepositsSum} ኩንታል ብቻ ስለሚሆን)!`
          : `Cannot delete deposit record! Already purchased: ${totalPurchased} quintals. Deleting this would leave only ${otherDepositsSum} quintals deposited under this variety, which cannot cover the purchase!`
      );
      return;
    }

    if (existingDeposits.length <= 1) {
      alert(
        lang === 'am'
          ? `ደንበኛው ቢያንስ አንድ የክምችት ማስታወሻ ሊኖረው ይገባል!`
          : `A customer profile must have at least one deposit record!`
      );
      return;
    }

    if (!window.confirm(
      lang === 'am'
        ? `እርግጠኛ ነዎት ይህን የክምችት መዝገብ መሰረዝ ይፈልጋሉ?`
        : `Are you sure you want to delete this deposit record?`
    )) {
      return;
    }

    setProfiles(prev => prev.map(p => {
      if (p.id === selectedProfileId) {
        const updatedDeposits = existingDeposits.filter(d => d.id !== depId);
        const totalInitialQty = updatedDeposits.reduce((sum, d) => sum + d.quantity, 0);
        const distinctGrainTypes = Array.from(new Set(updatedDeposits.map(d => d.grainType)));

        return {
          ...p,
          initialQuantity: totalInitialQty,
          grainTypes: distinctGrainTypes,
          deposits: updatedDeposits
        };
      }
      return p;
    }));
  };

  // Find currently active profile inside Module 2
  const activeProfile = useMemo(() => {
    return profiles.find(p => p.id === selectedProfileId) || null;
  }, [profiles, selectedProfileId]);

  // Set default buy grain type selection if showBuyGrainForm opens
  useEffect(() => {
    if (activeProfile && activeProfile.grainTypes.length > 0) {
      setBuyGrainType(activeProfile.grainTypes[0]);
    } else {
      setBuyGrainType('ስንዴ / Wheat');
    }
  }, [activeProfile, showBuyGrainForm]);

  return (
    <div className="space-y-6" id="grain-stocks-dashboard">
      
      {/* 1. Header with custom localized Title & Language Switcher */}
      <div className="bg-[#111827] border border-[#1f2937]/90 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white font-sans flex items-center gap-2">
              {lang === 'am' ? 'የእህል ክምችትና መጋዘን አስተዳዳሪ' : 'Grain Stock & Storage Manager'}
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-mono uppercase font-extrabold">Active</span>
            </h2>
            <p className="text-xs text-slate-400 font-sans mt-0.5 max-w-xl">
              {lang === 'am' 
                ? 'የደንበኞች መዝገብ ማስገቢያ፣ የእህል ግዢ ግብይት ሰነዶች እና አጠቃላይ የክምችት ማጠቃለያዎችን በአማርኛ እና እንግሊዝኛ የሚቆጣጠር ሥርዓት'
                : 'Process data entry, archive profile registries, execute quintals multiplication, and audit locked transactions.'}
            </p>
          </div>
        </div>

        {/* Dynamic Dual Selector with glowing badges */}
        <div className="flex items-center gap-2 self-start md:self-center">
          <button
            onClick={() => setLang('am')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              lang === 'am' 
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/10 border border-emerald-500' 
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
            id="lang-selector-am"
          >
            <Globe className="w-3.5 h-3.5" />
            አማርኛ (Amharic)
          </button>
          <button
            onClick={() => setLang('en')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              lang === 'en' 
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/10 border border-emerald-500' 
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
            id="lang-selector-en"
          >
            <Globe className="w-3.5 h-3.5" />
            English
          </button>
        </div>
      </div>

      {/* Dynamic Summary Cards: Total Grains in Stock by Grain Type (Only displaying total count, nothing else) */}
      <div className="bg-[#111827] border border-[#1f2937]/90 rounded-2xl p-5 shadow-lg space-y-4" id="total-grains-in-stock-panel">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-sans flex items-center gap-1.5" id="total-grains-heading">
              <span>🌾</span> {lang === 'en' ? 'Total Grains in Stock' : 'በመጋዘን ውስጥ ያለ ጠቅላላ እህል በዓይነት'}
            </h3>
            <p className="text-[10px] text-slate-450 font-sans mt-0.5">
              {lang === 'en' ? 'Net volume of grains currently stored in the physical warehouse' : 'በአሁኑ ጊዜ በአካላዊ መጋዘን ውስጥ የተከማቸ የተጣራ የእህል መጠን ጠቅላላ ድምር'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3" id="grains-stock-values-grid">
          {sixGrainsList.map((grain) => (
            <div 
              key={grain.id}
              className="bg-[#0e1321] border border-[#1f2937] hover:border-emerald-500/20 rounded-xl p-3 flex flex-col items-center justify-center text-center transition-all group"
              id={`total-grain-card-${grain.id}`}
            >
              <span className="text-xl mb-1 transition-transform group-hover:scale-110" id={`grain-icon-${grain.id}`}>
                {grain.icon}
              </span>
              <span className="text-[11px] font-bold text-slate-400 truncate max-w-full" id={`grain-name-${grain.id}`}>
                {grain.displayName}
              </span>
              <span className="text-base font-black font-mono text-emerald-400 mt-1" id={`grain-qty-${grain.id}`}>
                {grain.quantity.toLocaleString()} <span className="text-[9px] font-sans font-bold text-slate-550">{lang === 'en' ? 'qt' : 'ኩንታል'}</span>
              </span>
            </div>
          ))}
          {sixGrainsList.length === 0 && (
            <div className="col-span-full py-6 text-center text-xs text-slate-500 font-sans" id="no-grains-stock-placeholder">
              {lang === 'en' ? 'No stock records found.' : 'ምንም የክምችት መረጃ አልተገኘም።'}
            </div>
          )}
        </div>
      </div>

      {/* 2. Top-level MODULE tabs to process exact specifications */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3" id="modules-selection-bar">
        
        {/* Module 1 Tab */}
        <button
          onClick={() => setActiveSubTab('module1')}
          className={`p-4 rounded-xl border transition-all text-left group relative overflow-hidden flex flex-col justify-between ${
            activeSubTab === 'module1'
              ? 'bg-gradient-to-br from-indigo-950/40 to-slate-900 border-indigo-500 shadow-md text-white'
              : 'bg-[#111827] border-[#1f2937] text-slate-400 hover:bg-[#161d2d]/30 hover:border-slate-700'
          }`}
          id="module-1-tab-btn"
        >
          <div className="flex justify-between items-start w-full">
            <span className="text-[10px] uppercase tracking-wider bg-indigo-500/10 text-indigo-400 font-extrabold px-2 py-0.5 rounded font-mono">
              Module 1 / ሞጁል 1
            </span>
            <FileCheck2 className={`w-4 h-4 transition-transform group-hover:scale-110 ${activeSubTab === 'module1' ? 'text-indigo-400' : 'text-slate-500'}`} />
          </div>
          <div className="mt-4">
            <h3 className="text-[13px] font-black tracking-tight text-slate-100 uppercase">
              {lang === 'am' ? 'አዲስ መረጃ ማስገቢያ' : 'ADD NEW DATA'}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1 leading-snug">
              {lang === 'am' ? 'የደንበኛ መረጃ፣ ቀን፣ የእህል አይነት እና ማስታወሻ ምዝገባ' : 'Record client names, date mappings, crop variety, and general logistics notes.'}
            </p>
          </div>
        </button>

        {/* Module 2 Tab */}
        <button
          onClick={() => {
            setActiveSubTab('module2');
            if (profiles.length > 0 && !selectedProfileId) {
              setSelectedProfileId(profiles[0].id);
            }
          }}
          className={`p-4 rounded-xl border transition-all text-left group relative overflow-hidden flex flex-col justify-between ${
            activeSubTab === 'module2'
              ? 'bg-gradient-to-br from-emerald-950/40 to-slate-900 border-emerald-500 shadow-md text-white'
              : 'bg-[#111827] border-[#1f2937] text-slate-400 hover:bg-[#161d2d]/30 hover:border-slate-700'
          }`}
          id="module-2-tab-btn"
        >
          <div className="flex justify-between items-start w-full">
            <span className="text-[10px] uppercase tracking-wider bg-emerald-500/10 text-emerald-400 font-extrabold px-2 py-0.5 rounded font-mono">
              Module 2 / ሞጁል 2
            </span>
            <Users className={`w-4 h-4 transition-transform group-hover:scale-110 ${activeSubTab === 'module2' ? 'text-emerald-400' : 'text-slate-500'}`} />
          </div>
          <div className="mt-4">
            <h3 className="text-[13px] font-black tracking-tight text-slate-100 uppercase">
              {lang === 'am' ? 'የተሞላ መረጃ መመልከቻ' : 'VIEW PROFILE LOGS'}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1 leading-snug">
              {lang === 'am' ? 'የደንበኞች ድርጊቶች፣ የእህል አይነት መጨመሪያ እና የግዢ መቆጣጠሪያ' : 'Manage alphabetical client listings, add crops, delete, or record Buy calculations.'}
            </p>
          </div>
        </button>

        {/* Module 3 Tab */}
        <button
          onClick={() => setActiveSubTab('module3')}
          className={`p-4 rounded-xl border transition-all text-left group relative overflow-hidden flex flex-col justify-between ${
            activeSubTab === 'module3'
              ? 'bg-gradient-to-br from-teal-950/40 to-slate-900 border-teal-500 shadow-md text-white'
              : 'bg-[#111827] border-[#1f2937] text-slate-400 hover:bg-[#161d2d]/30 hover:border-slate-700'
          }`}
          id="module-3-tab-btn"
        >
          <div className="flex justify-between items-start w-full">
            <span className="text-[10px] uppercase tracking-wider bg-teal-500/10 text-teal-400 font-extrabold px-2 py-0.5 rounded font-mono">
              Module 3 / ሞጁል 3
            </span>
            <Layers className={`w-4 h-4 transition-transform group-hover:scale-110 ${activeSubTab === 'module3' ? 'text-teal-400' : 'text-slate-500'}`} />
          </div>
          <div className="mt-4">
            <h3 className="text-[13px] font-black tracking-tight text-slate-100 uppercase">
              {lang === 'am' ? 'አጠቃላይ ማጠቃለያ ዳሽቦርድ' : 'GLOBAL TOTALS DASHBOARD'}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1 leading-snug">
              {lang === 'am' ? 'አጠቃላይ የእህል ክምችት ድምር እና ድንገተኛ መመልከቻ' : 'Dynamic directories, sum totals per crop, physical stock weight balance boards.'}
            </p>
          </div>
        </button>

      </div>

      {/* 3. Render content matching active Module chosen above */}
      <div className="transition-all duration-300">
        
        {/* ==================== MODULE 1 RENDERING ==================== */}
        {activeSubTab === 'module1' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="module-1-grid-view">
            
            {/* Direct Intake processing form */}
            <div className="lg:col-span-6">
              <div className="bg-[#111827] border border-[#1f2937] rounded-2xl p-6 shadow-xl space-y-5">
                <div className="flex items-center gap-2.5 border-b border-[#1f2937] pb-4">
                  <FileCheck2 className="w-5 h-5 text-indigo-400" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-100 font-sans uppercase">
                      {lang === 'am' ? 'አዲስ መረጃ ማስገቢያ' : 'Register New Data Record'}
                    </h3>
                    <p className="text-[11px] text-slate-400 font-sans mt-0.5">
                      {lang === 'am' ? 'የደንበኛውን የእህል መረጃዎችን በሲስተሙ ውስጥ ያከማቹ' : 'Map customer profile into live state immediately.'}
                    </p>
                  </div>
                </div>

                <form onSubmit={handleModule1Submit} className="space-y-4 text-xs font-sans">
                  
                  {/* Name field */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-300" htmlFor="m1-customer-name">
                      {lang === 'am' ? 'የደንበኛ ስም (Customer Name) *' : 'Customer Name *'}
                    </label>
                    <input
                      id="m1-customer-name"
                      type="text"
                      required
                      placeholder={lang === 'am' ? 'ምሳሌ፡ አበበ በቀለ' : 'e.g. Abebe Bekele'}
                      value={m1Name}
                      onChange={(e) => setM1Name(e.target.value)}
                      className="w-full bg-[#0a0d16] text-white border border-[#1f2937] rounded-xl p-3 focus:outline-hidden focus:border-indigo-500 font-sans text-xs placeholder-slate-650"
                    />
                  </div>

                  {/* Date, Grain type, and Quantity split */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-300" htmlFor="m1-date-picker">
                        {lang === 'am' ? 'ቀን (Date) *' : 'Date *'}
                      </label>
                      <input
                        id="m1-date-picker"
                        type="date"
                        required
                        value={m1Date}
                        onChange={(e) => setM1Date(e.target.value)}
                        className="w-full bg-[#0a0d16] text-white border border-[#1f2937] rounded-xl p-3 focus:outline-hidden focus:border-indigo-500 font-mono text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-300" htmlFor="m1-grain-selector">
                        {lang === 'am' ? 'የእህል አይነት (Grain Type) *' : 'Grain Type *'}
                      </label>
                      <select
                        id="m1-grain-selector"
                        value={m1GrainType}
                        onChange={(e) => setM1GrainType(e.target.value)}
                        className="w-full bg-[#0a0d16] text-white border border-[#1f2937] rounded-xl p-3 focus:outline-hidden focus:border-indigo-500 font-sans text-xs"
                      >
                        {grainSelectionSuggestions.map(g => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-300" htmlFor="m1-grain-quantity">
                        {lang === 'am' ? 'የእህል መጠን ኩንታል (Quantity in Quintals)' : 'Quantity of Grain (Quintals)'}
                      </label>
                      <input
                        id="m1-grain-quantity"
                        type="number"
                        step="any"
                        min="0"
                        placeholder={lang === 'am' ? 'ምሳሌ፡ 100' : 'e.g. 100'}
                        value={m1Quantity}
                        onChange={(e) => setM1Quantity(e.target.value)}
                        className="w-full bg-[#0a0d16] text-white border border-[#1f2937] rounded-xl p-3 focus:outline-hidden focus:border-indigo-500 font-sans text-xs"
                      />
                    </div>

                  </div>

                  {/* Note block */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-300" htmlFor="m1-note-box">
                      {lang === 'am' ? 'ማስታወሻ (Note)' : 'Note / Location Logistics'}
                    </label>
                    <textarea
                      id="m1-note-box"
                      rows={3}
                      placeholder={lang === 'am' ? 'ምሳሌ፡ በመጋዘን ቁጥር 2 ገብቷል።' : 'Identify specific silo vaults or transportation IDs.'}
                      value={m1Note}
                      onChange={(e) => setM1Note(e.target.value)}
                      className="w-full bg-[#0a0d16] text-white border border-[#1f2937] rounded-xl p-3 focus:outline-hidden focus:border-indigo-500 font-sans text-xs resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer text-xs uppercase tracking-wider font-sans"
                  >
                    <Plus className="w-4 h-4" />
                    {lang === 'am' ? 'አዲስ መዝገብ አስገባ' : 'Register Intake'}
                  </button>

                </form>
              </div>
            </div>

            {/* Structured output display for Few-Shot confirmations */}
            <div className="lg:col-span-6 space-y-4">
              <div className="bg-[#111827] border border-[#1f2937] rounded-2xl p-6 shadow-xl flex flex-col justify-between min-h-[300px]">
                <div className="space-y-4">
                  <span className="text-[10px] uppercase font-bold text-slate-500 font-mono tracking-widest block">
                    {lang === 'am' ? 'የሲስተሙ ተግባራዊ ምላሽ መቆጣጠሪያ' : 'LIVE SYSTEM LOGGING PANEL'}
                  </span>
                  
                  {lastRecordedData ? (
                    <div className="space-y-4 animate-fade-in" id="m1-success-badge-panel">
                      <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 shrink-0" />
                        <div>
                          <p className="text-xs font-black uppercase tracking-wide">
                            {lang === 'am' ? '✅ መረጃው በተሳካ ሁኔታ ተመዝግቧል' : '✅ DATA RECORDED SUCCESSFULLY'}
                          </p>
                          <p className="text-[10px] text-slate-400 font-medium">Verified state update mapped to browser storage.</p>
                        </div>
                      </div>

                      {/* Literal replica matching few shot output box layout */}
                      <div className="bg-black/40 border border-slate-800 rounded-xl p-5 text-xs font-mono space-y-2 text-slate-350 select-text">
                        <p className="text-[#94a3b8] font-bold border-b border-slate-850 pb-2 flex justify-between">
                          <span>SYSTEM INTENT CONFIRMATION:</span>
                          <span className="text-emerald-500">PRO v3</span>
                        </p>
                        <p className="pt-2"><span className="text-indigo-400">👤 Customer Name (የደንበኛ ስም):</span> <span className="text-white font-bold">{lastRecordedData.customerName}</span></p>
                        <p><span className="text-indigo-400">📅 Date (ቀን):</span> <span className="text-white">{lastRecordedData.date}</span></p>
                        <p><span className="text-indigo-400">🌾 Grain Type (የእህል አይነት):</span> <span className="text-white font-bold">{lastRecordedData.grainType}</span></p>
                        <p><span className="text-indigo-400">📦 Quantity (የእህል መጠን):</span> <span className="text-white font-bold">{lastRecordedData.quantity} {lang === 'am' ? 'ኩንታል' : 'Quintals'}</span></p>
                        <p className="pb-2"><span className="text-indigo-400">📝 Note (ማስታወሻ):</span> <span className="text-slate-200 italic">"{lastRecordedData.note}"</span></p>
                        <div className="border-t border-slate-850 pt-2 text-[10px] text-slate-500 flex justify-between font-sans">
                          <span>[System Status: Active]</span>
                          <span className="text-indigo-450">[Record saved to memory]</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="border border-dashed border-[#1f2937]/80 rounded-2xl py-14 text-center">
                      <HelpCircle className="w-10 h-10 text-indigo-400/20 mx-auto mb-3" />
                      <h4 className="text-xs font-bold text-slate-300 uppercase">
                        {lang === 'am' ? 'መረጃ ማስገቢያ እየተጠባበቀ ነው' : 'Awaiting Entry'}
                      </h4>
                      <p className="text-xs text-slate-500 max-w-xs mx-auto mt-2 font-sans leading-relaxed">
                        {lang === 'am' 
                          ? 'የደንበኛ መረጃዎችን በግራ በኩል ባለው ማስገቢያ ላይ ያስገቡ። በክፍል 1 የተገለፀው የተሳካ ምላሽ ሰሌዳ እዚህ ላይ ይታያል።'
                          : 'Fill out the form on the left. The highly structured, customized validation block will stream into this terminal box instantly.'}
                      </p>
                    </div>
                  )}
                </div>

                <div className="bg-slate-900/40 p-3 rounded-lg border border-[#1f2937] mt-8 text-[10.5px] text-slate-500 flex items-center gap-2">
                  <Info className="w-4 h-4 text-slate-400 shrink-0" />
                  <p className="font-sans">
                    {lang === 'am'
                      ? 'ማስታወሻ፡ እዚህ የገቡት ደንበኞች በፊደል ቅደም ተከተል ተደርድረው በሞጁል 2 እና 3 የመገለጫ ዝርዝሮች ውስጥ ይካተታሉ።'
                      : 'Records created in Module 1 automatically auto-populate directory listings in both Module 2 and 3 dynamically.'}
                  </p>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ==================== MODULE 2 RENDERING ==================== */}
        {activeSubTab === 'module2' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="module-2-split-layout">
            
            {/* Left Hand: Strict Alphabetical Master Directory Panel */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-[#111827] border border-[#1f2937] rounded-2xl p-4 shadow-xl space-y-3.5">
                <div className="flex justify-between items-center border-b border-[#1f2937] pb-3">
                  <h3 className="text-xs font-bold uppercase text-white tracking-wider flex items-center gap-1.5 font-sans">
                    <Users className="w-4 h-4 text-emerald-400" />
                    {lang === 'am' ? 'የደንበኞች መዝገብ (በፊደል)' : 'Customer Directory'}
                  </h3>
                  <span className="text-[10px] bg-slate-900 px-2 py-0.5 rounded font-mono font-bold text-slate-450">
                    {profiles.length} total
                  </span>
                </div>

                {/* Directory list rendered strictly in alphabetical order */}
                <div className="space-y-1.5 max-h-[440px] overflow-y-auto pr-1">
                  {sortedProfiles.map(p => {
                    const isActive = p.id === selectedProfileId;
                    return (
                      <button
                        key={p.id}
                        onClick={() => {
                          setSelectedProfileId(p.id);
                          setShowAddGrainForm(false);
                          setShowEditProfileForm(false);
                          setShowBuyGrainForm(false);
                          setEditingBuyId(null);
                        }}
                        className={`w-full text-left p-3 rounded-xl transition-all text-xs font-sans flex items-center justify-between cursor-pointer ${
                          isActive 
                            ? 'bg-gradient-to-r from-emerald-950/40 to-slate-900 border border-emerald-500/80 text-white font-bold shadow-xs' 
                            : 'bg-slate-950/50 border border-transparent text-slate-400 hover:text-white hover:bg-slate-900'
                        }`}
                        id={`profile-item-btn-${p.id}`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-700'}`}></div>
                          <span className="truncate max-w-[170px]">{p.customerName}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9.5px] font-mono text-slate-500 bg-black/30 px-1.5 py-0.5 rounded">
                            {p.buyTransactions.length} buy
                          </span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                        </div>
                      </button>
                    );
                  })}

                  {sortedProfiles.length === 0 && (
                    <div className="text-center py-10 text-slate-550 border border-dashed border-slate-800 rounded-xl font-sans text-xs">
                      No directory profiles loaded. Use Module 1 to register.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Hand Detailed Profile controls, triggers & Buying transaction blocks */}
            <div className="lg:col-span-8">
              {activeProfile ? (
                <div className="space-y-5" id="active-profile-details">
                  
                  {/* Master View block under Module 2 specifications */}
                  <div className="bg-[#111827] border border-[#1f2937] rounded-3xl p-6 shadow-xl space-y-6">
                    
                    {/* Header information display */}
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-[#1f2937] pb-5">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-emerald-400">
                          <Users className="w-5 h-5" />
                          <span className="text-[10px] font-extrabold uppercase tracking-widest font-mono">
                            {lang === 'am' ? 'የተመረጠው ደንበኛ መገለጫ' : 'Active Client Profile'}
                          </span>
                        </div>
                        <h2 className="text-xl font-extrabold text-white font-sans">{activeProfile.customerName}</h2>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-1">
                          <span className="font-mono">📅 {lang === 'am' ? 'ቀን' : 'Registered Date'}: {activeProfile.date}</span>
                          <span>•</span>
                          <span className="italic">📝 {activeProfile.note || (lang === 'am' ? 'ማስታወሻ አልተመዘገበም' : 'No general notes logged.')}</span>
                        </div>
                      </div>

                      {/* Display registered crops tags */}
                      <div className="flex flex-wrap gap-1.5 self-start">
                        {activeProfile.grainTypes.map(tag => (
                          <span key={tag} className="px-2.5 py-1 text-[10px] font-bold bg-[#151c2a] border border-[#1f2937] text-slate-300 rounded-lg">
                            🌾 {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Highly Custom: Warehouse Storage & Trade Ledger of Farmer Consignments */}
                    {(() => {
                      const clientPurchasedQty = activeProfile.buyTransactions.reduce((acc, b) => acc + b.quantity, 0);
                      const initialQtyVal = activeProfile.initialQuantity || 0;
                      const clientRemainingQty = Math.max(0, initialQtyVal - clientPurchasedQty);

                      return (
                        <div className="bg-[#151d2f]/40 border border-[#1f2937] rounded-2xl p-5 space-y-4 shadow-sm" id="client-consignment-ledger">
                          <div className="flex justify-between items-center border-b border-[#1f2937]/50 pb-2">
                            <span className="text-[11px] font-bold text-slate-350 flex items-center gap-1.5 uppercase tracking-wide">
                              📦 {lang === 'am' ? 'የእህል ክምችትና ሽያጭ መቆጣጠሪያ' : 'Warehouse Storage Ledger'}
                            </span>
                            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                              {lang === 'am' ? 'መጋዘን ውስጥ ያለ' : 'Consignment Active'}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-sans">
                            
                            <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-900 flex flex-col justify-between">
                              <span className="text-slate-400 text-[10.5px] font-medium">{lang === 'am' ? '1. በአጠቃላይ የገባው ቀዳሚ ክምችት' : '1. Total Farmer Stored Grain'}</span>
                              <div className="mt-1.5 flex items-baseline gap-1">
                                <span className="text-base font-extrabold text-white">{initialQtyVal.toLocaleString()}</span>
                                <span className="text-[10px] text-slate-500">{lang === 'am' ? 'ኩንታል' : 'Quintals'}</span>
                              </div>
                              <span className="text-[9px] text-slate-500 mt-1">{lang === 'am' ? 'በደንበኛ ምዝገባ የተመዘገበ' : 'Recorded at profile registration'}</span>
                            </div>

                            <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-900 flex flex-col justify-between">
                              <span className="text-slate-400 text-[10.5px] font-medium text-indigo-400">{lang === 'am' ? '2. በነጋዴው የተገዛ (ባለቤትነቱ የዞረ)' : '2. Total Purchased by Merchant'}</span>
                              <div className="mt-1.5 flex items-baseline gap-1">
                                <span className="text-base font-extrabold text-indigo-400">{clientPurchasedQty.toLocaleString()}</span>
                                <span className="text-[10px] text-indigo-500">{lang === 'am' ? 'ኩንታል' : 'Quintals'}</span>
                              </div>
                              <span className="text-[9px] text-indigo-400 mt-1">{lang === 'am' ? 'በግዢ ታሪክ የተመዘገበ ድምር' : 'Aggregated from commercial logs'}</span>
                            </div>

                            <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-900 flex flex-col justify-between relative overflow-hidden ring-1 ring-emerald-500/20">
                              <span className="text-slate-400 text-[10.5px] font-bold text-emerald-450">{lang === 'am' ? '3. ቀሪ ያልተሸጠ ክምችት (ለመሸጥ የተከማቸ)' : '3. Outstanding Farmer Stock'}</span>
                              <div className="mt-1.5 flex items-baseline gap-1">
                                <span className="text-base font-extrabold text-emerald-400">{clientRemainingQty.toLocaleString()}</span>
                                <span className="text-[10px] text-emerald-500">{lang === 'am' ? 'ኩንታል' : 'Quintals'}</span>
                              </div>
                              <span className="text-[9.5px] font-bold text-emerald-500 mt-1 bg-emerald-500/5 px-1.5 py-0.5 rounded self-start">{lang === 'am' ? 'ባለቤትነቱ የገበሬው' : 'Still Owned by Farmer'}</span>
                            </div>

                          </div>

                        </div>
                      );
                    })()}

                    {/* FARMER STOCK RECORDS GROUPED BY GRAIN TYPE */}
                    <div className="bg-[#151d2f]/20 border border-[#1f2937] rounded-3xl p-6 space-y-5" id="farmer-grain-grouped-stocks">
                      <div className="border-b border-[#1f2937]/50 pb-3 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">🌾</span>
                          <div>
                            <h3 className="text-xs font-black uppercase tracking-wider text-slate-100 font-sans">
                              {lang === 'am' ? 'የገበሬው የእህል ክምችት ዝርዝር (በእህል አይነት)' : 'Farmer Deposit Registry (By Grain Type)'}
                            </h3>
                            <p className="text-[10px] text-slate-400">
                              {lang === 'am' ? 'እያንዳንዱ የእህል አይነት ያስመዘገበው ቀን፣ መጠን እና ማስታወሻ' : 'Individual deposit dates, quantities, and logs grouped for each crop'}
                            </p>
                          </div>
                        </div>
                        <span className="text-[10.5px] bg-[#1a2333] text-indigo-400 px-3 py-1 border border-indigo-500/10 rounded-lg font-bold self-start sm:self-center">
                          {activeProfile.grainTypes.length} {lang === 'am' ? 'የእህል ዓይነቶች' : 'grain types'}
                        </span>
                      </div>

                      <div className="overflow-x-auto rounded-3xl border border-[#1f2937] bg-slate-950/40 shadow-xl">
                        <table className="w-full text-left border-collapse text-xs font-sans">
                          <thead>
                            <tr className="bg-slate-900 border-b border-[#1f2937] text-slate-400 font-mono text-[10.5px] uppercase">
                              <th className="p-4 font-extrabold">{lang === 'am' ? 'የእህል አይነት' : 'Grain Type'}</th>
                              <th className="p-4 font-extrabold">{lang === 'am' ? 'ቀን' : 'Date'}</th>
                              <th className="p-4 font-extrabold">{lang === 'am' ? 'መጠን (ኩንታል)' : 'Quantity (Quintals)'}</th>
                              <th className="p-4 font-extrabold">{lang === 'am' ? 'ቀሪ መጠን' : 'Outstanding (Unsold)'}</th>
                              <th className="p-4 font-extrabold">{lang === 'am' ? 'ማስታወሻ / ሎጂስቲክስ' : 'Notes / Logistics'}</th>
                              <th className="p-4 font-extrabold text-right">{lang === 'am' ? 'እርምጃዎች' : 'Actions'}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#1f2937]/50">
                            {(() => {
                              const allDeps = (activeProfile.deposits || [
                                {
                                  id: `dep-${activeProfile.id}`,
                                  grainType: activeProfile.grainTypes[0] || 'Waliya / ዋሊያ',
                                  quantity: activeProfile.initialQuantity || 0,
                                  date: activeProfile.date,
                                  note: activeProfile.note
                                }
                              ]);

                              return allDeps.map(dep => {
                                const isEditing = editingDepositId === dep.id;
                                
                                // Calculate total deposited and bought to show remaining outstanding for this type
                                const totalDepForType = allDeps
                                  .filter(d => d.grainType === dep.grainType)
                                  .reduce((sum, d) => sum + d.quantity, 0);
                                const totalBoughtForType = activeProfile.buyTransactions
                                  .filter(t => t.grainType === dep.grainType)
                                  .reduce((sum, t) => sum + t.quantity, 0);
                                const remainingForType = Math.max(0, totalDepForType - totalBoughtForType);

                                if (isEditing) {
                                  return (
                                    <tr key={dep.id} className="bg-slate-900/85 text-white">
                                      <td className="p-3">
                                        <select
                                          value={editDepositGrainType}
                                          onChange={(e) => setEditDepositGrainType(e.target.value)}
                                          className="w-full bg-[#0a0d16] border border-[#1f2937] text-white p-2 rounded-lg text-xs font-sans"
                                        >
                                          {grainSelectionSuggestions.map(g => (
                                            <option key={g} value={g}>{g}</option>
                                          ))}
                                        </select>
                                      </td>
                                      <td className="p-3">
                                        <input
                                          type="date"
                                          required
                                          value={editDepositDate}
                                          onChange={(e) => setEditDepositDate(e.target.value)}
                                          className="w-full bg-[#0a0d16] border border-[#1f2937] text-white p-2 rounded-lg text-xs font-mono"
                                        />
                                      </td>
                                      <td className="p-3">
                                        <input
                                          type="number"
                                          required
                                          step="any"
                                          min="0"
                                          value={editDepositQuantity}
                                          onChange={(e) => setEditDepositQuantity(e.target.value)}
                                          className="w-full bg-[#0a0d16] border border-[#1f2937] text-white p-2 rounded-lg text-xs font-mono"
                                        />
                                      </td>
                                      <td className="p-3 text-slate-500 font-mono">—</td>
                                      <td className="p-3">
                                        <input
                                          type="text"
                                          value={editDepositNote}
                                          onChange={(e) => setEditDepositNote(e.target.value)}
                                          className="w-full bg-[#0a0d16] border border-[#1f2937] text-white p-2 rounded-lg text-xs font-sans"
                                          placeholder="Silo assignment or remarks..."
                                        />
                                      </td>
                                      <td className="p-3 text-right">
                                        <div className="flex justify-end gap-1.5 font-sans">
                                          <button
                                            type="button"
                                            onClick={() => setEditingDepositId(null)}
                                            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10.5px] font-bold"
                                          >
                                            {lang === 'am' ? 'ሰርዝ' : 'Cancel'}
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const mockEvent = { preventDefault: () => {} } as React.FormEvent;
                                              handleSaveDepositEdit(mockEvent);
                                            }}
                                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[10.5px] font-bold flex items-center gap-1"
                                          >
                                            💾 {lang === 'am' ? 'አስቀምጥ' : 'Save'}
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                }

                                return (
                                  <tr key={dep.id} className="hover:bg-slate-900/30 transition-all font-mono text-slate-350 text-xs">
                                    <td className="p-4 font-sans font-bold text-slate-100">{dep.grainType}</td>
                                    <td className="p-4 text-slate-450">📅 {dep.date}</td>
                                    <td className="p-4">
                                      <span className="bg-[#111827] px-2 py-0.5 rounded border border-slate-800 text-slate-200 font-bold">
                                        {dep.quantity.toLocaleString()} {lang === 'am' ? 'ኩንታል' : 'Quintals'}
                                      </span>
                                    </td>
                                    <td className="p-4 font-sans">
                                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                                        remainingForType > 0 
                                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                          : 'bg-slate-900 text-slate-500 border-transparent'
                                      }`}>
                                        {remainingForType.toLocaleString()} kn
                                      </span>
                                    </td>
                                    <td className="p-4 italic text-slate-450 font-sans">
                                      "{dep.note || (lang === 'am' ? 'ማስታወሻ የለም' : 'No notes written')}"
                                    </td>
                                    <td className="p-4 text-right font-sans">
                                      <div className="flex justify-end gap-1 font-sans">
                                        <button 
                                          type="button"
                                          onClick={() => startEditingDeposit(dep)}
                                          className="p-1.5 text-slate-400 hover:text-indigo-400 rounded hover:bg-slate-800 transition-all cursor-pointer"
                                          title={lang === 'am' ? 'ክምችት አስተካክል' : 'Edit deposit'}
                                        >
                                          <Edit2 className="w-3.5 h-3.5" />
                                        </button>
                                        <button 
                                          type="button"
                                          onClick={() => handleDeleteDeposit(dep.id)}
                                          className="p-1.5 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800 transition-all cursor-pointer"
                                          title={lang === 'am' ? 'ክምችት ሰርዝ' : 'Delete deposit'}
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              });
                            })()}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Operational Action triggers a, b, c, d */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5" id="profile-controls-panel">
                      
                      {/* Action A: Add New Deposit */}
                      <button
                        onClick={() => {
                          setShowAddGrainForm(prev => !prev);
                          setShowEditProfileForm(false);
                          setShowBuyGrainForm(false);
                        }}
                        className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                          showAddGrainForm 
                            ? 'bg-indigo-600 border-indigo-500 text-white' 
                            : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-200'
                        }`}
                        id="action-btn-add-grain"
                      >
                        <Plus className="w-4 h-4 shrink-0" />
                        {lang === 'am' ? '➕ እህል ክምችት ጨምር' : '[➕ Add New Deposit]'}
                      </button>

                      {/* Action B: Edit Profile Data */}
                      <button
                        onClick={() => {
                          startEditProfile();
                          setShowAddGrainForm(false);
                          setShowBuyGrainForm(false);
                        }}
                        className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                          showEditProfileForm 
                            ? 'bg-amber-600 border-amber-500 text-white font-black' 
                            : 'bg-slate-900 border-[#1f2937] hover:border-slate-700 text-slate-200'
                        }`}
                        id="action-btn-edit-profile"
                      >
                        <Edit2 className="w-3.5 h-3.5 shrink-0" />
                        {lang === 'am' ? '✏️ መረጃ አሻሽል' : '[✏️ Edit Data]'}
                      </button>

                      {/* Action C: Destructive Delete Trigger with inline safety warning */}
                      {profileDeleteConfirmId === activeProfile.id ? (
                        <div className="flex items-center gap-1 col-span-1">
                          <button
                            onClick={() => handleConfirmDeleteProfile(activeProfile.id)}
                            className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-bold py-2.5 px-2 text-[10px] rounded-lg transition-all cursor-pointer whitespace-nowrap"
                          >
                            {lang === 'am' ? 'አዎ አጥፋ!' : 'Confirm'}
                          </button>
                          <button
                            onClick={() => setProfileDeleteConfirmId(null)}
                            className="bg-slate-800 hover:bg-slate-705 text-slate-350 font-bold py-2.5 px-3 text-[10.5px] rounded-lg cursor-pointer"
                          >
                            X
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setProfileDeleteConfirmId(activeProfile.id)}
                          className="px-3 py-2.5 rounded-xl text-xs font-bold bg-[#1a0f12] border border-red-950 hover:bg-red-900/40 text-rose-400 hover:text-rose-350 transition-all flex items-center justify-center gap-2 cursor-pointer"
                          id="action-btn-delete-profile"
                        >
                          <Trash2 className="w-4 h-4 shrink-0" />
                          {lang === 'am' ? '🗑️ ደንበኛ ሰርዝ' : '[🗑️ Delete Data]'}
                        </button>
                      )}

                      {/* Action D: Buy Grain (እህል መግዛት) */}
                      <button
                        onClick={() => {
                          setShowBuyGrainForm(prev => !prev);
                          setShowAddGrainForm(false);
                          setShowEditProfileForm(false);
                        }}
                        className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                          showBuyGrainForm 
                            ? 'bg-emerald-600 border-emerald-500 text-white' 
                            : 'bg-slate-900 border-slate-800 hover:border-emerald-950 text-emerald-450 hover:text-emerald-405'
                        }`}
                        id="action-btn-buy-grain"
                      >
                        <ShoppingBag className="w-4 h-4 shrink-0" />
                        {lang === 'am' ? '🛒 እህል ግዛ (Buy Grain)' : 'Buy Grain (እህል መግዛት)'}
                      </button>

                    </div>

                    {/* INTERACTIVE FORM EXPANDER A: Add New Grain Storage Deposit under profile */}
                    {showAddGrainForm && (
                      <form onSubmit={handleAddNewGrain} className="bg-slate-900/60 p-5 border border-indigo-500/20 rounded-xl space-y-4 animate-fade-in font-sans text-xs" id="m2-new-grain-deposit-form">
                        <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                          <div className="flex items-center gap-1.5 text-indigo-400 font-bold uppercase">
                            <Tag className="w-4 h-4" />
                            <span>
                              {lang === 'am' ? 'አዲስ የእህል ክምችት ያክሉ (Add New Storage Deposit)' : 'Add New Storage Deposit'}
                            </span>
                          </div>
                          <button type="button" onClick={() => setShowAddGrainForm(false)} className="text-[10px] text-slate-500 hover:text-slate-350">Close</button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Grain Type Selection */}
                          <div className="space-y-1.5">
                            <label className="block text-slate-300 font-bold" htmlFor="new-dep-grain-select">
                              {lang === 'am' ? 'የእህል አይነት (Grain Type) *' : 'Grain Type *'}
                            </label>
                            <select
                              id="new-dep-grain-select"
                              value={newGrainTypeSelected}
                              onChange={(e) => setNewGrainTypeSelected(e.target.value)}
                              className="w-full bg-[#0a0d16] border border-[#1f2937] text-slate-200 p-2.5 rounded-lg font-sans"
                            >
                              {grainSelectionSuggestions.map(g => (
                                <option key={g} value={g}>{g}</option>
                              ))}
                            </select>
                          </div>

                          {/* Date selection */}
                          <div className="space-y-1.5">
                            <label className="block text-slate-300 font-bold" htmlFor="new-dep-date-input">
                              {lang === 'am' ? 'የክምችት ቀን (Date) *' : 'Date *'}
                            </label>
                            <input
                              id="new-dep-date-input"
                              type="date"
                              required
                              value={newGrainDate}
                              onChange={(e) => setNewGrainDate(e.target.value)}
                              className="w-full bg-[#0a0d16] border border-[#1f2937] text-white p-2 rounded-lg font-mono text-xs"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Quantity selection */}
                          <div className="space-y-1.5">
                            <label className="block text-slate-300 font-bold" htmlFor="new-dep-qty-input">
                              {lang === 'am' ? 'የእህል መጠን በኩንታል (Quantity in Quintals) *' : 'Quantity (Quintals) *'}
                            </label>
                            <input
                              id="new-dep-qty-input"
                              type="number"
                              required
                              step="any"
                              min="0.1"
                              placeholder="e.g. 100"
                              value={newGrainQty}
                              onChange={(e) => setNewGrainQty(e.target.value)}
                              className="w-full bg-[#0a0d16] border border-[#1f2937] text-white p-2.5 rounded-lg font-mono text-xs"
                            />
                          </div>

                          {/* Notes/Logistics */}
                          <div className="space-y-1.5">
                            <label className="block text-slate-300 font-bold" htmlFor="new-dep-note-input">
                              {lang === 'am' ? 'ክፍል ማስታወሻ (Storage Notes)' : 'Storage Notes / Logistics'}
                            </label>
                            <input
                              id="new-dep-note-input"
                              type="text"
                              placeholder="e.g. Silo No. 4, Upper Rack"
                              value={newGrainNote}
                              onChange={(e) => setNewGrainNote(e.target.value)}
                              className="w-full bg-[#0a0d16] border border-[#1f2937] text-slate-200 p-2.5 rounded-lg font-sans text-xs"
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer text-xs uppercase"
                        >
                          <Plus className="w-4 h-4" />
                          <span>
                            {lang === 'am' ? 'አዲስ ክምችት አስመዝግብ' : 'Register Deposit'}
                          </span>
                        </button>
                      </form>
                    )}

                    {/* INTERACTIVE FORM EXPANDER B: Edit Profile Data */}
                    {showEditProfileForm && (
                      <form onSubmit={handleSaveProfileEdit} className="bg-slate-900/50 p-4 border border-[#1f2937] rounded-xl space-y-3.5 animate-fade-in">
                        <div className="flex justify-between items-center text-xs font-bold text-slate-350">
                          <span>{lang === 'am' ? 'የደንበኛ መረጃ ማስተካከያ' : 'Edit Profile Specifications'}</span>
                          <button type="button" onClick={() => setShowEditProfileForm(false)} className="text-[10px] text-slate-500">X</button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-sans">
                          <div className="space-y-1">
                            <label className="text-slate-400 block" htmlFor="m2-edit-name">Name</label>
                            <input
                              id="m2-edit-name"
                              type="text"
                              required
                              value={editProfileName}
                              onChange={(e) => setEditProfileName(e.target.value)}
                              className="w-full bg-slate-950 border border-[#1f2937] text-white p-2 rounded-lg"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-slate-400 block" htmlFor="m2-edit-date">Date</label>
                            <input
                              id="m2-edit-date"
                              type="date"
                              required
                              value={editProfileDate}
                              onChange={(e) => setEditProfileDate(e.target.value)}
                              className="w-full bg-slate-950 border border-[#1f2937] text-white p-2 rounded-lg font-mono"
                            />
                          </div>
                        </div>
                        <div className="space-y-1 text-xs">
                          <label className="text-slate-400 block" htmlFor="m2-edit-note">Note</label>
                          <input
                            id="m2-edit-note"
                            type="text"
                            value={editProfileNote}
                            onChange={(e) => setEditProfileNote(e.target.value)}
                            className="w-full bg-slate-950 border border-[#1f2937] text-white p-2 rounded-lg font-sans text-xs"
                          />
                        </div>
                        <div className="flex gap-2 justify-end text-xs">
                          <button type="button" onClick={() => setShowEditProfileForm(false)} className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-md">Cancel</button>
                          <button type="submit" className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-md">Save Changes</button>
                        </div>
                      </form>
                    )}

                    {/* INTERACTIVE FORM EXPANDER D: Buy Grain (እህል መግዛት) */}
                    {showBuyGrainForm && (
                      <form onSubmit={handleAddBuyTransaction} className="bg-slate-900/60 p-5 border border-emerald-500/20 rounded-xl space-y-4 animate-fade-in font-sans text-xs">
                        <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                          <div className="flex items-center gap-1.5 text-emerald-400">
                            <ShoppingBag className="w-4 h-4" />
                            <h4 className="font-extrabold uppercase text-slate-200">
                              {lang === 'am' ? 'እህል መግዛት (Buy Grain)' : 'Buy Grain sub-module'}
                            </h4>
                          </div>
                          <button type="button" onClick={() => setShowBuyGrainForm(false)} className="text-[10px] text-slate-500 hover:text-slate-350">Cancel</button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          
                          {/* Grain Type Selection */}
                          <div className="space-y-1">
                            <label className="block text-slate-300 font-bold" htmlFor="buy-grain-select">
                              {lang === 'am' ? 'የእህል አይነት (Grain Type) *' : 'Grain Type *'}
                            </label>
                            <select
                              id="buy-grain-select"
                              value={buyGrainType}
                              onChange={(e) => setBuyGrainType(e.target.value)}
                              className="w-full bg-[#0a0d16] border border-[#1f2937] text-slate-200 p-2.5 rounded-lg"
                            >
                              {activeProfile.grainTypes.length > 0 ? (
                                activeProfile.grainTypes.map(g => (
                                  <option key={g} value={g}>{g}</option>
                                ))
                              ) : (
                                <option value={lang === 'am' ? 'ስንዴ (Wheat)' : 'ስንዴ (Wheat)'}>
                                  {lang === 'am' ? 'ስንዴ (Wheat) -- No registered' : 'Wheat (Not Registered)'}
                                </option>
                              )}
                            </select>
                          </div>

                          {/* Date selection for transaction */}
                          <div className="space-y-1">
                            <label className="block text-slate-300 font-bold" htmlFor="buy-date-input">
                              {lang === 'am' ? 'ቀን (Date) *' : 'Date *'}
                            </label>
                            <input
                              id="buy-date-input"
                              type="date"
                              required
                              value={buyDate}
                              onChange={(e) => setBuyDate(e.target.value)}
                              className="w-full bg-[#0a0d16] border border-[#1f2937] text-slate-200 p-2.5 rounded-lg font-mono"
                            />
                          </div>

                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          
                          {/* Quintals weight input */}
                          <div className="space-y-1">
                            <label className="block text-slate-300 font-bold" htmlFor="buy-qty-input">
                              {lang === 'am' ? 'የእህል ብዛት በኩንታል (No. of Grain - Quintals) *' : 'No. of Grain (Quintals / ኩንታል) *'}
                            </label>
                            <div className="relative">
                              <input
                                id="buy-qty-input"
                                type="number"
                                required
                                min="0.1"
                                step="any"
                                placeholder="e.g. 50"
                                value={buyQuantity}
                                onChange={(e) => setBuyQuantity(e.target.value)}
                                className="w-full bg-[#0a0d16] border border-[#1f2937] text-white p-2.5 rounded-lg font-mono"
                              />
                            </div>
                          </div>

                          {/* Price per Quintal */}
                          <div className="space-y-1">
                            <label className="block text-slate-300 font-bold" htmlFor="buy-price-input">
                              {lang === 'am' ? 'ባንድ ኩንታል ዋጋ (Price per Quintal) *' : 'Price per Quintal (ETB) *'}
                            </label>
                            <input
                              id="buy-price-input"
                              type="number"
                              required
                              min="1"
                              placeholder="e.g. 4000"
                              value={buyPrice}
                              onChange={(e) => setBuyPrice(e.target.value)}
                              className="w-full bg-[#0a0d16] border border-[#1f2937] text-white p-2.5 rounded-lg font-mono"
                            />
                          </div>

                          {/* Dynamic calculated price field */}
                          <div className="space-y-1">
                            <label className="block text-slate-400 font-medium">
                              {lang === 'am' ? 'አጠቃላይ ድምር (Total Price)' : 'Total Price (Auto-Calculated)'}
                            </label>
                            <div className="bg-black/40 border border-slate-800 text-emerald-400 p-2.5 rounded-lg font-mono text-[14px] font-black h-[42px] flex items-center">
                              {liveCalculatedTotalPrice.toLocaleString()} ETB
                            </div>
                          </div>

                        </div>

                        {/* Note area */}
                        <div className="space-y-1">
                          <label className="block text-slate-400 font-medium" htmlFor="buy-note-input">Note</label>
                          <input
                            id="buy-note-input"
                            type="text"
                            placeholder="e.g. Paid via mobile banking bank transfer"
                            value={buyNote}
                            onChange={(e) => setBuyNote(e.target.value)}
                            className="w-full bg-[#0a0d16] border border-[#1f2937] text-slate-250 p-2.5 rounded-lg"
                          />
                        </div>

                        {/* Submit */}
                        <button
                          type="submit"
                          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-lg transition-all"
                        >
                          {lang === 'am' ? 'ግብይቱን አስገባ' : 'Post Transaction'}
                        </button>
                      </form>
                    )}

                  </div>

                  {/* Buying transaction lists and locked permanent histories */}
                  <div className="bg-[#111827] border border-[#1f2937] rounded-3xl p-6 shadow-xl space-y-4">
                    <div className="flex justify-between items-center border-b border-[#1f2937] pb-3">
                      <div className="flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4 text-emerald-400" />
                        <h3 className="text-xs font-bold uppercase tracking-wider text-white font-sans">
                          {lang === 'am' ? '🛒 የተመዘገቡ ግዢዎች (Buy History)' : 'Commercial Purchase Log'}
                        </h3>
                      </div>
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-mono font-bold">
                        {activeProfile.buyTransactions.length} {lang === 'am' ? 'ግብይቶች' : 'transactions'}
                      </span>
                    </div>

                    {/* Transaction histories rendered */}
                    <div className="space-y-4">
                      {activeProfile.buyTransactions.length === 0 ? (
                        <div className="text-center py-10 text-slate-500 border border-dashed border-slate-800 rounded-2xl">
                          <HelpCircle className="w-8 h-8 mx-auto text-slate-650 mb-2" />
                          <p className="text-xs font-bold text-slate-400">{lang === 'am' ? 'ምንም ግዢ አልተፈጸመም' : 'No Purchase Transactions Recorded yet'}</p>
                          <p className="text-[10px] text-slate-550 mt-1">{lang === 'am' ? 'ለመመዝገብ ከላይ "እህል ግዛ" የሚለውን ይጫኑ።' : 'Trigger "Buy Grain" action to run maths calculations.'}</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto rounded-3xl border border-[#1f2937] bg-slate-950/40 shadow-xl">
                          <table className="w-full text-left border-collapse text-xs font-sans">
                            <thead>
                              <tr className="bg-slate-900 border-b border-[#1f2937] text-slate-400 font-mono text-[10.5px] uppercase">
                                <th className="p-4 font-extrabold">{lang === 'am' ? 'የእህል አይነት' : 'Grain Type'}</th>
                                <th className="p-4 font-extrabold">{lang === 'am' ? 'ቀን' : 'Date'}</th>
                                <th className="p-4 font-extrabold">{lang === 'am' ? 'ክምችት (በኩንታል)' : 'Quantity (Quintals)'}</th>
                                <th className="p-4 font-extrabold">{lang === 'am' ? 'የአንዱ ዋጋ' : 'Unit Price (ETB)'}</th>
                                <th className="p-4 font-extrabold">{lang === 'am' ? 'ጠቅላላ ዋጋ' : 'Total Price'}</th>
                                <th className="p-4 font-extrabold">{lang === 'am' ? 'ማስታወሻ' : 'Notes'}</th>
                                <th className="p-4 font-extrabold text-right">{lang === 'am' ? 'እርምጃዎች' : 'Actions'}</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#1f2937]/50">
                              {activeProfile.buyTransactions.map(buy => {
                                const isEditingThisBuy = editingBuyId === buy.id;

                                if (isEditingThisBuy) {
                                  return (
                                    <tr key={buy.id} className="bg-slate-900/85 text-white font-mono text-xs">
                                      <td className="p-3">
                                        <input
                                          type="text"
                                          value={editBuyGrainType}
                                          onChange={(e) => setEditBuyGrainType(e.target.value)}
                                          className="w-full bg-[#0a0d16] border border-[#1f2937] text-white p-2 rounded-lg text-xs font-sans"
                                        />
                                      </td>
                                      <td className="p-3">
                                        <input
                                          type="date"
                                          value={editBuyDate}
                                          onChange={(e) => setEditBuyDate(e.target.value)}
                                          className="w-full bg-[#0a0d16] border border-[#1f2937] text-white p-2 rounded-lg text-xs font-mono"
                                        />
                                      </td>
                                      <td className="p-3">
                                        <input
                                          type="number"
                                          value={editBuyQuantity}
                                          onChange={(e) => setEditBuyQuantity(e.target.value)}
                                          className="w-full bg-[#0a0d16] border border-[#1f2937] text-white p-2 rounded-lg text-xs font-mono"
                                        />
                                      </td>
                                      <td className="p-3">
                                        <input
                                          type="number"
                                          value={editBuyPrice}
                                          onChange={(e) => setEditBuyPrice(e.target.value)}
                                          className="w-full bg-[#0a0d16] border border-[#1f2937] text-white p-2 rounded-lg text-xs font-mono"
                                        />
                                      </td>
                                      <td className="p-3 text-emerald-400 font-bold font-sans">
                                        {liveCalculatedEditTotalPrice.toLocaleString()} ETB
                                      </td>
                                      <td className="p-3">
                                        <input
                                          type="text"
                                          value={editBuyNote}
                                          onChange={(e) => setEditBuyNote(e.target.value)}
                                          className="w-full bg-[#0a0d16] border border-[#1f2937] text-white p-2 rounded-lg text-xs font-sans"
                                        />
                                      </td>
                                      <td className="p-3 text-right">
                                        <div className="flex justify-end gap-1.5 font-sans">
                                          <button 
                                            type="button" 
                                            onClick={() => setEditingBuyId(null)} 
                                            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-350 rounded text-[10.5px] font-bold"
                                          >
                                            Cancel
                                          </button>
                                          <button 
                                            type="button"
                                            onClick={() => {
                                              const mockEvent = { preventDefault: () => {} } as React.FormEvent;
                                              handleSaveBuyEdit(mockEvent);
                                            }}
                                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 font-bold text-white rounded text-[10.5px]"
                                          >
                                            Save
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                }

                                return (
                                  <tr key={buy.id} className="hover:bg-slate-900/30 transition-all font-mono text-slate-300 text-xs">
                                    <td className="p-4 font-sans font-bold text-slate-100">🌾 {buy.grainType}</td>
                                    <td className="p-4 text-slate-450">📅 {buy.date}</td>
                                    <td className="p-4 font-bold text-slate-200">{buy.quantity.toLocaleString()} kn</td>
                                    <td className="p-4 text-emerald-400">{buy.pricePerQuintal.toLocaleString()} ETB</td>
                                    <td className="p-4 font-black text-emerald-400 bg-emerald-950/10 border-l border-[#1f2937]/50">{buy.totalPrice.toLocaleString()} ETB</td>
                                    <td className="p-4 italic text-slate-450 font-sans">"{buy.note || '—'}"</td>
                                    <td className="p-4 text-right font-sans">
                                      <div className="flex justify-end gap-2">
                                        <button
                                          onClick={() => startEditingBuy(buy)}
                                          className="hover:text-amber-400 text-[10px] uppercase font-bold text-slate-450 bg-slate-900/60 hover:bg-slate-800 border border-slate-800 px-2 py-1 rounded transition-all cursor-pointer flex items-center gap-1"
                                          title="Change purchase quantities"
                                        >
                                          <span>✏️</span> {lang === 'am' ? 'አስተካክል' : 'Edit'}
                                        </button>
                                        <button
                                          onClick={() => {
                                            if (confirm(lang === 'am' ? 'ይህንን ግዢ በእርግጠኝነት መሰረዝ ይፈልጋሉ?' : 'Are you sure you want to delete this buy transaction?')) {
                                              handleDeleteBuy(buy.id);
                                            }
                                          }}
                                          className="hover:text-rose-450 text-[10px] uppercase font-bold text-slate-450 bg-slate-900/60 hover:bg-rose-950/30 border border-slate-800 px-2 py-1 rounded transition-all cursor-pointer flex items-center gap-1"
                                          title="Revert quantities"
                                        >
                                          <span>🗑️</span> {lang === 'am' ? 'ሰርዝ' : 'Delete'}
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              ) : (
                <div className="bg-[#111827] border border-dashed border-[#1f2937] py-20 rounded-3xl text-center space-y-4">
                  <Database className="w-12 h-12 text-slate-700/50 mx-auto" />
                  <h3 className="text-sm font-bold text-slate-300 uppercase">Awaiting Profile Selection</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Please click on a customer name from the left alphabetical list to view their detailed profiles and operate buying modules.
                  </p>
                </div>
              )}
            </div>

          </div>
        )}

        {/* ==================== MODULE 3 RENDERING ==================== */}
        {activeSubTab === 'module3' && (
          <div className="space-y-6 animate-fade-in" id="module-3-dashboard">
            
            <div className="bg-[#111827] border border-[#1f2937]/95 p-4 rounded-xl flex items-center gap-2">
              <Layers className="w-4 h-4 text-teal-400 shrink-0" />
              <p className="text-xs font-bold text-slate-350 uppercase tracking-wide">
                📊 {lang === 'am' ? 'አጠቃላይ ማጠቃለያ ዳሽቦርድ (DASHBOARD OF TOTAL DATA)' : 'DASHBOARD OF TOTAL DATA overview'}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* COMPONENT A: CUSTOMER DIRECTORY (በፊደል ቅደም ተከተል የተደረደሩ) */}
              <div className="lg:col-span-6">
                <div className="bg-[#111827] border border-[#1f2937] rounded-2xl p-6 shadow-xl space-y-5">
                  <div className="border-b border-[#1f2937] pb-4">
                    <h3 className="text-xs font-bold text-white uppercase tracking-widest font-sans flex items-center gap-2">
                      👥 {lang === 'am' ? '1. የደንበኞች ዝርዝር (በፊደል ቅደም ተከተል የተደረደሩ)' : '1. CUSTOMER DIRECTORY (Sorted Alphabetically)'}
                    </h3>
                    <p className="text-[10.5px] text-slate-450 font-sans mt-1">
                      {lang === 'am' ? 'መገለጫዎችን እና ግብይቶችን በዝርዝር ለመቆጣጠር በስሙ ላይ ይጫኑ' : 'Click into any name to drill down into their specific transaction history.'}
                    </p>
                  </div>

                  <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
                    {sortedProfiles.map((p, idx) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setSelectedProfileId(p.id);
                          setActiveSubTab('module2');
                        }}
                        className="w-full text-left p-3.5 bg-slate-950/45 hover:bg-[#161d2d]/50 border border-slate-900 hover:border-emerald-950/40 rounded-xl transition-all font-sans text-xs flex items-center justify-between cursor-pointer group"
                        id={`dash-profile-row-${p.id}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-[10.5px] text-slate-600 bg-slate-900 border border-slate-800 w-6 h-6 rounded-full flex items-center justify-center font-bold">
                            {idx + 1}
                          </span>
                          <div className="flex flex-col">
                            <span className="font-extrabold text-slate-200 group-hover:text-emerald-450 transition-colors">
                              {p.customerName}
                            </span>
                            <span className="text-[10px] text-slate-500 mt-0.5">
                              {p.grainTypes.length} {lang === 'am' ? 'የእህል አይነቶች' : 'Grains'} registered
                            </span>
                          </div>
                        </div>

                        {/* Exact display arrow design of Component A */}
                        <div className="flex items-center gap-1.5 text-slate-500 hover:text-emerald-400">
                          <span className="text-[10px] text-slate-600 font-mono tracking-tight group-hover:text-emerald-500 transition-colors">
                            --------─&gt; {lang === 'am' ? '(ሙሉ ዝርዝር)' : '(Click profile)'}
                          </span>
                          <ChevronRight className="w-4 h-4 shrink-0 transition-transform group-hover:translate-x-1" />
                        </div>
                      </button>
                    ))}

                    {sortedProfiles.length === 0 && (
                      <div className="text-center py-12 text-slate-500 font-sans text-xs">
                        No clients registered yet. Let's record one in Module 1!
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* COMPONENT B: TOTAL STOCK SUMMARY BY GRAIN TYPE (የአጠቃላይ እህል ክምችት ድምር) */}
              <div className="lg:col-span-6">
                <div className="bg-[#111827] border border-[#1f2937] rounded-2xl p-6 shadow-xl space-y-5">
                  <div className="border-b border-[#1f2937] pb-4">
                    <h3 className="text-xs font-bold text-white uppercase tracking-widest font-sans flex items-center gap-2">
                      🌾 {lang === 'am' ? '2. የአጠቃላይ እህል ክምችት ድምር (TOTAL STOCK BY GRAIN)' : '2. TOTAL STOCK SUMMARY BY GRAIN TYPE'}
                    </h3>
                    <p className="text-[10.5px] text-slate-450 font-sans mt-1">
                      {lang === 'am' ? 'በመጋዘኑ ውስጥ ያሉትን ሁሉንም የተቀመጡ፣ የተገዙና ቀሪ ያልተገዙ የገበሬዎች ክምችት ድምር ያሰላል' : 'Aggregates the physical stored, purchased and outstanding consignments globally.'}
                    </p>
                  </div>

                  {/* Clean responsive styled table layout requested by Component B */}
                  <div className="bg-slate-950/60 border border-[#1f2937] rounded-xl overflow-hidden shadow-inner">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-[#1f2937] bg-slate-900/30 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-sans">
                          <th className="py-3 px-3">{lang === 'am' ? 'የእህል አይነት' : 'Grain Type'}</th>
                          <th className="py-3 px-3 text-right">{lang === 'am' ? 'የገባ ክምችት' : 'Stored'}</th>
                          <th className="py-3 px-3 text-right text-indigo-400">{lang === 'am' ? 'የተገዛ' : 'Purchased'}</th>
                          <th className="py-3 px-3 text-right text-emerald-400">{lang === 'am' ? 'ቀሪ' : 'Remaining'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1f2937] text-xs font-sans text-slate-200">
                        {aggregateGrainsData.map(item => (
                          <tr key={item.name} className="hover:bg-slate-900/30 transition-colors">
                            <td className="py-3 px-3 font-bold flex items-center gap-1.5">
                              {item.name.toLowerCase().includes('waliya') ? '🌾' :
                               item.name.toLowerCase().includes('evoniy') ? '🌱' :
                               item.name.toLowerCase().includes('atar') ? '🟢' :
                               item.name.toLowerCase().includes('bakela') ? '🟤' :
                               item.name.toLowerCase().includes('sinde') ? '🌾' :
                               item.name.toLowerCase().includes('ashile') ? '🌽' : '🌾'}
                              {item.name}
                            </td>
                            <td className="py-3 px-3 text-right font-mono text-slate-350">
                              {item.deposited.toLocaleString()} {lang === 'am' ? 'ኩንታል' : 'qt'}
                            </td>
                            <td className="py-3 px-3 text-right font-mono text-indigo-400">
                              {item.bought.toLocaleString()} {lang === 'am' ? 'ኩንታል' : 'qt'}
                            </td>
                            <td className="py-3 px-3 text-right font-mono font-extrabold text-emerald-400 bg-emerald-500/5">
                              {item.remaining.toLocaleString()} {lang === 'am' ? 'ኩንታል' : 'qt'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="bg-emerald-950/15 border border-emerald-900/35 p-3.5 rounded-xl flex items-start gap-2.5">
                    <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <p className="text-[10.5px] text-slate-400 leading-normal font-sans">
                      {lang === 'am'
                        ? 'የማጠቃለያ ህግ፡ ገበሬዎች ዋጋ እስኪጨምር በመጠባበቅ እህላቸውን በመጋዘን ያስቀምጣሉ። ነጋዴው ሲገዛ ከተቀመጠው ላይ ተቀንሶ ወደ ተገዛው ድምር ይሸጋገራል፣ ቀሪው ደግሞ ገበሬው ያልሸጠው በመጋዘን ያለው ነው።'
                        : 'COMPILING RULE: Farmers store grain to wait for higher prices. When purchased, quantity shifts from Stored to Purchased balance. The remaining is outstanding stored grain awaiting market sales.'}
                    </p>
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

      </div>

    </div>
  );
}
