import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import AddressBar from './components/AddressBar';
import EmailList from './components/EmailList';
import EmailViewer from './components/EmailViewer';
import CustomAddressModal from './components/CustomAddressModal';
import Footer from './components/Footer';
import { Mailbox, EmailSummary, EmailDetail } from './types';
import { generateMailbox, createCustomMailbox, getMessages, getMessageDetail, deleteMessage } from './services/mailService';
import { RefreshCw } from 'lucide-react';

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

  const STORAGE_KEY = 'nexus_accounts_v2';

  // --- Initialization & Persistence ---

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
    root.classList.remove('dark', 'light');
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
      console.error(e);
      // More friendly error message
      if (e.message.includes('Connection failed')) {
         setError("Connection Error. Try Retrying.");
      } else {
         setError("Initialization Failed.");
      }
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
    setCurrentEmailDetail(null);
  };

  const switchAccount = (id: string) => {
    setActiveAccountId(id);
    setSelectedEmailId(null);
    setCurrentEmailDetail(null);
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

  const toggleTheme = () => {};

  // --- Email Logic ---

  useEffect(() => {
    if (!activeAccount) return;

    let isMounted = true;
    
    const fetchEmails = async () => {
      if (emails.length === 0) setIsLoadingEmails(true);

      try {
        const fetchedEmails = await getMessages(activeAccount);
        
        if (isMounted) {
          if (fetchedEmails === null) {
            // Error occurred silently in getMessages
            return;
          }

          setEmails(prev => {
            if (fetchedEmails.length === 0 && prev.length === 0) return prev;
            if (fetchedEmails.length === prev.length && fetchedEmails[0]?.id === prev[0]?.id) {
              return prev;
            }
            
            const emailMap = new Map();
            fetchedEmails.forEach(e => emailMap.set(e.id, e));
            const mergedList = Array.from(emailMap.values());
            return mergedList.sort((a, b) => Number(b.id) - Number(a.id));
          });
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (isMounted) setIsLoadingEmails(false);
      }
    };

    fetchEmails();
    const interval = setInterval(fetchEmails, 5000); 

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [activeAccount]);

  useEffect(() => {
    if (!selectedEmailId || !activeAccount) return;

    const fetchDetail = async () => {
      setIsLoadingDetail(true);
      try {
        const detail = await getMessageDetail(activeAccount, selectedEmailId);
        setCurrentEmailDetail(detail);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoadingDetail(false);
      }
    };

    fetchDetail();
  }, [selectedEmailId, activeAccount]);

  // --- Actions ---

  const handleDeleteEmail = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activeAccount) return;
    
    setEmails(prev => prev.filter(email => email.id !== id));
    if (selectedEmailId === id) {
      setSelectedEmailId(null);
      setCurrentEmailDetail(null);
    }

    await deleteMessage(activeAccount, id);
  };

  const handleDeleteAll = async () => {
    if (!activeAccount) return;
    
    const emailsToDelete = [...emails];
    setEmails([]);
    setSelectedEmailId(null);
    setCurrentEmailDetail(null);

    for (const email of emailsToDelete) {
      await deleteMessage(activeAccount, email.id);
    }
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
        theme={theme}
        toggleTheme={toggleTheme}
      />

      <CustomAddressModal 
        isOpen={showCustomModal} 
        onClose={() => setShowCustomModal(false)}
        onCreate={handleCreateCustom}
      />

      <main className="flex-grow container mx-auto px-0 md:px-6 py-0 md:py-8 max-w-7xl flex flex-col h-[calc(100vh-80px)] md:h-auto">
        
        {/* Error Retry Overlay for Address Bar */}
        <div className="hidden md:block p-4 md:p-0 mb-6 relative">
             <AddressBar 
              mailbox={activeAccount} 
              isLoading={isLoadingAccount} 
              error={error}
            />
            {error && (
              <div className="absolute top-1/2 right-4 -translate-y-1/2 z-20">
                <button 
                  onClick={createAccount}
                  className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg shadow-red-900/50 flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" /> Retry
                </button>
              </div>
            )}
        </div>

        {/* Mobile Error Retry */}
        <div className="md:hidden">
           {error && (
             <div className="bg-red-500/10 p-3 flex justify-between items-center text-red-200 text-sm">
                <span>{error}</span>
                <button onClick={createAccount} className="p-2 bg-red-600 text-white rounded-lg">
                  <RefreshCw className="w-4 h-4" />
                </button>
             </div>
           )}
        </div>

        <div className="flex-grow grid grid-cols-1 md:grid-cols-12 gap-0 md:gap-6 relative overflow-hidden md:overflow-visible">
          
          <div className={`
            md:col-span-4 flex flex-col h-full md:h-[650px]
            ${isMobileDetailView ? 'hidden md:flex' : 'flex'}
          `}>
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
            md:col-span-8 h-full md:h-[650px] absolute inset-0 md:relative z-20 md:z-auto
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
      
      <Footer />
    </div>
  );
};

export default App;
