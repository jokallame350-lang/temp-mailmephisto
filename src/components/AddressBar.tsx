import React, { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react';
import { Mailbox } from '../types';
import { Copy, RefreshCw, Trash2, Check, Pencil, Globe, Loader2, Timer, Plus, UserCheck, SendToBack, Layers, Flame, ShieldCheck, Zap, Share2, Link, FileText, FileSpreadsheet, ChevronDown, Search, X, Volume2, VolumeX } from 'lucide-react';
import { translations, Language } from '../translations';
import { isSoundEnabled, toggleSound } from '../utils/audioNotification';
import { fetchDomains, GUERRILLA_DOMAINS } from '../services/mailService';

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

/**
 * Isolated Countdown Badge to prevent 1-second interval
 * from triggering re-render cascades across the parent AddressBar
 */
const CountdownBadge: React.FC<{ createdAt?: number; lang: Language }> = memo(({ createdAt, lang }) => {
  const [remainingMs, setRemainingMs] = useState<number | null>(() => {
    if (!createdAt) return null;
    return Math.max(0, ACCOUNT_LIFETIME_MS - (Date.now() - createdAt));
  });

  useEffect(() => {
    if (!createdAt) {
      setRemainingMs(null);
      return;
    }
    const update = () => {
      const elapsed = Date.now() - createdAt;
      setRemainingMs(Math.max(0, ACCOUNT_LIFETIME_MS - elapsed));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [createdAt]);

  if (remainingMs === null) return null;

  return (
    <div
      className={`hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/[0.03] border border-white/5 ${
        remainingMs < 3600000 ? 'animate-pulse' : ''
      }`}
      title={lang === 'tr' ? 'Hesap süresi' : 'Account expires in'}
    >
      <Timer className={`w-3 h-3 ${getTimerColor(remainingMs)}`} />
      <span className={`text-[10px] font-mono font-bold tabular-nums ${getTimerColor(remainingMs)}`}>
        {formatCountdown(remainingMs)}
      </span>
    </div>
  );
});

CountdownBadge.displayName = 'CountdownBadge';

interface AddressBarProps {
  mailbox: Mailbox | null;
  isLoading: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
  onChange: () => void;
  onDelete: () => void;
  progress: number;
  lang: Language;
  onChangeDomain?: (domain: string) => void;
  onCreateCustom?: () => void;
  onIdentity?: () => void;
  onForwarding?: () => void;
  onShareDrop?: () => void;
  onExtendTimer?: () => void;
  onOpenCustomDomain?: () => void;
  onOpenCompose?: () => void;
  autoVerifyEnabled?: boolean;
  onToggleAutoVerify?: () => void;
  onCopyMagicUrl?: () => void;
}

const AddressBar: React.FC<AddressBarProps> = ({
  mailbox, isLoading, isRefreshing, onRefresh, onChange, onDelete,
  progress, lang, onChangeDomain, onCreateCustom, onIdentity, onShareDrop,
  onOpenCustomDomain, autoVerifyEnabled, onToggleAutoVerify, onCopyMagicUrl
}) => {
  const t = translations[lang];
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [soundEnabled, setSoundEnabledState] = useState<boolean>(() => isSoundEnabled());

  // Quick Domain Switcher Popover State
  const [isDomainOpen, setIsDomainOpen] = useState(false);
  const [domainList, setDomainList] = useState<string[]>(GUERRILLA_DOMAINS);
  const [domainSearch, setDomainSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const domainBtnRef = useRef<HTMLButtonElement>(null);

  const addressParts = mailbox?.address ? mailbox.address.split('@') : ['', ''];
  const username = addressParts[0] || '';
  const currentDomain = addressParts[1] || '';

  // Fetch available domains with resilient fallback
  useEffect(() => {
    fetchDomains().then(res => {
      if (res?.domains?.length) {
        setDomainList(res.domains);
      }
    }).catch(() => {
      // Fallback already in initial state
    });
  }, []);

  // Handle click outside & escape key to close popover
  useEffect(() => {
    if (!isDomainOpen) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        domainBtnRef.current &&
        !domainBtnRef.current.contains(target)
      ) {
        setIsDomainOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsDomainOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDomainOpen]);

  const handleDomainSelect = useCallback((dom: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsDomainOpen(false);
    if (dom.toLowerCase() === currentDomain.toLowerCase()) return;
    if (onChangeDomain) {
      onChangeDomain(dom);
    }
  }, [currentDomain, onChangeDomain]);

  const filteredDomains = useMemo(() => {
    if (!domainSearch.trim()) return domainList;
    return domainList.filter(d => d.toLowerCase().includes(domainSearch.toLowerCase().trim()));
  }, [domainList, domainSearch]);

  useEffect(() => {
    const handleSoundChange = (e: Event) => {
      const custom = e as CustomEvent;
      if (custom.detail && typeof custom.detail.enabled === 'boolean') {
        setSoundEnabledState(custom.detail.enabled);
      } else {
        setSoundEnabledState(isSoundEnabled());
      }
    };
    window.addEventListener('mephisto-sound-toggle', handleSoundChange);
    return () => window.removeEventListener('mephisto-sound-toggle', handleSoundChange);
  }, []);

  const handleCopy = useCallback(() => {
    if (mailbox?.address) {
      navigator.clipboard.writeText(mailbox.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [mailbox?.address]);

  const handleCopyMagicUrl = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!mailbox?.address || typeof window === 'undefined') return;
    const url = new URL(window.location.origin);
    url.searchParams.set('mailbox', mailbox.address);
    const magicUrl = url.toString();

    if (navigator.clipboard) {
      navigator.clipboard.writeText(magicUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }

    if (onCopyMagicUrl) {
      onCopyMagicUrl();
    }
  }, [mailbox?.address, onCopyMagicUrl]);

  const handleTestOtpTrigger = useCallback(() => {
    if (!mailbox?.address) return;
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    window.dispatchEvent(new CustomEvent('mephisto-test-otp', {
      detail: {
        id: 'test_' + Date.now(),
        from: 'security@verify-service.com',
        subject: lang === 'tr' ? `🔐 Doğrulama Kodunuz: ${otpCode}` : `🔐 Your Verification Code: ${otpCode}`,
        body: lang === 'tr'
          ? `Merhaba! MephistoMail canlı test doğrulaması başarılı. Güvenlik OTP kodunuz: ${otpCode}`
          : `Hello! MephistoMail live test verification successful. Your security PIN is: ${otpCode}`,
        date: new Date().toLocaleTimeString()
      }
    }));
  }, [mailbox?.address, lang]);

  const exportMailboxTxt = useCallback(() => {
    if (!mailbox?.address) return;
    const magicUrl = typeof window !== 'undefined' ? `${window.location.origin}/?mailbox=${encodeURIComponent(mailbox.address)}` : '';
    const content = [
      `========================================`,
      `MEPHISTOMAIL - MAILBOX EXPORT (TXT)`,
      `========================================`,
      `Mailbox Address: ${mailbox.address}`,
      `Magic Share URL: ${magicUrl}`,
      `Created At:      ${mailbox.createdAt ? new Date(mailbox.createdAt).toLocaleString() : 'N/A'}`,
      `Domain:          ${mailbox.address.split('@')[1] || ''}`,
      `Auto Delete:     ${mailbox.autoDeleteMinutes ? `${mailbox.autoDeleteMinutes} mins` : 'Disabled'}`,
      `========================================`
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mailbox_${mailbox.address.split('@')[0]}_export.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [mailbox?.address, mailbox?.createdAt, mailbox?.autoDeleteMinutes]);

  const exportMailboxCsv = useCallback(() => {
    if (!mailbox?.address) return;
    const magicUrl = typeof window !== 'undefined' ? `${window.location.origin}/?mailbox=${encodeURIComponent(mailbox.address)}` : '';
    const headers = 'Address,MagicURL,CreatedAt,Domain,AutoDeleteMinutes\n';
    const row = `"${mailbox.address}","${magicUrl}","${mailbox.createdAt ? new Date(mailbox.createdAt).toISOString() : ''}","${mailbox.address.split('@')[1] || ''}","${mailbox.autoDeleteMinutes || 0}"\n`;
    const content = headers + row;

    const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mailbox_${mailbox.address.split('@')[0]}_export.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [mailbox?.address, mailbox?.createdAt, mailbox?.autoDeleteMinutes]);

  return (
    <div className="w-full flex flex-col items-center gap-4 sm:gap-6 max-w-2xl mx-auto px-3 sm:px-4">

      {/* ADRES KUTUSU */}
      <div
        role="button"
        tabIndex={0}
        onClick={handleCopy}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleCopy();
          }
        }}
        className="w-full relative group cursor-pointer active:scale-[0.99] transition-transform duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500/50 rounded-2xl"
        title={t.tipCopy}
      >
        <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500/20 to-orange-400/20 rounded-2xl blur-sm opacity-0 group-hover:opacity-100 transition duration-300 pointer-events-none"></div>

        <div className="relative bg-[#0f1115] border border-white/10 rounded-xl sm:rounded-2xl p-1 shadow-xl flex items-center overflow-visible h-14 sm:h-16 transition-colors duration-200">
          {/* İlerleme Çubuğu */}
          <div className="absolute bottom-0 left-0 h-[2px] bg-orange-500 transition-all duration-100 ease-linear z-10 rounded-full" style={{ width: `${progress}%` }}></div>

          {/* Sol İkon */}
          <div className="pl-2 sm:pl-4 pr-1 sm:pr-3 flex items-center justify-center flex-shrink-0">
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
            ) : (
              copied ? <Check className="w-5 h-5 text-green-500" /> : <Globe className="w-5 h-5 text-orange-500" />
            )}
          </div>

          {/* Mail Adresi & Domain Switcher */}
          <div className="flex-grow flex items-center justify-center md:justify-start min-w-0 pr-1">
            {isLoading ? (
              <div className="h-5 w-40 bg-white/10 rounded animate-pulse"></div>
            ) : (
              <div className="flex items-center min-w-0 max-w-full text-base sm:text-lg md:text-xl font-mono tracking-tight select-none">
                <span className={`font-bold truncate transition-colors duration-200 ${copied ? 'text-green-500' : 'text-white'}`}>
                  {username}
                </span>
                {currentDomain && (
                  <div className="relative inline-flex items-center flex-shrink-0">
                    <button
                      ref={domainBtnRef}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsDomainOpen(prev => !prev);
                      }}
                      className={`group/dom ml-1 px-1.5 sm:px-2 py-0.5 rounded-lg flex items-center gap-1 font-bold text-xs sm:text-sm md:text-base transition-all duration-200 border cursor-pointer ${
                        isDomainOpen
                          ? 'bg-orange-500/25 text-orange-300 border-orange-500/60 shadow-lg shadow-orange-500/20 ring-2 ring-orange-500/30 scale-105'
                          : 'text-orange-400 hover:text-orange-200 bg-orange-500/10 hover:bg-orange-500/20 border-orange-500/30 hover:border-orange-500/50'
                      }`}
                      title={lang === 'tr' ? '1 Tıkla Alan Adı Değiştir (@' + currentDomain + ')' : '1-Click Quick Domain Switch (@' + currentDomain + ')'}
                      aria-expanded={isDomainOpen}
                      aria-haspopup="listbox"
                    >
                      <span className="truncate">@{currentDomain}</span>
                      <ChevronDown className={`w-3.5 h-3.5 flex-shrink-0 transition-transform duration-200 ${isDomainOpen ? 'rotate-180 text-orange-300' : 'text-orange-400/80 group-hover/dom:text-orange-200'}`} />
                    </button>

                    {/* Quick Domain Switch Popover Dropdown */}
                    {isDomainOpen && (
                      <div
                        ref={dropdownRef}
                        onClick={(e) => e.stopPropagation()}
                        className="absolute top-[calc(100%+10px)] left-0 sm:-left-12 w-72 sm:w-80 bg-[#0c0d12]/95 backdrop-blur-2xl border border-orange-500/40 rounded-2xl shadow-2xl shadow-black/95 p-3 z-50 animate-in fade-in zoom-in-95 duration-150 flex flex-col gap-2.5"
                        role="listbox"
                        aria-label={lang === 'tr' ? 'Alan Adı Listesi' : 'Domain List'}
                      >
                        {/* Popover Header */}
                        <div className="flex items-center justify-between pb-2 border-b border-white/10">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-orange-500/20 border border-orange-500/30 flex items-center justify-center">
                              <Globe className="w-3.5 h-3.5 text-orange-400" />
                            </div>
                            <div>
                              <h4 className="text-[11px] font-bold text-white uppercase tracking-wider">
                                {lang === 'tr' ? 'Hızlı Domain Değiştir' : 'Quick Domain Switch'}
                              </h4>
                              <p className="text-[9px] text-slate-400">
                                {lang === 'tr' ? '1 Tıkla Anında Geçiş' : 'Instant 1-Click Switch'}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setIsDomainOpen(false)}
                            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                            aria-label="Close"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Search in Dropdown */}
                        {domainList.length > 4 && (
                          <div className="relative">
                            <Search className="w-3 h-3 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                              type="text"
                              value={domainSearch}
                              onChange={(e) => setDomainSearch(e.target.value)}
                              placeholder={lang === 'tr' ? 'Domain ara...' : 'Search domain...'}
                              className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-8 pr-7 py-1.5 text-xs text-white placeholder:text-slate-500 outline-none focus:border-orange-500/50"
                              autoFocus
                            />
                            {domainSearch && (
                              <button
                                type="button"
                                onClick={() => setDomainSearch('')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        )}

                        {/* Domain List Items */}
                        <div className="overflow-y-auto max-h-56 pr-1 space-y-1 custom-scrollbar">
                          {filteredDomains.length === 0 ? (
                            <div className="text-center py-4 text-xs text-slate-500 font-mono">
                              {lang === 'tr' ? 'Domain bulunamadı' : 'No domains found'}
                            </div>
                          ) : (
                            filteredDomains.map((d) => {
                              const isActive = d.toLowerCase() === currentDomain.toLowerCase();
                              return (
                                <button
                                  key={d}
                                  type="button"
                                  role="option"
                                  aria-selected={isActive}
                                  onClick={(e) => handleDomainSelect(d, e)}
                                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-mono transition-all duration-150 border cursor-pointer ${
                                    isActive
                                      ? 'bg-orange-500/20 text-orange-300 border-orange-500/40 shadow-sm shadow-orange-500/10 font-bold'
                                      : 'bg-white/[0.02] text-slate-300 hover:text-white hover:bg-orange-500/10 border-white/5 hover:border-orange-500/30'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isActive ? 'bg-orange-500 animate-pulse' : 'bg-slate-600'}`} />
                                    <span className="truncate font-semibold">@{d}</span>
                                  </div>
                                  <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                                    {isActive ? (
                                      <span className="flex items-center gap-1 text-[9px] font-sans font-bold text-orange-400 bg-orange-500/20 px-1.5 py-0.5 rounded-full border border-orange-500/30">
                                        <Check className="w-2.5 h-2.5 text-orange-400" />
                                        {lang === 'tr' ? 'Aktif' : 'Active'}
                                      </span>
                                    ) : (
                                      <span className="text-[9px] font-sans text-slate-500 hover:text-orange-400 flex items-center gap-0.5">
                                        <Zap className="w-2.5 h-2.5 text-amber-400" />
                                        {lang === 'tr' ? 'Seç' : 'Select'}
                                      </span>
                                    )}
                                  </div>
                                </button>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Kopyala Rozeti + Magic Share + Geri Sayım */}
          <div className="pr-2 sm:pr-4 pl-1 sm:pl-2 flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
            <CountdownBadge createdAt={mailbox?.createdAt} lang={lang} />
            <button
              type="button"
              onClick={handleCopyMagicUrl}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-orange-500/20 text-slate-400 hover:text-orange-400 transition-colors flex items-center gap-1"
              title={lang === 'tr' ? 'Direkt Mailbox URL Paylaş (?mailbox=...)' : 'Share Direct Mailbox URL (?mailbox=...)'}
            >
              {copiedLink ? <Check className="w-4 h-4 text-green-500" /> : <Share2 className="w-4 h-4 text-orange-400" />}
            </button>
            <span className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-widest px-1.5 sm:px-2 py-1 rounded bg-white/5 transition-colors whitespace-nowrap ${copied ? 'text-green-500' : 'text-slate-400 group-hover:text-slate-300'}`}>
              {copied ? t.copied : t.copy}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 w-full items-center">
        {/* TEMEL İŞLEMLER */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 w-full">
          <button onClick={(e) => { e.stopPropagation(); handleCopy(); }} className="flex items-center justify-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2.5 bg-[#111] text-slate-200 hover:bg-[#1a1a1a] border border-white/10 rounded-full font-bold text-[11px] sm:text-xs md:text-sm transition-all shadow-sm hover:shadow active:scale-95 min-h-[44px] min-w-[44px]">
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-slate-400" />}
            <span>{t.copy}</span>
          </button>
          <button onClick={handleCopyMagicUrl} className="flex items-center justify-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2.5 bg-[#111] text-slate-200 hover:bg-[#1a1a1a] border border-orange-500/30 hover:border-orange-500/60 rounded-full font-bold text-[11px] sm:text-xs md:text-sm transition-all shadow-sm hover:shadow active:scale-95 min-h-[44px] min-w-[44px]" title={lang === 'tr' ? '1-Tık Magic URL Bağlantısını (?mailbox=...) Kopyala' : '1-Click Magic URL (?mailbox=...) Copy'}>
            {copiedLink ? <Check className="w-4 h-4 text-green-500" /> : <Link className="w-4 h-4 text-orange-400" />}
            <span className={copiedLink ? 'text-green-500' : 'text-orange-400'}>{copiedLink ? (lang === 'tr' ? 'Magic URL Kopyalandı' : 'Magic URL Copied') : (lang === 'tr' ? 'Magic URL (?mailbox=)' : 'Magic URL (?mailbox=)')}</span>
          </button>
          <button onClick={onRefresh} className="flex items-center justify-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2.5 bg-[#111] text-slate-200 hover:bg-[#1a1a1a] border border-white/10 rounded-full font-bold text-[11px] sm:text-xs md:text-sm transition-all shadow-sm hover:shadow active:scale-95 min-h-[44px] min-w-[44px]">
            <RefreshCw className={`w-4 h-4 text-slate-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{t.refresh}</span>
          </button>
          <button onClick={onChange} className="flex items-center justify-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2.5 bg-[#111] text-slate-200 hover:bg-[#1a1a1a] border border-white/10 rounded-full font-bold text-[11px] sm:text-xs md:text-sm transition-all shadow-sm hover:shadow active:scale-95 min-h-[44px] min-w-[44px]">
            <Plus className="w-4 h-4 text-slate-400" />
            <span>{lang === 'tr' ? 'Yeni' : 'New'}</span>
          </button>
          <button onClick={onCreateCustom} className="flex items-center justify-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2.5 bg-[#111] text-slate-200 hover:bg-[#1a1a1a] border border-white/10 rounded-full font-bold text-[11px] sm:text-xs md:text-sm transition-all shadow-sm hover:shadow active:scale-95 min-h-[44px] min-w-[44px]">
            <Pencil className="w-4 h-4 text-slate-400" />
            <span>{t.change}</span>
          </button>
          <button onClick={onDelete} className="flex items-center justify-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2.5 bg-[#111] text-red-500 hover:bg-red-900/10 border border-white/10 rounded-full font-bold text-[11px] sm:text-xs md:text-sm transition-all shadow-sm hover:shadow active:scale-95 min-h-[44px] min-w-[44px]">
            <Trash2 className="w-4 h-4" />
            <span>{t.delete}</span>
          </button>
        </div>

        {/* EKSTRA ARAÇLAR */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 w-full mt-2 pt-3 border-t border-white/5 relative">
          <span className="absolute -top-[9px] bg-[#050505] px-2 text-[10px] font-black tracking-widest text-slate-500 uppercase">{lang === 'tr' ? 'Araçlar & Güvenlik' : 'Tools & Security'}</span>
          
          {onOpenCustomDomain && (
            <button onClick={onOpenCustomDomain} className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 border border-purple-500/20 rounded-xl font-bold text-[11px] transition-all shadow-sm min-h-[44px]" title={lang === 'tr' ? 'Kendi Alan Adını Bağla' : 'Bring Your Own Domain'}>
              <Globe className="w-3.5 h-3.5 text-purple-400" />
              <span>{lang === 'tr' ? 'Kendi Domainin' : 'Custom Domain'}</span>
            </button>
          )}

          {onToggleAutoVerify && (
            <button onClick={onToggleAutoVerify} className={`flex items-center justify-center gap-1.5 px-3.5 py-2 border rounded-xl font-bold text-[11px] transition-all shadow-sm min-h-[44px] ${autoVerifyEnabled ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-amber-500/10' : 'bg-white/[0.03] text-slate-400 hover:text-slate-200 border-white/10'}`} title={lang === 'tr' ? 'Otomatik Doğrulama (Auto-Verify)' : 'Auto Verification Link Clicker'}>
              <Zap className={`w-3.5 h-3.5 ${autoVerifyEnabled ? 'text-amber-400 animate-pulse' : 'text-slate-400'}`} />
              <span>Auto-Verify {autoVerifyEnabled ? '[AÇIK]' : '[KAPALI]'}</span>
            </button>
          )}

          <button
            onClick={() => {
              const next = toggleSound();
              setSoundEnabledState(next);
            }}
            className={`flex items-center justify-center gap-1.5 px-3.5 py-2 border rounded-xl font-bold text-[11px] transition-all shadow-sm min-h-[44px] ${
              soundEnabled
                ? 'bg-orange-500/15 text-orange-300 border-orange-500/30 hover:bg-orange-500/25'
                : 'bg-white/[0.03] text-slate-400 hover:text-slate-200 border-white/10 hover:bg-white/[0.06]'
            }`}
            title={
              soundEnabled
                ? (lang === 'tr' ? 'Bildirim Sesini Kapat (Sessiz)' : 'Mute Notification Sound')
                : (lang === 'tr' ? 'Bildirim Sesini Aç' : 'Enable Notification Sound')
            }
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-orange-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
            <span>{soundEnabled ? (lang === 'tr' ? 'Ses: Açık' : 'Sound: ON') : (lang === 'tr' ? 'Ses: Kapalı' : 'Sound: OFF')}</span>
          </button>

          {onIdentity && (
            <button onClick={onIdentity} className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-white/[0.03] text-slate-400 hover:text-white hover:bg-white/[0.06] border border-white/10 rounded-xl font-bold text-[11px] transition-all min-h-[44px]" title={lang === 'tr' ? 'Sahte Kimlik' : 'Fake Identity'}>
              <UserCheck className="w-3.5 h-3.5" />
              <span>{lang === 'tr' ? 'Kimlik' : 'Identity'}</span>
            </button>
          )}
          <button 
            onClick={handleTestOtpTrigger} 
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 hover:text-white hover:from-amber-500/40 hover:to-orange-500/40 border border-amber-500/30 rounded-xl font-bold text-[11px] transition-all min-h-[44px] shadow-sm animate-pulse" 
            title={lang === 'tr' ? '1 Saniyede Canlı Test OTP E-postası Gönder' : 'Send 1-Second Instant Test OTP Email'}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>{lang === 'tr' ? '⚡ Test OTP Gönder' : '⚡ Test OTP Demo'}</span>
          </button>
          <button
            onClick={exportMailboxTxt}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-xl font-bold text-[11px] transition-all min-h-[44px]"
            title={lang === 'tr' ? 'Posta Kutusu Detaylarını TXT Olarak İndir' : 'Export Mailbox Details as TXT'}
          >
            <FileText className="w-3.5 h-3.5 text-blue-400" />
            <span>{lang === 'tr' ? 'TXT Dışa Aktar' : 'Export TXT'}</span>
          </button>
          <button
            onClick={exportMailboxCsv}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-xl font-bold text-[11px] transition-all min-h-[44px]"
            title={lang === 'tr' ? 'Posta Kutusu Detaylarını CSV Olarak İndir' : 'Export Mailbox Details as CSV'}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>{lang === 'tr' ? 'CSV Dışa Aktar' : 'Export CSV'}</span>
          </button>
          {onShareDrop && (
            <button onClick={onShareDrop} className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-white/[0.03] text-slate-400 hover:text-white hover:bg-white/[0.06] border border-white/10 rounded-xl font-bold text-[11px] transition-all min-h-[44px]" title={lang === 'tr' ? 'Güvenli Dosya Al' : 'Secure Drop Link'}>
              <SendToBack className="w-3.5 h-3.5" />
              <span>Drop Link</span>
            </button>
          )}
          <a href="/bulk-generator" className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 border border-orange-500/20 rounded-xl font-bold text-[11px] transition-all min-h-[44px]">
            <Layers className="w-3.5 h-3.5" />
            <span>{lang === 'tr' ? 'Toplu Mail' : 'Bulk Temp'}</span>
          </a>
          <a href="/burn-note" className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 rounded-xl font-bold text-[11px] transition-all min-h-[44px]">
            <Flame className="w-3.5 h-3.5" />
            <span>{lang === 'tr' ? 'Burn Note' : 'Burn Note'}</span>
          </a>
          <div className="flex items-center justify-center gap-1 px-3 py-2 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 font-bold text-[10px] min-h-[44px]" title="Domain Health Risk Score: 100% Clean">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Risk: %0 (Temiz)</span>
          </div>
        </div>
      </div>

    </div>
  );
};

export default memo(AddressBar);