import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  RotateCcw, 
  Download, 
  Upload, 
  Info, 
  Phone, 
  User, 
  Check, 
  AlertCircle, 
  RefreshCw, 
  Key, 
  Smartphone,
  ExternalLink,
  Loader2,
  CheckCircle2,
  FileJson,
  UserCheck
} from 'lucide-react';
import AppLogo from './AppLogo';
import { Product, PurchaseTransaction, SaleTransaction, FinanceRecord, Account, ProviderDeposit } from '../types';

interface SettingsViewProps {
  products: Product[];
  purchases: PurchaseTransaction[];
  sales: SaleTransaction[];
  financeRecords: FinanceRecord[];
  accounts: Account[];
  providerDeposits: ProviderDeposit[];
  onRestoreState: (state: {
    products?: Product[];
    purchases?: PurchaseTransaction[];
    sales?: SaleTransaction[];
    financeRecords?: FinanceRecord[];
    accounts?: Account[];
    providerDeposits?: ProviderDeposit[];
  }) => void;
  lang: 'en' | 'am';
  onSetLang: (lang: 'en' | 'am') => void;
}

// Translations dictionary
const TRANSLATIONS = {
  en: {
    settings: 'Settings',
    subtitle: 'Manage your application language, real-time Google Drive sync, and view about info',
    langSelect: 'Language Selection',
    langSubtitle: 'Toggle the application user interface between English and Amharic',
    english: 'English (US)',
    amharic: 'አማርኛ (Amharic)',
    googleSync: 'Google Drive Sync & Backup',
    syncSubtitle: 'Link your Google account to backup and restore your local grain data seamlessly',
    gdriveConnect: 'Connect Google Account',
    gdriveConnected: 'Connected as Google Direct Partner',
    gdriveDisconnect: 'Disconnect Account',
    customClientId: 'Custom Google Client ID (Optional)',
    clientIdHelp: 'Define your own OAuth 2.0 Web Client ID from Google Cloud Console if needed.',
    backupNow: 'Backup Data to Drive',
    restoreNow: 'Restore Data from Drive',
    autoSync: 'Auto-Backup on state updates',
    autoSyncHelp: 'Automatically upload your latest state to Google Drive whenever changes are registered',
    localExport: 'Offline Export & Import',
    localExportSubtitle: 'Download or upload the database physically using structured JSON backup files',
    downloadJson: 'Download Backup JSON',
    uploadJson: 'Upload / Restore JSON',
    about: 'About App & Developer',
    aboutApp: 'DforDani App is a highly tailored full-scale grain inventory, source allocation, and personal accounting framework designed for professional traders.',
    appName: 'App Name',
    appVersion: 'App Version',
    developer: 'Developer Name',
    devPhone: 'Developer Phone',
    backupSuccess: 'Successfully backed up state to Google Drive!',
    restoreSuccess: 'Successfully restored and synchronized your grain ledgers from Google Drive!',
    restoreConfirm: 'Warning: This will completely replace your current local stock, sourcing registers, and financial listings. Proceed?',
    invalidJson: 'The chosen file is not a valid DforDani App backup package.',
    localRestoreSuccess: 'Local database replaced and initialized successfully!',
    backupFailed: 'Backup operation aborted. Ensure your account is authenticated and retry.',
    restoreFailed: 'Restore failed. No previous backup package found in this Google Drive folder.',
    status: 'System Synchronization Status',
    statusSynced: 'All entries synced securely with storage indicators.',
    statusOffline: 'Running local standalone mode. Google Cloud drive is unlinked.'
  },
  am: {
    settings: 'ቅንብሮች',
    subtitle: 'የመተግበሪያውን ቋንቋ፣ የእውነተኛ ጊዜ የጎግል ድራይቭ ምትኬን ያስተዳድሩ እና ስለ እኛ መረጃ ይመልከቱ',
    langSelect: 'የቋንቋ ምርጫ',
    langSubtitle: 'የመተግበሪያውን ተጠቃሚ በይነገጽ በእንግሊዝኛ እና በአማርኛ መካከል ይቀይሩ',
    english: 'English (እንግሊዝኛ)',
    amharic: 'አማርኛ',
    googleSync: 'የጎግል ድራይቭ ምትኬ እና ማመሳሰል',
    syncSubtitle: 'የአካባቢዎን የእህል መረጃዎች ያለምንም እንከን ምትኬ ለማስቀመጥ እና ለመመለስ የጎግል መለያዎን ያገናኙ',
    gdriveConnect: 'የጎግል መለያ አገናኝ',
    gdriveConnected: 'በጎግል ቀጥተኛ አጋርነት ተገናኝቷል',
    gdriveDisconnect: 'መለያ አቋርጥ',
    customClientId: 'ብጁ የጎግል ደንበኛ መታወቂያ (አማራጭ)',
    clientIdHelp: 'ከተፈለገ የራስዎን የኦውዝ (OAuth 2.0) የደንበኛ መታወቂያ ከጎግል ክላውድ ኮንሶል እዚህ ይግለጹ።',
    backupNow: 'መረጃ ወደ ድራይቭ አስቀምጥ (Backup)',
    restoreNow: 'መረጃ ከድራይቭ ይመልስ (Restore)',
    autoSync: 'በለውጦች ጊዜ ወዲያውኑ ምትኬ አስቀምጥ',
    autoSyncHelp: 'ማንኛቸውም ለውጦች በሚደረጉበት ጊዜ የቅርብ ጊዜውን እንቅስቃሴ በራስ-ሰር ወደ ጎግል ድራይቭ ይጫኑ',
    localExport: 'ከመስመር ውጭ ወደ ውጭ መላክ እና ማስገባት',
    localExportSubtitle: 'የተዋቀሩ የጄሰን (JSON) ምትኬ ፋይሎችን በመጠቀም የውሂብ ጎታውን ያውርዱ ወይም ይጫኑ',
    downloadJson: 'ምትኬ ጄሰን (JSON) ፋይል አውርድ',
    uploadJson: 'ጄሰን (JSON) ፋይል ጫን / መልስ',
    about: 'ስለ መተግበሪያው እና አዘጋጁ',
    aboutApp: 'ድፎርዳኒ (DforDani) መተግበሪያ ለባለሙያ ነጋዴዎች የተነደፈ የእህል ክምችት፣ የግዢ ማዘዣዎች እና የግል ፋይናንስ ሂሳቦች የተቀናጀ መቆጣጠሪያ መድረክ ነው።',
    appName: 'የመተግበሪያው ስም',
    appVersion: 'የመተግበሪያው ስሪት',
    developer: 'የአዘጋጁ ስም',
    devPhone: 'የአዘጋጁ ስልክ ቁጥር',
    backupSuccess: 'የመተግበሪያው መረጃ በስኬት በጎግል ድራይቭዎ ላይ ታቅቧል!',
    restoreSuccess: 'የእህል ክምችትዎ እና የፋይናንስ መዝገቦችዎ ከጎግል ድራይቭ በስኬት ተመልሰዋል!',
    restoreConfirm: 'ማስጠንቀቂያ፦ ይህ አሰራር አሁን ያሉትን የአገር ውስጥ ክምችቶች እና የፋይናንስ Listings ሙሉ በሙሉ ይተካል። መቀጠል ይፈልጋሉ?',
    invalidJson: 'የመረጡት ፋይል ትክክለኛ የDforDani መተግበሪያ ምትኬ ጥቅል አይደለም።',
    localRestoreSuccess: 'የአገር ውስጥ የውሂብ ጎታ በስኬት ተተክቷል!',
    backupFailed: 'የምትኬ ስራ አልተሳካም። መለያዎ በትክክል መገናኘቱን ያረጋግጡና እንደገና ይሞክሩ።',
    restoreFailed: 'ምትኬን መመለስ አልተሳካም። በዚህ የጎግል ድራይቭ ፎልደር ውስጥ ከዚህ ቀደም የተቀመጠ ምትኬ አልተገኘም።',
    status: 'የስርዓቱ ማመሳሰል ሁኔታ',
    statusSynced: 'ሁሉም ግቤቶች ከደመና ማከማቻ ጠቋሚዎች ጋር በደህንነት ተመሳስለዋል።',
    statusOffline: 'ከመስመር ውጭ እየሰሩ ነው። ጎግል ድራይቭ አልተገናኘም።'
  }
};

// Default Sandbox App client ID (can be customized by power developers)
const DEFAULT_CLIENT_ID = '784698896918-7s1dndrffgd9pfcq0ps0r99hcoevor79.apps.googleusercontent.com';

export default function SettingsView({
  products,
  purchases,
  sales,
  financeRecords,
  accounts,
  providerDeposits,
  onRestoreState,
  lang,
  onSetLang
}: SettingsViewProps) {
  const t = TRANSLATIONS[lang];

  // OAuth & Google Integration States
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('dfordani_gdrive_token');
  });
  const [customClientId, setCustomClientId] = useState<string>(() => {
    return localStorage.getItem('dfordani_custom_client_id') || '';
  });
  const [googleUser, setGoogleUser] = useState<{
    name: string;
    email: string;
    picture: string;
  } | null>(null);

  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isBackupActionPending, setIsBackupActionPending] = useState(false);
  const [isRestoreActionPending, setIsRestoreActionPending] = useState(false);
  const [operationStatus, setOperationStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  const [autoSyncEnabled, setAutoSyncEnabled] = useState<boolean>(() => {
    return localStorage.getItem('dfordani_autosync') === 'true';
  });

  // Direct manual token input state for sandbox testing resilience
  const [manualTokenInput, setManualTokenInput] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);

  // Monitor Google OAuth implicit redirection access token in URL Hash
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get('access_token');
      if (accessToken) {
        setToken(accessToken);
        localStorage.setItem('dfordani_gdrive_token', accessToken);
        // Clear url hash state cleanly to avoid cosmetic pollution
        window.history.pushState("", document.title, window.location.pathname + window.location.search);
        setOperationStatus({
          type: 'success',
          message: lang === 'en' ? 'Successfully connected with Google OAuth 2.0 Flow!' : 'በጎግል ኦውዝ (OAuth 2.0) ማዕቀፍ በስኬት ተገናኝቷል!'
        });
      }
    }
  }, [lang]);

  // Save manual/custom configurations
  useEffect(() => {
    localStorage.setItem('dfordani_autosync', autoSyncEnabled.toString());
  }, [autoSyncEnabled]);

  // Fetch Google account identity profile data if token is active
  useEffect(() => {
    if (!token) {
      setGoogleUser(null);
      return;
    }

    const fetchProfile = async () => {
      setIsLoadingProfile(true);
      try {
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          const uProfile = await res.json();
          setGoogleUser({
            name: uProfile.name || 'Daniel Partner',
            email: uProfile.email || 'daniel.dejene54@gmail.com',
            picture: uProfile.picture || ''
          });
        } else {
          // Token is likely invalid or expired
          handleDisconnect();
        }
      } catch (err) {
        console.error('Error retrieving userinfo profile:', err);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    fetchProfile();
  }, [token]);

  // Auto-Sync Trigger mapping on payload updates
  useEffect(() => {
    if (autoSyncEnabled && token) {
      // Trigger background silent backup to Drive
      silentBackupToDrive();
    }
  }, [products, purchases, sales, financeRecords, accounts, providerDeposits]);

  const handleDisconnect = () => {
    setToken(null);
    setGoogleUser(null);
    localStorage.removeItem('dfordani_gdrive_token');
    setOperationStatus({ type: null, message: '' });
  };

  const handleSaveCustomClientId = () => {
    if (customClientId.trim()) {
      localStorage.setItem('dfordani_custom_client_id', customClientId.trim());
    } else {
      localStorage.removeItem('dfordani_custom_client_id');
    }
    setOperationStatus({
      type: 'success',
      message: lang === 'en' ? 'OAuth client configuration saved!' : 'የኦውዝ ደንበኛ ውቅር በስኬት ተቀምጧል!'
    });
  };

  // Launch implicit Google authorization redirection
  const handleConnectGoogle = () => {
    const activeClientId = customClientId.trim() || DEFAULT_CLIENT_ID;
    const redirectUri = window.location.origin + window.location.pathname;
    const scopeList = [
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email'
    ];
    
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${activeClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=${encodeURIComponent(scopeList.join(' '))}&state=dfordani-settings`;
    
    // Redirect the top screen context
    window.location.href = googleAuthUrl;
  };

  const applyManualToken = () => {
    if (manualTokenInput.trim()) {
      setToken(manualTokenInput.trim());
      localStorage.setItem('dfordani_gdrive_token', manualTokenInput.trim());
      setShowManualInput(false);
      setOperationStatus({
        type: 'success',
        message: lang === 'en' ? 'Connected using alternative access token!' : 'በአማራጭ የመዳረሻ ቁልፍ በስኬት ተገናኝቷል!'
      });
    }
  };

  // Bundle package payload representing localized app context state
  const compileBackupPayload = () => {
    return {
      app: 'DforDani App',
      version: '2.4.1',
      backedUpAt: new Date().toISOString(),
      products,
      purchases,
      sales,
      financeRecords,
      accounts,
      providerDeposits
    };
  };

  // Silent automatic sync function
  const silentBackupToDrive = async () => {
    if (!token) return;
    try {
      const payload = compileBackupPayload();
      const fileName = 'dfordani_backup.json';
      
      // Step A: Seek if dfordani_backup.json exists in user's gdrive already
      const queryUrl = `https://www.googleapis.com/drive/v3/files?q=name='${fileName}' and trashed=false`;
      const searchRes = await fetch(queryUrl, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!searchRes.ok) return;
      const searchData = await searchRes.json();
      const fileMatch = searchData.files && searchData.files[0];

      if (fileMatch) {
        // File exists -> PATCH/UPDATE content
        await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileMatch.id}?uploadType=media`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
      } else {
        // File doesn't exist -> POST multi-part create
        const metadata = { name: fileName, mimeType: 'application/json' };
        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', new Blob([JSON.stringify(payload)], { type: 'application/json' }));

        await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: form
        });
      }
    } catch (err) {
      console.warn('Silent sync failed:', err);
    }
  };

  // Manual Backup trigger with full loader interactions
  const triggerManualBackupToDrive = async () => {
    if (!token) return;
    setIsBackupActionPending(true);
    setOperationStatus({ type: null, message: '' });

    try {
      const payload = compileBackupPayload();
      const fileName = 'dfordani_backup.json';
      
      // Seek existing file
      const queryUrl = `https://www.googleapis.com/drive/v3/files?q=name='${fileName}' and trashed=false`;
      const searchRes = await fetch(queryUrl, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!searchRes.ok) {
        throw new Error('Search failed');
      }
      
      const searchData = await searchRes.json();
      const fileMatch = searchData.files && searchData.files[0];
      let response;

      if (fileMatch) {
         response = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileMatch.id}?uploadType=media`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
      } else {
        const metadata = { name: fileName, mimeType: 'application/json' };
        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', new Blob([JSON.stringify(payload)], { type: 'application/json' }));

        response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: form
        });
      }

      if (response.ok) {
        setOperationStatus({
          type: 'success',
          message: t.backupSuccess
        });
      } else {
        throw new Error('Upload failed');
      }
    } catch (err) {
      console.error(err);
      setOperationStatus({
        type: 'error',
        message: t.backupFailed
      });
    } finally {
      setIsBackupActionPending(false);
    }
  };

  // Restore backup file trigger
  const triggerRestoreFromDrive = async () => {
    if (!token) return;
    if (!window.confirm(t.restoreConfirm)) return;
    
    setIsRestoreActionPending(true);
    setOperationStatus({ type: null, message: '' });

    try {
      const fileName = 'dfordani_backup.json';
      const queryUrl = `https://www.googleapis.com/drive/v3/files?q=name='${fileName}' and trashed=false`;
      const searchRes = await fetch(queryUrl, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!searchRes.ok) throw new Error('Query failed');
      
      const searchData = await searchRes.json();
      const fileMatch = searchData.files && searchData.files[0];

      if (!fileMatch) {
        setOperationStatus({
          type: 'error',
          message: t.restoreFailed
        });
        return;
      }

      const fileContentUrl = `https://www.googleapis.com/drive/v3/files/${fileMatch.id}?alt=media`;
      const contentRes = await fetch(fileContentUrl, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (contentRes.ok) {
        const parsedData = await contentRes.json();
        if (parsedData && parsedData.app === 'DforDani App') {
          // Restore items
          onRestoreState({
            products: parsedData.products,
            purchases: parsedData.purchases,
            sales: parsedData.sales,
            financeRecords: parsedData.financeRecords,
            accounts: parsedData.accounts,
            providerDeposits: parsedData.providerDeposits
          });
          setOperationStatus({
            type: 'success',
            message: t.restoreSuccess
          });
        } else {
          throw new Error('Invalid schema content');
        }
      } else {
        throw new Error('Restore fetch failed');
      }
    } catch (error) {
      console.error(error);
      setOperationStatus({
        type: 'error',
        message: t.restoreFailed
      });
    } finally {
      setIsRestoreActionPending(false);
    }
  };

  // Local JSON download export triggers
  const triggerLocalJsonDownload = () => {
    const payload = compileBackupPayload();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(payload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `dfordani_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Local JSON upload triggers
  const triggerLocalJsonUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    if (!window.confirm(t.restoreConfirm)) return;

    const fileReader = new FileReader();
    fileReader.onload = (e) => {
      try {
        const resultText = e.target?.result as string;
        const parsed = JSON.parse(resultText);
        
        if (parsed && parsed.app === 'DforDani App') {
          onRestoreState({
            products: parsed.products,
            purchases: parsed.purchases,
            sales: parsed.sales,
            financeRecords: parsed.financeRecords,
            accounts: parsed.accounts,
            providerDeposits: parsed.providerDeposits
          });
          setOperationStatus({
            type: 'success',
            message: t.localRestoreSuccess
          });
        } else {
          setOperationStatus({
            type: 'error',
            message: t.invalidJson
          });
        }
      } catch (err) {
        setOperationStatus({
          type: 'error',
          message: t.invalidJson
        });
      }
    };
    fileReader.readAsText(files[0]);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto" id="settings-view-root">
      
      {/* Settings Title Header section */}
      <div className="flex items-center justify-between border-b border-[#1f293d] pb-4" id="settings-view-header">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span className="p-1 px-2.5 rounded bg-indigo-600/10 text-indigo-400">⌘</span>
            {t.settings}
          </h2>
          <p className="text-sm text-slate-400 mt-1 max-w-xl">{t.subtitle}</p>
        </div>
      </div>

      {/* Global Banner Notification and status states */}
      {operationStatus.message && (
        <div 
          className={`p-4 rounded-xl flex items-start gap-3 border ${
            operationStatus.type === 'success' 
              ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300' 
              : 'bg-rose-950/20 border-rose-500/30 text-rose-300'
          }`}
          id="global-backup-alert-banner"
        >
          {operationStatus.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          )}
          <span className="text-xs font-semibold leading-relaxed">{operationStatus.message}</span>
        </div>
      )}

      {/* 1. Language Toggle Section */}
      <section className="bg-[#0f1422] border border-[#1f293d] rounded-2xl p-6 shadow-md space-y-4" id="section-language">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-indigo-400" />
              {t.langSelect}
            </h3>
            <p className="text-xs text-slate-400">{t.langSubtitle}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          {/* English toggle button selection */}
          <button
            onClick={() => onSetLang('en')}
            className={`p-4 rounded-xl border flex flex-col justify-between items-start text-left cursor-pointer transition-all ${
              lang === 'en' 
                ? 'bg-indigo-600/10 border-indigo-500 text-white shadow-sm' 
                : 'bg-[#141b2c] border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
            }`}
            id="lang-btn-en"
          >
            <span className="font-mono text-xs text-indigo-400 tracking-widest uppercase">EN-US</span>
            <span className="font-bold text-sm mt-3">{t.english}</span>
            {lang === 'en' && <Check className="w-4 h-4 text-indigo-400 absolute top-4 right-4" />}
          </button>

          {/* Amharic toggle button selection */}
          <button
            onClick={() => onSetLang('am')}
            className={`p-4 rounded-xl border flex flex-col justify-between items-start text-left cursor-pointer transition-all ${
              lang === 'am' 
                ? 'bg-indigo-600/10 border-indigo-500 text-white shadow-sm' 
                : 'bg-[#141b2c] border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
            }`}
            id="lang-btn-am"
          >
            <span className="font-mono text-xs text-indigo-400 tracking-widest uppercase">AM-ET</span>
            <span className="font-bold text-sm mt-3">{t.amharic}</span>
            {lang === 'am' && <Check className="w-4 h-4 text-indigo-400 absolute top-4 right-4" />}
          </button>
        </div>
      </section>

      {/* 2. Google Account Drive Backup integration */}
      <section className="bg-[#0f1422] border border-[#1f293d] rounded-2xl p-6 shadow-md space-y-6" id="section-google-drive">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <svg className="w-4 h-4 text-amber-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46.21 14.25 0 14 0h-4c-.25 0-.46.21-.49.46L9.13 3.1c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.25.24.46.49.46h4c.25 0 .46-.21.49-.46l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z"/>
              </svg>
              {t.googleSync}
            </h3>
            <span className={`text-[10px] uppercase font-black px-2 mt-0.5 py-0.5 rounded-md ${
              token ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400'
            }`}>
              {token ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>
          <p className="text-xs text-slate-400">{t.syncSubtitle}</p>
        </div>

        {/* Sync panel configuration */}
        {!token ? (
          <div className="bg-[#141b2c] rounded-xl p-5 border border-slate-800 space-y-4" id="google-drive-unlinked-state">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM19 18H6c-2.21 0-4-1.79-4-4 0-2.05 1.53-3.76 3.56-3.97l1.07-.11.5-.95C8.08 7.14 9.94 6 12 6c2.62 0 4.88 1.86 5.39 4.43l.3 1.5 1.53.11c1.56.1 2.78 1.41 2.78 2.96 0 1.65-1.35 3-3 3z"/>
                </svg>
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-300">{lang === 'en' ? 'Drive Backups Unlinked' : 'የጎግል መረጃ ምትኬ አልተገናኘም'}</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">{lang === 'en' ? 'Connect DforDani securely with standard Cloud REST credentials.' : 'መተግበሪያውን በስኬት ከእርስዎ የጎግል ደመና ማከማቻ ጋር ያገናኙት።'}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2.5 pt-2">
              <button
                onClick={handleConnectGoogle}
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 cursor-pointer text-white font-bold text-xs px-4 py-2.5 rounded-lg active:scale-95 transition-all shadow"
                id="btn-oauth-gdrive-connect"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>{t.gdriveConnect}</span>
              </button>

              <button
                onClick={() => setShowManualInput(!showManualInput)}
                className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 cursor-pointer text-slate-300 font-bold text-xs px-3.5 py-2.5 rounded-lg active:scale-95 transition-all"
                id="btn-toggle-manual-token-field"
              >
                <Key className="w-3.5 h-3.5" />
                <span>{lang === 'en' ? 'Use Temporary Access Token' : 'ጊዜያዊ የመግቢያ መዳረሻ ቁልፍ ተጠቀም'}</span>
              </button>
            </div>

            {/* Manual token input option for sandbox robustness */}
            {showManualInput && (
              <div className="p-4 bg-[#1a2336] rounded-xl border border-slate-700/60 animate-in fade-in duration-200 space-y-3" id="manual-token-input-card">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    {lang === 'en' ? 'OAuth Access Token (Bearer)' : 'የኦውዝ መዳረሻ ቁልፍ (Access Token)'}
                  </label>
                  <input
                    type="text"
                    value={manualTokenInput}
                    onChange={(e) => setManualTokenInput(e.target.value)}
                    placeholder="ya29.a0Axoo..."
                    className="w-full bg-[#0b0f17] border border-slate-700 rounded-lg p-2 font-mono text-[11px] text-indigo-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                    id="input-raw-oauth-access-token"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    {lang === 'en' 
                      ? 'Acquire a temporary access token from Google OAuth 2.0 Playground to test features instantly.' 
                      : 'የጎግል መተግበሪያን በተሳካ ሁኔታ ለመፈተሽ ጊዜያዊ የመዳረሻ ቁልፍ ከኦውዝ መጫወቻ ሜዳ (Playground) ማምጣት ይችላሉ።'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={applyManualToken}
                  className="bg-indigo-600 hover:bg-indigo-500 cursor-pointer text-white text-[11px] font-bold px-3 py-1.5 rounded-md"
                  id="btn-apply-manual-token"
                >
                  {lang === 'en' ? 'Apply Token' : 'ቁልፍ ተግብር'}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-[#141b2c] rounded-xl p-5 border border-slate-800 space-y-5" id="google-drive-active-sync-state">
            
            {/* Connected User Profile Banner */}
            <div className="flex items-center justify-between border-b border-slate-800/60 pb-4">
              <div className="flex items-center gap-3">
                {isLoadingProfile ? (
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                  </div>
                ) : googleUser?.picture ? (
                  <img 
                    src={googleUser.picture} 
                    alt="Google Profile" 
                    className="w-10 h-10 rounded-full border border-indigo-500/20 shadow"
                    id="google-user-avatar-image"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-indigo-600/15 flex items-center justify-center text-indigo-400 text-sm font-bold border border-indigo-500/20">
                    <User className="w-5 h-5" />
                  </div>
                )}
                
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs font-black text-white">{googleUser?.name || 'Daniel Partner'}</h4>
                    <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-1 py-0.5 rounded font-bold uppercase shrink-0">
                      ACTIVE PARTNER
                    </span>
                  </div>
                  <p className="text-[10px] font-mono text-slate-400 mt-0.5">{googleUser?.email || 'daniel.dejene54@gmail.com'}</p>
                </div>
              </div>

              <button
                onClick={handleDisconnect}
                className="text-[10px] text-rose-400 hover:text-rose-300 hover:bg-rose-950/20 border border-rose-500/10 hover:border-rose-500/20 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer"
                id="btn-disconnect-google-partner"
              >
                {t.gdriveDisconnect}
              </button>
            </div>

            {/* Sync trigger cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Force Backup Card */}
              <div className="bg-[#0b0f17]/40 p-4 rounded-xl border border-slate-800/40 space-y-3">
                <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{lang === 'en' ? 'Upload Data Ledger' : 'የእህል ሌጅሮችን ወደ ደመና ስቀል'}</h5>
                <p className="text-xs text-slate-300 leading-normal">
                  {lang === 'en' ? 'Package all client grain inventory, customer registries, and book ledgers, sending them to your drive.' : 'ሁሉንም የአገር ውስጥ የእህል ክምችቶች፣ የደንበኛ መዛግብቶች እና የፋይናንስ ሌጅሮች በአንድ ላይ ጠቅልለው ወደ ጎግል ድራይቭዎ ይስቀሉ።'}
                </p>
                <button
                  onClick={triggerManualBackupToDrive}
                  disabled={isBackupActionPending}
                  className="w-full inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 cursor-pointer text-white font-bold text-xs py-2 px-3 rounded-lg active:scale-95 transition-all shadow disabled:cursor-not-allowed"
                  id="btn-trigger-cloud-backup"
                >
                  {isBackupActionPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                  ) : (
                    <Upload className="w-3.5 h-3.5" />
                  )}
                  <span>{t.backupNow}</span>
                </button>
              </div>

              {/* Force Restore Card */}
              <div className="bg-[#0b0f17]/40 p-4 rounded-xl border border-slate-800/40 space-y-3">
                <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{lang === 'en' ? 'Restore Ledger Data' : 'የእህል ሌጅሮችን ከደመና መልስ'}</h5>
                <p className="text-xs text-slate-300 leading-normal">
                  {lang === 'en' ? 'Fetch the previous backup packet from Google Drive and replace your active local workspace data.' : 'ያለፈውን የምትኬ ጥቅል ከእርስዎ የጎግል ድራይቭ ዳታቤዝ ላይ በማምጣት የአሁኑን የመስሪያ ቦታ መዝገብ ሙሉ በሙሉ ይተኩ።'}
                </p>
                <button
                  onClick={triggerRestoreFromDrive}
                  disabled={isRestoreActionPending}
                  className="w-full inline-flex items-center justify-center gap-2 bg-[#1a2336] hover:bg-[#202b40] border border-slate-800 disabled:bg-slate-800 cursor-pointer text-slate-200 font-bold text-xs py-2 px-3 rounded-lg active:scale-95 transition-all disabled:cursor-not-allowed"
                  id="btn-trigger-cloud-restore"
                >
                  {isRestoreActionPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                  ) : (
                    <RotateCcw className="w-3.5 h-3.5" />
                  )}
                  <span>{t.restoreNow}</span>
                </button>
              </div>

            </div>

            {/* Auto background sync checkbox */}
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-indigo-950/10 border border-indigo-500/10">
              <input
                type="checkbox"
                id="checkbox-autosync-indicator"
                checked={autoSyncEnabled}
                onChange={(e) => setAutoSyncEnabled(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 bg-[#0b0f17] text-indigo-600 focus:ring-indigo-500 focus:ring-offset-[#0f1422] mt-1 shrink-0 cursor-pointer"
              />
              <div>
                <label htmlFor="checkbox-autosync-indicator" className="text-xs font-bold text-slate-200 cursor-pointer">
                  {t.autoSync}
                </label>
                <p className="text-[10px] text-slate-400 mt-1 leading-normal">{t.autoSyncHelp}</p>
              </div>
            </div>

          </div>
        )}

        {/* Developer Custom Client ID options collapsible */}
        <div className="pt-2 border-t border-slate-800/40">
          <details className="group">
            <summary className="list-none flex items-center justify-between text-xs text-slate-400 group-open:text-slate-200 cursor-pointer font-bold select-none py-1">
              <span>{t.customClientId}</span>
              <span className="transition group-open:rotate-180 text-slate-500 text-[10px]">▼</span>
            </summary>
            
            <div className="mt-3 bg-[#141b2c]/80 rounded-xl p-4 border border-slate-800 space-y-3 group-open:animate-in group-open:slide-in-from-top-2 duration-200" id="custom-oauth-id-wrapper">
              <div>
                <p className="text-[10px] text-slate-400 leading-normal mb-2.5">
                  {t.clientIdHelp}
                </p>
                <input
                  type="text"
                  value={customClientId}
                  onChange={(e) => setCustomClientId(e.target.value)}
                  placeholder={`Default: ${DEFAULT_CLIENT_ID.substring(0, 20)}...`}
                  className="w-full bg-[#0b0f17] border border-slate-700 rounded-lg p-2 font-mono text-[11px] text-slate-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  id="input-custom-oauth-client-id"
                />
              </div>
              <button
                type="button"
                onClick={handleSaveCustomClientId}
                className="bg-slate-850 hover:bg-slate-800 text-slate-300 text-[11.5px] border border-slate-700 font-bold px-3.5 py-1.5 rounded-lg active:scale-95 transition-all cursor-pointer"
                id="btn-save-custom-client-id"
              >
                {lang === 'en' ? 'Save Client ID' : 'አስቀምጥ'}
              </button>
            </div>
          </details>
        </div>
      </section>

      {/* 3. Offline backup / manual local file export and import */}
      <section className="bg-[#0f1422] border border-[#1f293d] rounded-2xl p-6 shadow-md space-y-4" id="section-offline-export">
        <div className="space-y-1">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <FileJson className="w-4 h-4 text-cyan-400" />
            {t.localExport}
          </h3>
          <p className="text-xs text-slate-400">{t.localExportSubtitle}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Download JSON Button */}
          <button
            onClick={triggerLocalJsonDownload}
            className="p-4 rounded-xl border border-slate-800 bg-[#141b2c] text-slate-200 hover:text-white hover:border-slate-700 flex flex-col justify-between items-start text-left cursor-pointer transition-all active:scale-98"
            id="btn-local-export-json-file"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <div className="mt-4">
              <span className="font-bold text-sm block">{t.downloadJson}</span>
              <span className="text-[10px] text-slate-400 mt-1 block">
                {lang === 'en' ? 'Download a .json backup file of your tables' : 'ሁሉንም ሰንጠረዦች የያዘ የአካባቢ .json ፋይል ያውርዱ'}
              </span>
            </div>
          </button>

          {/* Upload JSON file block */}
          <label
            className="p-4 rounded-xl border border-slate-800 bg-[#141b2c] text-slate-200 hover:text-white hover:border-slate-700 flex flex-col justify-between items-start text-left cursor-pointer transition-all active:scale-98"
            id="label-local-import-json-file"
          >
            <Upload className="w-4 h-4 text-indigo-400" />
            <div className="mt-4">
              <span className="font-bold text-sm block">{t.uploadJson}</span>
              <span className="text-[10px] text-slate-400 mt-1 block">
                {lang === 'en' ? 'Select and import a prior DforDani JSON backup' : 'ከዚህ ቀደም የተቀመጠ የDforDani .json ምትኬን መርጠው ያስገቡ'}
              </span>
            </div>
            <input
              type="file"
              accept=".json"
              onChange={triggerLocalJsonUpload}
              className="hidden"
              id="input-raw-json-import-selector"
            />
          </label>
        </div>
      </section>

      {/* 4. About App & Developer Segment */}
      <section className="bg-[#0f1422] border border-[#1f293d] rounded-2xl p-6 shadow-md space-y-6" id="section-about">
        
        {/* Profile Card Header with App details */}
        <div className="flex flex-col md:flex-row gap-5 items-center md:items-start border-b border-slate-800/60 pb-5">
          {/* Logo center block */}
          <div className="bg-[#141b2c] p-4 rounded-2xl border border-slate-800 shadow" id="about-logo-wrapper">
            <AppLogo size="lg" showText={false} />
          </div>

          <div className="space-y-2 text-center md:text-left">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <h3 className="text-xl font-black text-white">DforDani App</h3>
              <span className="bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">
                Grain ERP v2.4.1
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
              {t.aboutApp}
            </p>
          </div>
        </div>

        {/* Technical Key-Values Details table */}
        <div className="space-y-3" id="about-technical-specifications">
          <h4 className="text-xs font-black text-slate-300 uppercase tracking-widest">{t.about}</h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            
            {/* Entry: App Name */}
            <div className="bg-[#141b2c]/40 p-3 rounded-xl border border-slate-800/40 flex justify-between items-center text-xs">
              <span className="text-slate-400 font-medium">{t.appName}</span>
              <span className="text-white font-black">DforDani App</span>
            </div>

            {/* Entry: App Version */}
            <div className="bg-[#141b2c]/40 p-3 rounded-xl border border-slate-800/40 flex justify-between items-center text-xs">
              <span className="text-slate-400 font-medium">{t.appVersion}</span>
              <span className="text-white font-mono font-bold">2.4.1</span>
            </div>

            {/* Entry: Developer Name */}
            <div className="bg-[#141b2c]/40 p-3 rounded-xl border border-slate-800/40 flex justify-between items-center text-xs">
              <span className="text-slate-400 font-medium">{t.developer}</span>
              <span className="text-white font-semibold flex items-center gap-1.5 font-bold">
                <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                Daniel Dejene
              </span>
            </div>

            {/* Entry: Developer Phone */}
            <div className="bg-[#141b2c]/40 p-3 rounded-xl border border-slate-800/40 flex justify-between items-center text-xs">
              <span className="text-slate-400 font-medium">{t.devPhone}</span>
              <a 
                href="tel:0912122244"
                className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 font-bold transition-colors"
                id="developer-phone-action-call"
              >
                <Phone className="w-3.5 h-3.5" />
                0912122244
              </a>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
}
