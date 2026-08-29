import React, { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react';
import { Mailbox } from '../types';
import { Copy, RefreshCw, Check, Globe, Loader2, Timer, UserCheck, SendToBack, Layers, Flame, ShieldCheck, Zap, Share2, Link, FileText, FileSpreadsheet, ChevronDown, Search, X } from 'lucide-react';
import { translations, Language } from '../translations';
import { fetchDomains, GUERRILLA_DOMAINS } from '../services/mailService';

const ACCOUNT_LIFETIME_MS = 24 * 60 * 60 * 1000;
const formatCountdown = (ms: number) => {
  if (ms <= 0) return '00:00:00';
  const h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000), s = Math.floor((ms % 60000) / 1000);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};
const getTimerColor = (ms: number) => {
  const hours = ms / 3600000;
  if (hours > 12) return 'text-green-500';
  if (hours > 6) return 'text-emerald-400';
  if (hours > 3) return 'text-yellow-400';
  if (hours > 1) return 'text-orange-400';
  return 'text-red-500';
};
const CountdownBadge = memo(({ createdAt, lang }: { createdAt?: number; lang: Language }) => {
  const [remainingMs, setRemainingMs] = useState(() => createdAt ? Math.max(0, ACCOUNT_LIFETIME_MS - (Date.now() - createdAt)) : 0);
  useEffect(() => {
    if (!createdAt) return;
    const update = () => setRemainingMs(Math.max(0, ACCOUNT_LIFETIME_MS - (Date.now() - createdAt)));
    update(); const interval = window.setInterval(update, 1000);
    return () => window.clearInterval(interval);
  }, [createdAt]);
  if (!createdAt) return null;
  return <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/[0.03] border border-white/5" title={lang === 'tr' ? 'Hesap süresi' : 'Account expires in'}><Timer className={`w-3 h-3 ${getTimerColor(remainingMs)}`} /><span className={`text-[10px] font-mono font-bold tabular-nums ${getTimerColor(remainingMs)}`}>{formatCountdown(remainingMs)}</span></div>;
});
CountdownBadge.displayName = 'CountdownBadge';

interface AddressBarProps {
  mailbox: Mailbox | null; isLoading: boolean; isRefreshing: boolean; onRefresh: () => void; onChange: () => void; onDelete: () => void;
  progress: number; lang: Language; onChangeDomain?: (domain: string) => void; onCreateCustom?: () => void; onIdentity?: () => void;
  onForwarding?: () => void; onShareDrop?: () => void; onExtendTimer?: () => void; onOpenCustomDomain?: () => void;
  onOpenCompose?: () => void; autoVerifyEnabled?: boolean; onToggleAutoVerify?: () => void; onCopyMagicUrl?: () => void;
}

const AddressBar: React.FC<AddressBarProps> = ({ mailbox, isLoading, isRefreshing, onRefresh, onChange, onDelete: _onDelete, progress, lang, onChangeDomain, onIdentity, onShareDrop, onOpenCustomDomain: _onOpenCustomDomain, onCopyMagicUrl }) => {
  const t = translations[lang];
  const [copied, setCopied] = useState(false), [copiedLink, setCopiedLink] = useState(false);
  const [isDomainOpen, setIsDomainOpen] = useState(false), [domainList, setDomainList] = useState<string[]>(GUERRILLA_DOMAINS), [domainSearch, setDomainSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null), domainBtnRef = useRef<HTMLButtonElement>(null);
  const addressParts = mailbox?.address ? mailbox.address.split('@') : ['', ''];
  const username = addressParts[0] || '', currentDomain = addressParts[1] || '';

  useEffect(() => { fetchDomains().then(res => { if (res?.domains?.length) setDomainList(res.domains); }).catch(() => undefined); }, []);
  useEffect(() => {
    if (!isDomainOpen) return;
    const outside = (e: MouseEvent | TouchEvent) => { const target = e.target as Node; if (dropdownRef.current && !dropdownRef.current.contains(target) && domainBtnRef.current && !domainBtnRef.current.contains(target)) setIsDomainOpen(false); };
    const escape = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsDomainOpen(false); };
    document.addEventListener('mousedown', outside); document.addEventListener('touchstart', outside); document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('mousedown', outside); document.removeEventListener('touchstart', outside); document.removeEventListener('keydown', escape); };
  }, [isDomainOpen]);
  const handleDomainSelect = useCallback((dom: string) => { setIsDomainOpen(false); if (dom.toLowerCase() !== currentDomain.toLowerCase()) onChangeDomain?.(dom); }, [currentDomain, onChangeDomain]);
  const filteredDomains = useMemo(() => domainSearch.trim() ? domainList.filter(d => d.toLowerCase().includes(domainSearch.trim().toLowerCase())) : domainList, [domainList, domainSearch]);
  const handleCopy = useCallback(async () => { if (!mailbox?.address) return; try { await navigator.clipboard.writeText(mailbox.address); setCopied(true); window.setTimeout(() => setCopied(false), 2000); } catch {} }, [mailbox?.address]);
  const handleCopyMagicUrl = useCallback(async () => {
    if (!mailbox?.address || typeof window === 'undefined') return;
    const url = new URL(window.location.origin); url.searchParams.set('mailbox', mailbox.address);
    try { await navigator.clipboard.writeText(url.toString()); setCopiedLink(true); window.setTimeout(() => setCopiedLink(false), 2000); } catch {}
    onCopyMagicUrl?.();
  }, [mailbox?.address, onCopyMagicUrl]);
  const exportMailboxTxt = useCallback(() => {
    if (!mailbox?.address) return;
    const content = ['========================================', 'MEPHISTOMAIL - MAILBOX EXPORT (TXT)', '========================================', `Mailbox Address: ${mailbox.address}`, `Created At: ${mailbox.createdAt ? new Date(mailbox.createdAt).toISOString() : 'N/A'}`, `Domain: ${mailbox.address.split('@')[1] || ''}`, '========================================'].join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' }), url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = `mailbox_${mailbox.address.split('@')[0]}_export.txt`; a.click(); window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }, [mailbox?.address, mailbox?.createdAt]);
  const exportMailboxCsv = useCallback(() => {
    if (!mailbox?.address) return;
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const row = [mailbox.address, mailbox.createdAt ? new Date(mailbox.createdAt).toISOString() : '', mailbox.address.split('@')[1] || '', String(mailbox.autoDeleteMinutes || 0)].map(esc).join(',');
    const blob = new Blob([`Address,CreatedAt,Domain,AutoDeleteMinutes\n${row}\n`], { type: 'text/csv;charset=utf-8' }), url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = `mailbox_${mailbox.address.split('@')[0]}_export.csv`; a.click(); window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }, [mailbox?.address, mailbox?.createdAt, mailbox?.autoDeleteMinutes]);
  const handleTestOtpTrigger = useCallback(() => {
    if (!mailbox?.address || typeof crypto === 'undefined') return;
    const bytes = new Uint32Array(1); crypto.getRandomValues(bytes); const otpCode = String(100000 + (bytes[0] % 900000));
    window.dispatchEvent(new CustomEvent('mephisto-test-otp', { detail: { id: `test_${crypto.randomUUID?.() || Date.now()}`, from: 'security@verify-service.com', subject: lang === 'tr' ? `🔐 Doğrulama Kodunuz: ${otpCode}` : `🔐 Your Verification Code: ${otpCode}`, body: lang === 'tr' ? `MephistoMail canlı test doğrulaması. OTP: ${otpCode}` : `MephistoMail live test verification. OTP: ${otpCode}`, date: new Date().toLocaleTimeString() } }));
  }, [mailbox?.address, lang]);

  return <div className="w-full flex flex-col items-center gap-4 sm:gap-6 max-w-2xl mx-auto px-3 sm:px-4">
    <div role="button" tabIndex={0} onClick={handleCopy} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleCopy(); } }} className="w-full relative group cursor-pointer active:scale-[0.99] transition-transform duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500/50 rounded-2xl" title={t.tipCopy}>
      <div className="relative bg-[#0f1115] border border-white/10 rounded-xl sm:rounded-2xl p-1 shadow-xl flex items-center overflow-visible h-14 sm:h-16">
        <div className="absolute bottom-0 left-0 h-[2px] bg-orange-500 transition-all duration-100 ease-linear z-10 rounded-full" style={{ width: `${Math.max(0, Math.min(100, progress))}%` }} />
        <div className="pl-2 sm:pl-4 pr-1 sm:pr-3 flex items-center justify-center flex-shrink-0">{isLoading ? <Loader2 className="w-5 h-5 animate-spin text-slate-400" /> : copied ? <Check className="w-5 h-5 text-green-500" /> : <Globe className="w-5 h-5 text-orange-500" />}</div>
        <div className="flex-grow flex items-center justify-center md:justify-start min-w-0 pr-1">{isLoading ? <div className="h-5 w-40 bg-white/10 rounded animate-pulse" /> : <div className="flex items-center min-w-0 max-w-full text-base sm:text-lg md:text-xl font-mono tracking-tight select-none"><span className={`font-bold truncate ${copied ? 'text-green-500' : 'text-white'}`}>{username}</span>{currentDomain && <div className="relative inline-flex items-center flex-shrink-0"><button ref={domainBtnRef} type="button" onClick={e => { e.stopPropagation(); setIsDomainOpen(v => !v); }} className="group/dom ml-1 px-1.5 sm:px-2 py-0.5 rounded-lg flex items-center gap-1 font-bold text-xs sm:text-sm md:text-base transition-all border text-orange-400 bg-orange-500/10 border-orange-500/30" aria-expanded={isDomainOpen} aria-haspopup="listbox"><span className="truncate">@{currentDomain}</span><ChevronDown className={`w-3.5 h-3.5 ${isDomainOpen ? 'rotate-180' : ''}`} /></button>{isDomainOpen && <div ref={dropdownRef} onClick={e => e.stopPropagation()} className="absolute top-[calc(100%+10px)] left-0 sm:-left-12 w-72 sm:w-80 bg-[#0c0d12]/95 backdrop-blur-2xl border border-orange-500/40 rounded-2xl shadow-2xl p-3 z-50" role="listbox"><div className="flex items-center justify-between pb-2 border-b border-white/10"><span className="text-[11px] font-bold text-white uppercase">{lang === 'tr' ? 'Hızlı Domain Değiştir' : 'Quick Domain Switch'}</span><button type="button" onClick={() => setIsDomainOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-white" aria-label="Close"><X className="w-3.5 h-3.5" /></button></div>{domainList.length > 4 && <div className="relative mt-2"><Search className="w-3 h-3 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" /><input value={domainSearch} onChange={e => setDomainSearch(e.target.value)} placeholder={lang === 'tr' ? 'Domain ara...' : 'Search domain...'} className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white outline-none" autoFocus /></div>}<div className="overflow-y-auto max-h-56 mt-2 space-y-1">{filteredDomains.map(d => <button key={d} type="button" role="option" aria-selected={d.toLowerCase() === currentDomain.toLowerCase()} onClick={() => handleDomainSelect(d)} className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-mono text-slate-300 hover:text-white hover:bg-orange-500/10 border border-white/5"><span className="truncate">@{d}</span>{d.toLowerCase() === currentDomain.toLowerCase() && <Check className="w-3 h-3 text-orange-400" />}</button>)}</div></div>}</div>}</div>}</div>
        <div className="pr-2 sm:pr-4 pl-1 sm:pl-2 flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0"><CountdownBadge createdAt={mailbox?.createdAt} lang={lang} /><button type="button" onClick={e => { e.stopPropagation(); handleCopyMagicUrl(); }} className="p-1.5 rounded-lg bg-white/5 hover:bg-orange-500/20 text-slate-400 hover:text-orange-400" title={lang === 'tr' ? 'Mailbox bağlantısını kopyala' : 'Copy mailbox link'}>{copiedLink ? <Check className="w-4 h-4 text-green-500" /> : <Share2 className="w-4 h-4 text-orange-400" />}</button><span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest px-1.5 sm:px-2 py-1 rounded bg-white/5 text-slate-400">{copied ? t.copied : t.copy}</span></div>
      </div>
    </div>
    <div className="flex flex-col gap-3 w-full items-center"><div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 w-full">
      <button onClick={handleCopy} className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#111] text-slate-200 hover:bg-[#1a1a1a] border border-white/10 rounded-full font-bold text-xs transition-all min-h-[44px]"><CopyIcon /></button>
      <button onClick={handleCopyMagicUrl} className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#111] text-orange-400 border border-orange-500/30 rounded-full font-bold text-xs min-h-[44px]"><Link className="w-4 h-4" /><span>Magic URL</span></button>
      <button onClick={onRefresh} className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#111] text-slate-200 border border-white/10 rounded-full font-bold text-xs min-h-[44px]"><RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} /><span>{t.refresh}</span></button>
      <button onClick={onChange} className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#111] text-slate-200 border border-white/10 rounded-full font-bold text-xs min-h-[44px]"><RefreshCw className="w-4 h-4" /><span>{lang === 'tr' ? 'Yeni' : 'New'}</span></button>
      {onIdentity && <button onClick={onIdentity} className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white/[0.03] text-slate-400 border border-white/10 rounded-xl font-bold text-xs min-h-[44px]"><UserCheck className="w-4 h-4" /><span>{lang === 'tr' ? 'Kimlik' : 'Identity'}</span></button>}
      <button onClick={handleTestOtpTrigger} className="flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500/10 text-amber-300 border border-amber-500/30 rounded-xl font-bold text-xs min-h-[44px]" title={lang === 'tr' ? 'Yerel test OTP' : 'Local OTP test'}><Zap className="w-4 h-4" /><span>Test OTP</span></button>
      <button onClick={exportMailboxTxt} className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl font-bold text-xs min-h-[44px]"><FileText className="w-4 h-4" /><span>TXT</span></button>
      <button onClick={exportMailboxCsv} className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl font-bold text-xs min-h-[44px]"><FileSpreadsheet className="w-4 h-4" /><span>CSV</span></button>
      {onShareDrop && <button onClick={onShareDrop} className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white/[0.03] text-slate-400 border border-white/10 rounded-xl font-bold text-xs min-h-[44px]"><SendToBack className="w-4 h-4" /><span>Drop Link</span></button>}
      <a href="/bulk-generator" className="flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded-xl font-bold text-xs min-h-[44px]"><Layers className="w-4 h-4" /><span>{lang === 'tr' ? 'Toplu Mail' : 'Bulk Temp'}</span></a>
      <a href="/burn-note" className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl font-bold text-xs min-h-[44px]"><Flame className="w-4 h-4" /><span>Burn Note</span></a>
      <div className="flex items-center justify-center gap-1 px-3 py-2 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 font-bold text-[10px] min-h-[44px]" title="Domain health is monitored; no static clean-score claim"><ShieldCheck className="w-3.5 h-3.5" /><span>{lang === 'tr' ? 'Durum: Aktif' : 'Status: Active'}</span></div>
    </div></div>
  </div>;
};
const CopyIcon = () => <Copy className="w-4 h-4 text-slate-400" />;
export default memo(AddressBar);