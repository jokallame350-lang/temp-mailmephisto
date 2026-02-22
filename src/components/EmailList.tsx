import React, { useRef, useState, useCallback, useMemo } from 'react';
import { Clock, ChevronRight, Inbox, Loader2, ShieldCheck, Zap, Trash2, CheckCircle2, AlertCircle, Tag, Copy, Check, Search, X, Mail } from 'lucide-react';
import { EmailSummary } from '../types';
import { translations, Language } from '../translations';

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
}

// OTP kodunu subject'ten çıkar
const extractOTP = (subject: string): string | null => {
  const patterns = [
    /\b(\d{4,8})\b/,
    /code[:\s]+(\d{4,8})/i,
    /kod[:\s]+(\d{4,8})/i,
    /verification[:\s]+(\d{4,8})/i,
    /doğrulama[:\s]+(\d{4,8})/i,
  ];
  for (const pattern of patterns) {
    const match = subject.match(pattern);
    if (match) return match[1];
  }
  return null;
};

const EmailList: React.FC<EmailListProps> = ({ emails, selectedId, onSelect, onDelete, onDeleteAll, loading, lang, searchQuery, onSearchChange }) => {
  const t = translations[lang];
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [swipingId, setSwipingId] = useState<string | null>(null);
  const [swipeX, setSwipeX] = useState(0);
  const touchStartRef = useRef<{ x: number; y: number; id: string } | null>(null);
  const [pullY, setPullY] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const handleCopyCode = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

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

    // Yatay swipe kontrolü
    if (Math.abs(dx) > Math.abs(dy) && dx < 0) {
      setSwipingId(id);
      setSwipeX(Math.max(dx, -120));
    }
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent, id: string) => {
    if (swipingId === id && swipeX < -80) {
      // Swipe threshold geçildi - sil
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
      // Pull-to-refresh tetikle
      window.dispatchEvent(new CustomEvent('mephisto-refresh'));
    }
    setPullY(0);
    setIsPulling(false);
    if (touchStartRef.current?.id === '_pull_') {
      touchStartRef.current = null;
    }
  }, [isPulling, pullY]);

  const RefreshIndicator = () => (
    <div className="flex items-center justify-center gap-2 py-3 bg-orange-500/5 border-b border-white/5 animate-pulse">
      <Loader2 className="w-3 h-3 text-orange-500 animate-spin" />
      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-orange-500/80">
        {t.scanningNetwork}
      </span>
    </div>
  );

  // Yükleme Durumu
  if (loading && emails.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4 opacity-50" role="status" aria-live="polite">
        <div className="w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" aria-hidden="true" />
        <span className="text-[10px] font-black uppercase tracking-widest text-orange-500">{t.connecting}</span>
      </div>
    );
  }

  // Boş Durum - Geliştirilmiş İllüstrasyon
  if (emails.length === 0 && !searchQuery) {
    return (
      <div className="flex flex-col h-full">
        <RefreshIndicator />
        <div className="flex-grow flex flex-col items-center justify-center text-center p-8" role="status" aria-live="polite">
          {/* Animasyonlu Empty Inbox İllüstrasyonu */}
          <div className="relative w-28 h-28 mb-6">
            {/* Ana ikon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 bg-orange-500/5 rounded-2xl flex items-center justify-center border border-orange-500/10">
                <Mail className="w-10 h-10 text-orange-500/30" />
              </div>
            </div>
          </div>

          <h3 className="text-sm font-black uppercase tracking-widest mb-2 text-white">
            {t.emptyInboxTitle}
          </h3>

          <div className="space-y-4 max-w-[240px]">
            <p className="text-[11px] text-slate-500 leading-relaxed font-medium uppercase tracking-tighter">
              {t.emptyInboxDesc}
            </p>

            <div className="flex flex-col gap-2 pt-4">
              <div className="glass-card flex items-center gap-2 px-3 py-2 rounded-xl">
                <ShieldCheck className="w-3 h-3 text-orange-500" aria-hidden="true" />
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{t.encryptedLabel}</span>
              </div>
              <div className="glass-card flex items-center gap-2 px-3 py-2 rounded-xl">
                <Zap className="w-3 h-3 text-orange-500" aria-hidden="true" />
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
      <RefreshIndicator />

      {/* Arama Çubuğu */}
      <div className="px-3 py-2 border-b border-white/5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            placeholder={lang === 'tr' ? 'E-postalarda ara...' : 'Search emails...'}
            className="w-full bg-white/[0.03] border border-white/5 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-300 placeholder:text-slate-600 outline-none focus:border-red-500/30 transition-colors"
            aria-label={lang === 'tr' ? 'E-posta arama' : 'Search emails'}
          />
          {searchQuery && (
            <button onClick={() => onSearchChange('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-white/5 rounded-lg" aria-label="Clear search">
              <X className="w-3 h-3 text-slate-500" />
            </button>
          )}
        </div>
      </div>

      {/* Tümünü Sil butonu */}
      {emails.length > 1 && (
        <div className="flex justify-between items-center px-4 py-2 border-b border-white/5">
          <span className="text-[9px] font-bold text-slate-600">{emails.length} {lang === 'tr' ? 'mesaj' : 'messages'}</span>
          <button
            onClick={onDeleteAll}
            className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-red-500 transition-colors"
            aria-label={lang === 'tr' ? 'Tümünü sil' : 'Delete all emails'}
          >
            <Trash2 className="w-3 h-3" aria-hidden="true" />
            {t.clearAll}
          </button>
        </div>
      )}

      {/* Pull-to-refresh indicator */}
      {isPulling && (
        <div className="flex items-center justify-center py-2 transition-all" style={{ height: `${pullY * 0.5}px`, opacity: pullY / 80 }}>
          <Loader2 className={`w-4 h-4 text-red-500 ${pullY > 50 ? 'animate-spin' : ''}`} aria-hidden="true" />
        </div>
      )}

      {/* Arama sonucu boş */}
      {searchQuery && emails.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full py-12 text-center" role="status" aria-live="polite">
          <Search className="w-8 h-8 text-slate-700 mb-3" aria-hidden="true" />
          <p className="text-xs font-bold text-slate-500">{lang === 'tr' ? 'Sonuç bulunamadı' : 'No results found'}</p>
        </div>
      )}

      {/* Email listesi */}
      <div
        ref={listRef}
        className="flex-grow overflow-y-auto custom-scrollbar"
        onTouchStart={handleListTouchStart}
        onTouchMove={handleListTouchMove}
        onTouchEnd={handleListTouchEnd}
        role="list"
        aria-label={lang === 'tr' ? 'E-posta listesi' : 'Email list'}
      >
        {emails.map((email, index) => {
          const fromName = typeof email.from === 'string' ? email.from : (email.from.name || email.from.address);
          const otpCode = extractOTP(email.subject);
          const isSwipingThis = swipingId === email.id;

          return (
            <div
              key={email.id}
              role="listitem"
              aria-selected={selectedId === email.id}
              tabIndex={0}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(email.id); } }}
              className="relative overflow-hidden"
            >
              {/* Swipe arka planı */}
              <div className="absolute inset-0 bg-red-500/20 flex items-center justify-end pr-6" aria-hidden="true">
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>

              {/* Ana kart */}
              <div
                onClick={() => onSelect(email.id)}
                onTouchStart={e => handleTouchStart(e, email.id)}
                onTouchMove={e => handleTouchMove(e, email.id)}
                onTouchEnd={e => handleTouchEnd(e, email.id)}
                className={`email-card-enter stagger-${Math.min(index + 1, 6)} group relative cursor-pointer transition-all duration-300 bg-[#0a0a0c] ${selectedId === email.id
                  ? 'bg-orange-500/[0.07] border-l-2 border-orange-600'
                  : 'hover:bg-white/[0.03] border-l-2 border-transparent'
                  }`}
                style={isSwipingThis ? { transform: `translateX(${swipeX}px)`, transition: 'none' } : { transform: 'translateX(0)', transition: 'transform 0.3s' }}
              >
                {/* İç Kart */}
                <div className="p-3 sm:p-4 md:p-5">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest truncate max-w-[120px] sm:max-w-[150px]">
                      {fromName}
                    </span>
                    <div className="flex items-center gap-2 text-slate-500">
                      <Clock className="w-3 h-3" aria-hidden="true" />
                      <time className="text-[9px] font-bold" dateTime={email.createdAt}>
                        {new Date(email.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </time>
                    </div>
                  </div>

                  <h3 className={`text-xs font-bold mb-1 truncate ${selectedId === email.id ? 'text-white' : 'text-slate-400'}`}>
                    {email.subject || t.noSubject}
                  </h3>

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      {email.aiCategory === 'Verification' && <span className="px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 text-[9px] border border-green-500/20 flex items-center gap-1" aria-label="Verification code"><CheckCircle2 className="w-3 h-3" aria-hidden="true" /> Code</span>}
                      {email.aiCategory === 'Security' && <span className="px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 text-[9px] border border-red-500/20 flex items-center gap-1" aria-label="Security alert"><AlertCircle className="w-3 h-3" aria-hidden="true" /> Alert</span>}
                      {email.aiCategory === 'Newsletter' && <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[9px] border border-blue-500/20 flex items-center gap-1" aria-label="Newsletter"><Tag className="w-3 h-3" aria-hidden="true" /> News</span>}

                      {/* OTP Tek Tıkla Kopyala */}
                      {otpCode && (
                        <button
                          onClick={(e) => handleCopyCode(otpCode, e)}
                          className="otp-glow flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-mono font-black hover:bg-green-500/20 transition-all active:scale-95"
                          aria-label={`Copy verification code ${otpCode}`}
                        >
                          {copiedCode === otpCode ? <Check className="w-3 h-3" aria-hidden="true" /> : <Copy className="w-3 h-3" aria-hidden="true" />}
                          {copiedCode === otpCode ? 'Copied!' : otpCode}
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <ChevronRight className={`w-4 h-4 transition-transform ${selectedId === email.id ? 'translate-x-1 text-orange-500' : 'opacity-0 group-hover:opacity-100 text-slate-700'}`} aria-hidden="true" />
                      <button
                        onClick={(e) => onDelete(email.id, e)}
                        className="text-slate-500 hover:text-red-500 transition-colors p-1 rounded hover:bg-red-500/10 sm:opacity-0 sm:group-hover:opacity-100"
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
        })}
      </div>
    </div>
  );
};

export default React.memo(EmailList);