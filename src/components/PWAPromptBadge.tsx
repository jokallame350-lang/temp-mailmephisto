import React, { useState, useEffect, useCallback, memo } from 'react';
import { Smartphone, Download, X, CheckCircle2 } from 'lucide-react';
import { Language } from '../translations';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface PWAPromptBadgeProps {
  lang: Language;
}

export const PWAPromptBadge: React.FC<PWAPromptBadgeProps> = memo(({ lang }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [installed, setInstalled] = useState<boolean>(false);
  const [showToast, setShowToast] = useState<boolean>(false);

  useEffect(() => {
    // Check if running in standalone mode (already installed)
    if (window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone) {
      setInstalled(true);
      return;
    }

    // Check localStorage dismissal
    const dismissedUntil = localStorage.getItem('mephisto_pwa_dismissed_until');
    if (dismissedUntil && Date.now() < parseInt(dismissedUntil, 10)) {
      return;
    }

    const checkIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(checkIOS);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    const handleAppInstalled = () => {
      setInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Auto-display floating badge after 2.5 seconds if not dismissed
    const timer = setTimeout(() => {
      if (!installed && (!dismissedUntil || Date.now() >= parseInt(dismissedUntil, 10))) {
        setShowPrompt(true);
      }
    }, 2500);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      clearTimeout(timer);
    };
  }, []);

  const handleInstallClick = useCallback(async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult.outcome === 'accepted') {
          setInstalled(true);
          setShowPrompt(false);
        }
      } catch (err) {
        console.error('PWA install error:', err);
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      alert(
        lang === 'tr'
          ? '📱 iOS Safari İpucu: Alt kısımdaki Paylaş (Share) simgesine dokunun ve "Ana Ekrana Ekle" seçeneğini tıklayın.'
          : '📱 iOS Safari Tip: Tap the Share icon at the bottom of Safari and select "Add to Home Screen".'
      );
    } else {
      // Desktop / Android without native prompt event: instruct bookmark / chrome install
      alert(
        lang === 'tr'
          ? '💡 MephistoMail Uygulamasını Yükleyin: Tarayıcı menüsünden (⋮) "Uygulamayı Yükle" veya "Ana Ekrana Ekle" seçeneğini tıklayın.'
          : '💡 Install MephistoMail App: Click browser menu (⋮) and choose "Install App" or "Add to Home Screen".'
      );
    }
  }, [deferredPrompt, isIOS, lang]);

  const handleDismiss = useCallback(() => {
    setShowPrompt(false);
    // Dismiss for 3 days to avoid user fatigue while encouraging repeat visits
    const nextWeek = Date.now() + 3 * 24 * 60 * 60 * 1000;
    localStorage.setItem('mephisto_pwa_dismissed_until', nextWeek.toString());
  }, []);

  if (showToast) {
    return (
      <div className="fixed bottom-4 right-4 z-50 bg-green-500/20 border border-green-500/40 text-green-400 px-4 py-3 rounded-2xl shadow-xl backdrop-blur-md flex items-center gap-2 text-xs font-bold animate-bounce">
        <CheckCircle2 className="w-4 h-4 text-green-400" />
        <span>{lang === 'tr' ? 'MephistoMail Başarıyla Yüklendi!' : 'MephistoMail App Installed Successfully!'}</span>
      </div>
    );
  }

  if (!showPrompt || installed) return null;

  const isTr = lang === 'tr';

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 max-w-sm w-[calc(100vw-2rem)] sm:w-auto transition-all duration-300 transform translate-y-0">
      <div className="relative bg-[#0b0c10]/95 backdrop-blur-xl border border-orange-500/40 rounded-2xl p-3.5 sm:p-4 shadow-2xl shadow-orange-500/15 flex items-center gap-3 group">
        {/* Glow Accent */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500/30 via-amber-500/20 to-red-500/30 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-300 -z-10"></div>

        {/* App Icon */}
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-orange-500/30">
          <Smartphone className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
        </div>

        {/* Content */}
        <div className="flex-grow min-w-0 pr-1">
          <div className="flex items-center gap-1.5">
            <h4 className="text-xs sm:text-sm font-bold text-white tracking-tight truncate">
              {isTr ? 'MephistoMail Uygulaması' : 'MephistoMail App'}
            </h4>
            <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30 shrink-0">
              PWA
            </span>
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-300 leading-tight mt-0.5 line-clamp-1">
            {isTr ? '1-Tıkla Ana Ekrana Ekle & Anlık Bildirim' : '1-Click Add to Home Screen & Alerts'}
          </p>
        </div>

        {/* Install Action */}
        <button
          onClick={handleInstallClick}
          className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl font-bold text-xs shadow-md shadow-orange-500/20 active:scale-95 transition-all whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{isTr ? 'Ekle' : 'Install'}</span>
        </button>

        {/* Dismiss Button */}
        <button
          onClick={handleDismiss}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
          title={isTr ? 'Kapat' : 'Dismiss'}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
});

export default PWAPromptBadge;
