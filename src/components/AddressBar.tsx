import React, { useState, useEffect, useCallback } from 'react';
import { Mailbox } from '../types';
import { Copy, RefreshCw, Trash2, Check, Pencil, Globe, Loader2, Timer, Plus, UserCheck, Ghost, SendToBack, Layers, Flame, Hourglass, ShieldCheck, Zap, Send } from 'lucide-react';
import { translations, Language } from '../translations';

const ACCOUNT_LIFETIME_MS = 24 * 60 * 60 * 1000; // 24 saat

/** Kalan süreyi formatla */
const formatCountdown = (ms: number): string => {
  if (ms <= 0) return '00:00:00';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

/** Kalan süreye göre renk */
const getTimerColor = (ms: number): string => {
  const hours = ms / 3600000;
  if (hours > 12) return 'text-green-500';
  if (hours > 6) return 'text-emerald-400';
  if (hours > 3) return 'text-yellow-400';
  if (hours > 1) return 'text-orange-400';
  return 'text-red-500';
};

interface AddressBarProps {
  mailbox: Mailbox | null;
  isLoading: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
  onChange: () => void;
  onDelete: () => void;
  progress: number;
  lang: Language;
  onCreateCustom?: () => void;
  onIdentity?: () => void;
  onForwarding?: () => void;
  onShareDrop?: () => void;
  onExtendTimer?: () => void;
  onOpenCustomDomain?: () => void;
  onOpenCompose?: () => void;
  autoVerifyEnabled?: boolean;
  onToggleAutoVerify?: () => void;
}

const AddressBar: React.FC<AddressBarProps> = ({
  mailbox, isLoading, isRefreshing, onRefresh, onChange, onDelete,
  progress, lang, onCreateCustom, onIdentity, onForwarding, onShareDrop,
  onOpenCustomDomain, onOpenCompose, autoVerifyEnabled, onToggleAutoVerify
}) => {
  const t = translations[lang];
  const [copied, setCopied] = useState(false);
  const [remainingMs, setRemainingMs] = useState<number | null>(null);

  // Geri sayım zamanlayıcısı
  useEffect(() => {
    if (!mailbox?.createdAt) {
      setRemainingMs(null);
      return;
    }
    const update = () => {
      const elapsed = Date.now() - mailbox.createdAt!;
      setRemainingMs(Math.max(0, ACCOUNT_LIFETIME_MS - elapsed));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [mailbox?.createdAt]);

  const handleCopy = () => {
    if (mailbox?.address) {
      navigator.clipboard.writeText(mailbox.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="w-full flex flex-col items-center gap-4 sm:gap-6 max-w-2xl mx-auto px-3 sm:px-4">

      {/* ADRES KUTUSU */}
      <div
        onClick={handleCopy}
        className="w-full relative group cursor-pointer active:scale-[0.99] transition-all duration-200"
        title={t.tipCopy}
      >
        <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500/20 to-orange-400/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500"></div>

        <div className="relative bg-[#0f1115] border border-white/10 rounded-xl sm:rounded-2xl p-1 shadow-xl flex items-center overflow-hidden h-14 sm:h-16 transition-colors duration-300">
          {/* İlerleme Çubuğu */}
          <div className="absolute bottom-0 left-0 h-[2px] bg-orange-500 transition-all duration-100 ease-linear z-10" style={{ width: `${progress}%` }}></div>

          {/* Sol İkon */}
          <div className="pl-2 sm:pl-4 pr-1 sm:pr-3 flex items-center justify-center flex-shrink-0">
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
            ) : (
              copied ? <Check className="w-5 h-5 text-green-500" /> : <Globe className="w-5 h-5 text-orange-500" />
            )}
          </div>

          {/* Mail Adresi */}
          <div className="flex-grow flex items-center justify-center md:justify-start min-w-0">
            {isLoading ? (
              <div className="h-5 w-40 bg-white/10 rounded animate-pulse"></div>
            ) : (
              <span className={`text-base sm:text-lg md:text-xl font-bold font-mono tracking-tight truncate w-full text-center md:text-left transition-colors duration-300 ${copied ? 'text-green-500' : 'text-white'}`}>
                {mailbox?.address}
              </span>
            )}
          </div>

          {/* Kopyala Rozeti + Geri Sayım */}
          <div className="pr-2 sm:pr-4 pl-1 sm:pl-2 flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
            {remainingMs !== null && (
              <div className={`hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/[0.03] border border-white/5 ${remainingMs < 3600000 ? 'animate-pulse' : ''}`}
                title={lang === 'tr' ? 'Hesap süresi' : 'Account expires in'}
              >
                <Timer className={`w-3 h-3 ${getTimerColor(remainingMs)}`} />
                <span className={`text-[10px] font-mono font-bold tabular-nums ${getTimerColor(remainingMs)}`}>
                  {formatCountdown(remainingMs)}
                </span>
              </div>
            )}
            <span className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-widest px-1.5 sm:px-2 py-1 rounded bg-white/5 transition-colors whitespace-nowrap ${copied ? 'text-green-500' : 'text-slate-400 group-hover:text-slate-300'}`}>
              {copied ? t.copied : t.copy}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 w-full items-center">
        {/* TEMEL İŞLEMLER */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 w-full">
          <button onClick={(e) => { e.stopPropagation(); handleCopy(); }} className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-[#111] text-slate-200 hover:bg-[#1a1a1a] border border-white/10 rounded-full font-bold text-[11px] sm:text-xs md:text-sm transition-all shadow-sm hover:shadow active:scale-95">
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-slate-400" />}
            <span>{t.copy}</span>
          </button>
          <button onClick={onRefresh} className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-[#111] text-slate-200 hover:bg-[#1a1a1a] border border-white/10 rounded-full font-bold text-[11px] sm:text-xs md:text-sm transition-all shadow-sm hover:shadow active:scale-95">
            <RefreshCw className={`w-4 h-4 text-slate-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{t.refresh}</span>
          </button>
          <button onClick={onChange} className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-[#111] text-slate-200 hover:bg-[#1a1a1a] border border-white/10 rounded-full font-bold text-[11px] sm:text-xs md:text-sm transition-all shadow-sm hover:shadow active:scale-95">
            <Plus className="w-4 h-4 text-slate-400" />
            <span>{lang === 'tr' ? 'Yeni' : 'New'}</span>
          </button>
          <button onClick={onCreateCustom} className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-[#111] text-slate-200 hover:bg-[#1a1a1a] border border-white/10 rounded-full font-bold text-[11px] sm:text-xs md:text-sm transition-all shadow-sm hover:shadow active:scale-95">
            <Pencil className="w-4 h-4 text-slate-400" />
            <span>{t.change}</span>
          </button>
          <button onClick={onDelete} className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-[#111] text-red-500 hover:bg-red-900/10 border border-white/10 rounded-full font-bold text-[11px] sm:text-xs md:text-sm transition-all shadow-sm hover:shadow active:scale-95">
            <Trash2 className="w-4 h-4" />
            <span>{t.delete}</span>
          </button>
        </div>

        {/* EKSTRA ARAÇLAR */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 w-full mt-2 pt-3 border-t border-white/5 relative">
          <span className="absolute -top-[9px] bg-[#050505] px-2 text-[10px] font-black tracking-widest text-slate-500 uppercase">{lang === 'tr' ? 'Araçlar & Güvenlik' : 'Tools & Security'}</span>
          
          {onOpenCustomDomain && (
            <button onClick={onOpenCustomDomain} className="flex items-center gap-1.5 px-3.5 py-1.5 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 border border-purple-500/20 rounded-xl font-bold text-[11px] transition-all shadow-sm" title={lang === 'tr' ? 'Kendi Alan Adını Bağla' : 'Bring Your Own Domain'}>
              <Globe className="w-3.5 h-3.5 text-purple-400" />
              <span>{lang === 'tr' ? 'Kendi Domainin' : 'Custom Domain'}</span>
            </button>
          )}

          {onOpenCompose && (
            <button onClick={onOpenCompose} className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 border border-blue-500/20 rounded-xl font-bold text-[11px] transition-all shadow-sm" title={lang === 'tr' ? 'E-posta Gönder / Yanıtla' : 'Send / Reply Email'}>
              <Send className="w-3.5 h-3.5 text-blue-400" />
              <span>{lang === 'tr' ? 'Mail Gönder' : 'Compose Mail'}</span>
            </button>
          )}

          {onToggleAutoVerify && (
            <button onClick={onToggleAutoVerify} className={`flex items-center gap-1.5 px-3.5 py-1.5 border rounded-xl font-bold text-[11px] transition-all shadow-sm ${autoVerifyEnabled ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-amber-500/10' : 'bg-white/[0.03] text-slate-400 hover:text-slate-200 border-white/10'}`} title={lang === 'tr' ? 'Otomatik Doğrulama (Auto-Verify)' : 'Auto Verification Link Clicker'}>
              <Zap className={`w-3.5 h-3.5 ${autoVerifyEnabled ? 'text-amber-400 animate-pulse' : 'text-slate-400'}`} />
              <span>Auto-Verify {autoVerifyEnabled ? '[AÇIK]' : '[KAPALI]'}</span>
            </button>
          )}

          {onIdentity && (
            <button onClick={onIdentity} className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white/[0.03] text-slate-400 hover:text-white hover:bg-white/[0.06] border border-white/10 rounded-xl font-bold text-[11px] transition-all" title={lang === 'tr' ? 'Sahte Kimlik' : 'Fake Identity'}>
              <UserCheck className="w-3.5 h-3.5" />
              <span>{lang === 'tr' ? 'Kimlik' : 'Identity'}</span>
            </button>
          )}
          {onShareDrop && (
            <button onClick={onShareDrop} className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white/[0.03] text-slate-400 hover:text-white hover:bg-white/[0.06] border border-white/10 rounded-xl font-bold text-[11px] transition-all" title={lang === 'tr' ? 'Güvenli Dosya Al' : 'Secure Drop Link'}>
              <SendToBack className="w-3.5 h-3.5" />
              <span>Drop Link</span>
            </button>
          )}
          <a href="/bulk-generator" className="flex items-center gap-1.5 px-3.5 py-1.5 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 border border-orange-500/20 rounded-xl font-bold text-[11px] transition-all">
            <Layers className="w-3.5 h-3.5" />
            <span>{lang === 'tr' ? 'Toplu Mail' : 'Bulk Temp'}</span>
          </a>
          <a href="/burn-note" className="flex items-center gap-1.5 px-3.5 py-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 rounded-xl font-bold text-[11px] transition-all">
            <Flame className="w-3.5 h-3.5" />
            <span>{lang === 'tr' ? 'Burn Note' : 'Burn Note'}</span>
          </a>
          <div className="flex items-center gap-1 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 font-bold text-[10px]" title="Domain Health Risk Score: 100% Clean">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Risk: %0 (Temiz)</span>
          </div>
        </div>
      </div>

    </div>
  );
};

export default AddressBar;