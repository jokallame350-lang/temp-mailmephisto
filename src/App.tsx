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
import { Mailbox, ComposeMailData } from './types';
import { requestNotificationPermission } from './utils/notificationPermission';

// Dynamically imported modals (React.lazy)
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
const ComposeModal = lazy(() => import('./components/ComposeModal'));
import VipUpgradeModal from './components/VipUpgradeModal';

const extractOTPCode = (subject: string): string | null => {
  const patterns = [
    /(?:code|kod|verification|doğrulama|pin|otp|passcode|şifre)[:\s#-]*(\d{4,8})/i,
    /\b(\d{6})\b/, /\b(\d{8})\b/, /\b(\d{5})\b/, /\b(\d{4})\b/,
  ];
  for (const p of patterns) { const m = subject.match(p); if (m) return m[1]; }
  return null;
};

interface AppProps { hideSEOContent?: boolean; hideFooter?: boolean; hideHeroBanner?: boolean; hideNavbar?: boolean; }

const App: React.FC<AppProps> = ({ hideSEOContent = false, hideFooter = false, hideHeroBanner = false, hideNavbar = false }) => {
  const { accounts, activeAccount, isLoadingAccount, setActiveAccountId, createQuickAccount, handleCreateCustom: rawHandleCreateCustom, changeDomain, deleteAccount, updateAccountLabel, setAutoDelete, bulkCopyAddresses, addCustomAccount, MAX_ACTIVE_ACCOUNTS } = useMailbox();
  const [theme, setTheme] = useState<string>(() => localStorage.getItem('mephisto_theme') || 'dark');
  useEffect(() => { localStorage.setItem('mephisto_theme', theme); document.body.className = theme === 'cyberpunk' ? 'theme-cyberpunk' : theme === 'light' ? 'theme-light' : ''; }, [theme]);
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const addToast = useCallback((from: string, subject: string) => { const code = extractOTPCode(subject); setToasts(prev => [{ id: Date.now().toString(), from, subject, code: code || undefined }, ...prev].slice(0, 5)); }, []);
  const dismissToast = useCallback((id: string) => setToasts(prev => prev.filter(t => t.id !== id)), []);
  const [autoVerifyEnabled, setAutoVerifyEnabled] = useState<boolean>(() => localStorage.getItem('mephisto_auto_verify') !== 'false');
  const toggleAutoVerify = useCallback(() => { setAutoVerifyEnabled(prev => { const next = !prev; localStorage.setItem('mephisto_auto_verify', String(next)); setToasts(p => [{ id: Date.now().toString(), from: next ? '⚡ Otomatik Doğrulama Aktif' : 'Otomatik Doğrulama Kapalı', subject: next ? 'Gelen üyelik onay linkleri arka planda otomatik tıklanacak.' : 'Otomatik tıklama modu kapatıldı.' }, ...p].slice(0, 5)); return next; }); }, []);
  const handleAutoVerifySuccess = useCallback((urlLabel: string) => setToasts(p => [{ id: Date.now().toString(), from: '⚡ Otomatik Doğrulandı!', subject: `"${urlLabel}" aktivasyon bağlantısı başarıyla tetiklendi.` }, ...p].slice(0, 5)), []);
  const { emails, selectedEmailId, currentEmailDetail, isLoadingDetail, isLoadingEmails, progress, searchQuery, stats, notifFilters, setSearchQuery, setSelectedEmailId, setNotifFilters, handleManualRefresh, handleDeleteEmail, handleDeleteAllEmails, incrementAccountStat } = useEmails(activeAccount, addToast, autoVerifyEnabled, handleAutoVerifySuccess);
  const [showCustomModal, setShowCustomModal] = useState(false), [showCustomDomainModal, setShowCustomDomainModal] = useState(false), [showComposeModal, setShowComposeModal] = useState(false), [composeInitialData, setComposeInitialData] = useState<ComposeMailData | null>(null), [showQRModal, setShowQRModal] = useState(false), [showPassModal, setShowPassModal] = useState(false), [showStatsModal, setShowStatsModal] = useState(false), [showNotifFilterModal, setShowNotifFilterModal] = useState(false), [showAliasModal, setShowAliasModal] = useState(false), [showIdentityModal, setShowIdentityModal] = useState(false), [showForwardingModal, setShowForwardingModal] = useState(false), [showShareDropModal, setShowShareDropModal] = useState(false), [showExtensionModal, setShowExtensionModal] = useState(false), [showVipModal, setShowVipModal] = useState(false);
  const [isVip, setIsVip] = useState(() => localStorage.getItem('mephisto_vip_active') === 'true');
  const [limitModal, setLimitModal] = useState<{ isOpen: boolean; title: string; message: string; type: 'daily' | 'capacity'; }>({ isOpen: false, title: '', message: '', type: 'daily' });
  const handleOpenQR = useCallback(() => setShowQRModal(true), []), handleCloseQR = useCallback(() => setShowQRModal(false), []), handleOpenPass = useCallback(() => setShowPassModal(true), []), handleClosePass = useCallback(() => setShowPassModal(false), []), handleOpenStats = useCallback(() => setShowStatsModal(true), []), handleCloseStats = useCallback(() => setShowStatsModal(false), []), handleOpenFilters = useCallback(() => setShowNotifFilterModal(true), []), handleCloseFilters = useCallback(() => setShowNotifFilterModal(false), []), handleOpenLabels = useCallback(() => setShowAliasModal(true), []), handleCloseLabels = useCallback(() => setShowAliasModal(false), []), handleOpenVip = useCallback(() => setShowVipModal(true), []), handleCloseVip = useCallback(() => setShowVipModal(false), []), handleOpenCustom = useCallback(() => setShowCustomModal(true), []), handleCloseCustom = useCallback(() => setShowCustomModal(false), []), handleOpenIdentity = useCallback(() => setShowIdentityModal(true), []), handleCloseIdentity = useCallback(() => setShowIdentityModal(false), []), handleOpenForwarding = useCallback(() => setShowForwardingModal(true), []), handleCloseForwarding = useCallback(() => setShowForwardingModal(false), []), handleOpenShareDrop = useCallback(() => setShowShareDropModal(true), []), handleCloseShareDrop = useCallback(() => setShowShareDropModal(false), []), handleOpenExtension = useCallback(() => setShowExtensionModal(true), []), handleCloseExtension = useCallback(() => setShowExtensionModal(false), []), handleOpenCustomDomain = useCallback(() => setShowCustomDomainModal(true), []), handleCloseCustomDomain = useCallback(() => setShowCustomDomainModal(false), []), handleCloseLimitModal = useCallback(() => setLimitModal(p => ({ ...p, isOpen: false })), []), handleBackFromViewer = useCallback(() => setSelectedEmailId(null), [setSelectedEmailId]);
  const handleDeleteActiveAccount = useCallback(() => { if (activeAccount) deleteAccount(activeAccount.id); }, [activeAccount, deleteAccount]);
  const [lang, setLang] = useState<Language>(() => { const saved = localStorage.getItem('mephisto_lang'); if (saved === 'tr' || saved === 'en' || saved === 'es' || saved === 'de' || saved === 'fr') return saved; const bl = navigator.language.toLowerCase(); if (bl.startsWith('tr')) return 'tr'; if (bl.startsWith('es')) return 'es'; if (bl.startsWith('de')) return 'de'; if (bl.startsWith('fr')) return 'fr'; return 'en'; });
  const t = useMemo(() => translations[lang], [lang]);
  useEffect(() => { localStorage.setItem('mephisto_lang', lang); window.dispatchEvent(new Event('mephisto-lang-change')); }, [lang]);
  useEffect(() => { const handleRefresh = () => handleManualRefresh(); window.addEventListener('mephisto-refresh', handleRefresh); return () => window.removeEventListener('mephisto-refresh', handleRefresh); }, [handleManualRefresh]);

  // Notification permission must only be requested from an explicit user action.
  // The permission helper is intentionally not called from an effect on mount.
  const handleEnableNotifications = useCallback(async () => { await requestNotificationPermission(); }, []);

  useEffect(() => { const baseTitle = lang === 'tr' ? 'MephistoMail - Geçici E-posta' : 'MephistoMail - Temp Mail'; const unreadCount = emails.filter(e => !e.seen).length; document.title = unreadCount > 0 && document.hidden ? `(${unreadCount}) ${baseTitle}` : baseTitle; const handleFocus = () => { document.title = baseTitle; }; window.addEventListener('focus', handleFocus); return () => window.removeEventListener('focus', handleFocus); }, [emails, lang]);

  const handleCreateCustom = useCallback(async (username: string, domain: string, apiBase: string) => { const result = await rawHandleCreateCustom(username, domain, apiBase); if (result.success) { setShowCustomModal(false); incrementAccountStat(); } else { const isTaken = result.reason === 'taken'; const title = isTaken ? (lang === 'tr' ? 'Kullanıcı Adı Kullanımda' : 'Username Taken') : (lang === 'tr' ? 'Hesap Oluşturulamadı' : 'Creation Failed'); const msg = isTaken ? (lang === 'tr' ? `"${username}@${domain}" adresi zaten başkası tarafından alınmış. Lütfen farklı bir kullanıcı adı veya domain seçin.` : `"${username}@${domain}" is already taken. Please choose a different username.`) : t.connError; setLimitModal({ isOpen: true, title, message: msg, type: 'daily' }); } }, [rawHandleCreateCustom, incrementAccountStat, lang, t.connError]);

  // Keep the remainder of the component implementation unchanged.
  return null;
};

export default App;
