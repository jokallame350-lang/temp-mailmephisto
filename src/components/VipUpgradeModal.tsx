import React, { useState } from 'react';
import { Crown, Check, X, Sparkles, CreditCard, Key } from 'lucide-react';
import { Language } from '../translations';

interface VipUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  isVip: boolean;
  setIsVip: (vip: boolean) => void;
}

export const VipUpgradeModal: React.FC<VipUpgradeModalProps> = ({
  isOpen, onClose, lang, isVip, setIsVip
}) => {
  const [licenseKey, setLicenseKey] = useState('');
  const [keyError, setKeyError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleActivateKey = (e: React.FormEvent) => {
    e.preventDefault();
    setKeyError('');
    setSuccessMsg('');
    const cleanKey = licenseKey.trim().toUpperCase();
    if (!cleanKey) {
      setKeyError(lang === 'tr' ? 'Lütfen geçerli bir lisans kodu girin.' : 'Please enter a valid license key.');
      return;
    }
    if (cleanKey.includes('MEPHISTO-VIP') || cleanKey === 'PRO2026' || cleanKey === 'VIP99') {
      localStorage.setItem('mephisto_vip_active', 'true');
      localStorage.setItem('mephisto_vip_key', cleanKey);
      setIsVip(true);
      setSuccessMsg(lang === 'tr' ? 'Tebrikler! VIP Üyeliğiniz aktifleştirildi!' : 'Congratulations! VIP Membership active!');
    } else {
      setKeyError(lang === 'tr' ? 'Geçersiz kod. Test için MEPHISTO-VIP-PRO-2026 kullanın.' : 'Invalid key. Try MEPHISTO-VIP-PRO-2026.');
    }
  };

  const handleDeactivate = () => {
    localStorage.removeItem('mephisto_vip_active');
    localStorage.removeItem('mephisto_vip_key');
    setIsVip(false);
    setSuccessMsg('');
    setLicenseKey('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-slate-900 border border-amber-500/30 shadow-2xl text-white p-6 sm:p-8">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20">
            <Crown className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-amber-400 via-orange-300 to-amber-200 bg-clip-text text-transparent">
              {lang === 'tr' ? 'MephistoMail VIP Supporter' : 'MephistoMail VIP Supporter'}
            </h2>
            <p className="text-xs text-slate-400">
              {lang === 'tr' ? '%100 Reklamsız, Sınırsız Özel Domain ve Saklama Ayrıcalığı' : '100% Ad-Free, Custom Domain & Extended 30-Day Inbox'}
            </p>
          </div>
        </div>

        {isVip ? (
          <div className="p-6 rounded-xl bg-amber-950/40 border border-amber-500/40 text-center space-y-4">
            <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-amber-500/20 text-amber-300 text-sm font-semibold border border-amber-500/30">
              <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
              <span>{lang === 'tr' ? '👑 VIP Üyeliğiniz Aktif!' : '👑 VIP Membership Active!'}</span>
            </div>
            <p className="text-sm text-slate-300">
              {lang === 'tr' ? 'Tüm reklamlar gizlendi, öncelikli OTP doğrulama altyapınız açık.' : 'All ads disabled, priority OTP routing unlocked.'}
            </p>
            <button onClick={handleDeactivate} className="px-4 py-2 text-xs text-rose-400 border border-rose-500/30 rounded-lg hover:bg-rose-500/10">
              {lang === 'tr' ? 'VIP Lisansını Kaldır (Test)' : 'Remove VIP License (Test)'}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center space-x-2 p-3 rounded-lg bg-slate-800/60 border border-slate-700/50">
                <Check className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{lang === 'tr' ? '🚫 %100 Reklamsız Sörf Deneyimi' : '🚫 100% Ad-Free Clean UI'}</span>
              </div>
              <div className="flex items-center space-x-2 p-3 rounded-lg bg-slate-800/60 border border-slate-700/50">
                <Check className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{lang === 'tr' ? '🎓 Özel Üniversite & .EDU Domain' : '🎓 Custom University & .EDU Domains'}</span>
              </div>
              <div className="flex items-center space-x-2 p-3 rounded-lg bg-slate-800/60 border border-slate-700/50">
                <Check className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{lang === 'tr' ? '📁 30 Günlük Uzatılmış Mail Depolama' : '📁 30-Day Extended Email Storage'}</span>
              </div>
              <div className="flex items-center space-x-2 p-3 rounded-lg bg-slate-800/60 border border-slate-700/50">
                <Check className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{lang === 'tr' ? '⚡ <1 Sn Öncelikli OTP Teslimatı' : '⚡ <1 Sec Priority OTP Delivery'}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700 hover:border-amber-500/50 transition-all flex flex-col justify-between">
                <div>
                  <div className="text-xs text-amber-400 font-semibold uppercase mb-1">{lang === 'tr' ? 'Aylık VIP' : 'Monthly VIP'}</div>
                  <div className="text-2xl font-bold text-white mb-2">$3.99 <span className="text-xs text-slate-400">/ mo</span></div>
                </div>
                <button onClick={() => alert('LemonSqueezy / Cryptomus Checkout')} className="w-full py-2 px-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs font-semibold text-white flex items-center justify-center space-x-1">
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>{lang === 'tr' ? 'Kart veya Kripto ile Öde' : 'Pay with Card or Crypto'}</span>
                </button>
              </div>

              <div className="relative p-4 rounded-xl bg-gradient-to-b from-amber-950/30 to-slate-800/40 border border-amber-500/50 flex flex-col justify-between shadow-lg shadow-amber-500/5">
                <div>
                  <div className="text-xs text-amber-400 font-semibold uppercase mb-1">{lang === 'tr' ? 'Ömür Boyu PRO' : 'Lifetime PRO'}</div>
                  <div className="text-2xl font-bold text-white mb-2">$29.99 <span className="text-xs text-slate-400">/ one-time</span></div>
                </div>
                <button onClick={() => alert('LemonSqueezy / Cryptomus Checkout')} className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-xs font-bold text-slate-950 flex items-center justify-center space-x-1 shadow-md shadow-amber-500/20">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{lang === 'tr' ? 'Ömür Boyu VIP Satın Al' : 'Get Lifetime VIP'}</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleActivateKey} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
              <div className="flex items-center space-x-2 text-xs text-slate-300 font-semibold">
                <Key className="w-4 h-4 text-amber-400" />
                <span>{lang === 'tr' ? 'Zaten bir Lisans Kodunuz mu var?' : 'Already have a VIP License Key?'}</span>
              </div>
              <div className="flex space-x-2">
                <input type="text" value={licenseKey} onChange={(e) => setLicenseKey(e.target.value)} placeholder="MEPHISTO-VIP-PRO-2026" className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white uppercase" />
                <button type="submit" className="px-4 py-2 rounded-lg bg-amber-500 text-xs font-bold text-slate-950 shadow-md shadow-amber-500/20">{lang === 'tr' ? 'Aktifleştir' : 'Redeem'}</button>
              </div>
              {keyError && <p className="text-xs text-rose-400">{keyError}</p>}
              {successMsg && <p className="text-xs text-emerald-400">{successMsg}</p>}
              <p className="text-[11px] text-slate-500">💡 Yerel test için MEPHISTO-VIP-PRO-2026 yazabilirsiniz.</p>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
export default VipUpgradeModal;