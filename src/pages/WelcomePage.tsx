import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Crown,
  CheckCircle2,
  Sparkles,
  Loader2,
  ArrowRight,
  ShieldCheck,
  Zap,
  GraduationCap,
  Download,
  AlertTriangle,
  RefreshCw,
  Mail,
} from 'lucide-react';
import { translations, Language } from '../translations';
import SEOHead from '../components/SEOHead';
import { VipEntitlementResponse } from '../types/paddle';

interface WelcomePageProps {
  lang: Language;
}

type VerificationStatus = 'verifying' | 'activated' | 'pending' | 'failed';

export const WelcomePage: React.FC<WelcomePageProps> = ({ lang }) => {
  const t = translations[lang] || translations.en;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [status, setStatus] = useState<VerificationStatus>('verifying');
  const [pollCount, setPollCount] = useState<number>(0);
  const [userEmail, setUserEmail] = useState<string>('');
  const [planName, setPlanName] = useState<string>('VIP Supporter');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const maxAttempts = 10; // 10 attempts * 2.5s = ~25 seconds
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Read email or transaction from query parameters if passed from checkout
  useEffect(() => {
    const queryEmail =
      searchParams.get('email') ||
      searchParams.get('customer_email') ||
      searchParams.get('identifier');

    if (queryEmail) {
      setUserEmail(queryEmail);
      localStorage.setItem('mephisto_vip_email', queryEmail);
    } else {
      const stored = localStorage.getItem('mephisto_vip_email');
      if (stored) setUserEmail(stored);
    }

    const planParam = searchParams.get('plan');
    if (planParam === 'lifetime') {
      setPlanName('Lifetime PRO');
    } else if (planParam === 'monthly') {
      setPlanName('Monthly VIP');
    }
  }, [searchParams]);

  const verifyEntitlement = useCallback(async (): Promise<boolean> => {
    const emailToVerify =
      userEmail ||
      (typeof window !== 'undefined' ? localStorage.getItem('mephisto_vip_email') : null) ||
      '';

    // If offline test key was already used, immediately activate
    const offlineKey = (localStorage.getItem('mephisto_vip_key') || '').trim().toUpperCase();
    if (offlineKey && (offlineKey.includes('MEPHISTO-VIP') || offlineKey === 'PRO2026' || offlineKey === 'VIP99')) {
      localStorage.setItem('mephisto_vip_active', 'true');
      setStatus('activated');
      window.dispatchEvent(new CustomEvent('mephisto-vip-change'));
      return true;
    }

    try {
      const url = new URL('/api/paddle/entitlement', window.location.origin);
      if (emailToVerify) {
        url.searchParams.set('email', emailToVerify);
      }

      const res = await fetch(url.toString(), {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });

      if (!res.ok) {
        // If 400 because no email supplied yet, check if local storage was set during checkout
        if (res.status === 400 && localStorage.getItem('mephisto_vip_active') === 'true') {
          setStatus('activated');
          return true;
        }
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const data = (await res.json()) as VipEntitlementResponse;
      if (data.isVip || data.active) {
        localStorage.setItem('mephisto_vip_active', 'true');
        if (data.plan) {
          localStorage.setItem('mephisto_vip_plan', data.plan);
          setPlanName(data.plan === 'lifetime' ? 'Lifetime PRO' : 'Monthly VIP');
        }
        if (data.expiresAt) {
          localStorage.setItem('mephisto_vip_expires_at', data.expiresAt);
        }
        setStatus('activated');
        window.dispatchEvent(new CustomEvent('mephisto-vip-change'));
        return true;
      }

      return false;
    } catch (err: unknown) {
      console.warn('[WelcomePage] Verification poll failed:', err);
      // If locally already active from checkout event, activate
      if (localStorage.getItem('mephisto_vip_active') === 'true') {
        setStatus('activated');
        return true;
      }
      return false;
    }
  }, [userEmail]);

  // Polling loop
  useEffect(() => {
    let attempts = 0;
    let isCancelled = false;

    const runPoll = async () => {
      attempts++;
      setPollCount(attempts);

      const success = await verifyEntitlement();
      if (success || isCancelled) {
        return;
      }

      if (attempts >= maxAttempts) {
        // If attempts run out without confirmation, check if local session was set or fallback to pending
        if (localStorage.getItem('mephisto_vip_active') === 'true') {
          setStatus('activated');
        } else {
          setStatus('pending');
        }
        return;
      }

      pollTimerRef.current = setTimeout(runPoll, 2500);
    };

    runPoll();

    return () => {
      isCancelled = true;
      if (pollTimerRef.current) {
        clearTimeout(pollTimerRef.current);
      }
    };
  }, [verifyEntitlement]);

  const handleManualRetry = () => {
    setStatus('verifying');
    setErrorMessage('');
    setPollCount(0);
    verifyEntitlement().then((success) => {
      if (!success) {
        if (localStorage.getItem('mephisto_vip_active') === 'true') {
          setStatus('activated');
        } else {
          setStatus('pending');
        }
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col justify-between selection:bg-amber-500 selection:text-black">
      <SEOHead
        title={`${t.vipWelcomeTitle} | MephistoMail`}
        description={t.vipWelcomeDesc}
        lang={lang}
      />

      {/* Ambient background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[140px]" />
        <div className="absolute top-1/3 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-orange-600/10 rounded-full blur-[120px]" />
      </div>

      {/* Simple Header */}
      <header className="relative z-10 w-full max-w-5xl mx-auto px-4 py-6 flex items-center justify-between border-b border-slate-800/60">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="flex items-center space-x-2 text-white hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-lg p-1"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Crown className="w-5 h-5 text-slate-950 font-bold" />
          </div>
          <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-amber-400 via-orange-300 to-amber-200 bg-clip-text text-transparent">
            MephistoMail <span className="text-amber-400">VIP</span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => navigate('/')}
          className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900/60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
        >
          {t.vipBackToInbox}
        </button>
      </header>

      {/* Main Content */}
      <main className="relative z-10 w-full max-w-2xl mx-auto px-4 py-12 flex-1 flex flex-col items-center justify-center">
        {/* Verification Status Card */}
        <div className="w-full bg-slate-900/90 border border-amber-500/30 rounded-2xl p-6 sm:p-10 shadow-2xl shadow-amber-500/10 backdrop-blur-xl animate-in zoom-in-95 duration-200 text-center">
          {/* Status Icon */}
          <div className="inline-flex items-center justify-center mb-6">
            {status === 'verifying' && (
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-slate-950 shadow-xl shadow-amber-500/30">
                  <Crown className="w-10 h-10 animate-bounce" />
                </div>
                <div className="absolute -bottom-2 -right-2 bg-slate-950 rounded-full p-1.5 border border-amber-500/40">
                  <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
                </div>
              </div>
            )}

            {status === 'activated' && (
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-amber-400 via-orange-400 to-amber-500 flex items-center justify-center text-slate-950 shadow-2xl shadow-amber-500/40 animate-pulse">
                  <Crown className="w-10 h-10" />
                </div>
                <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-slate-950 rounded-full p-1 shadow-lg shadow-emerald-500/40">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              </div>
            )}

            {status === 'pending' && (
              <div className="w-20 h-20 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-xl shadow-amber-500/20">
                <Sparkles className="w-10 h-10" />
              </div>
            )}

            {status === 'failed' && (
              <div className="w-20 h-20 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shadow-xl shadow-rose-500/20">
                <AlertTriangle className="w-10 h-10" />
              </div>
            )}
          </div>

          {/* Heading */}
          {status === 'verifying' && (
            <div className="space-y-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-amber-400 via-orange-300 to-amber-200 bg-clip-text text-transparent">
                {t.vipVerifyingEntitlement}
              </h1>
              <p className="text-sm text-slate-300 max-w-md mx-auto">{t.vipActivating}</p>
            </div>
          )}

          {status === 'activated' && (
            <div className="space-y-3">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{planName}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-amber-400 via-orange-300 to-amber-200 bg-clip-text text-transparent">
                {t.vipActivatedSuccess}
              </h1>
              <p className="text-sm text-slate-300 max-w-md mx-auto">{t.vipWelcomeDesc}</p>
            </div>
          )}

          {status === 'pending' && (
            <div className="space-y-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-amber-400">
                {t.vipPaymentReceived}
              </h1>
              <p className="text-sm text-slate-300 max-w-md mx-auto">{t.vipPaymentPending}</p>
            </div>
          )}

          {status === 'failed' && (
            <div className="space-y-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-rose-400">
                {t.vipPaymentFailed}
              </h1>
              {errorMessage && <p className="text-xs text-rose-300/80">{errorMessage}</p>}
            </div>
          )}

          {/* Progress / Step Indicator for 'verifying' */}
          {status === 'verifying' && (
            <div className="my-8 max-w-md mx-auto bg-slate-950/60 rounded-xl p-4 border border-slate-800/80 space-y-3 text-left">
              <div className="flex items-center space-x-3 text-xs text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{t.vipPaymentReceived}</span>
              </div>
              <div className="flex items-center space-x-3 text-xs text-amber-300 font-medium">
                <Loader2 className="w-4 h-4 text-amber-400 animate-spin shrink-0" />
                <span>
                  {t.vipVerifyingEntitlement} ({pollCount}/{maxAttempts})
                </span>
              </div>
              <div className="flex items-center space-x-3 text-xs text-slate-500">
                <div className="w-4 h-4 rounded-full border border-slate-700 shrink-0" />
                <span>{t.vipWelcomeTitle}</span>
              </div>
            </div>
          )}

          {/* VIP Perks Grid for 'activated' or 'pending' */}
          {(status === 'activated' || status === 'pending') && (
            <div className="my-8 grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
              <div className="flex items-start space-x-3 p-3 rounded-xl bg-slate-800/40 border border-slate-700/60">
                <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-semibold text-white">{t.vipFeatAdFree}</div>
                  <div className="text-[11px] text-slate-400">Zero banners, instant clean UI</div>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 rounded-xl bg-slate-800/40 border border-slate-700/60">
                <Zap className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-semibold text-white">{t.vipFeatOtp}</div>
                  <div className="text-[11px] text-slate-400">Dedicated high-speed relay queue</div>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 rounded-xl bg-slate-800/40 border border-slate-700/60">
                <GraduationCap className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-semibold text-white">{t.vipFeatEdu}</div>
                  <div className="text-[11px] text-slate-400">Verified academic email domains</div>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 rounded-xl bg-slate-800/40 border border-slate-700/60">
                <Download className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-semibold text-white">{t.vipFeatStorage}</div>
                  <div className="text-[11px] text-slate-400">RFC 5322 .eml & JSON backups</div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-amber-500/25 flex items-center justify-center space-x-2 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            >
              <Mail className="w-4 h-4" />
              <span>{t.vipBackToInbox}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {(status === 'pending' || status === 'failed') && (
              <button
                type="button"
                onClick={handleManualRetry}
                className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-700 hover:border-slate-600 bg-slate-800/60 hover:bg-slate-800 text-xs font-semibold text-white flex items-center justify-center space-x-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
              >
                <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                <span>{t.vipRetryVerification}</span>
              </button>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-5xl mx-auto px-4 py-6 text-center text-xs text-slate-500 border-t border-slate-900">
        <p>© 2026 MephistoMail. All rights reserved. Secure VIP Infrastructure.</p>
      </footer>
    </div>
  );
};

export default WelcomePage;
