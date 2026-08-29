import React, { useState, useCallback, useEffect, useMemo, lazy, Suspense } from 'react';
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
import AdBanner from './components/AdBanner';
import { Mailbox } from './types';

const CustomAddressModal = lazy(() => import('./components/CustomAddressModal'));
const QRCodeModal = lazy(() => import('./components/QRCodeModal'));
const PasswordGenModal = lazy(() => import('./components/PasswordGenModal'));
const LimitModal = lazy(() => import('./components/LimitModal'));
const StatsAndFiltersModule = lazy(() => import('./components/StatsAndFilters').then(m => ({ default: m.StatsModal })));
const NotifFilterModule = lazy(() => import('./components/StatsAndFilters').then(m => ({ default: m.NotifFilterModal })));
const AliasManagerModal = lazy(() => import('./components/AliasManagerModal'));
const IdentityModal = lazy(() => import('./components/IdentityModal'));
const ForwardingModal = lazy(() => import('./components/ForwardingModal'));
const ShareDropModal = lazy(() => import('./components/ShareDropModal'));
const ExtensionInstallModal = lazy(() => import('./components/ExtensionInstallModal'));
const CustomDomainModal = lazy(() => import('./components/CustomDomainModal'));
import VipUpgradeModal from './components/VipUpgradeModal';

import { extractOTP } from './utils/otp';

interface AppProps { hideSEOContent?: boolean; hideFooter?: boolean; hideHeroBanner?: boolean; hideNavbar?: boolean; }

const App: React.FC<AppProps> = ({ hideSEOContent = false, hideFooter = false, hideHeroBanner = false, hideNavbar = false }) => {
  const { accounts, activeAccount, isLoadingAccount, setActiveAccountId, createQuickAccount, handleCreateCustom: rawHandleCreateCustom, changeDomain, deleteAccount, updateAccountLabel, setAutoDelete, bulkCopyAddresses, addCustomAccount, MAX_ACTIVE_ACCOUNTS } = useMailbox();
  const [theme, setTheme] = useState<string>(() => localStorage.getItem('mephisto_theme') || 'dark');
  useEffect(() => { localStorage.setItem('mephisto_theme', theme); document.body.className = theme === 'cyberpunk' ? 'theme-cyberpunk' : theme === 'light' ? 'theme-light' : ''; }, [theme]);
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const addToast = useCallback((from: string, subject: string) => { const code = extractOTP(subject); setToasts(prev => [{ id: Date.now().toString(), from, subject, code: code || undefined }, ...prev].slice(0, 5)); }, []);
  const dismissToast = useCallback((id: string) => setToasts(prev => prev.filter(t => t.id !== id)), []);
  const [autoVerifyEnabled, setAutoVerifyEnabled] = useState<boolean>(() => localStorage.getItem('mephisto_auto_verify') !== 'false');
  const toggleAutoVerify = useCallback(() => { setAutoVerifyEnabled(prev => { const next = !prev; localStorage.setItem('mephisto_auto_verify', String(next)); setToasts(p => [{ id: Date.now().toString(), from: next ? '⚡ Otomatik Doğrulama Aktif' : 'Otomatik Doğrulama Kapalı', subject: next ? 'Gelen üyelik onay linkleri arka planda otomatik tıklanacak.' : 'Otomatik tıklama modu kapatıldı.' }, ...p].slice(0, 5)); return next; }); }, []);
  const handleAutoVerifySuccess = useCallback((urlLabel: string) => setToasts(p => [{ id: Date.now().toString(), from: '⚡ Otomatik Doğrulandı!', subject: `"${urlLabel}" aktivasyon bağlantısı başarıyla tetiklendi.` }, ...p].slice(0, 5)), []);
  const { emails, selectedEmailId, currentEmailDetail, isLoadingDetail, isLoadingEmails, progress, searchQuery, stats, notifFilters, setSearchQuery, setSelectedEmailId, setNotifFilters, handleManualRefresh, handleDeleteEmail, handleDeleteAllEmails, incrementAccountStat } = useEmails(activeAccount, addToast, autoVerifyEnabled, handleAutoVerifySuccess);
  const [showCustomModal, setShowCustomModal] = useState(false), [showCustomDomainModal, setShowCustomDomainModal] = useState(false), [showQRModal, setShowQRModal] = useState(false), [showPassModal, setShowPassModal] = useState(false), [showStatsModal, setShowStatsModal] = useState(false), [showNotifFilterModal, setShowNotifFilterModal] = useState(false), [showAliasModal, setShowAliasModal] = useState(false), [showIdentityModal, setShowIdentityModal] = useState(false), [showForwardingModal, setShowForwardingModal] = useState(false), [showShareDropModal, setShowShareDropModal] = useState(false), [showExtensionModal, setShowExtensionModal] = useState(false), [showVipModal, setShowVipModal] = useState(false);
  const [isVip, setIsVip] = useState(() => localStorage.getItem('mephisto_vip_active') === 'true');
  const [limitModal, setLimitModal] = useState<{ isOpen: boolean; title: string; message: string; type: 'daily' | 'capacity'; }>({ isOpen: false, title: '', message: '', type: 'daily' });
  const handleOpenQR = useCallback(() => setShowQRModal(true), []), handleCloseQR = useCallback(() => setShowQRModal(false), []), handleOpenPass = useCallback(() => setShowPassModal(true), []), handleClosePass = useCallback(() => setShowPassModal(false), []), handleOpenStats = useCallback(() => setShowStatsModal(true), []), handleCloseStats = useCallback(() => setShowStatsModal(false), []), handleOpenFilters = useCallback(() => setShowNotifFilterModal(true), []), handleCloseFilters = useCallback(() => setShowNotifFilterModal(false), []), handleOpenLabels = useCallback(() => setShowAliasModal(true), []), handleCloseLabels = useCallback(() => setShowAliasModal(false), []), handleOpenVip = useCallback(() => setShowVipModal(true), []), handleCloseVip = useCallback(() => setShowVipModal(false), []), handleOpenCustom = useCallback(() => setShowCustomModal(true), []), handleCloseCustom = useCallback(() => setShowCustomModal(false), []), handleOpenIdentity = useCallback(() => setShowIdentityModal(true), []), handleCloseIdentity = useCallback(() => setShowIdentityModal(false), []), handleOpenForwarding = useCallback(() => setShowForwardingModal(true), []), handleCloseForwarding = useCallback(() => setShowForwardingModal(false), []), handleOpenShareDrop = useCallback(() => setShowShareDropModal(true), []), handleCloseShareDrop = useCallback(() => setShowShareDropModal(false), []), handleOpenExtension = useCallback(() => setShowExtensionModal(true), []), handleCloseExtension = useCallback(() => setShowExtensionModal(false), []), handleOpenCustomDomain = useCallback(() => setShowCustomDomainModal(true), []), handleCloseCustomDomain = useCallback(() => setShowCustomDomainModal(false), []), handleCloseLimitModal = useCallback(() => setLimitModal(p => ({ ...p, isOpen: false })), []), handleBackFromViewer = useCallback(() => setSelectedEmailId(null), [setSelectedEmailId]);
  const handleDeleteActiveAccount = useCallback(() => { if (activeAccount) deleteAccount(activeAccount.id); }, [activeAccount, deleteAccount]);
  const [lang, setLang] = useState<Language>(() => { const saved = localStorage.getItem('mephisto_lang'); if (saved === 'tr' || saved === 'en' || saved === 'es' || saved === 'de' || saved === 'fr') return saved; const bl = navigator.language.toLowerCase(); if (bl.startsWith('tr')) return 'tr'; if (bl.startsWith('es')) return 'es'; if (bl.startsWith('de')) return 'de'; if (bl.startsWith('fr')) return 'fr'; return 'en'; });
  const t = useMemo(() => translations[lang], [lang]);
  useEffect(() => { localStorage.setItem('mephisto_lang', lang); window.dispatchEvent(new Event('mephisto-lang-change')); }, [lang]);
  useEffect(() => { const handleRefresh = () => handleManualRefresh(); window.addEventListener('mephisto-refresh', handleRefresh); return () => window.removeEventListener('mephisto-refresh', handleRefresh); }, [handleManualRefresh]);
  useEffect(() => { const baseTitle = lang === 'tr' ? 'MephistoMail - Geçici E-posta' : 'MephistoMail - Temp Mail'; const unreadCount = emails.filter(e => !e.seen).length; document.title = unreadCount > 0 && document.hidden ? `(${unreadCount}) ${baseTitle}` : baseTitle; const handleFocus = () => { document.title = baseTitle; }; window.addEventListener('focus', handleFocus); return () => window.removeEventListener('focus', handleFocus); }, [emails, lang]);
  const handleCreateCustom = useCallback(async (username: string, domain: string, apiBase: string) => { const result = await rawHandleCreateCustom(username, domain, apiBase); if (result.success) { setShowCustomModal(false); incrementAccountStat(); } else { const isTaken = result.reason === 'taken'; const title = isTaken ? (lang === 'tr' ? 'Kullanıcı Adı Kullanımda' : 'Username Taken') : (lang === 'tr' ? 'Hesap Oluşturulamadı' : 'Creation Failed'); const msg = isTaken ? (lang === 'tr' ? `"${username}@${domain}" adresi zaten başkası tarafından alınmış. Lütfen farklı bir kullanıcı adı veya domain seçin.` : `"${username}@${domain}" is already taken. Please choose a different username.`) : t.connError; setLimitModal({ isOpen: true, title, message: msg, type: 'daily' }); } }, [rawHandleCreateCustom, incrementAccountStat, lang, t]);
  const handleNewAccount = useCallback(async () => { if (accounts.length >= MAX_ACTIVE_ACCOUNTS) { setLimitModal({ isOpen: true, title: t.limitCapacityTitle, message: t.limitCapacityMsg, type: 'capacity' }); return; } const result = await createQuickAccount(); if (result.success) incrementAccountStat(); }, [accounts.length, MAX_ACTIVE_ACCOUNTS, createQuickAccount, incrementAccountStat, t]);
  const langOrder: Language[] = useMemo(() => ['en', 'tr', 'es', 'de', 'fr'], []);
  const toggleLang = useCallback(() => { setLang(prev => langOrder[(langOrder.indexOf(prev) + 1) % langOrder.length]); }, [langOrder]);
  const handleDomainChange = useCallback(async (newDomain: string) => { const res = await changeDomain(newDomain); if (res.success && res.address) addToast(lang === 'tr' ? '🌐 Domain Değiştirildi' : '🌐 Domain Switched', lang === 'tr' ? `Yeni adres: ${res.address}` : `New address: ${res.address}`); }, [changeDomain, addToast, lang]);
  const handleAddCustomDomain = useCallback((domain: string, username: string) => { const fullAddress = `${username}@${domain}`; const newBox: Mailbox = { id: `custom_${Date.now()}`, address: fullAddress, apiBase: 'mail_tm', isCustomDomain: true, customDomainName: domain, createdAt: Date.now(), label: 'Custom Domain', labelColor: '#a855f7' }; addCustomAccount(newBox); addToast('🌐 Kendi Domainin Bağlandı!', `${fullAddress} adresi başarıyla oluşturuldu.`); }, [addCustomAccount, addToast]);
  return (
    <ErrorBoundary>
      <div className={hideHeroBanner ? "w-full flex flex-col font-['Sora'] text-slate-200 relative" : "min-h-screen flex flex-col font-['Sora'] bg-[#050505] text-slate-200 overflow-x-hidden relative"}>
        <SEOHead lang={lang} />
        <SkipNavigation />
        <KeyboardShortcuts lang={lang} onNewAccount={handleNewAccount} onRefresh={handleManualRefresh} onToggleLang={toggleLang} />
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true"><div className="floating-orb w-96 h-96 bg-orange-500/[0.03] top-0 -left-48" /><div className="floating-orb w-80 h-80 bg-orange-500/[0.02] top-40 -right-40" style={{ animationDelay: '-7s' }} /></div>
        <Toast toasts={toasts} onDismiss={dismissToast} />
        {!hideNavbar && <Header accounts={accounts} currentAccount={activeAccount} onSwitchAccount={setActiveAccountId} onDeleteAccount={deleteAccount} lang={lang} setLang={setLang} theme={theme} setTheme={setTheme} onOpenQR={handleOpenQR} onOpenPass={handleOpenPass} onOpenExtension={handleOpenExtension} onOpenStats={handleOpenStats} onOpenFilters={handleOpenFilters} onOpenLabels={handleOpenLabels} onOpenVip={handleOpenVip} isVip={isVip} />}
        <Suspense fallback={null}>
          {showVipModal && <VipUpgradeModal isOpen={showVipModal} onClose={handleCloseVip} lang={lang} isVip={isVip} setIsVip={setIsVip} />}
          {showCustomModal && <CustomAddressModal isOpen={showCustomModal} onClose={handleCloseCustom} onCreate={handleCreateCustom} lang={lang} />}
          {showQRModal && <QRCodeModal isOpen={showQRModal} onClose={handleCloseQR} email={activeAccount?.address || ''} lang={lang} />}
          {showPassModal && <PasswordGenModal isOpen={showPassModal} onClose={handleClosePass} lang={lang} />}
          {limitModal.isOpen && <LimitModal isOpen={limitModal.isOpen} onClose={handleCloseLimitModal} title={limitModal.title} message={limitModal.message} type={limitModal.type} lang={lang} />}
          {showStatsModal && <StatsAndFiltersModule isOpen={showStatsModal} onClose={handleCloseStats} stats={stats} lang={lang} />}
          {showNotifFilterModal && <NotifFilterModule isOpen={showNotifFilterModal} onClose={handleCloseFilters} filters={notifFilters} setFilters={setNotifFilters} lang={lang} />}
          {showAliasModal && <AliasManagerModal isOpen={showAliasModal} onClose={handleCloseLabels} accounts={accounts} onUpdateLabel={updateAccountLabel} onSetAutoDelete={setAutoDelete} onBulkCopy={bulkCopyAddresses} lang={lang} />}
          {showIdentityModal && <IdentityModal isOpen={showIdentityModal} onClose={handleCloseIdentity} lang={lang} activeAddress={activeAccount?.address} />}
          {showForwardingModal && <ForwardingModal isOpen={showForwardingModal} onClose={handleCloseForwarding} lang={lang} activeAddress={activeAccount?.address} />}
          {showShareDropModal && <ShareDropModal isOpen={showShareDropModal} onClose={handleCloseShareDrop} lang={lang} activeAddress={activeAccount?.address} />}
          {showExtensionModal && <ExtensionInstallModal isOpen={showExtensionModal} onClose={handleCloseExtension} lang={lang} />}
          {showCustomDomainModal && <CustomDomainModal isOpen={showCustomDomainModal} onClose={handleCloseCustomDomain} onAddCustomDomain={handleAddCustomDomain} lang={lang} />}
        </Suspense>
        <main id="main-content" className={hideHeroBanner ? "w-full flex flex-col items-center justify-start gap-4 z-10" : "flex-grow flex flex-col items-center justify-start pt-[72px] sm:pt-20 md:pt-24 px-3 md:px-4 gap-4 sm:gap-6 md:gap-8 w-full max-w-7xl mx-auto z-10"} role="main">
          {!hideHeroBanner && <div className="w-full max-w-4xl flex flex-col items-center text-center space-y-4 relative"><div className="space-y-2"><h1 className="hero-title text-2xl md:text-4xl font-black text-white tracking-tighter leading-tight">{t.heroTitle} <br /><span className="hero-gradient-text text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-orange-400 to-orange-500">{t.heroSubtitle}</span></h1><p className="text-sm md:text-base text-slate-400 max-w-lg mx-auto leading-relaxed">{t.heroTagline}</p></div><div className="flex items-center gap-4 text-[10px] text-slate-400 font-medium uppercase tracking-widest"><span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-orange-500/60" aria-hidden="true" />{t.heroBadge1}</span><span className="text-slate-700">|</span><span>{t.heroBadge2}</span><span className="text-slate-700">|</span><span>{t.heroBadge3}</span></div></div>}
          {accounts.length === 0 || isLoadingAccount ? <div className="w-full max-w-2xl h-16 flex items-center justify-center border border-white/10 rounded-2xl bg-[#0f1115] shadow-lg animate-pulse gap-3" role="status" aria-live="polite"><Loader2 className="w-5 h-5 text-red-500 animate-spin" aria-hidden="true" /><span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.connecting}</span></div> : <AddressBar mailbox={activeAccount} isLoading={isLoadingAccount} isRefreshing={isLoadingEmails} onRefresh={handleManualRefresh} lang={lang} progress={progress} onChange={handleNewAccount} onChangeDomain={handleDomainChange} onDelete={handleDeleteActiveAccount} onCreateCustom={handleOpenCustom} onIdentity={handleOpenIdentity} onForwarding={handleOpenForwarding} onShareDrop={handleOpenShareDrop} onOpenCustomDomain={handleOpenCustomDomain} autoVerifyEnabled={autoVerifyEnabled} onToggleAutoVerify={toggleAutoVerify} />}
          <div className="w-full max-w-4xl mx-auto my-2"><AdBanner slot="header" lang={lang} /></div>
          <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 md:gap-6 pb-8 sm:pb-12"><div className={`md:col-span-4 flex flex-col ${selectedEmailId ? 'hidden md:flex' : 'flex'}`}><div className="glass-panel rounded-2xl md:rounded-[24px] overflow-hidden shadow-2xl flex flex-col min-h-[350px] sm:min-h-[400px] md:min-h-[500px]" role="region" aria-label={t.inbox}><div className="flex justify-between items-center px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 md:py-4 bg-white/[0.02] border-b border-white/5"><span className="text-[10px] font-black uppercase tracking-widest opacity-50">{t.activeNodes}</span><span className="text-[10px] font-black px-3 py-1 rounded-full text-orange-500 bg-orange-500/10 animate-pulse" role="status">{accounts.length} {t.activeLabel}</span></div><EmailList emails={emails} selectedId={selectedEmailId} onSelect={setSelectedEmailId} onDelete={handleDeleteEmail} onDeleteAll={handleDeleteAllEmails} loading={isLoadingEmails} lang={lang} searchQuery={searchQuery} onSearchChange={setSearchQuery} /></div></div><div className={`md:col-span-8 flex flex-col ${selectedEmailId ? 'flex' : 'hidden md:flex'}`}><div className="glass-panel rounded-2xl md:rounded-[24px] overflow-hidden shadow-2xl flex flex-col min-h-[350px] sm:min-h-[400px] md:min-h-[500px]" role="region" aria-label={lang === 'tr' ? 'E-posta İçeriği' : 'Email Content'}>{!selectedEmailId ? <div className="flex-grow flex flex-col items-center justify-center text-slate-800 p-6 sm:p-8 md:p-12 relative" aria-label={t.awaitingSignal}><div className="absolute inset-0 flex items-center justify-center opacity-[0.02]" aria-hidden="true"><Sparkles className="w-64 h-64" /></div><div className="relative mb-6"><div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-500/10 to-orange-500/5 border border-white/5 flex items-center justify-center"><Terminal className="w-10 h-10 opacity-20" aria-hidden="true" /></div><div className="absolute -inset-3 border border-red-500/5 rounded-3xl animate-ping" style={{ animationDuration: '3s' }} aria-hidden="true" /></div><span className="text-[10px] uppercase tracking-[0.3em] font-black italic mb-3">{t.awaitingSignal}</span><div className="flex items-center gap-2 mt-2 px-4 py-2 rounded-xl bg-white/[0.02] border border-white/5 max-w-xs"><ArrowDown className="w-3 h-3 text-red-500/50 animate-bounce flex-shrink-0" aria-hidden="true" /><p className="text-[10px] text-slate-600 leading-relaxed">{t.awaitingHint}</p></div></div> : <EmailViewer email={currentEmailDetail} loading={isLoadingDetail} onBack={handleBackFromViewer} lang={lang} token={activeAccount?.token} />}</div></div></div>
          {!hideSEOContent && <SEOContent lang={lang} />}
        </main>
        {!hideFooter && <Footer lang={lang} />}
      </div>
    </ErrorBoundary>
  );
};

export default App;