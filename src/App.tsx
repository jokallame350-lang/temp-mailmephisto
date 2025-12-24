import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import AddressBar from './components/AddressBar';
import EmailList from './components/EmailList';
import EmailViewer from './components/EmailViewer';
import CustomAddressModal from './components/CustomAddressModal';
import Footer from './components/Footer';
import PersonaModal from './components/PersonaModal';
import QRCodeModal from './components/QRCodeModal';
import PasswordGenModal from './components/PasswordGenModal';
import LimitModal from './components/LimitModal';
import { SEOContent } from './components/SEOContent'; 

import { Mailbox, EmailSummary, EmailDetail } from './types';
import { generateMailbox, createCustomMailbox, getMessages, getMessageDetail, deleteMessage, fetchDomains } from './services/mailService';
import { Terminal, Activity } from 'lucide-react';
import { translations, Language } from './translations';

const REFRESH_INTERVAL = 7000; 
const MAX_ACTIVE_ACCOUNTS = 3; 
const DAILY_CREATION_LIMIT = 5; 

const App: React.FC = () => {
  // --- TEMA VE DİL AYARLARI (EN ÜSTTE) ---
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [lang, setLang] = useState<Language>('en');
  const t = translations[lang];

  // EKSİK OLAN FONKSİYON BU:
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('mephisto_theme', newTheme);
  };

  // Tema Başlangıç Ayarı
  useEffect(() => {
    const root = window.document.documentElement;
    const savedTheme = localStorage.getItem('mephisto_theme') as 'dark' | 'light';
    
    if (savedTheme) {
      setTheme(savedTheme);
      root.classList.remove('dark', 'light');
      root.classList.add(savedTheme);
    } else {
      root.classList.add('dark'); // Varsayılan Dark
    }
  }, []);

  // Theme state değişince class'ı güncelle
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('dark', 'light');
    root.classList.add(theme);
  }, [theme]);

  // --- STATE TANIMLARI ---
  const [accounts, setAccounts] = useState<Mailbox[]>([]);
  const [activeAccountId, setActiveAccountId] = useState<string | null>(null);
  const [emails, setEmails] = useState<EmailSummary[]>([]);
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [currentEmailDetail, setCurrentEmailDetail] = useState<EmailDetail | null>(null);
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [availableDomains, setAvailableDomains] = useState<string[]>([]);

  // Modallar
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [showPersonaModal, setShowPersonaModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showPassModal, setShowPassModal] = useState(false);
  
  // Limit Modal
  const [limitModal, setLimitModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'daily' | 'capacity';
  }>({ isOpen: false, title: '', message: '', type: 'daily' });
  
  const [isLoadingAccount, setIsLoadingAccount] = useState(false);
  const [isLoadingEmails, setIsLoadingEmails] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [progress, setProgress] = useState(0); 
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [error, setError] = useState<string | null>(null);

  const STORAGE_KEY = 'nexus_accounts_v4_mailtm';
  const LIMIT_KEY = 'nexus_daily_limit_v1';
  const activeAccount = accounts.find(a => a.id === activeAccountId) || null;

  // --- LIMIT KONTROL ---
  const checkDailyLimit = (): boolean => {
    const today = new Date().toDateString(); 
    const rawData = localStorage.getItem(LIMIT_KEY);
    let usage = { date: today, count: 0 };
    if (rawData) {
      const parsed = JSON.parse(rawData);
      if (parsed.date === today) usage = parsed;
    }
    return usage.count < DAILY_CREATION_LIMIT;
  };

  const incrementDailyLimit = () => {
    const today = new Date().toDateString();
    const rawData = localStorage.getItem(LIMIT_KEY);
    let usage = { date: today, count: 0 };
    if (rawData) {
      const parsed = JSON.parse(rawData);
      if (parsed.date === today) usage = parsed;
    }
    usage.count += 1;
    localStorage.setItem(LIMIT_KEY, JSON.stringify(usage));
  };

  const showLimitAlert = (type: 'daily' | 'capacity') => {
    setLimitModal({
      isOpen: true, 
      type,
      title: type === 'daily' ? t.limitDailyTitle : t.limitCapacityTitle,
      message: type === 'daily' ? t.limitDailyMsg : t.limitCapacityMsg
    });
  };

  // --- KISAYOLLAR ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      switch(e.key.toLowerCase()) {
        case 'r': fetchEmails(); break;
        case 'c': if (activeAccount) navigator.clipboard.writeText(activeAccount.address); break;
        case 'n': createAccount(); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeAccount, accounts]);

  useEffect(() => { fetchDomains().then(data => setAvailableDomains(data.domains)); }, []);
  
  useEffect(() => {
    const step = 100 / (REFRESH_INTERVAL / 100);
    const timer = setInterval(() => setProgress(p => (p >= 100 ? 0 : p + step)), 100);
    return () => clearInterval(timer);
  }, []);

  // --- ACTIONS ---
  const createAccount = async () => {
    if (accounts.length >= MAX_ACTIVE_ACCOUNTS) { showLimitAlert('capacity'); return; }
    if (!checkDailyLimit()) { showLimitAlert('daily'); return; }

    setIsLoadingAccount(true);
    try {
      const newMailbox = await generateMailbox();
      if (newMailbox.id === 'error') { alert(t.connFailed); return; }
      incrementDailyLimit();
      setAccounts(prev => [newMailbox, ...prev]);
      setActiveAccountId(newMailbox.id);
      setEmails([]);
      setDeletedIds(new Set());
      setSelectedEmailId(null);
      setCurrentEmailDetail(null);
    } catch { alert(t.connError); } finally { setIsLoadingAccount(false); }
  };

  const deleteAccount = (id: string) => {
    const newAccounts = accounts.filter(a => a.id !== id);
    setAccounts(newAccounts);
    if (newAccounts.length > 0) {
      if (activeAccountId === id) setActiveAccountId(newAccounts[0].id);
    } else {
      localStorage.removeItem(STORAGE_KEY);
      setActiveAccountId(null);
    }
  };

  const handleDomainChange = async (newDomain: string) => {
    if (!activeAccount) return;
    if (!checkDailyLimit()) { showLimitAlert('daily'); return; }
    const username = activeAccount.address.split('@')[0];
    setIsLoadingAccount(true);
    try {
      const newMailbox = await createCustomMailbox(username, newDomain, 'mail_tm');
      incrementDailyLimit();
      setAccounts(prev => prev.map(acc => acc.id === activeAccountId ? newMailbox : acc));
      setActiveAccountId(newMailbox.id);
      setEmails([]);
      setDeletedIds(new Set());
      setSelectedEmailId(null);
    } catch { alert(t.errorDomain); } finally { setIsLoadingAccount(false); }
  };

  const handleCreateCustom = async (username: string, domain: string, apiBase: string) => {
    if (accounts.length >= MAX_ACTIVE_ACCOUNTS) { showLimitAlert('capacity'); setShowCustomModal(false); return; }
    if (!checkDailyLimit()) { showLimitAlert('daily'); setShowCustomModal(false); return; }

    setIsLoadingAccount(true);
    try {
      const newMailbox = await createCustomMailbox(username, domain, apiBase);
      incrementDailyLimit();
      setAccounts(prev => [newMailbox, ...prev]);
      setActiveAccountId(newMailbox.id);
      setEmails([]);
      setDeletedIds(new Set());
      setSelectedEmailId(null);
      setShowCustomModal(false);
    } catch { alert(t.usernameTaken); } finally { setIsLoadingAccount(false); }
  };

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) { try {
        const parsed = JSON.parse(saved);
        if (parsed.length > 0) { setAccounts(parsed); setActiveAccountId(parsed[0].id); }
      } catch {} }
  }, []);

  useEffect(() => { if (accounts.length > 0) localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts)); }, [accounts]);

  const fetchEmails = useCallback(async () => {
    if (!activeAccount) return;
    try {
      const fetched = await getMessages(activeAccount);
      if (fetched) {
        setEmails(prev => {
          const m = new Map(); fetched.forEach(e => m.set(e.id, e));
          return Array.from(m.values()).filter(e => !deletedIds.has(e.id)).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        });
        setProgress(0);
      }
    } catch {}
  }, [activeAccount, deletedIds]);

  useEffect(() => { fetchEmails(); const i = setInterval(fetchEmails, REFRESH_INTERVAL); return () => clearInterval(i); }, [fetchEmails]);

  // Sayfa Başlığı Çevirisi
  useEffect(() => {
    const unreadCount = emails.length;
    if (unreadCount > 0) {
      document.title = `(${unreadCount}) Mephisto Mail`;
    } else {
      document.title = lang === 'tr' ? "Mephisto Mail - Gizlilik Kalkanı" : "Mephisto Mail - Privacy Shield";
    }
  }, [emails, lang]);

  useEffect(() => {
    const fetchDetail = async () => {
      if (!selectedEmailId || !activeAccount) { setCurrentEmailDetail(null); return; }
      setIsLoadingDetail(true);
      try {
        const d = await getMessageDetail(activeAccount, selectedEmailId);
        if (d) setCurrentEmailDetail(d);
      } catch {} finally { setIsLoadingDetail(false); }
    };
    fetchDetail();
  }, [selectedEmailId, activeAccount]);

  const handleDeleteEmail = async (id: string, e: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEmails(prev => prev.filter(email => email.id !== id));
    setDeletedIds(prev => new Set(prev).add(id));
    if (selectedEmailId === id) setSelectedEmailId(null);
    if (activeAccount) await deleteMessage(activeAccount, id);
  };

  const isMobileDetailView = !!selectedEmailId;

  return (
    <div className="min-h-screen flex flex-col font-['Sora'] bg-slate-50 dark:bg-[#050505] text-slate-900 dark:text-slate-200 overflow-x-hidden text-[13px] transition-colors duration-300">
      <Header 
        accounts={accounts} currentAccount={activeAccount} 
        onSwitchAccount={(id) => { setActiveAccountId(id); setDeletedIds(new Set()); setSelectedEmailId(null); }} 
        onNewAccount={createAccount} 
        onNewCustomAccount={() => {
           if (accounts.length >= MAX_ACTIVE_ACCOUNTS) { showLimitAlert('capacity'); return; }
           setShowCustomModal(true);
        }} 
        onDeleteAccount={deleteAccount} 
        theme={theme} toggleTheme={toggleTheme} lang={lang} setLang={setLang}
        onOpenQR={() => setShowQRModal(true)} onOpenPass={() => setShowPassModal(true)}
      />
      
      <PersonaModal isOpen={showPersonaModal} onClose={() => setShowPersonaModal(false)} currentEmail={activeAccount?.address} />
      
      <QRCodeModal isOpen={showQRModal} onClose={() => setShowQRModal(false)} email={activeAccount?.address || ''} lang={lang} />
      <PasswordGenModal isOpen={showPassModal} onClose={() => setShowPassModal(false)} lang={lang} />
      <LimitModal isOpen={limitModal.isOpen} onClose={() => setLimitModal(p => ({ ...p, isOpen: false }))} title={limitModal.title} message={limitModal.message} type={limitModal.type} lang={lang} />

      <main className="flex-grow flex flex-col items-center justify-start pt-6 pb-8 px-4 gap-5">
        <div className="w-full max-w-3xl flex flex-col items-center text-center space-y-3 animate-in fade-in slide-in-from-top-4 duration-500">
           <div className="space-y-1 flex flex-col items-center">
              <div className="h-5 inline-flex items-center gap-1.5 px-2 rounded border border-red-500/20 bg-red-50 dark:bg-red-500/5 text-red-600 dark:text-red-400 text-[9px] font-bold uppercase tracking-widest">
                <Activity className="w-2.5 h-2.5" /> {t.systemActive}
              </div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                {t.heroTitle} <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-600 dark:from-red-500 dark:to-orange-500">{t.heroSubtitle}</span>
              </h1>
           </div>

           {accounts.length === 0 ? (
             <div className="p-8 border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-[#0a0a0c] text-center space-y-4 animate-in fade-in zoom-in duration-300 shadow-xl dark:shadow-none">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t.noAccountTitle}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs mx-auto">{t.noAccountDesc}</p>
                <button onClick={createAccount} className="px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white font-bold rounded-lg hover:shadow-lg hover:shadow-red-500/20 transition-all active:scale-95">
                  {t.generateBtn}
                </button>
             </div>
           ) : (
             <AddressBar 
               mailbox={activeAccount} isLoading={isLoadingAccount} isRefreshing={isLoadingEmails} 
               onRefresh={() => fetchEmails()} onChange={createAccount} onDelete={() => activeAccount && deleteAccount(activeAccount.id)} 
               onDomainChange={handleDomainChange} domains={availableDomains} progress={progress} 
               lang={lang}
             />
           )}
        </div>

        {accounts.length > 0 && (
          <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-12 gap-3 h-[500px]">
            <div className={`md:col-span-4 flex flex-col ${isMobileDetailView ? 'hidden md:flex' : 'flex'}`}>
               <div className="flex-grow bg-white dark:bg-[#0a0a0c] border border-gray-200 dark:border-white/5 rounded-lg overflow-hidden relative shadow-xl dark:shadow-2xl">
                  <div className="absolute inset-0 overflow-y-auto">
                    <EmailList emails={emails} selectedId={selectedEmailId} onSelect={(id) => setSelectedEmailId(id)} onDelete={handleDeleteEmail} onDeleteAll={() => setEmails([])} loading={isLoadingEmails} lang={lang} />
                  </div>
               </div>
            </div>

            <div className={`md:col-span-8 flex flex-col ${isMobileDetailView ? 'flex' : 'hidden md:flex'}`}>
               <div className="flex-grow bg-white dark:bg-[#0a0a0c] border border-gray-200 dark:border-white/5 rounded-lg overflow-hidden relative shadow-xl dark:shadow-2xl flex flex-col">
                  {!selectedEmailId ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 dark:text-slate-800 pointer-events-none">
                          <Terminal className="w-10 h-10 mb-2 opacity-20" />
                          <span className="text-[9px] uppercase tracking-[0.2em] font-mono">{t.awaitingSignal}</span>
                      </div>
                  ) : (
                      <EmailViewer email={currentEmailDetail} loading={isLoadingDetail} onBack={() => setSelectedEmailId(null)} lang={lang} />
                  )}
               </div>
            </div>
          </div>
        )}
      </main>

      <div className="w-full bg-slate-50 dark:bg-[#050505] transition-colors duration-300">
         <SEOContent lang={lang} />
      </div>
      
      <Footer lang={lang} />
      <CustomAddressModal isOpen={showCustomModal} onClose={() => setShowCustomModal(false)} onCreate={handleCreateCustom} lang={lang} />
    </div>
  );
};

export default App;