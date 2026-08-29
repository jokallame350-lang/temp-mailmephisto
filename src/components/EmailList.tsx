import React, { useRef, useState, useCallback, memo } from 'react';
import { Clock, ChevronRight, Loader2, ShieldCheck, Zap, Trash2, CheckCircle2, AlertCircle, Tag, Copy, Check, Search, X, Mail } from 'lucide-react';
import { EmailSummary } from '../types';
import { translations, Language } from '../translations';
import { getLocalizedErrorMessage } from '../utils/errorLocalization';
import { extractOTP } from '../utils/otp';

interface EmailListProps {
  emails: EmailSummary[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  onDeleteAll: () => void;
  loading: boolean;
  lang: Language;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  error?: string | null;
}

/**
 * Text highlight component that visually marks search query matches
 */
export const HighlightText: React.FC<{ text: string; query: string; className?: string }> = memo(({ text, query, className = '' }) => {
  if (!query || !query.trim() || !text) {
    return <span className={className}>{text}</span>;
  }

  const trimmed = query.trim();
  const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  try {
    const regex = new RegExp(`(${escaped})`, 'gi');
    const parts = text.split(regex);
    if (parts.length <= 1) return <span className={className}>{text}</span>;

    return (
      <span className={className}>
        {parts.map((part, index) =>
          regex.test(part) ? (
            <mark
              key={index}
              className="bg-orange-500/30 text-orange-200 font-bold px-1 py-0.5 rounded border border-orange-500/40 shadow-sm"
            >
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </span>
    );
  } catch {
    return <span className={className}>{text}</span>;
  }
});
HighlightText.displayName = 'HighlightText';

interface EmailListItemProps {
  email: EmailSummary;
  isSelected: boolean;
  isSwiping: boolean;
  swipeX: number;
  searchQuery: string;
  onSelect: (id: string) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  onTouchStart: (e: React.TouchEvent, id: string) => void;
  onTouchMove: (e: React.TouchEvent, id: string) => void;
  onTouchEnd: (e: React.TouchEvent, id: string) => void;
  onCopyCode: (code: string, e: React.MouseEvent) => void;
  copiedCode: string | null;
  lang: Language;
  index: number;
  noSubjectText: string;
}

const EmailListItem: React.FC<EmailListItemProps> = memo(({
  email,
  isSelected,
  isSwiping,
  swipeX,
  searchQuery,
  onSelect,
  onDelete,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  onCopyCode,
  copiedCode,
  lang,
  index,
  noSubjectText,
}) => {
  const fromName = typeof email.from === 'string'
    ? email.from
    : (email.from && typeof email.from === 'object'
        ? String(email.from.name || email.from.address || 'unknown')
        : String(email.from || 'unknown'));

  const fromAddress = typeof email.from === 'object' && email.from?.address
    ? String(email.from.address)
    : '';

  const otpCode = extractOTP(email.subject) || extractOTP(email.intro || '');

  return (
    <div
      role="listitem"
      aria-selected={isSelected}
      tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(email.id); } }}
      className="relative overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-inset"
    >
      {/* Swipe background */}
      <div className="absolute inset-0 bg-red-500/20 flex items-center justify-end pr-6 pointer-events-none" aria-hidden="true">
        <Trash2 className="w-5 h-5 text-red-500" />
      </div>

      {/* Main card */}
      <div
        onClick={() => onSelect(email.id)}
        onTouchStart={e => onTouchStart(e, email.id)}
        onTouchMove={e => onTouchMove(e, email.id)}
        onTouchEnd={e => onTouchEnd(e, email.id)}
        className={`email-card-enter stagger-${Math.min(index + 1, 6)} group relative cursor-pointer transition-colors duration-200 bg-[#0a0a0c] ${
          isSelected
            ? 'bg-orange-500/[0.07] border-l-2 border-orange-600'
            : 'hover:bg-white/[0.03] border-l-2 border-transparent'
        }`}
        style={isSwiping ? { transform: `translateX(${swipeX}px)`, transition: 'none' } : { transform: 'translateX(0)', transition: 'transform 0.3s' }}
      >
        <div className="p-3 sm:p-4 md:p-5">
          <div className="flex justify-between items-start mb-1.5 gap-2">
            <div className="flex flex-col min-w-0 max-w-[170px] sm:max-w-[200px]">
              <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest truncate">
                <HighlightText text={fromName} query={searchQuery} />
              </span>
              {fromAddress && fromAddress.toLowerCase() !== fromName.toLowerCase() && (
                <span className="text-[9px] text-slate-500 font-mono truncate">
                  &lt;<HighlightText text={fromAddress} query={searchQuery} />&gt;
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-slate-500 flex-shrink-0">
              <Clock className="w-3 h-3" aria-hidden="true" />
              <time className="text-[9px] font-bold" dateTime={email.createdAt}>
                {new Date(email.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </time>
            </div>
          </div>

          <h3 className={`text-xs font-bold mb-1 truncate ${isSelected ? 'text-white' : 'text-slate-300'}`}>
            <HighlightText text={email.subject || noSubjectText} query={searchQuery} />
          </h3>

          {email.intro && (
            <p className="text-[10px] text-slate-500 line-clamp-1 mb-1.5 font-medium">
              <HighlightText text={email.intro} query={searchQuery} />
            </p>
          )}

          {otpCode && (
            <div className={`mt-2 flex items-center justify-between border rounded-lg p-1.5 transition-all ${
              searchQuery && otpCode.toLowerCase().includes(searchQuery.toLowerCase().trim())
                ? 'bg-green-500/20 border-green-500/50 ring-2 ring-green-500/30 shadow-md shadow-green-500/20'
                : 'bg-green-500/10 border-green-500/20'
            }`}>
              <span className="font-mono text-xs font-black text-green-400 tracking-wider flex items-center gap-1">
                ⚡ <HighlightText text={otpCode} query={searchQuery} className="text-green-300" />
              </span>
              <button
                type="button"
                onClick={e => onCopyCode(otpCode, e)}
                className="px-2.5 py-1 bg-green-500 hover:bg-green-600 text-black text-[10px] font-bold rounded-md flex items-center gap-1 transition-all active:scale-95 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
                aria-label={copiedCode === otpCode ? (lang === 'tr' ? 'Kopyalandı' : 'Copied') : (lang === 'tr' ? `Doğrulama kodunu kopyala: ${otpCode}` : `Copy verification code: ${otpCode}`)}
              >
                {copiedCode === otpCode ? <Check className="w-3 h-3" aria-hidden="true" /> : <Copy className="w-3 h-3" aria-hidden="true" />}
                <span>{copiedCode === otpCode ? 'OK!' : (lang === 'tr' ? 'Kopyala' : 'Copy')}</span>
              </button>
            </div>
          )}

          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2">
              {email.aiCategory === 'Verification' && <span className="px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 text-[9px] border border-green-500/20 flex items-center gap-1" aria-label="Verification code"><CheckCircle2 className="w-3 h-3" aria-hidden="true" /> Code</span>}
              {email.aiCategory === 'Security' && <span className="px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 text-[9px] border border-red-500/20 flex items-center gap-1" aria-label="Security alert"><AlertCircle className="w-3 h-3" aria-hidden="true" /> Alert</span>}
              {email.aiCategory === 'Newsletter' && <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[9px] border border-blue-500/20 flex items-center gap-1" aria-label="Newsletter"><Tag className="w-3 h-3" aria-hidden="true" /> News</span>}

              {/* OTP Quick Copy */}
              {otpCode && (
                <button
                  type="button"
                  onClick={(e) => onCopyCode(otpCode, e)}
                  className="otp-glow flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-mono font-black hover:bg-green-500/20 transition-all active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
                  aria-label={lang === 'tr' ? `Doğrulama kodunu kopyala: ${otpCode}` : `Copy verification code: ${otpCode}`}
                >
                  {copiedCode === otpCode ? <Check className="w-3 h-3" aria-hidden="true" /> : <Copy className="w-3 h-3" aria-hidden="true" />}
                  <span>{copiedCode === otpCode ? 'Copied!' : otpCode}</span>
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <ChevronRight className={`w-4 h-4 transition-transform ${isSelected ? 'translate-x-1 text-orange-500' : 'opacity-0 group-hover:opacity-100 text-slate-700'}`} aria-hidden="true" />
              <button
                type="button"
                onClick={(e) => onDelete(email.id, e)}
                className="text-slate-500 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-500/10 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                aria-label={lang === 'tr' ? 'E-postayı sil' : 'Delete email'}
              >
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" aria-hidden="true" />
      </div>
    </div>
  );
});

EmailListItem.displayName = 'EmailListItem';

const RefreshIndicator: React.FC<{ scanningText: string }> = memo(({ scanningText }) => (
  <div className="flex items-center justify-center gap-2 py-3 bg-orange-500/5 border-b border-white/5 animate-pulse" aria-live="off">
    <Loader2 className="w-3 h-3 text-orange-500 animate-spin" aria-hidden="true" />
    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-orange-500/80">
      {scanningText}
    </span>
  </div>
));

RefreshIndicator.displayName = 'RefreshIndicator';

// Stable Skeleton Loader Component to prevent any layout jump
const EmailListSkeleton: React.FC = memo(() => (
  <div className="flex flex-col h-full animate-pulse" role="status" aria-label="Loading emails">
    <div className="p-2 sm:p-2.5 border-b border-white/5 bg-white/[0.01]">
      <div className="h-9 bg-white/[0.04] rounded-xl border border-white/10" />
      <div className="flex gap-1.5 mt-2">
        <div className="h-5 w-12 bg-white/[0.03] rounded-lg border border-white/5" />
        <div className="h-5 w-12 bg-white/[0.03] rounded-lg border border-white/5" />
        <div className="h-5 w-16 bg-white/[0.03] rounded-lg border border-white/5" />
      </div>
    </div>
    <div className="p-4 space-y-4 flex-grow overflow-hidden">
      {[1, 2, 3].map(i => (
        <div key={i} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2.5">
          <div className="flex justify-between items-center">
            <div className="h-3 w-28 bg-white/10 rounded" />
            <div className="h-3 w-12 bg-white/5 rounded" />
          </div>
          <div className="h-4 w-3/4 bg-white/10 rounded" />
          <div className="h-3 w-full bg-white/5 rounded" />
          <div className="flex gap-2 pt-1">
            <div className="h-4 w-14 bg-white/5 rounded" />
            <div className="h-4 w-10 bg-white/5 rounded" />
          </div>
        </div>
      ))}
    </div>
  </div>
));
EmailListSkeleton.displayName = 'EmailListSkeleton';

const EmailList: React.FC<EmailListProps> = ({
  emails, selectedId, onSelect, onDelete, onDeleteAll, loading, lang, searchQuery, onSearchChange, error
}) => {
  const t = translations[lang] || translations.en;
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [swipingId, setSwipingId] = useState<string | null>(null);
  const [swipeX, setSwipeX] = useState(0);
  const touchStartRef = useRef<{ x: number; y: number; id: string } | null>(null);
  const [pullY, setPullY] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const handleCopyCode = useCallback((code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  }, []);

  // Touch handlers for swipe-to-delete
  const handleTouchStart = useCallback((e: React.TouchEvent, id: string) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, id };
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent, id: string) => {
    if (!touchStartRef.current || touchStartRef.current.id !== id) return;
    const touch = e.touches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;

    if (Math.abs(dx) > Math.abs(dy) && dx < 0) {
      if (Math.abs(dx) > 10 && e.cancelable) {
        e.preventDefault();
      }
      setSwipingId(id);
      setSwipeX(Math.max(dx, -120));
    }
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent, id: string) => {
    if (swipingId === id && swipeX < -80) {
      onDelete(id, e as any);
    }
    setSwipingId(null);
    setSwipeX(0);
    touchStartRef.current = null;
  }, [swipingId, swipeX, onDelete]);

  // Pull-to-refresh touch handlers (list container)
  const handleListTouchStart = useCallback((e: React.TouchEvent) => {
    if (listRef.current && listRef.current.scrollTop === 0) {
      const touch = e.touches[0];
      touchStartRef.current = { x: touch.clientX, y: touch.clientY, id: '_pull_' };
    }
  }, []);

  const handleListTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current || touchStartRef.current.id !== '_pull_') return;
    const touch = e.touches[0];
    const dy = touch.clientY - touchStartRef.current.y;
    if (dy > 0 && dy < 100) {
      setPullY(dy);
      setIsPulling(true);
    }
  }, []);

  const handleListTouchEnd = useCallback(() => {
    if (isPulling && pullY > 50) {
      window.dispatchEvent(new CustomEvent('mephisto-refresh'));
    }
    setPullY(0);
    setIsPulling(false);
    if (touchStartRef.current?.id === '_pull_') {
      touchStartRef.current = null;
    }
  }, [isPulling, pullY]);

  // Loading state with stable skeleton layout
  if (loading && emails.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <RefreshIndicator scanningText={t.scanningNetwork} />
        <EmailListSkeleton />
      </div>
    );
  }

  // Empty state
  if (emails.length === 0 && !searchQuery) {
    return (
      <div className="flex flex-col h-full">
        <RefreshIndicator scanningText={t.scanningNetwork} />
        {error && (
          <div className="px-3 py-1.5 bg-amber-500/10 border-b border-amber-500/20 text-amber-400 text-[10px] flex items-center gap-1.5 font-medium" role="status" aria-live="polite">
            <AlertCircle className="w-3 h-3 shrink-0" aria-hidden="true" />
            <span className="truncate">{getLocalizedErrorMessage(error, lang)}</span>
          </div>
        )}
        <div className="flex-grow flex flex-col items-center justify-center text-center p-6 sm:p-8" role="status" aria-live="polite">
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 mb-4 sm:mb-6">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-orange-500/5 rounded-2xl flex items-center justify-center border border-orange-500/10">
                <Mail className="w-8 h-8 sm:w-10 sm:h-10 text-orange-500/30" aria-hidden="true" />
              </div>
            </div>
          </div>

          <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest mb-2 text-white">
            {t.emptyInboxTitle}
          </h3>

          <div className="space-y-4 max-w-[240px]">
            <p className="text-[10px] sm:text-[11px] text-slate-500 leading-relaxed font-medium uppercase tracking-tighter">
              {t.emptyInboxDesc}
            </p>

            <div className="flex flex-col gap-2 pt-2 sm:pt-4">
              <div className="glass-card flex items-center gap-2 px-3 py-2 rounded-xl">
                <ShieldCheck className="w-3 h-3 text-orange-500 shrink-0" aria-hidden="true" />
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{t.encryptedLabel}</span>
              </div>
              <div className="glass-card flex items-center gap-2 px-3 py-2 rounded-xl">
                <Zap className="w-3 h-3 text-orange-500 shrink-0" aria-hidden="true" />
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{t.instantLabel}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <RefreshIndicator scanningText={t.scanningNetwork} />

      {error && (
        <div className="px-3 py-1.5 bg-amber-500/10 border-b border-amber-500/20 text-amber-400 text-[10px] flex items-center gap-1.5 font-medium" role="status" aria-live="polite">
          <AlertCircle className="w-3 h-3 shrink-0" aria-hidden="true" />
          <span className="truncate">{getLocalizedErrorMessage(error, lang)}</span>
        </div>
      )}

      {/* Search Bar & Quick Filters */}
      <div className="p-2 sm:p-2.5 border-b border-white/5 bg-white/[0.01]">
        <div className="relative">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 transition-colors ${searchQuery ? 'text-orange-400' : 'text-slate-500'}`} aria-hidden="true" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            placeholder={lang === 'tr' ? 'Gönderen, e-posta, konu veya OTP ara...' : 'Search sender, email, subject, or OTP...'}
            className="w-full bg-white/[0.04] border border-white/10 focus:border-orange-500/40 rounded-xl pl-9 pr-16 py-2 text-xs text-white placeholder:text-slate-500 outline-none transition-all shadow-inner focus-visible:ring-2 focus-visible:ring-orange-500/50"
            aria-label={lang === 'tr' ? 'E-posta arama' : 'Search emails'}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {searchQuery && (
              <>
                <span className="text-[9px] font-bold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-1.5 py-0.5 rounded">
                  {emails.length}
                </span>
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="p-1 hover:bg-white/10 text-slate-400 hover:text-white rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                  aria-label={lang === 'tr' ? 'Aramayı temizle' : 'Clear search'}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Quick Filter Buttons */}
        <div className="flex items-center gap-1.5 mt-2 overflow-x-auto no-scrollbar text-[10px]" role="toolbar" aria-label="Filters">
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 ${
              !searchQuery ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-white/[0.02] text-slate-400 hover:text-white border border-white/5'
            }`}
            aria-pressed={!searchQuery}
          >
            {lang === 'tr' ? 'Tümü' : 'All'}
          </button>
          <button
            type="button"
            onClick={() => onSearchChange('otp')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all whitespace-nowrap flex items-center gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400 ${
              searchQuery.toLowerCase() === 'otp' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-white/[0.02] text-slate-400 hover:text-green-400 border border-white/5'
            }`}
            aria-pressed={searchQuery.toLowerCase() === 'otp'}
          >
            <Zap className="w-2.5 h-2.5 text-green-400" aria-hidden="true" />
            <span>OTP</span>
          </button>
          <button
            type="button"
            onClick={() => onSearchChange('verification')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
              searchQuery.toLowerCase() === 'verification' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/[0.02] text-slate-400 hover:text-emerald-400 border border-white/5'
            }`}
            aria-pressed={searchQuery.toLowerCase() === 'verification'}
          >
            {lang === 'tr' ? 'Doğrulama' : 'Verification'}
          </button>
          <button
            type="button"
            onClick={() => onSearchChange('security')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 ${
              searchQuery.toLowerCase() === 'security' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-white/[0.02] text-slate-400 hover:text-red-400 border border-white/5'
            }`}
            aria-pressed={searchQuery.toLowerCase() === 'security'}
          >
            {lang === 'tr' ? 'Güvenlik' : 'Security'}
          </button>
        </div>
      </div>

      {/* Delete All Header */}
      {emails.length > 1 && (
        <div className="flex justify-between items-center px-4 py-2 border-b border-white/5 bg-white/[0.01]">
          <span className="text-[9px] font-bold text-slate-500">{emails.length} {lang === 'tr' ? 'mesaj' : 'messages'}</span>
          <button
            type="button"
            onClick={onDeleteAll}
            className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-red-500 transition-colors p-1 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
            aria-label={lang === 'tr' ? 'Tümünü sil' : 'Delete all emails'}
          >
            <Trash2 className="w-3 h-3" aria-hidden="true" />
            <span>{t.clearAll}</span>
          </button>
        </div>
      )}

      {/* Pull-to-refresh indicator */}
      {isPulling && (
        <div className="flex items-center justify-center py-2 transition-all" style={{ height: `${pullY * 0.5}px`, opacity: pullY / 80 }}>
          <Loader2 className={`w-4 h-4 text-orange-500 ${pullY > 50 ? 'animate-spin' : ''}`} aria-hidden="true" />
        </div>
      )}

      {/* Search Empty Result */}
      {searchQuery && emails.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full py-12 px-4 text-center" role="status" aria-live="polite">
          <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center mb-3">
            <Search className="w-6 h-6 text-orange-400/50" aria-hidden="true" />
          </div>
          <p className="text-xs font-bold text-white mb-1">
            {lang === 'tr' ? `"${searchQuery}" için sonuç bulunamadı` : `No results found for "${searchQuery}"`}
          </p>
          <p className="text-[10px] text-slate-500 max-w-[200px] mb-3">
            {lang === 'tr' ? 'Gönderen, e-posta adresi, konu veya OTP kodunu kontrol edin.' : 'Check sender name, email address, subject or OTP code.'}
          </p>
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="text-[10px] font-bold px-3 py-1.5 bg-white/5 hover:bg-white/10 text-orange-400 rounded-lg border border-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
          >
            {lang === 'tr' ? 'Aramayı Temizle' : 'Clear Search'}
          </button>
        </div>
      )}

      {/* Email list */}
      <div
        ref={listRef}
        className="flex-grow overflow-y-auto custom-scrollbar"
        onTouchStart={handleListTouchStart}
        onTouchMove={handleListTouchMove}
        onTouchEnd={handleListTouchEnd}
        role="list"
        aria-label={lang === 'tr' ? 'E-posta listesi' : 'Email list'}
      >
        {emails.map((email, index) => (
          <EmailListItem
            key={email.id}
            email={email}
            isSelected={selectedId === email.id}
            isSwiping={swipingId === email.id}
            swipeX={swipeX}
            searchQuery={searchQuery}
            onSelect={onSelect}
            onDelete={onDelete}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onCopyCode={handleCopyCode}
            copiedCode={copiedCode}
            lang={lang}
            index={index}
            noSubjectText={t.noSubject}
          />
        ))}
      </div>
    </div>
  );
};

export default memo(EmailList);