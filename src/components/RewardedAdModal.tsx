import React, { useState, useEffect } from 'react';
import { Film, Gift, X, Lock, Check, Timer } from 'lucide-react';
import { Language } from '../translations';

const CREDITS_STORAGE_KEY = 'mephisto_credits';
const FREE_CREDITS = 3;
const CREDITS_PER_AD = 3;

function getCredits(): number {
    try {
        const saved = localStorage.getItem(CREDITS_STORAGE_KEY);
        if (saved === null) return FREE_CREDITS; // İlk kez gelen kullanıcı
        return Math.max(0, parseInt(saved, 10) || 0);
    } catch {
        return FREE_CREDITS;
    }
}

interface RewardedAdModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreditsEarned: (amount: number) => void;
    lang: Language;
}

const RewardedAdModal: React.FC<RewardedAdModalProps> = ({ isOpen, onClose, onCreditsEarned, lang }) => {
    const [adState, setAdState] = useState<'idle' | 'watching' | 'completed'>('idle');
    const [countdown, setCountdown] = useState(5);
    const credits = getCredits();

    useEffect(() => {
        if (adState === 'watching' && countdown > 0) {
            const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
            return () => clearTimeout(timer);
        }
        if (adState === 'watching' && countdown === 0) {
            setAdState('completed');
        }
    }, [adState, countdown]);

    const handleWatchAd = () => {
        setAdState('watching');
        setCountdown(5);

        /**
         * PRODUCTION: Google AdSense Rewarded Ad Integration
         * 
         * Replace the countdown simulation with actual rewarded ad:
         * 
         * if (window.googletag) {
         *   googletag.cmd.push(() => {
         *     const slot = googletag.defineOutOfPageSlot(
         *       '/your-ad-unit-id',
         *       googletag.enums.OutOfPageFormat.REWARDED
         *     );
         *     slot.addService(googletag.pubads());
         *     googletag.pubads().addEventListener('rewardedSlotReady', (evt) => {
         *       evt.makeRewardedVisible();
         *     });
         *     googletag.pubads().addEventListener('rewardedSlotClosed', () => {
         *       // User closed before reward
         *       setAdState('idle');
         *     });
         *     googletag.pubads().addEventListener('rewardedSlotGranted', () => {
         *       setAdState('completed');
         *     });
         *     googletag.enableServices();
         *     googletag.display(slot);
         *   });
         * }
         */
    };

    const handleClaimReward = () => {
        // Kredileri ekle
        const current = getCredits();
        localStorage.setItem(CREDITS_STORAGE_KEY, String(current + CREDITS_PER_AD));
        onCreditsEarned(CREDITS_PER_AD);
        setAdState('idle');
        setCountdown(5);
        onClose();
    };

    if (!isOpen) return null;

    const t = {
        title: lang === 'tr' ? 'E-posta Hakları Bitti' : 'Email Credits Depleted',
        subtitle: lang === 'tr'
            ? 'Ücretsiz 3 e-posta hakkınız doldu. Kısa bir reklam izleyerek yeni haklar kazanın!'
            : 'Your 3 free email credits are used up. Watch a short ad to earn more!',
        currentCredits: lang === 'tr' ? 'Mevcut Hak' : 'Current Credits',
        watchAd: lang === 'tr' ? 'Reklam İzle → +3 Hak Kazan' : 'Watch Ad → Earn +3 Credits',
        watching: lang === 'tr' ? 'Reklam İzleniyor...' : 'Watching Ad...',
        waitSec: lang === 'tr' ? 'saniye' : 'seconds',
        completed: lang === 'tr' ? '🎉 Tebrikler!' : '🎉 Congratulations!',
        completedMsg: lang === 'tr' ? '+3 e-posta hakkı kazandınız!' : 'You earned +3 email credits!',
        claim: lang === 'tr' ? 'Hakları Al' : 'Claim Credits',
        close: lang === 'tr' ? 'Kapat' : 'Close',
        howItWorks: lang === 'tr' ? 'Nasıl Çalışır?' : 'How It Works?',
        step1: lang === 'tr' ? 'Ücretsiz 3 e-posta hakkı ile başlarsınız' : 'You start with 3 free email credits',
        step2: lang === 'tr' ? 'Her yeni hesap oluşturma 1 hak kullanır' : 'Each new account uses 1 credit',
        step3: lang === 'tr' ? 'Haklar bitince kısa reklam izleyerek +3 hak kazanın' : 'When credits run out, watch a short ad to earn +3 more',
        privacyNote: lang === 'tr'
            ? '🔒 Kişisel veriniz asla toplanmaz. Reklamlar üçüncü taraf servis tarafından sunulur.'
            : '🔒 Your personal data is never collected. Ads are served by a third-party service.',
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
            <div
                className="w-full max-w-md bg-[#0a0a0f] border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="relative p-6 pb-4 text-center">
                    <button onClick={onClose} className="absolute top-4 right-4 p-1.5 text-slate-600 hover:text-white transition-colors">
                        <X className="w-4 h-4" />
                    </button>

                    {adState === 'completed' ? (
                        <>
                            <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center animate-bounce">
                                <Gift className="w-8 h-8 text-white" />
                            </div>
                            <h2 className="text-xl font-black text-white">{t.completed}</h2>
                            <p className="text-sm text-green-400 mt-1">{t.completedMsg}</p>
                        </>
                    ) : (
                        <>
                            <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl flex items-center justify-center">
                                <Lock className="w-8 h-8 text-white" />
                            </div>
                            <h2 className="text-xl font-black text-white">{t.title}</h2>
                            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">{t.subtitle}</p>
                        </>
                    )}
                </div>

                {/* Content */}
                <div className="px-6 pb-2">
                    {/* Credits display */}
                    <div className="flex items-center justify-center gap-4 py-3 bg-white/[0.03] rounded-xl mb-4">
                        <div className="text-center">
                            <p className="text-2xl font-black text-red-500">{credits}</p>
                            <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">{t.currentCredits}</p>
                        </div>
                    </div>

                    {adState === 'watching' ? (
                        <div className="text-center py-8">
                            {/* Ad placeholder — replace with real rewarded ad */}
                            <div className="w-full h-40 bg-white/[0.02] border border-white/5 rounded-xl flex flex-col items-center justify-center mb-4">
                                <Film className="w-8 h-8 text-slate-500 mb-2 animate-pulse" />
                                <p className="text-xs text-slate-500 font-mono">AD PLAYING</p>
                                <p className="text-[9px] text-slate-600 mt-1">
                                    {/* PRODUCTION: Gerçek reklam burada gösterilecek */}
                                    data-ad-slot="rewarded-video"
                                </p>
                            </div>
                            <div className="flex items-center justify-center gap-2 text-amber-400">
                                <Timer className="w-4 h-4 animate-spin" />
                                <span className="text-lg font-black tabular-nums">{countdown}</span>
                                <span className="text-xs text-slate-500">{t.waitSec}</span>
                            </div>
                        </div>
                    ) : adState === 'completed' ? (
                        <button
                            onClick={handleClaimReward}
                            className="w-full py-3.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-black rounded-xl hover:opacity-90 transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-sm"
                        >
                            <Check className="w-4 h-4" />
                            {t.claim}
                        </button>
                    ) : (
                        <button
                            onClick={handleWatchAd}
                            className="w-full py-3.5 bg-gradient-to-r from-red-600 to-orange-600 text-white font-black rounded-xl hover:opacity-90 transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-sm"
                        >
                            <Film className="w-4 h-4" />
                            {t.watchAd}
                        </button>
                    )}
                </div>

                {/* How it works */}
                {adState === 'idle' && (
                    <div className="px-6 py-4 mt-2 border-t border-white/5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">{t.howItWorks}</p>
                        <div className="space-y-1.5">
                            {[t.step1, t.step2, t.step3].map((step, i) => (
                                <div key={i} className="flex items-start gap-2 text-[11px] text-slate-400">
                                    <span className="w-4 h-4 rounded-full bg-white/5 text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                                    {step}
                                </div>
                            ))}
                        </div>
                        <p className="text-[9px] text-slate-600 mt-3">{t.privacyNote}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RewardedAdModal;
