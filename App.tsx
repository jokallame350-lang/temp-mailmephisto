import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import AddressBar from './components/AddressBar';
import EmailList from './components/EmailList';
import EmailViewer from './components/EmailViewer';
import CustomAddressModal from './components/CustomAddressModal';
import Footer from './components/Footer';
import { Mailbox, EmailSummary, EmailDetail } from './types';
import { generateMailbox, createCustomMailbox, getMessages, getMessageDetail, deleteMessage } from './services/mailService';
import { RefreshCw } from 'lucide-react';
import { SEOContent } from './components/SEOContent';
import { CookieConsent } from './components/CookieConsent';

const App: React.FC = () => {
  // State
  const [accounts, setAccounts] = useState<Mailbox[]>([]);
  const [activeAccountId, setActiveAccountId] = useState<string | null>(null);
  const [emails, setEmails] = useState<EmailSummary[]>([]);
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [currentEmailDetail, setCurrentEmailDetail] = useState<EmailDetail | null>(null);
  const [showCustomModal, setShowCustomModal] = useState(false);
  
  // Loading States
  const [isLoadingAccount, setIsLoadingAccount] = useState(false);
  const [isLoadingEmails, setIsLoadingEmails] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Theme State
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  const STORAGE_KEY = 'nexus_accounts_v3';

  // --- Initialization ---
  useEffect(() => {
    const savedAccounts = localStorage.getItem(STORAGE_KEY);
    if (savedAccounts) {
      try {
        const parsed = JSON.parse(savedAccounts);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setAccounts(parsed);
          setActiveAccountId(parsed[0].id);
        } else {
          createAccount();
        }
      } catch {
        createAccount();
      }
    } else {
      createAccount();
    }
  }, []);

  useEffect(() => {
    if (accounts.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
    }
  }, [accounts]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.add('dark');
  }, []);

  // --- Account Management ---
  const activeAccount = accounts.find(a => a.id === activeAccountId) || null;

  const createAccount = async () => {
    setIsLoadingAccount(true);
    setError(null);
    try {
      const newMailbox = await generateMailbox();
      setAccounts(prev => [newMailbox, ...prev]);
      setActiveAccountId(newMailbox.id);
      setEmails([]);
      setSelectedEmailId(null);
      setCurrentEmailDetail(null);
    } catch (e: any) {
      setError("Connection Error. Try Retrying.");
    } finally {
      setIsLoadingAccount(false);
    }
  };

  const handleCreateCustom = async (username: string, domain: string, apiBase: string) => {
    const newMailbox = await createCustomMailbox(username, domain, apiBase);
    setAccounts(prev => [newMailbox, ...prev]);
    setActiveAccountId(newMailbox.id);
    setEmails([]);
    setSelectedEmailId(null);
  };

  const switchAccount = (id: string) => {
    setActiveAccountId(id);
    setSelectedEmailId(null);
    setEmails([]);
  };

  const deleteAccount = (id: string) => {
    const newAccounts = accounts.filter(a => a.id !== id);
    setAccounts(newAccounts);
    if (newAccounts.length > 0) {
      if (activeAccountId === id) {
        switchAccount(newAccounts[0].id);
      }
    } else {
      localStorage.removeItem(STORAGE_KEY);
      createAccount(); 
    }
  };

  // --- Email Logic ---
  const fetchEmails = useCallback(async () => {
    if (!activeAccount) return;
    setIsLoadingEmails(prev => prev || true); 
    try {
      const fetchedEmails = await getMessages(activeAccount);
      if (fetchedEmails) {
        setEmails(prev => {
          if (fetchedEmails.length === 0 && prev.length === 0) return prev;
          if (fetchedEmails.length === prev.length && fetchedEmails[0]?.id === prev[0]?.id) return prev;
          
          const emailMap = new Map();
          fetchedEmails.forEach(e => emailMap.set(e.id, e));
          return Array.from(emailMap.values()).sort((a, b) => Number(b.id) - Number(a.id));
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingEmails(false);
    }
  }, [activeAccount]);

  useEffect(() => {
    fetchEmails(); 
    const interval = setInterval(fetchEmails, 6000); 
    return () => clearInterval(interval);
  }, [fetchEmails]);

  useEffect(() => {
    if (!selectedEmailId || !activeAccount) return;
    const fetchDetail = async () => {
      setIsLoadingDetail(true);
      try {
        const detail = await getMessageDetail(activeAccount, selectedEmailId);
        setCurrentEmailDetail(detail);
      } catch (e) { console.error(e); } finally { setIsLoadingDetail(false); }
    };
    fetchDetail();
  }, [selectedEmailId, activeAccount]);

  // --- Actions ---
  const handleDeleteEmail = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activeAccount) return;
    setEmails(prev => prev.filter(email => email.id !== id));
    if (selectedEmailId === id) setSelectedEmailId(null);
    await deleteMessage(activeAccount, id);
  };

  const handleDeleteAll = async () => {
    if (!activeAccount) return;
    const list = [...emails];
    setEmails([]);
    setSelectedEmailId(null);
    for (const email of list) { await deleteMessage(activeAccount, email.id); }
  };

  const isMobileDetailView = !!selectedEmailId;

  return (
    <div className="min-h-screen flex flex-col font-sans bg-mephisto-gradient text-slate-200">
      
      <Header 
        accounts={accounts} 
        currentAccount={activeAccount}
        onSwitchAccount={switchAccount}
        onNewAccount={createAccount}
        onNewCustomAccount={() => setShowCustomModal(true)}
        onDeleteAccount={deleteAccount}
        theme={'dark'}
        toggleTheme={() => {}}
      />

      <CustomAddressModal 
        isOpen={showCustomModal} 
        onClose={() => setShowCustomModal(false)}
        onCreate={handleCreateCustom}
      />

      {/* --- HERO SECTION (YENİLENDİ) --- */}
      <div className="w-full bg-slate-900/30 border-b border-white/5 pt-12 pb-14 px-4 relative">
          <div className="max-w-3xl mx-auto text-center space-y-8 relative z-10">
              
              <div>
                <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-4 tracking-tighter">
                    The Ultimate Shield <br/> 
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">For Your Privacy.</span>
                </h1>
                <p className="text-slate-400 text-base md:text-lg max-w-xl mx-auto leading-relaxed">
                   Instantly generate disposable email addresses to stay anonymous and protect your personal inbox from spam.
                </p>
              </div>

              <AddressBar 
                  mailbox={activeAccount} 
                  isLoading={isLoadingAccount} 
                  isRefreshing={isLoadingEmails}
                  onRefresh={fetchEmails}
                  onChange={createAccount} // "New" butonu random üretir
                  onDelete={() => activeAccount && deleteAccount(activeAccount.id)}
                  onCreateCustom={() => setShowCustomModal(true)} // Custom modalı açar
              />

          </div>
      </div>

      <main className="flex-grow container mx-auto px-0 md:px-6 py-0 md:py-8 max-w-7xl flex flex-col">
        
        <div className="flex-grow grid grid-cols-1 md:grid-cols-12 gap-0 md:gap-6 relative">
          <div className={`
            md:col-span-4 flex flex-col h-[600px]
            ${isMobileDetailView ? 'hidden md:flex' : 'flex'}
          `}>
             <div className="flex items-center justify-between mb-3 px-4 md:px-0">
                <h3 className="text-sm md:text-base font-semibold text-slate-300 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    Live Inbox
                </h3>
                {isLoadingEmails && <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-500" />}
             </div>

            <div className="bg-black/40 backdrop-blur-xl border border-white/5 rounded-none md:rounded-2xl h-full overflow-hidden shadow-2xl shadow-black/50">
              <EmailList 
                emails={emails} 
                selectedId={selectedEmailId} 
                onSelect={setSelectedEmailId}
                onDelete={handleDeleteEmail}
                onDeleteAll={handleDeleteAll}
                loading={isLoadingEmails}
              />
            </div>
          </div>

          <div className={`
            md:col-span-8 h-[600px]
            ${isMobileDetailView ? 'flex flex-col' : 'hidden md:flex'}
          `}>
             <div className="h-full bg-black/40 backdrop-blur-xl border border-white/5 rounded-none md:rounded-2xl overflow-hidden shadow-2xl shadow-black/50 flex flex-col">
                <EmailViewer 
                  email={currentEmailDetail} 
                  loading={isLoadingDetail} 
                  onBack={() => setSelectedEmailId(null)}
                />
             </div>
          </div>
        </div>
      </main>
      
      <SEOContent />
      <CookieConsent />
      <Footer />
    </div>
  );
};

export default App;
