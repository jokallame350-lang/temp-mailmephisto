import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from './components/Header';
import AddressBar from './components/AddressBar';
import EmailList from './components/EmailList';
import EmailViewer from './components/EmailViewer';
import CustomAddressModal from './components/CustomAddressModal';
import Footer from './components/Footer';
import PersonaModal from './components/PersonaModal';
import { Mailbox, EmailSummary, EmailDetail } from './types';
import { generateMailbox, createCustomMailbox, getMessages, getMessageDetail, deleteMessage } from './services/mailService';
import { Shield, Terminal, Activity } from 'lucide-react';
import { SEOContent } from './components/SEOContent'; 

const App: React.FC = () => {
  // --- State Yönetimi ---
  const [accounts, setAccounts] = useState<Mailbox[]>([]);
  const [activeAccountId, setActiveAccountId] = useState<string | null>(null);
  const [emails, setEmails] = useState<EmailSummary[]>([]);
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [currentEmailDetail, setCurrentEmailDetail] = useState<EmailDetail | null>(null);
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());

  const [showCustomModal, setShowCustomModal] = useState(false);
  const [showPersonaModal, setShowPersonaModal] = useState(false);
  
  const [isLoadingAccount, setIsLoadingAccount] = useState(false);
  const [isLoadingEmails, setIsLoadingEmails] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previousEmailCountRef = useRef(0);
  const STORAGE_KEY = 'nexus_accounts_v3';

  // --- Aktif Hesap ---
  const activeAccount = accounts.find(a => a.id === activeAccountId) || null;

  // --- Temel Fonksiyonlar ---
  const createAccount = async () => {
    setIsLoadingAccount(true);
    try {
      const newMailbox = await generateMailbox();
      setAccounts(prev => [newMailbox, ...prev]);
      setActiveAccountId(newMailbox.id);
      setEmails([]);
      setDeletedIds(new Set());
      setSelectedEmailId(null);
      setCurrentEmailDetail(null);
    } catch (e) { setError("Connection Error."); } finally { setIsLoadingAccount(false); }
  };

  const deleteAccount = (id: string) => {
    const newAccounts = accounts.filter(a => a.id !== id);
    setAccounts(newAccounts);
    if (newAccounts.length > 0) {
      if (activeAccountId === id) setActiveAccountId(newAccounts[0].id);
    } else {
      localStorage.removeItem(STORAGE_KEY);
      createAccount(); 
    }
  };

  const handleDomainChange = async (newDomain: string) => {
    if (!activeAccount) return;
    const username = activeAccount.address.split('@')[0];
    setIsLoadingAccount(true);
    try {
      const updatedMailbox = await createCustomMailbox(username, newDomain, 'shark_final');
      setAccounts(prev => prev.map(acc => acc.id === activeAccountId ? updatedMailbox : acc));
      setActiveAccountId(updatedMailbox.id);
      setEmails([]);
      setDeletedIds(new Set());
      setSelectedEmailId(null);
    } catch (e) { console.error("Domain change failed"); } finally { setIsLoadingAccount(false); }
  };

  const handleCreateCustom = async (username: string, domain: string, apiBase: string) => {
    setIsLoadingAccount(true);
    try {
      const newMailbox = await createCustomMailbox(username, domain, apiBase);
      setAccounts(prev => [newMailbox, ...prev]);
      setActiveAccountId(newMailbox.id);
      setEmails([]);
      setDeletedIds(new Set());
      setSelectedEmailId(null);
      setShowCustomModal(false);
    } catch (e) { console.error("Custom creation failed"); } finally { setIsLoadingAccount(false); }
  };

  // --- Veri Çekme Efektleri ---
  useEffect(() => {
    const savedAccounts = localStorage.getItem(STORAGE_KEY);
    if (savedAccounts) {
      try {
        const parsed = JSON.parse(savedAccounts);
        if (parsed.length > 0) { setAccounts(parsed); setActiveAccountId(parsed[0].id); }
        else { createAccount(); }
      } catch { createAccount(); }
    } else { createAccount(); }
    document.documentElement.classList.add('dark');
  }, []);

  const fetchEmails = useCallback(async () => {
    if (!activeAccount) return;
    try {
      const fetchedEmails = await getMessages(activeAccount);
      if (fetchedEmails) {
        setEmails(prev => {
          const filtered = fetchedEmails.filter(email => !deletedIds.has(email.id));
          const emailMap = new Map();
          filtered.forEach(e => emailMap.set(e.id, e));
          return Array.from(emailMap.values()).sort((a, b) => Number(b.id) - Number(a.id));
        });
      }
    } catch (e) { console.error("Silent Refresh fail"); }
  }, [activeAccount, deletedIds]);

  useEffect(() => {
    fetchEmails();
    const interval = setInterval(fetchEmails, 5000);
    return () => clearInterval(interval);
  }, [fetchEmails]);

  useEffect(() => {
    const fetchDetail = async () => {
      if (!selectedEmailId || !activeAccount) { setCurrentEmailDetail(null); return; }
      setIsLoadingDetail(true);
      try {
        const detail = await getMessageDetail(activeAccount, selectedEmailId);
        if (detail) setCurrentEmailDetail(detail);
      } catch (e) { console.error(e); } finally { setIsLoadingDetail(false); }
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
    <div className="min-h-screen flex flex-col font-['Sora'] bg-[#050505] text-slate-200 overflow-x-hidden text-[13px]">
      <Header accounts={accounts} currentAccount={activeAccount} onSwitchAccount={(id) => { setActiveAccountId(id); setDeletedIds(new Set()); setSelectedEmailId(null); }} onNewAccount={createAccount} onNewCustomAccount={() => setShowCustomModal(true)} onDeleteAccount={deleteAccount} theme={'dark'} toggleTheme={() => {}} />
      
      <PersonaModal isOpen={showPersonaModal} onClose={() => setShowPersonaModal(false)} currentEmail={activeAccount?.address} />

      <main className="flex-grow flex flex-col items-center justify-start pt-6 pb-8 px-4 gap-5">
        <div className="w-full max-w-3xl flex flex-col items-center text-center space-y-3 animate-in fade-in slide-in-from-top-4 duration-500">
           <div className="space-y-1 flex flex-col items-center">
              <div className="h-5 inline-flex items-center gap-1.5 px-2 rounded border border-red-500/20 bg-red-500/5 text-red-400 text-[9px] font-bold uppercase tracking-widest">
                <Activity className="w-2.5 h-2.5" /> System Active
              </div>
              <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                The Ultimate Shield <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">For Your Privacy.</span>
              </h1>
           </div>

           <AddressBar mailbox={activeAccount} isLoading={isLoadingAccount} isRefreshing={isLoadingEmails} onRefresh={() => fetchEmails()} onChange={createAccount} onDelete={() => activeAccount && deleteAccount(activeAccount.id)} onDomainChange={handleDomainChange} />
        </div>

        <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-12 gap-3 h-[500px]">
          <div className={`md:col-span-4 flex flex-col ${isMobileDetailView ? 'hidden md:flex' : 'flex'}`}>
             <div className="flex-grow bg-[#0a0a0c] border border-white/5 rounded-lg overflow-hidden relative shadow-2xl">
                <div className="absolute inset-0 overflow-y-auto">
                  <EmailList emails={emails} selectedId={selectedEmailId} onSelect={(id) => setSelectedEmailId(id)} onDelete={handleDeleteEmail} onDeleteAll={() => setEmails([])} loading={isLoadingEmails} />
                </div>
             </div>
          </div>

          <div className={`md:col-span-8 flex flex-col ${isMobileDetailView ? 'flex' : 'hidden md:flex'}`}>
             <div className="flex-grow bg-[#0a0a0c] border border-white/5 rounded-lg overflow-hidden relative shadow-2xl flex flex-col">
                {!selectedEmailId ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-800 pointer-events-none">
                        <Terminal className="w-10 h-10 mb-2 opacity-20" />
                        <span className="text-[9px] uppercase tracking-[0.2em] font-mono">Awaiting Signal...</span>
                    </div>
                ) : (
                    <EmailViewer email={currentEmailDetail} loading={isLoadingDetail} onBack={() => setSelectedEmailId(null)} />
                )}
             </div>
          </div>
        </div>
      </main>

      <div className="w-full bg-[#050505]">
         <SEOContent />
      </div>
      
      <Footer />

      <CustomAddressModal 
        isOpen={showCustomModal} 
        onClose={() => setShowCustomModal(false)} 
        onCreate={handleCreateCustom} 
      />
    </div>
  );
};

export default App;
