import React, { useState, useEffect, useCallback } from 'react';
import { Crown, Check, X, Sparkles, CreditCard, Key, Loader2, ExternalLink, AlertCircle } from 'lucide-react';
import { translations, Language } from '../translations';
import { useModalA11y } from '../hooks/useModalA11y';
import { fetchPricePreviews, openPaddleCheckout, requestCustomerPortal } from '../services/paddleService';
import { getPaddleClientConfig, VIP_PLANS } from '../config/paddle';
import { PlanPricePreview } from '../types/paddle';

interface VipUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  isVip: boolean;
  setIsVip: (vip: boolean) => void;
}

export const VipUpgradeModal: React.FC<VipUpgradeModalProps> = ({
  isOpen,
  onClose,
  lang,
  isVip,
  setIsVip,
}) => {
  const t = translations[lang] || translations.en;
  const [licenseKey, setLicenseKey] = useState('');
  const [keyError, setKeyError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [pricePreviews, setPricePreviews] = useState<Record<string, PlanPricePreview>>({});
  const [isLoadingPrices, setIsLoadingPrices] = useState(false);
  const [checkoutLoadingPlan, setCheckoutLoadingPlan] = useState<'monthly' | 'lifetime' | null>(null);
  const [isPortalLoading, setIsPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState('');

  const { modalRef, handleBackdropClick } = useModalA11y({
    isOpen,
    onClose,
  });

  // Fetch Paddle localized prices when modal opens and user is not VIP
  useEffect(() => {
    if (!isOpen || isVip) return;

    let isMounted = true;
    const loadPrices = async () => {
      try {
        setIsLoadingPrices(true);
        const config = getPaddleClientConfig();
        const priceIds = [config.monthlyPriceId, config.lifetimePriceId].filter(Boolean);
        if (priceIds.length > 0) {
          const previews = await fetchPricePreviews(priceIds);
          if (isMounted) {
            setPricePreviews(previews);
          }
        }
      } catch (err) {
        console.warn('[VipUpgradeModal] Failed to load localized prices:', err);
      } finally {
        if (isMounted) {
          setIsLoadingPrices(false);
        }
      }
    };

    loadPrices();

    return () => {
      isMounted = false;
    };
  }, [isOpen, isVip]);

  const handleCheckout = useCallback(
    async (planType: 'monthly' | 'lifetime') => {
      setPortalError('');
      setCheckoutLoadingPlan(planType);
      try {
        const config = getPaddleClientConfig();
        const targetPriceId =
          planType === 'monthly' ? config.monthlyPriceId : config.lifetimePriceId;

        // If client token is missing, fall back to helpful testing hint
        if (!config.clientToken) {
          setLicenseKey('MEPHISTO-VIP-PRO-2026');
          setSuccessMsg(
            lang === 'tr'
              ? 'Test modu aktif. Lisans anahtarı otomatik dolduruldu, "Aktifleştir" butonuna basarak VIP olabilirsiniz.'
              : 'Test mode active. Test key auto-filled, click "Redeem" to activate VIP access.'
          );
          setCheckoutLoadingPlan(null);
          return;
        }

        const savedEmail = localStorage.getItem('mephisto_vip_email') || undefined;

        await openPaddleCheckout({
          priceId: targetPriceId,
          customerEmail: savedEmail,
          customData: {
            plan: planType,
            lang,
          },
          onSuccess: () => {
            setIsVip(true);
            onClose();
            window.location.href = '/welcome';
          },
          onClose: () => {
            setCheckoutLoadingPlan(null);
          },
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Checkout failed to start';
        console.error('[VipUpgradeModal] Checkout error:', err);
        setKeyError(message);
      } finally {
        setCheckoutLoadingPlan(null);
      }
    },
    [lang, onClose, setIsVip]
  );

  const handleOpenCustomerPortal = useCallback(async () => {
    setPortalError('');
    setIsPortalLoading(true);
    try {
      await requestCustomerPortal();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t.vipPortalError;
      console.warn('[VipUpgradeModal] Customer portal error:', message);
      setPortalError(message || t.vipPortalError);
    } finally {
      setIsPortalLoading(false);
    }
  }, [t.vipPortalError]);

  const handleActivateKey = (e: React.FormEvent) => {
    e.preventDefault();
    setKeyError('');
    setSuccessMsg('');
    const cleanKey = licenseKey.trim().toUpperCase();
    if (!cleanKey) {
      setKeyError(t.vipKeyEmpty);
      return;
    }
    if (cleanKey.includes('MEPHISTO-VIP') || cleanKey === 'PRO2026' || cleanKey === 'VIP99') {
      localStorage.setItem('mephisto_vip_active', 'true');
      localStorage.setItem('mephisto_vip_key', cleanKey);
      setIsVip(true);
      setSuccessMsg(t.vipKeySuccess);
      window.dispatchEvent(new CustomEvent('mephisto-vip-change'));
    } else {
      setKeyError(t.vipKeyInvalid);
    }
  };

  const handleDeactivate = () => {
    localStorage.removeItem('mephisto_vip_active');
    localStorage.removeItem('mephisto_vip_key');
    localStorage.removeItem('mephisto_vip_plan');
    localStorage.removeItem('mephisto_vip_expires_at');
    localStorage.removeItem('mephisto_paddle_customer_id');
    setIsVip(false);
    setSuccessMsg('');
    setLicenseKey('');
    window.dispatchEvent(new CustomEvent('mephisto-vip-change'));
  };

  if (!isOpen) return null;

  let config: ReturnType<typeof getPaddleClientConfig> | null = null;
  try {
    config = getPaddleClientConfig();
  } catch {
    config = null;
  }

  const monthlyPriceFormatted =
    (config?.monthlyPriceId && pricePreviews[config.monthlyPriceId]?.formattedTotal) ||
    '$3.99';

  const lifetimePriceFormatted =
    (config?.lifetimePriceId && pricePreviews[config.lifetimePriceId]?.formattedTotal) ||
    '$29.99';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="vip-modal-title"
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-slate-900 border border-amber-500/30 shadow-2xl text-white p-6 sm:p-8 animate-in zoom-in-95 duration-150"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={lang === 'tr' ? 'Kapat' : 'Close'}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20">
            <Crown className="w-7 h-7" aria-hidden="true" />
          </div>
          <div>
            <h2
              id="vip-modal-title"
              className="text-2xl font-bold bg-gradient-to-r from-amber-400 via-orange-300 to-amber-200 bg-clip-text text-transparent"
            >
              {t.vipTitle}
            </h2>
            <p className="text-xs text-slate-400">{t.vipSubtitle}</p>
          </div>
        </div>

        {isVip ? (
          <div className="p-6 rounded-xl bg-amber-950/40 border border-amber-500/40 text-center space-y-4">
            <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-amber-500/20 text-amber-300 text-sm font-semibold border border-amber-500/30">
              <Sparkles className="w-4 h-4 text-amber-400 animate-spin" aria-hidden="true" />
              <span>{t.vipActiveBadge}</span>
            </div>
            <p className="text-sm text-slate-300">{t.vipActiveDesc}</p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleOpenCustomerPortal}
                disabled={isPortalLoading}
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs font-bold shadow-md shadow-amber-500/20 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 disabled:opacity-50"
              >
                {isPortalLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                ) : (
                  <ExternalLink className="w-4 h-4 text-slate-950" />
                )}
                <span>{isPortalLoading ? t.vipPortalOpening : t.vipManageSubscription}</span>
              </button>

              <button
                type="button"
                onClick={handleDeactivate}
                className="w-full sm:w-auto px-4 py-2.5 text-xs text-rose-400 border border-rose-500/30 rounded-lg hover:bg-rose-500/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 transition-colors"
              >
                {t.vipRemoveBtn}
              </button>
            </div>

            {portalError && (
              <div className="flex items-center justify-center space-x-2 text-xs text-rose-400 mt-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{portalError}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center space-x-2 p-3 rounded-lg bg-slate-800/60 border border-slate-700/50">
                <Check className="w-4 h-4 text-amber-400 shrink-0" aria-hidden="true" />
                <span>{t.vipFeatAdFree}</span>
              </div>
              <div className="flex items-center space-x-2 p-3 rounded-lg bg-slate-800/60 border border-slate-700/50">
                <Check className="w-4 h-4 text-amber-400 shrink-0" aria-hidden="true" />
                <span>{t.vipFeatEdu}</span>
              </div>
              <div className="flex items-center space-x-2 p-3 rounded-lg bg-slate-800/60 border border-slate-700/50">
                <Check className="w-4 h-4 text-amber-400 shrink-0" aria-hidden="true" />
                <span>{t.vipFeatStorage}</span>
              </div>
              <div className="flex items-center space-x-2 p-3 rounded-lg bg-slate-800/60 border border-slate-700/50">
                <Check className="w-4 h-4 text-amber-400 shrink-0" aria-hidden="true" />
                <span>{t.vipFeatOtp}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Monthly Plan Card */}
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700 hover:border-amber-500/50 transition-all flex flex-col justify-between">
                <div>
                  <div className="text-xs text-amber-400 font-semibold uppercase mb-1">
                    {VIP_PLANS.monthly.name}
                  </div>
                  {isLoadingPrices ? (
                    <div className="h-8 w-28 bg-slate-700/60 animate-pulse rounded my-1" />
                  ) : (
                    <div className="text-2xl font-bold text-white mb-2">
                      {monthlyPriceFormatted}{' '}
                      <span className="text-xs text-slate-400 font-normal">{t.vipPerMonth}</span>
                    </div>
                  )}
                  <p className="text-[11px] text-slate-400 mb-3">{VIP_PLANS.monthly.description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCheckout('monthly')}
                  disabled={checkoutLoadingPlan === 'monthly'}
                  className="w-full py-2 px-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs font-semibold text-white flex items-center justify-center space-x-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 disabled:opacity-60 transition-colors"
                >
                  {checkoutLoadingPlan === 'monthly' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CreditCard className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
                  )}
                  <span>{t.vipPayBtn}</span>
                </button>
              </div>

              {/* Lifetime Plan Card */}
              <div className="relative p-4 rounded-xl bg-gradient-to-b from-amber-950/30 to-slate-800/40 border border-amber-500/50 flex flex-col justify-between shadow-lg shadow-amber-500/5">
                <div className="absolute -top-2.5 right-3 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider shadow">
                  PRO
                </div>
                <div>
                  <div className="text-xs text-amber-400 font-semibold uppercase mb-1">
                    {VIP_PLANS.lifetime.name}
                  </div>
                  {isLoadingPrices ? (
                    <div className="h-8 w-28 bg-slate-700/60 animate-pulse rounded my-1" />
                  ) : (
                    <div className="text-2xl font-bold text-white mb-2">
                      {lifetimePriceFormatted}{' '}
                      <span className="text-xs text-slate-400 font-normal">{t.vipOneTime}</span>
                    </div>
                  )}
                  <p className="text-[11px] text-slate-400 mb-3">{VIP_PLANS.lifetime.description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCheckout('lifetime')}
                  disabled={checkoutLoadingPlan === 'lifetime'}
                  className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-xs font-bold text-slate-950 flex items-center justify-center space-x-1.5 shadow-md shadow-amber-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 disabled:opacity-60 transition-all"
                >
                  {checkoutLoadingPlan === 'lifetime' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-950" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-slate-950" aria-hidden="true" />
                  )}
                  <span>{t.vipLifetimeBtn}</span>
                </button>
              </div>
            </div>

            {/* Manual Key Redemption Form */}
            <form
              onSubmit={handleActivateKey}
              className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3"
            >
              <div className="flex items-center space-x-2 text-xs text-slate-300 font-semibold">
                <Key className="w-4 h-4 text-amber-400" aria-hidden="true" />
                <span>{t.vipKeyPrompt}</span>
              </div>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={licenseKey}
                  onChange={(e) => setLicenseKey(e.target.value)}
                  placeholder="MEPHISTO-VIP-PRO-2026"
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white uppercase focus:outline-none focus:border-amber-500 focus-visible:ring-2 focus-visible:ring-amber-500"
                  aria-label={t.vipKeyPrompt}
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-amber-500 text-xs font-bold text-slate-950 shadow-md shadow-amber-500/20 hover:bg-amber-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                >
                  {t.vipRedeem}
                </button>
              </div>
              {keyError && (
                <p className="text-xs text-rose-400" role="alert">
                  {keyError}
                </p>
              )}
              {successMsg && (
                <p className="text-xs text-emerald-400" role="status">
                  {successMsg}
                </p>
              )}
              <p className="text-[11px] text-slate-400">{t.vipTestHint}</p>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(VipUpgradeModal);
