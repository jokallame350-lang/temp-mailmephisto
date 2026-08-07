import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import App from './App.tsx'
import './index.css'
import { translations, Language } from './translations'

// Lazy load pages for code splitting
const BlogPage = lazy(() => import('./pages/BlogPage'));
const BlogPostPage = lazy(() => import('./pages/BlogPostPage'));
const ToolsPage = lazy(() => import('./pages/ToolsPage'));
const TenMinuteMailPage = lazy(() => import('./pages/TenMinuteMailPage'));
const HelpPage = lazy(() => import('./pages/HelpPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const ApiDocsPage = lazy(() => import('./pages/ApiDocsPage'));
const ServiceMailPage = lazy(() => import('./pages/ServiceMailPage'));
const DisposableCheckerPage = lazy(() => import('./pages/DisposableCheckerPage'));
const BulkGeneratorPage = lazy(() => import('./pages/BulkGeneratorPage'));
const BurnNotePage = lazy(() => import('./pages/BurnNotePage'));
const ServicesCatalogPage = lazy(() => import('./pages/ServicesCatalogPage'));

// Loading fallback
const PageLoader = () => (
  <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

// Scroll to top on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

// Language hook
const useLang = (): Language => {
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem('mephisto_lang');
    if (['tr', 'en', 'es', 'de', 'fr', 'it', 'pt', 'ru', 'ar'].includes(saved || '')) return saved as Language;
    const bl = navigator.language.toLowerCase();
    if (bl.startsWith('tr')) return 'tr';
    if (bl.startsWith('es')) return 'es';
    if (bl.startsWith('de')) return 'de';
    if (bl.startsWith('fr')) return 'fr';
    if (bl.startsWith('it')) return 'it';
    if (bl.startsWith('pt')) return 'pt';
    if (bl.startsWith('ru')) return 'ru';
    if (bl.startsWith('ar')) return 'ar';
    return 'en';
  });

  useEffect(() => {
    const handleStorage = () => {
      const saved = localStorage.getItem('mephisto_lang') as Language;
      if (saved && ['tr', 'en', 'es', 'de', 'fr', 'it', 'pt', 'ru', 'ar'].includes(saved)) {
        setLang(saved);
      }
    };
    window.addEventListener('storage', handleStorage);
    window.addEventListener('mephisto-lang-change', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('mephisto-lang-change', handleStorage);
    };
  }, []);

  return lang;
};

// Router wrapper
const AppRouter = () => {
  const lang = useLang();

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/blog" element={<BlogPage lang={lang} />} />
          <Route path="/blog/:slug" element={<BlogPostPage lang={lang} />} />
          <Route path="/tools" element={<ToolsPage lang={lang} />} />
          <Route path="/10minutemail" element={<TenMinuteMailPage lang={lang} />} />
          <Route path="/help" element={<HelpPage lang={lang} />} />
          <Route path="/contact" element={<ContactPage lang={lang} />} />
          <Route path="/api-docs" element={<ApiDocsPage lang={lang} />} />
          <Route path="/services" element={<ServicesCatalogPage lang={lang} />} />
          <Route path="/kullanim-alanlari" element={<ServicesCatalogPage lang={lang} />} />
          <Route path="/temp-mail-for-students" element={<ServiceMailPage lang={lang} />} />
          <Route path="/edu-temp-mail" element={<ServiceMailPage lang={lang} />} />
          <Route path="/temp-mail-for-classifieds" element={<ServiceMailPage lang={lang} />} />
          <Route path="/temp-mail-for-discounts" element={<ServiceMailPage lang={lang} />} />
          <Route path="/temp-mail-for-free-trials" element={<ServiceMailPage lang={lang} />} />
          <Route path="/temp-mail-for-wifi-login" element={<ServiceMailPage lang={lang} />} />
          <Route path="/temp-mail-for-downloads" element={<ServiceMailPage lang={lang} />} />
          <Route path="/temp-mail-for-gaming" element={<ServiceMailPage lang={lang} />} />
          <Route path="/temp-mail-for-qa-testing" element={<ServiceMailPage lang={lang} />} />
          <Route path="/temp-mail-for-spam-protection" element={<ServiceMailPage lang={lang} />} />
          <Route path="/temp-mail-for-surveys" element={<ServiceMailPage lang={lang} />} />
          <Route path="/temp-mail-for-crypto-airdrops" element={<ServiceMailPage lang={lang} />} />
          <Route path="/temp-mail-for-chatgpt" element={<ServiceMailPage lang={lang} />} />
          <Route path="/temp-mail-for-discord" element={<ServiceMailPage lang={lang} />} />
          <Route path="/temp-mail-for-instagram" element={<ServiceMailPage lang={lang} />} />
          <Route path="/temp-mail-for-spotify" element={<ServiceMailPage lang={lang} />} />
          <Route path="/temp-mail-for-netflix" element={<ServiceMailPage lang={lang} />} />
          <Route path="/temp-mail-for-roblox" element={<ServiceMailPage lang={lang} />} />
          <Route path="/temp-mail-for-steam" element={<ServiceMailPage lang={lang} />} />
          <Route path="/temp-mail-for-epicgames" element={<ServiceMailPage lang={lang} />} />
          <Route path="/temp-mail-for-twitch" element={<ServiceMailPage lang={lang} />} />
          <Route path="/temp-mail-for-tiktok" element={<ServiceMailPage lang={lang} />} />
          <Route path="/temp-mail-for-canva" element={<ServiceMailPage lang={lang} />} />
          <Route path="/temp-mail-for-github" element={<ServiceMailPage lang={lang} />} />
          <Route path="/temp-mail-for-amazon" element={<ServiceMailPage lang={lang} />} />
          <Route path="/temp-mail-for-vinted" element={<ServiceMailPage lang={lang} />} />
          <Route path="/temp-mail-for-saas" element={<ServiceMailPage lang={lang} />} />
          <Route path="/temp-mail-for-claude-ai" element={<ServiceMailPage lang={lang} />} />
          <Route path="/temp-mail-for-midjourney" element={<ServiceMailPage lang={lang} />} />
          <Route path="/temp-mail-for-vpn" element={<ServiceMailPage lang={lang} />} />
          <Route path="/temp-mail-for-ai-art" element={<ServiceMailPage lang={lang} />} />
          <Route path="/temp-mail-for-freelancers" element={<ServiceMailPage lang={lang} />} />
          <Route path="/temp-mail-for-crypto" element={<ServiceMailPage lang={lang} />} />
          <Route path="/temp-mail-for-disney-plus" element={<ServiceMailPage lang={lang} />} />
          <Route path="/temp-mail-for-workspaces" element={<ServiceMailPage lang={lang} />} />
          <Route path="/temp-mail-for-facebook" element={<ServiceMailPage lang={lang} />} />
          <Route path="/temp-mail-for-reddit" element={<ServiceMailPage lang={lang} />} />
          <Route path="/temp-mail-for-:service" element={<ServiceMailPage lang={lang} />} />
          <Route path="/disposable-email-checker" element={<DisposableCheckerPage lang={lang} />} />
          <Route path="/bulk-generator" element={<BulkGeneratorPage lang={lang} />} />
          <Route path="/burn-note" element={<BurnNotePage lang={lang} />} />
          {/* Catch-all: redirect to home */}
          <Route path="*" element={<App />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error("Root element bulunamadı!");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <AppRouter />
  </React.StrictMode>,
)

// Service Worker kaydı (PWA & Push Notifications)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('SW registration failed:', err);
    });
  });
}

// PWA Install Prompt — daha sonra kullanmak üzere sakla
let deferredPrompt: any = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  (window as any).__pwaInstallPrompt = deferredPrompt;
  window.dispatchEvent(new CustomEvent('pwa-install-available'));
});
