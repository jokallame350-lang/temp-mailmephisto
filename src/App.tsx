import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from './components/Header';
import AddressBar from './components/AddressBar';
import EmailList from './components/EmailList';
import EmailViewer from './components/EmailViewer';
import PremiumModal from './components/PremiumModal';
import Footer from './components/Footer';
import PersonaModal from './components/PersonaModal';
import { Mailbox, EmailSummary, EmailDetail } from './types';
import { generateMailbox, getMessages, getMessageDetail } from './services/mailService';
import { Activity, Terminal } from 'lucide-react';
import { SEOContent } from './components/SEOContent';
import { Language } from './translations';

const App: React.FC = () => {
  const [accounts, setAccounts] = useState<Mailbox[]>([]);
  const [activeAccountId, setActiveAccountId] = useState<string | null>(null);
  const [emails, setEmails] = useState<EmailSummary[]>([]);
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [currentEmailDetail, setCurrentEmailDetail] = useState<EmailDetail | null>(null);
  const [deletedIds] = useState<Set<string>>(new Set());
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showPersonaModal, setShowPersonaModal] = useState(false);
  const [isLoadingAccount, setIsLoadingAccount] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [progress, setProgress] = useState(0);
  const [lang, setLang] = useState<Language>('en');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isPremium] = useState(false);
  const [isFireTransition, setIsFireTransition] = useState(false);
  const previousEmailCountRef = useRef(0);

  const STORAGE_KEY = 'nexus_accounts_v5';
  const activeAccount = accounts.find(a => a.id === activeAccountId) || null;

  // --- TEMA VE BİLDİRİM MANTIĞI ---
  const playNotificationSound = () => {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audio.play().catch(() => {});
  };

  const toggleThemeWithFire = () => {
    setIsFireTransition(true);
    setTimeout(() => setTheme(prev => prev === 'dark' ? 'light' : 'dark'), 400);
    setTimeout(() => setIsFireTransition(false), 800);
  };

  useEffect(() => {
    const root = document.documentElement;
    theme === 'dark' ? root.classList.add('dark') : root.classList.remove('dark');
  }, [theme]);

  // --- HESAP YÖNETİMİ ---
  const createQuickAccount = async () => {
    if (!isPremium && accounts.length >= 3) { setShowPremiumModal(true); return; }
    setIsLoadingAccount(true);
    try {
      const newMailbox = await generateMailbox();
      setAccounts(prev => [newMailbox, ...prev]);
      setActiveAccountId(newMailbox.id);
      previousEmailCountRef.current = 0;
    } catch (e) { console.error(e); } finally { setIsLoadingAccount(false); }
  };

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.length > 0) { setAccounts(parsed); setActiveAccountId(parsed[0].id); }
        else createQuickAccount();
      } catch { createQuickAccount(); }
    } else createQuickAccount();
  }, []);

  useEffect(() => { if (accounts.length > 0) localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts)); }, [accounts]);

  // --- MAİL ÇEKME ---
  const fetchEmails = useCallback(async () => {
    if (!activeAccount) return;
    try {
      const fetched = await getMessages(activeAccount);
      if (fetched) {
        const filtered = fetched.filter(e => !deletedIds.has(e.id));
        if (filtered.length > previousEmailCountRef.current && previousEmailCountRef.current !== 0) {
          playNotificationSound();
          if (Notification.permission === "granted") {
            new Notification("Mephisto", { body: lang === 'tr' ? "Yeni mesaj!" : "New message!", icon: "/logo.png" });
          }
        }
        previousEmailCountRef.current = filtered.length;
        setEmails(filtered.sort((a, b) => Number(b.id) - Number(a.id)));
      }
      setProgress(0);
    } catch { }
  }, [activeAccount, deletedIds, lang]);

  useEffect(() => {
    fetchEmails();
    const pInt = setInterval(() => setProgress(prev => prev >= 100 ? 0 : prev + 1.5), 100);
    const dInt = setInterval(fetchEmails, 7000);
    return () => { clearInterval(pInt); clearInterval(dInt); };
  }, [fetchEmails]);

  useEffect(() => {
    const fetchDet = async () => {
      if (!selectedEmailId || !activeAccount) { setCurrentEmailDetail(null); return; }
      setIsLoadingDetail(true);
      try {
        const det = await getMessageDetail(activeAccount, selectedEmailId);
        if (det) setCurrentEmailDetail(det);
      } catch { } finally { setIsLoadingDetail(false); }
    };
    fetchDet();
  }, [selectedEmailId, activeAccount]);

  return (
    <div className={`min-h-screen flex flex-col font-['Sora'] transition-colors duration-500 ${theme === 'dark' ? 'bg-[#050505] text-slate-200' : 'bg-slate-50 text-slate-900'} overflow-x-hidden`}>
      
      {/* ALEV GEÇİŞ KATMANI */}
      <div className={`fire-transition-overlay ${isFireTransition ? 'fire-transition-active' : ''}`} />

      <Header 
        accounts={accounts} 
        currentAccount={activeAccount} 
        onSwitchAccount={setActiveAccountId} 
        onNewAccount={createQuickAccount} 
        onOpenPremium={() => setShowPremiumModal(true)} 
        theme={theme} 
        toggleTheme={toggleThemeWithFire} 
        lang={lang} 
        setLang={setLang} 
      />

      <PremiumModal isOpen={showPremiumModal} onClose={() => setShowPremiumModal(false)} />
      <PersonaModal isOpen={showPersonaModal} onClose={() => setShowPersonaModal(false)} currentEmail={activeAccount?.address} />
      
      <main className="flex-grow flex flex-col items-center justify-start pt-8 px-4 gap-8 w-full max-w-7xl mx-auto z-10">
        <div className="w-full max-w-3xl flex flex-col items-center text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-red-500/20 bg-red-500/5 text-red-500 text-[10px] font-black uppercase tracking-widest animate-pulse">
            <Activity className="w-3 h-3" /> System Active
          </div>
          <h1 className="text-2xl md:text-4xl font-black dark:text-white tracking-tighter italic uppercase">
            The Ultimate Shield <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-600">For Your Privacy.</span>
          </h1>
          <AddressBar 
            mailbox={activeAccount} 
            isLoading={isLoadingAccount} 
            onRefresh={fetchEmails} 
            lang={lang} 
          />
        </div>

        <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-6 pb-12">
          <div className={`md:col-span-4 flex flex-col ${selectedEmailId ? 'hidden md:flex' : 'flex'}`}>
            <div className="bg-white dark:bg-[#0a0a0c] border border-gray-200 dark:border-white/5 rounded-[24px] overflow-hidden shadow-2xl flex flex-col min-h-[500px]">
              <div className="flex justify-between items-center px-6 py-4 bg-slate-50 dark:bg-white/[0.02] border-b dark:border-white/5">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Active Nodes</span>
                <span className={`text-[10px] font-black px-3 py-1 rounded-full ${isPremium ? 'text-green-500 bg-green-500/10' : 'text-red-500 bg-red-500/10'}`}>
                   {accounts.length} / {isPremium ? '15' : '3'}
                </span>
              </div>
              <EmailList emails={emails} selectedId={selectedEmailId} onSelect={setSelectedEmailId} loading={false} lang={lang} />
            </div>
          </div>
          
          <div className={`md:col-span-8 flex flex-col ${selectedEmailId ? 'flex' : 'hidden md:flex'}`}>
            <div className="bg-white dark:bg-[#0a0a0c] border border-gray-200 dark:border-white/5 rounded-[24px] overflow-hidden shadow-2xl flex flex-col min-h-[500px]">
              {!selectedEmailId ? (
                <div className="flex-grow flex flex-col items-center justify-center text-slate-400 dark:text-slate-800 p-12">
                  <Terminal className="w-12 h-12 mb-4 opacity-10" />
                  <span className="text-[10px] uppercase tracking-[0.3em] font-black italic">Awaiting Signal...</span>
                </div>
              ) : (
                <EmailViewer email={currentEmailDetail} loading={isLoadingDetail} onBack={() => setSelectedEmailId(null)} lang={lang} />
              )}
            </div>
          </div>
        </div>
        
        <SEOContent lang={lang} />
      </main>

      <Footer lang={lang} />
    </div>
  );
};

export default App;