import React, { useState, useCallback, lazy, Suspense, useEffect, useMemo } from 'react';
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
import AdBanner from './components/AdBanner';
import RewardedAdModal, { getCredits } from './components/RewardedAdModal';
import { useMailbox } from './hooks/useMailbox';
import { useEmails } from './hooks/useEmails';
import { Activity, Terminal, Loader2, Sparkles, BarChart3, Bell, Tag, ShieldCheck, UserX, Globe, ArrowDown } from 'lucide-react';
import { SEOContent } from './components/SEOContent';
import { translations, Language } from './translations';

// Lazy loaded modals for bundle size reduction
const CustomAddressModal = lazy(() => import('./components/CustomAddressModal'));
const QRCodeModal = lazy(() => import('./components/QRCodeModal'));
const PasswordGenModal = lazy(() => import('./components/PasswordGenModal'));
const LimitModal = lazy(() => import('./components/LimitModal'));
const StatsAndFiltersModule = lazy(() => import('./components/StatsAndFilters').then(m => ({ default: m.StatsModal })));
const NotifFilterModule = lazy(() => import('./components/StatsAndFilters').then(m => ({ default: m.NotifFilterModal })));
const AliasManagerModal = lazy(() => import('./components/AliasManagerModal'));

// OTP kodunu subject'ten çıkar (toast için)
const extractOTPCode = (subject: string): string | null => {
  const patterns = [/\b(\d{6})\b/, /\b(\d{4})\b/, /\b(\d{8})\b/, /code[:\s]+(\d{4,8})/i, /kod[:\s]+(\d{4,8})/i];
  for (const p of patterns) { const m = subject.match(p); if (m) return m[1]; }
  return null;
};

const ModalFallback = () => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
    <Loader2 className="w-6 h-6 text-red-500 animate-spin" />
  </div>
);

const App: React.FC = () => {
  // Custom hooklar
  const {
    accounts,
    activeAccount,
    activeAccountId,
    isLoadingAccount,
    setActiveAccountId,
    createQuickAccount,
    handleCreateCustom: rawHandleCreateCustom,
    deleteAccount,
    updateAccountLabel,
    setAutoDelete,
    bulkCopyAddresses,
    MAX_ACTIVE_ACCOUNTS,
  } = useMailbox();

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
  } = useEmails(activeAccount, addToast);

  // Modallar
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showPassModal, setShowPassModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showNotifFilterModal, setShowNotifFilterModal] = useState(false);
  const [showAliasModal, setShowAliasModal] = useState(false);
  const [showRewardedAd, setShowRewardedAd] = useState(false);
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
    } else if (result.reason === 'no_credits') {
      setShowRewardedAd(true);
    } else {
      const msg = result.reason === 'taken' ? t.usernameTaken : t.connError;
      setLimitModal({ isOpen: true, title: t.connError, message: msg, type: 'daily' });
    }
  }, [rawHandleCreateCustom, incrementAccountStat, t]);

  // Quick account — kredi kontrolü useMailbox içinde
  const handleNewAccount = useCallback(async () => {
    if (accounts.length >= MAX_ACTIVE_ACCOUNTS) {
      setLimitModal({ isOpen: true, title: t.limitCapacityTitle, message: t.limitCapacityMsg, type: 'capacity' });
      return;
    }
    const result = await createQuickAccount();
    if (result.success) {
      incrementAccountStat();
    } else if (result.reason === 'no_credits') {
      setShowRewardedAd(true);
    }
  }, [accounts.length, MAX_ACTIVE_ACCOUNTS, createQuickAccount, incrementAccountStat, t]);

  const langOrder: Language[] = ['en', 'tr', 'es', 'de', 'fr'];
  const toggleLang = useCallback(() => {
    setLang(prev => langOrder[(langOrder.indexOf(prev) + 1) % langOrder.length]);
  }, []);

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

        {/* Floating Orbs — Hero arka plan efekti */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
          <div className="floating-orb w-96 h-96 bg-red-500/[0.04] top-0 -left-48" />
          <div className="floating-orb w-80 h-80 bg-orange-500/[0.03] top-40 -right-40" style={{ animationDelay: '-7s' }} />
          <div className="floating-orb w-64 h-64 bg-purple-500/[0.02] bottom-20 left-1/3" style={{ animationDelay: '-14s' }} />
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
          onOpenQR={() => setShowQRModal(true)}
          onOpenPass={() => setShowPassModal(true)}
        />

        {/* Lazy-loaded Modals */}
        <Suspense fallback={<ModalFallback />}>
          {showCustomModal && <CustomAddressModal isOpen={showCustomModal} onClose={() => setShowCustomModal(false)} onCreate={handleCreateCustom} lang={lang} />}
          {showQRModal && <QRCodeModal isOpen={showQRModal} onClose={() => setShowQRModal(false)} email={activeAccount?.address || ''} lang={lang} />}
          {showPassModal && <PasswordGenModal isOpen={showPassModal} onClose={() => setShowPassModal(false)} lang={lang} />}
          {limitModal.isOpen && <LimitModal isOpen={limitModal.isOpen} onClose={() => setLimitModal(p => ({ ...p, isOpen: false }))} title={limitModal.title} message={limitModal.message} type={limitModal.type} lang={lang} />}
          {showStatsModal && <StatsAndFiltersModule isOpen={showStatsModal} onClose={() => setShowStatsModal(false)} stats={stats} lang={lang} />}
          {showNotifFilterModal && <NotifFilterModule isOpen={showNotifFilterModal} onClose={() => setShowNotifFilterModal(false)} filters={notifFilters} setFilters={setNotifFilters} lang={lang} />}
          {showAliasModal && <AliasManagerModal isOpen={showAliasModal} onClose={() => setShowAliasModal(false)} accounts={accounts} onUpdateLabel={updateAccountLabel} onSetAutoDelete={setAutoDelete} onBulkCopy={bulkCopyAddresses} lang={lang} />}
        </Suspense>

        {/* Rewarded Ad Modal — kredi bittiğinde gösterilir */}
        <RewardedAdModal
          isOpen={showRewardedAd}
          onClose={() => setShowRewardedAd(false)}
          onCreditsEarned={() => {
            setShowRewardedAd(false);
          }}
          lang={lang}
        />

        <main id="main-content" className="flex-grow flex flex-col items-center justify-start pt-20 md:pt-24 px-3 md:px-4 gap-6 md:gap-8 w-full max-w-7xl mx-auto z-10" role="main">

          {/* HERO BAŞLIK */}
          <div className="w-full max-w-4xl flex flex-col items-center text-center space-y-5 relative">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-red-500/20 bg-red-500/5 text-red-500 text-[10px] font-black uppercase tracking-widest animate-pulse" role="status" aria-live="polite">
                <Activity className="w-3 h-3" aria-hidden="true" /> {t.systemActive}
              </div>
              <h1 className="hero-title text-2xl md:text-4xl font-black text-white tracking-tighter italic uppercase leading-none">
                {t.heroTitle} <br />
                <span className="hero-gradient-text text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-orange-500 to-red-600">{t.heroSubtitle}</span>
              </h1>
            </div>

            {/* Hızlı Erişim Butonları */}
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <button
                onClick={() => setShowStatsModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.03] text-slate-400 hover:text-purple-400 hover:border-purple-500/30 text-[10px] font-bold transition-all"
                aria-label={lang === 'tr' ? 'İstatistikleri göster' : 'Show statistics'}
              >
                <BarChart3 className="w-3 h-3" aria-hidden="true" />
                {lang === 'tr' ? 'İstatistikler' : 'Stats'}
              </button>
              <button
                onClick={() => setShowNotifFilterModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.03] text-slate-400 hover:text-yellow-400 hover:border-yellow-500/30 text-[10px] font-bold transition-all"
                aria-label={lang === 'tr' ? 'Bildirim filtrelerini aç' : 'Open notification filters'}
              >
                <Bell className="w-3 h-3" aria-hidden="true" />
                {lang === 'tr' ? 'Filtreler' : 'Filters'}
              </button>
              <button
                onClick={() => setShowAliasModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.03] text-slate-400 hover:text-indigo-400 hover:border-indigo-500/30 text-[10px] font-bold transition-all"
                aria-label={lang === 'tr' ? 'Hesap yöneticisini aç' : 'Open account manager'}
              >
                <Tag className="w-3 h-3" aria-hidden="true" />
                {lang === 'tr' ? 'Etiketler' : 'Labels'}
              </button>
              {/* Klavye kısayolları göstergesi */}
              <div className="hidden md:flex items-center gap-3 text-[9px] text-slate-600 uppercase tracking-widest ml-2">
                <span><kbd className="kbd">?</kbd> {lang === 'tr' ? 'Kısayollar' : 'Shortcuts'}</span>
              </div>
            </div>

            {/* Trust Signals */}
            <div className="flex items-center gap-3 flex-wrap justify-center">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/5 border border-green-500/10 text-green-500/70 text-[9px] font-bold uppercase tracking-wider">
                <UserX className="w-3 h-3" aria-hidden="true" />
                {lang === 'tr' ? 'Kayıt Gereksiz' : 'No Registration'}
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/5 border border-red-500/10 text-red-500/70 text-[9px] font-bold uppercase tracking-wider">
                <ShieldCheck className="w-3 h-3" aria-hidden="true" />
                {lang === 'tr' ? 'Sıfır Kayıt' : 'Zero Logs'}
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-500/5 border border-orange-500/10 text-orange-500/70 text-[9px] font-bold uppercase tracking-wider">
                <Globe className="w-3 h-3" aria-hidden="true" />
                {lang === 'tr' ? 'Çoklu Domain' : 'Multi-Domain'}
              </div>
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
                    // Son hesapsa ve kredi yoksa — reklam göster
                    if (accounts.length <= 1 && getCredits() <= 0) {
                      setShowRewardedAd(true);
                      return;
                    }
                    deleteAccount(activeAccount.id);
                  }
                }}
                onCreateCustom={() => setShowCustomModal(true)}
              />
            )}
          </div>

          {/* E-POSTA İÇERİK ALANI */}
          <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 pb-12">
            <div className={`md:col-span-4 flex flex-col ${selectedEmailId ? 'hidden md:flex' : 'flex'}`}>
              <div className="glass-panel rounded-[20px] md:rounded-[24px] overflow-hidden shadow-2xl flex flex-col min-h-[400px] md:min-h-[500px]" role="region" aria-label={t.inbox}>
                <div className="flex justify-between items-center px-4 md:px-6 py-3 md:py-4 bg-white/[0.02] border-b border-white/5">
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-50">{t.activeNodes}</span>
                  <span className="text-[10px] font-black px-3 py-1 rounded-full text-green-500 bg-green-500/10 animate-pulse" role="status">
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
              <div className="glass-panel rounded-[20px] md:rounded-[24px] overflow-hidden shadow-2xl flex flex-col min-h-[400px] md:min-h-[500px]" role="region" aria-label={lang === 'tr' ? 'E-posta İçeriği' : 'Email Content'}>
                {!selectedEmailId ? (
                  <div className="flex-grow flex flex-col items-center justify-center text-slate-800 p-12 relative" aria-label={t.awaitingSignal}>
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
                  <EmailViewer email={currentEmailDetail} loading={isLoadingDetail} onBack={() => setSelectedEmailId(null)} lang={lang} />
                )}
              </div>
            </div>
          </div>

          <SEOContent lang={lang} />

          {/* Reklam Alanı */}
          <div className="w-full max-w-4xl mx-auto">
            <AdBanner slot="footer" lang={lang} />
          </div>
        </main>

        <Footer lang={lang} />
      </div>
    </ErrorBoundary>
  );
};

export default App;