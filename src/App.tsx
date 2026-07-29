import React, { useState, useCallback, useEffect, useMemo } from 'react';
import Header from './components/Header';
import AddressBar from './components/AddressBar';
import EmailList from './components/EmailList';
import EmailViewer from './components/EmailViewer';
import Footer from './components/Footer';
import Toast, { ToastData } from './components/Toast';
import ErrorBoundary from './components/ErrorBoundary';
import SEOHead from './components/SEOHead';
import SkipNavigation from './components/SkipNavigation';
import KeyboardShortcuts from './components/KeyboardShortcuts';
import { useMailbox } from './hooks/useMailbox';
import { useEmails } from './hooks/useEmails';
import { Terminal, Loader2, Sparkles, ShieldCheck, ArrowDown } from 'lucide-react';
import { SEOContent } from './components/SEOContent';
import { translations, Language } from './translations';
import CustomAddressModal from './components/CustomAddressModal';
import QRCodeModal from './components/QRCodeModal';
import PasswordGenModal from './components/PasswordGenModal';
import LimitModal from './components/LimitModal';
import { StatsModal as StatsAndFiltersModule, NotifFilterModal as NotifFilterModule } from './components/StatsAndFilters';
import AliasManagerModal from './components/AliasManagerModal';
import IdentityModal from './components/IdentityModal';
import ForwardingModal from './components/ForwardingModal';
import ShareDropModal from './components/ShareDropModal';
import ExtensionInstallModal from './components/ExtensionInstallModal';
import CustomDomainModal from './components/CustomDomainModal';
import ComposeModal from './components/ComposeModal';
import { Mailbox, ComposeMailData } from './types';

// OTP kodunu subject'ten çıkar (toast için)
const extractOTPCode = (subject: string): string | null => {
  const patterns = [/\b(\d{6})\b/, /\b(\d{4})\b/, /\b(\d{8})\b/, /code[:\s]+(\d{4,8})/i, /kod[:\s]+(\d{4,8})/i];
  for (const p of patterns) { const m = subject.match(p); if (m) return m[1]; }
  return null;
};

const App: React.FC = () => {
  // Custom hooklar
  const {
    accounts,
    activeAccount,
    isLoadingAccount,
    setActiveAccountId,
    createQuickAccount,
    handleCreateCustom: rawHandleCreateCustom,
    deleteAccount,
    updateAccountLabel,
    setAutoDelete,
    bulkCopyAddresses,
    addCustomAccount,
    MAX_ACTIVE_ACCOUNTS,
  } = useMailbox();

  const [theme, setTheme] = useState<string>(() => localStorage.getItem('mephisto_theme') || 'dark');

  useEffect(() => {
    localStorage.setItem('mephisto_theme', theme);
    document.body.className = theme === 'cyberpunk' ? 'theme-cyberpunk' : theme === 'light' ? 'theme-light' : '';
  }, [theme]);

  // Toast bildirimleri (useEmails'den önce tanımlanmalı, callback olarak geçilecek)
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = useCallback((from: string, subject: string) => {
    const code = extractOTPCode(subject);
    const toast: ToastData = { id: Date.now().toString(), from, subject, code: code || undefined };
    setToasts(prev => [toast, ...prev].slice(0, 5));
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const [autoVerifyEnabled, setAutoVerifyEnabled] = useState<boolean>(() => {
    return localStorage.getItem('mephisto_auto_verify') === 'true';
  });

  const toggleAutoVerify = useCallback(() => {
    setAutoVerifyEnabled(prev => {
      const next = !prev;
      localStorage.setItem('mephisto_auto_verify', String(next));
      const toastMsg: ToastData = {
        id: Date.now().toString(),
        from: next ? '⚡ Otomatik Doğrulama Aktif' : 'Otomatik Doğrulama Kapalı',
        subject: next ? 'Gelen üyelik onay linkleri arka planda otomatik tıklanacak.' : 'Otomatik tıklama modu kapatıldı.',
      };
      setToasts(p => [toastMsg, ...p].slice(0, 5));
      return next;
    });
  }, []);

  const handleAutoVerifySuccess = useCallback((urlLabel: string) => {
    const toastMsg: ToastData = {
      id: Date.now().toString(),
      from: '⚡ Otomatik Doğrulandı!',
      subject: `"${urlLabel}" aktivasyon bağlantısı başarıyla tetiklendi.`,
    };
    setToasts(p => [toastMsg, ...p].slice(0, 5));
  }, []);

  const {
    emails,
    selectedEmailId,
    currentEmailDetail,
    isLoadingDetail,
    isLoadingEmails,
    progress,
    searchQuery,
    stats,
    notifFilters,
    setSearchQuery,
    setSelectedEmailId,
    setNotifFilters,
    handleManualRefresh,
    handleDeleteEmail,
    handleDeleteAllEmails,
    incrementAccountStat,
  } = useEmails(activeAccount, addToast, autoVerifyEnabled, handleAutoVerifySuccess);

  // Modallar
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [showCustomDomainModal, setShowCustomDomainModal] = useState(false);
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [composeInitialData, setComposeInitialData] = useState<ComposeMailData | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showPassModal, setShowPassModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showNotifFilterModal, setShowNotifFilterModal] = useState(false);
  const [showAliasModal, setShowAliasModal] = useState(false);
  const [showIdentityModal, setShowIdentityModal] = useState(false);
  const [showForwardingModal, setShowForwardingModal] = useState(false);
  const [showShareDropModal, setShowShareDropModal] = useState(false);
  const [showExtensionModal, setShowExtensionModal] = useState(false);
  const [limitModal, setLimitModal] = useState<{ isOpen: boolean; title: string; message: string; type: 'daily' | 'capacity'; }>({ isOpen: false, title: '', message: '', type: 'daily' });

  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem('mephisto_lang');
    if (saved === 'tr' || saved === 'en' || saved === 'es' || saved === 'de' || saved === 'fr') return saved;
    const bl = navigator.language.toLowerCase();
    if (bl.startsWith('tr')) return 'tr';
    if (bl.startsWith('es')) return 'es';
    if (bl.startsWith('de')) return 'de';
    if (bl.startsWith('fr')) return 'fr';
    return 'en';
  });

  const t = useMemo(() => translations[lang], [lang]);

  // Dil değişikliğini kaydet
  useEffect(() => {
    localStorage.setItem('mephisto_lang', lang);
    window.dispatchEvent(new Event('mephisto-lang-change'));
  }, [lang]);

  // Pull-to-refresh event listener
  useEffect(() => {
    const handleRefresh = () => handleManualRefresh();
    window.addEventListener('mephisto-refresh', handleRefresh);
    return () => window.removeEventListener('mephisto-refresh', handleRefresh);
  }, [handleManualRefresh]);

  // Bildirim izni
  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Tab başlığında okunmamış e-posta sayısı göster
  useEffect(() => {
    const baseTitle = lang === 'tr' ? 'MephistoMail - Geçici E-posta' : 'MephistoMail - Temp Mail';
    const unreadCount = emails.filter(e => !e.seen).length;

    if (unreadCount > 0 && document.hidden) {
      document.title = `(${unreadCount}) ${baseTitle}`;
    } else {
      document.title = baseTitle;
    }

    const handleFocus = () => {
      document.title = baseTitle;
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [emails, lang]);

  // Custom hesap oluşturma
  const handleCreateCustom = useCallback(async (username: string, domain: string, apiBase: string) => {
    const result = await rawHandleCreateCustom(username, domain, apiBase);
    if (result.success) {
      setShowCustomModal(false);
      incrementAccountStat();
    } else {
      const isTaken = result.reason === 'taken';
      const title = isTaken
        ? (lang === 'tr' ? 'Kullanıcı Adı Kullanımda' : 'Username Taken')
        : (lang === 'tr' ? 'Hesap Oluşturulamadı' : 'Creation Failed');
      const msg = isTaken
        ? (lang === 'tr'
            ? `"${username}@${domain}" adresi zaten başkası tarafından alınmış. Lütfen farklı bir kullanıcı adı veya domain seçin.`
            : `"${username}@${domain}" is already taken. Please choose a different username.`)
        : t.connError;
      setLimitModal({ isOpen: true, title, message: msg, type: 'daily' });
    }
  }, [rawHandleCreateCustom, incrementAccountStat, lang, t]);

  // Quick account — kredi kontrolü useMailbox içinde
  const handleNewAccount = useCallback(async () => {
    if (accounts.length >= MAX_ACTIVE_ACCOUNTS) {
      setLimitModal({ isOpen: true, title: t.limitCapacityTitle, message: t.limitCapacityMsg, type: 'capacity' });
      return;
    }
    const result = await createQuickAccount();
    if (result.success) {
      incrementAccountStat();
    }
  }, [accounts.length, MAX_ACTIVE_ACCOUNTS, createQuickAccount, incrementAccountStat, t]);

  const langOrder: Language[] = ['en', 'tr', 'es', 'de', 'fr'];
  const toggleLang = useCallback(() => {
    setLang(prev => langOrder[(langOrder.indexOf(prev) + 1) % langOrder.length]);
  }, []);

  const handleAddCustomDomain = useCallback((domain: string, username: string) => {
    const fullAddress = `${username}@${domain}`;
    const newBox: Mailbox = {
      id: `custom_${Date.now()}`,
      address: fullAddress,
      apiBase: 'mail_tm',
      isCustomDomain: true,
      customDomainName: domain,
      createdAt: Date.now(),
      label: 'Custom Domain',
      labelColor: '#a855f7',
    };
    addCustomAccount(newBox);
    addToast('🌐 Kendi Domainin Bağlandı!', `${fullAddress} adresi başarıyla oluşturuldu.`);
  }, [addCustomAccount, addToast]);

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col font-['Sora'] bg-[#050505] text-slate-200 overflow-x-hidden relative">

        {/* SEO Head */}
        <SEOHead lang={lang} />

        {/* Skip Navigation (WCAG) */}
        <SkipNavigation />

        {/* Keyboard Shortcuts */}
        <KeyboardShortcuts
          lang={lang}
          onNewAccount={handleNewAccount}
          onRefresh={handleManualRefresh}
          onToggleLang={toggleLang}
        />

        {/* Floating Orbs — Minimal arka plan */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
          <div className="floating-orb w-96 h-96 bg-orange-500/[0.03] top-0 -left-48" />
          <div className="floating-orb w-80 h-80 bg-orange-500/[0.02] top-40 -right-40" style={{ animationDelay: '-7s' }} />
        </div>

        {/* Toast Bildirimleri */}
        <Toast toasts={toasts} onDismiss={dismissToast} />

        <Header
          accounts={accounts}
          currentAccount={activeAccount}
          onSwitchAccount={setActiveAccountId}
          onDeleteAccount={deleteAccount}
          lang={lang}
          setLang={setLang}
          theme={theme}
          setTheme={setTheme}
          onOpenQR={() => setShowQRModal(true)}
          onOpenPass={() => setShowPassModal(true)}
          onOpenExtension={() => setShowExtensionModal(true)}
          onOpenStats={() => setShowStatsModal(true)}
          onOpenFilters={() => setShowNotifFilterModal(true)}
          onOpenLabels={() => setShowAliasModal(true)}
        />

        {/* Modals */}
        {showCustomModal && <CustomAddressModal isOpen={showCustomModal} onClose={() => setShowCustomModal(false)} onCreate={handleCreateCustom} lang={lang} />}
        {showQRModal && <QRCodeModal isOpen={showQRModal} onClose={() => setShowQRModal(false)} email={activeAccount?.address || ''} lang={lang} />}
        {showPassModal && <PasswordGenModal isOpen={showPassModal} onClose={() => setShowPassModal(false)} lang={lang} />}
        {limitModal.isOpen && <LimitModal isOpen={limitModal.isOpen} onClose={() => setLimitModal(p => ({ ...p, isOpen: false }))} title={limitModal.title} message={limitModal.message} type={limitModal.type} lang={lang} />}
        {showStatsModal && <StatsAndFiltersModule isOpen={showStatsModal} onClose={() => setShowStatsModal(false)} stats={stats} lang={lang} />}
        {showNotifFilterModal && <NotifFilterModule isOpen={showNotifFilterModal} onClose={() => setShowNotifFilterModal(false)} filters={notifFilters} setFilters={setNotifFilters} lang={lang} />}
        {showAliasModal && <AliasManagerModal isOpen={showAliasModal} onClose={() => setShowAliasModal(false)} accounts={accounts} onUpdateLabel={updateAccountLabel} onSetAutoDelete={setAutoDelete} onBulkCopy={bulkCopyAddresses} lang={lang} />}
        {showIdentityModal && <IdentityModal isOpen={showIdentityModal} onClose={() => setShowIdentityModal(false)} lang={lang} activeAddress={activeAccount?.address} />}
        {showForwardingModal && <ForwardingModal isOpen={showForwardingModal} onClose={() => setShowForwardingModal(false)} lang={lang} activeAddress={activeAccount?.address} />}
        {showShareDropModal && <ShareDropModal isOpen={showShareDropModal} onClose={() => setShowShareDropModal(false)} lang={lang} activeAddress={activeAccount?.address} />}
        {showExtensionModal && <ExtensionInstallModal isOpen={showExtensionModal} onClose={() => setShowExtensionModal(false)} lang={lang} />}
        {showCustomDomainModal && (
          <CustomDomainModal
            isOpen={showCustomDomainModal}
            onClose={() => setShowCustomDomainModal(false)}
            onAddCustomDomain={handleAddCustomDomain}
            lang={lang}
          />
        )}
        {showComposeModal && (
          <ComposeModal
            isOpen={showComposeModal}
            onClose={() => setShowComposeModal(false)}
            senderAddress={activeAccount?.address || 'mephisto@temp.mail'}
            mailboxId={activeAccount?.id || ''}
            initialData={composeInitialData}
            lang={lang}
            onSuccessToast={(msg) => addToast('✓ E-posta Gönderildi', msg)}
          />
        )}

        <main id="main-content" className="flex-grow flex flex-col items-center justify-start pt-[72px] sm:pt-20 md:pt-24 px-3 md:px-4 gap-4 sm:gap-6 md:gap-8 w-full max-w-7xl mx-auto z-10" role="main">

          {/* HERO BAŞLIK — Sadeleştirildi */}
          <div className="w-full max-w-4xl flex flex-col items-center text-center space-y-4 relative">
            <div className="space-y-2">
              <h1 className="hero-title text-2xl md:text-4xl font-black text-white tracking-tighter leading-tight">
                {t.heroTitle} <br />
                <span className="hero-gradient-text text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-orange-400 to-orange-500">{t.heroSubtitle}</span>
              </h1>
              <p className="text-sm md:text-base text-slate-400 max-w-lg mx-auto leading-relaxed">
                {lang === 'tr'
                  ? 'Kayıt yok. Log yok. Sekmeyi kapat, her şey silinsin.'
                  : 'No signup. No logs. Close the tab, everything is gone.'}
              </p>
            </div>

            {/* Trust Signals — Tek satır, sakin */}
            <div className="flex items-center gap-4 text-[10px] text-slate-500 font-medium uppercase tracking-widest">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-orange-500/60" aria-hidden="true" />
                {lang === 'tr' ? 'Sıfır Log' : 'Zero Logs'}
              </span>
              <span className="text-slate-700">|</span>
              <span>{lang === 'tr' ? 'Sadece RAM' : 'RAM-Only'}</span>
              <span className="text-slate-700">|</span>
              <span>{lang === 'tr' ? 'Açık Kaynak' : 'Open Source'}</span>
            </div>

            {accounts.length === 0 || isLoadingAccount ? (
              <div className="w-full max-w-2xl h-16 flex items-center justify-center border border-white/10 rounded-2xl bg-[#0f1115] shadow-lg animate-pulse gap-3" role="status" aria-live="polite">
                <Loader2 className="w-5 h-5 text-red-500 animate-spin" aria-hidden="true" />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.connecting}</span>
              </div>
            ) : (
              <AddressBar
                mailbox={activeAccount}
                isLoading={isLoadingAccount}
                isRefreshing={isLoadingEmails}
                onRefresh={handleManualRefresh}
                lang={lang}
                progress={progress}
                onChange={handleNewAccount}
                onDelete={() => {
                  if (activeAccount) {
                    deleteAccount(activeAccount.id);
                  }
                }}
                onCreateCustom={() => setShowCustomModal(true)}
                onIdentity={() => setShowIdentityModal(true)}
                onForwarding={() => setShowForwardingModal(true)}
                onShareDrop={() => setShowShareDropModal(true)}
                onOpenCustomDomain={() => setShowCustomDomainModal(true)}
                onOpenCompose={() => { setComposeInitialData(null); setShowComposeModal(true); }}
                autoVerifyEnabled={autoVerifyEnabled}
                onToggleAutoVerify={toggleAutoVerify}
              />
            )}
          </div>

          {/* E-POSTA İÇERİK ALANI */}
          <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 md:gap-6 pb-8 sm:pb-12">
            <div className={`md:col-span-4 flex flex-col ${selectedEmailId ? 'hidden md:flex' : 'flex'}`}>
              <div className="glass-panel rounded-2xl md:rounded-[24px] overflow-hidden shadow-2xl flex flex-col min-h-[350px] sm:min-h-[400px] md:min-h-[500px]" role="region" aria-label={t.inbox}>
                <div className="flex justify-between items-center px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 md:py-4 bg-white/[0.02] border-b border-white/5">
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-50">{t.activeNodes}</span>
                  <span className="text-[10px] font-black px-3 py-1 rounded-full text-orange-500 bg-orange-500/10 animate-pulse" role="status">
                    {accounts.length} {t.activeLabel}
                  </span>
                </div>
                <EmailList
                  emails={emails}
                  selectedId={selectedEmailId}
                  onSelect={setSelectedEmailId}
                  onDelete={handleDeleteEmail}
                  onDeleteAll={handleDeleteAllEmails}
                  loading={isLoadingEmails}
                  lang={lang}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                />
              </div>
            </div>

            <div className={`md:col-span-8 flex flex-col ${selectedEmailId ? 'flex' : 'hidden md:flex'}`}>
              <div className="glass-panel rounded-2xl md:rounded-[24px] overflow-hidden shadow-2xl flex flex-col min-h-[350px] sm:min-h-[400px] md:min-h-[500px]" role="region" aria-label={lang === 'tr' ? 'E-posta İçeriği' : 'Email Content'}>
                {!selectedEmailId ? (
                  <div className="flex-grow flex flex-col items-center justify-center text-slate-800 p-6 sm:p-8 md:p-12 relative" aria-label={t.awaitingSignal}>
                    <div className="absolute inset-0 flex items-center justify-center opacity-[0.02]" aria-hidden="true">
                      <Sparkles className="w-64 h-64" />
                    </div>
                    <div className="relative mb-6">
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-500/10 to-orange-500/5 border border-white/5 flex items-center justify-center">
                        <Terminal className="w-10 h-10 opacity-20" aria-hidden="true" />
                      </div>
                      <div className="absolute -inset-3 border border-red-500/5 rounded-3xl animate-ping" style={{ animationDuration: '3s' }} aria-hidden="true" />
                    </div>
                    <span className="text-[10px] uppercase tracking-[0.3em] font-black italic mb-3">{t.awaitingSignal}</span>
                    <div className="flex items-center gap-2 mt-2 px-4 py-2 rounded-xl bg-white/[0.02] border border-white/5 max-w-xs">
                      <ArrowDown className="w-3 h-3 text-red-500/50 animate-bounce flex-shrink-0" aria-hidden="true" />
                      <p className="text-[10px] text-slate-600 leading-relaxed">{t.awaitingHint}</p>
                    </div>
                  </div>
                ) : (
                  <EmailViewer
                    email={currentEmailDetail}
                    loading={isLoadingDetail}
                    onBack={() => setSelectedEmailId(null)}
                    lang={lang}
                    token={activeAccount?.token}
                    onReply={(initialData) => {
                      setComposeInitialData(initialData);
                      setShowComposeModal(true);
                    }}
                  />
                )}
              </div>
            </div>
          </div>

          <SEOContent lang={lang} />
        </main>

        <Footer lang={lang} />
      </div>
    </ErrorBoundary>
  );
};

export default App;