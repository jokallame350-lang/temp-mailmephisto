import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { EmailDetail } from '../types';
import { ArrowLeft, Calendar, User, Download, Code, Eye, Forward, Copy, Check, CheckCircle2, Paperclip, FileText, Image, File, List, Smartphone, Printer, FileType, Reply, ShieldCheck, FileJson } from 'lucide-react';
import DOMPurify from 'dompurify';
import { translations, Language } from '../translations';
import { sanitizeAndBlockTrackers } from '../utils/trackerBlocker';
import { downloadAsEML, downloadAsJSON, printEmailContent } from '../utils/exportMail';

interface EmailViewerProps {
  email: EmailDetail | null;
  loading: boolean;
  onBack: () => void;
  lang: Language;
  token?: string;
  onReply?: (initialData: { to: string; subject: string; body: string }) => void;
}

const extractOTPFromContent = (subject: string, text?: string): string | null => {
  const combined = `${subject || ''} ${text || ''}`;
  const patterns = [
    /\b(\d{6})\b/,
    /\b(\d{4})\b/,
    /\b(\d{8})\b/,
    /code[:\s]+(\d{4,8})/i,
    /kod[:\s]+(\d{4,8})/i,
    /verification[:\s]+(\d{4,8})/i,
    /doğrulama[:\s]+(\d{4,8})/i,
    /pin[:\s]+(\d{4,8})/i,
  ];
  for (const pattern of patterns) {
    const match = combined.match(pattern);
    if (match) return match[1];
  }
  return null;
};

// Basit AI/Heuristic Eylem Linki Çıkarıcı
const extractActionLinks = (htmlText?: string): { url: string, label: string } | null => {
  if (!htmlText) return null;
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, 'text/html');
    const links = doc.querySelectorAll('a');

    const targetWords = ['verify', 'confirm', 'activate', 'reset', 'unsubscribe', 'onayla', 'doğrula', 'etkinleştir', 'sıfırla', 'login', 'sign in', 'giriş', 'şifre', 'click here', 'tıkla', 'unsubscribe', 'ayrıl'];

    for (let i = 0; i < links.length; i++) {
      const link = links[i];
      const textContext = (link.textContent || '').toLowerCase().trim();
      const href = link.getAttribute('href');

      if (!textContext || !href || (!href.startsWith('http') && !href.startsWith('https'))) continue;

      const isAction = targetWords.some(word => textContext.includes(word));

      if (isAction || link.style.padding || link.style.backgroundColor) {
        return { url: href, label: link.textContent?.trim() || 'Action Link' };
      }
    }
  } catch (e) {
    console.error('Action link parse failed', e);
  }
  return null;
};

// Dosya tipine göre ikon
const getFileIcon = (contentType: string) => {
  if (contentType.startsWith('image/')) return <Image className="w-4 h-4 text-blue-400" />;
  if (contentType.includes('pdf') || contentType.includes('document')) return <FileText className="w-4 h-4 text-orange-400" />;
  return <File className="w-4 h-4 text-slate-400" />;
};

// Dosya boyutunu formatla
const formatSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const EmailViewer: React.FC<EmailViewerProps> = ({ email, loading, onBack, lang, token, onReply }) => {
  const t = translations[lang];
  const [viewSource, setViewSource] = useState(false);
  const [showHeaders, setShowHeaders] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'responsive' | 'mobile'>('responsive');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Ek dosya indirme
  const handleDownloadAttachment = useCallback(async (att: EmailDetail['attachments'][0]) => {
    if (!email) return;
    try {
      const url = att.downloadUrl || `https://api.mail.tm/messages/${email.id}/attachment/${att.id}`;
      const lowerUrl = url.toLowerCase().trim();
      if (lowerUrl.startsWith('file:') || lowerUrl.startsWith('file:/') || lowerUrl.startsWith('file://')) {
        console.warn('Blocked file:/// attachment download URL:', url);
        return;
      }
      const headers: Record<string, string> = { 'Accept': '*/*' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = att.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.warn('Attachment download failed:', err);
      if (att.downloadUrl && (att.downloadUrl.startsWith('http://') || att.downloadUrl.startsWith('https://'))) {
        window.open(att.downloadUrl, '_blank', 'noopener,noreferrer');
      }
    }
  }, [email, token]);

  useEffect(() => { setViewSource(false); setShowHeaders(false); setCodeCopied(false); }, [email?.id]);

  // Sandbox HTML - Tracker Blocker & DOMPurify ile temizle (file:/// ve güvensiz protokolleri kesin engelle)
  const trackerResult = useMemo(() => {
    if (!email) return { cleanHtml: '', trackerCount: 0, trackerDomains: [] };
    let raw = '';
    try {
      if (email.html && email.html.length > 0) {
        raw = typeof email.html[0] === 'string' ? email.html[0] : JSON.stringify(email.html[0]);
      } else {
        raw = email.text || '';
      }
    } catch (e) {
      raw = email.text || '';
    }

    const { cleanHtml, trackerCount, trackerDomains } = sanitizeAndBlockTrackers(raw);

    try {
      // DOMPurify Hook: file:/// ve güvensiz protokolleri öznitelik düzeyinde temizle
      const attrHook = (node: Element, data: any) => {
        if (data.attrValue) {
          const val = data.attrValue.trim().toLowerCase();
          if (
            val.startsWith('file:') ||
            val.startsWith('file:/') ||
            val.startsWith('file://') ||
            val.startsWith('content:') ||
            val.startsWith('chrome:') ||
            val.startsWith('resource:') ||
            val.startsWith('filesystem:') ||
            val.startsWith('javascript:') ||
            val.startsWith('vbscript:') ||
            val.startsWith('about:')
          ) {
            data.attrValue = '';
          }
          if (data.attrName === 'style' && (val.includes('file:') || val.includes('content:') || val.includes('chrome:'))) {
            data.attrValue = data.attrValue
              .replace(/url\(['"]?file:[^'"]+['"]?\)/gi, 'none')
              .replace(/url\(['"]?content:[^'"]+['"]?\)/gi, 'none')
              .replace(/url\(['"]?chrome:[^'"]+['"]?\)/gi, 'none');
          }
        }
      };

      const nodeHook = (node: Node) => {
        if (node.nodeType === 1) {
          const el = node as Element;
          if (el.tagName === 'A') {
            el.setAttribute('rel', 'noopener noreferrer');
            const href = el.getAttribute('href');
            if (href) {
              const cleanHref = href.trim().toLowerCase();
              if (
                cleanHref.startsWith('file:') ||
                cleanHref.startsWith('file:/') ||
                cleanHref.startsWith('file://') ||
                cleanHref.startsWith('content:') ||
                cleanHref.startsWith('chrome:') ||
                cleanHref.startsWith('resource:') ||
                cleanHref.startsWith('javascript:') ||
                cleanHref.startsWith('vbscript:')
              ) {
                el.removeAttribute('href');
              }
            }
          }
        }
      };

      DOMPurify.addHook('uponSanitizeAttribute', attrHook);
      DOMPurify.addHook('uponSanitizeElement', nodeHook);

      const sanitized = DOMPurify.sanitize(cleanHtml, {
        USE_PROFILES: { html: true },
        FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'textarea', 'button'],
        FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'onsubmit'],
        ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|data:image\/(?:png|jpeg|jpg|gif|svg\+xml|webp);base64,)/i,
        ALLOW_DATA_ATTR: false,
        ADD_ATTR: ['target'],
      });

      DOMPurify.removeHook('uponSanitizeAttribute');
      DOMPurify.removeHook('uponSanitizeElement');

      return { cleanHtml: sanitized, trackerCount, trackerDomains };
    } catch (e) {
      console.error('DOMPurify sanitize error:', e);
      return { cleanHtml: cleanHtml.replace(/<[^>]*>/g, ''), trackerCount, trackerDomains };
    }
  }, [email]);

  const sanitizedHTML = trackerResult.cleanHtml;

  // iframe sandbox içeriği
  useEffect(() => {
    if (!iframeRef.current || viewSource || !sanitizedHTML) return;
    const doc = iframeRef.current.contentDocument;
    if (!doc) return;

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src https: http: data:; style-src 'unsafe-inline'; font-src https: http: data:;">
        <style>
          body { 
            margin: 0; padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            font-size: 14px; line-height: 1.6;
            word-wrap: break-word; overflow-wrap: break-word;
          }
          img { max-width: 100%; height: auto; }
          table { max-width: 100% !important; }
          td, th { word-break: break-word; }
        </style>
      </head>
      <body>${sanitizedHTML}</body>
      </html>
    `);
    doc.close();

    // iframe yüksekliğini otomatik ayarla
    const resizeObserver = new ResizeObserver(() => {
      if (iframeRef.current && doc.body) {
        iframeRef.current.style.height = `${doc.body.scrollHeight + 32}px`;
      }
    });
    if (doc.body) resizeObserver.observe(doc.body);

    // Linkleri güvenli protokollerle aç (file:// ve güvensiz protokolleri kesin engelle)
    const handleLinkClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a');
      if (target) {
        e.preventDefault();
        const href = target.getAttribute('href');
        if (href) {
          const cleanHref = href.trim();
          const lower = cleanHref.toLowerCase();
          if (
            lower.startsWith('file:') ||
            lower.startsWith('file:/') ||
            lower.startsWith('file://') ||
            lower.startsWith('javascript:') ||
            lower.startsWith('data:') ||
            lower.startsWith('blob:') ||
            lower.startsWith('content:') ||
            lower.startsWith('chrome:')
          ) {
            console.warn('Blocked unsafe protocol link navigation:', cleanHref);
            return;
          }
          if (lower.startsWith('http://') || lower.startsWith('https://')) {
            window.open(cleanHref, '_blank', 'noopener,noreferrer');
          } else if (lower.startsWith('mailto:') || lower.startsWith('tel:')) {
            window.location.href = cleanHref;
          }
        }
      }
    };
    doc.addEventListener('click', handleLinkClick);

    return () => {
      resizeObserver.disconnect();
      doc.removeEventListener('click', handleLinkClick);
    };
  }, [sanitizedHTML, viewSource]);

  const actionLink = useMemo(() => {
    if (!email) return null;
    try {
      const htmlContent = email.html ? (typeof email.html[0] === 'string' ? email.html[0] : '') : '';
      return extractActionLinks(htmlContent);
    } catch { return null; }
  }, [email?.id, email?.html]);

  if (loading) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center space-y-4" role="status" aria-live="polite">
        <div className="w-full max-w-md px-8 space-y-4 animate-pulse" aria-hidden="true">
          <div className="h-6 bg-white/5 rounded-lg w-3/4" />
          <div className="h-4 bg-white/5 rounded-lg w-1/2" />
          <div className="h-px bg-white/5 my-4" />
          <div className="space-y-2">
            <div className="h-3 bg-white/5 rounded w-full" />
            <div className="h-3 bg-white/5 rounded w-5/6" />
            <div className="h-3 bg-white/5 rounded w-4/6" />
          </div>
        </div>
        <div className="text-xs text-slate-500 font-mono animate-pulse">{t.decrypting}</div>
      </div>
    );
  }

  if (!email) return null;

  const fromAddress = typeof email.from === 'string'
    ? email.from
    : (email.from && typeof email.from === 'object' ? String(email.from.address || 'unknown') : 'unknown');

  const fromName = typeof email.from === 'string'
    ? email.from
    : (email.from && typeof email.from === 'object' ? String(email.from.name || email.from.address || 'unknown') : 'unknown');

  const otpCode = useMemo(() => {
    return extractOTPFromContent(email.subject, email.text || '');
  }, [email.subject, email.text]);

  const formatDate = useCallback((dateString: string) => {
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return dateString || '';
      return d.toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US', {
        weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });
    } catch {
      return dateString || '';
    }
  }, [lang]);

  const handleDownloadTXT = useCallback(() => {
    if (!email) return;
    const content = `From: ${fromAddress}\nDate: ${email.createdAt}\nSubject: ${email.subject || ''}\n\n${email.text || ''}`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${email.subject?.replace(/[^a-z0-9]/gi, '_').substring(0, 20) || 'email'}.txt`;
    link.click();
    URL.revokeObjectURL(link.href);
  }, [email, fromAddress]);

  const handleDownloadPDF = useCallback(() => {
    if (!iframeRef.current || !iframeRef.current.contentWindow) {
      window.print();
      return;
    }
    try {
      iframeRef.current.contentWindow.print();
    } catch {
      window.print();
    }
  }, []);

  const handleDownload = useCallback(() => {
    const htmlBody = email.html && email.html[0] ? (typeof email.html[0] === 'string' ? email.html[0] : '') : '';
    const emlContent = `From: ${fromAddress}\nSubject: ${email.subject}\nDate: ${email.createdAt}\n\n${htmlBody || email.text || ''}`;
    const blob = new Blob([emlContent], { type: 'message/rfc822' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${email.subject?.replace(/[^a-z0-9]/gi, '_').substring(0, 20) || 'email'}.eml`;
    link.click();
    URL.revokeObjectURL(link.href);
  }, [email, fromAddress]);

  const handleForward = useCallback(() => {
    const subject = encodeURIComponent(`Fwd: ${email.subject || ''}`);
    const body = encodeURIComponent(`---------- Forwarded message ----------\nFrom: ${fromAddress}\nDate: ${email.createdAt}\nSubject: ${email.subject || ''}\n\n${email.text || ''}`);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_self');
  }, [email, fromAddress]);

  const handleCopyCode = useCallback(() => {
    if (otpCode) {
      navigator.clipboard.writeText(otpCode);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    }
  }, [otpCode]);

  return (
    <div className="flex flex-col h-full bg-transparent text-slate-200" role="article" aria-label={`Email: ${email.subject || 'No subject'}`}>
      {/* Üst Toolbar */}
      <div className="flex items-center justify-between p-3 md:p-4 border-b border-white/5 bg-[#0e0e11]/40">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-xs font-bold uppercase md:hidden min-h-[44px] px-2" aria-label={t.back}>
          <ArrowLeft className="w-4 h-4" aria-hidden="true" /> {t.back}
        </button>
        <div className="flex items-center gap-1.5 md:gap-2 ml-auto">
          <button onClick={() => setPreviewDevice(prev => prev === 'mobile' ? 'responsive' : 'mobile')} className={`p-2 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center ${previewDevice === 'mobile' ? 'bg-orange-500/20 text-orange-500' : 'hover:bg-white/5 text-slate-400'}`} title={lang === 'tr' ? 'Mobil Önizleme' : 'Mobile Preview'}>
            <Smartphone className="w-4 h-4" />
          </button>
          <button onClick={() => { setShowHeaders(!showHeaders); if (!showHeaders) setViewSource(false); }} className={`p-2 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center ${showHeaders ? 'bg-orange-500/20 text-orange-500' : 'hover:bg-white/5 text-slate-400'}`} title={lang === 'tr' ? 'E-posta Başlıkları' : 'Email Headers'} aria-label={showHeaders ? 'Hide headers' : 'Show headers'} aria-pressed={showHeaders}>
            <List className="w-4 h-4" />
          </button>
          <button onClick={() => { setViewSource(!viewSource); if (!viewSource) setShowHeaders(false); }} className={`p-2 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center ${viewSource ? 'bg-orange-500/20 text-orange-500' : 'hover:bg-white/5 text-slate-400'}`} title={t.sourceCode} aria-label={viewSource ? 'View rendered' : t.sourceCode} aria-pressed={viewSource}>
            {viewSource ? <Eye className="w-4 h-4" /> : <Code className="w-4 h-4" />}
          </button>
          <button onClick={handleForward} className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-orange-400 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center" title={t.forward} aria-label={t.forward}>
            <Forward className="w-4 h-4" />
          </button>
          <button onClick={() => downloadAsEML(email)} className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-purple-400 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center" title={lang === 'tr' ? 'EML İndir (.eml)' : 'Download EML'}>
            <FileType className="w-4 h-4" />
          </button>
          <button onClick={() => downloadAsJSON(email)} className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-emerald-400 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center" title={lang === 'tr' ? 'JSON İndir (.json)' : 'Download JSON'}>
            <FileJson className="w-4 h-4" />
          </button>
          <button onClick={() => printEmailContent(email)} className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center" title={lang === 'tr' ? 'PDF İndir / Yazdır' : 'Download PDF / Print'}>
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tracker Blocker Bildirim Rozeti */}
      {trackerResult.trackerCount > 0 && (
        <div className="mx-3 sm:mx-6 mt-3 px-4 py-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between text-xs text-emerald-300 animate-fade-in">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              🛡️ <strong>{trackerResult.trackerCount}</strong> {t.trackerBlockedDesc}
            </span>
          </div>
          <span className="text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded font-mono text-emerald-200 uppercase tracking-wider">
            RAM Shield Active
          </span>
        </div>
      )}

      {/* Konu + Gönderici */}
      <div className="p-3 sm:p-4 md:p-6 border-b border-white/5 space-y-3 sm:space-y-4 bg-transparent">
        <h1 className="text-base sm:text-lg md:text-2xl font-bold text-white leading-tight">{email.subject || t.noSubject}</h1>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 md:gap-4 text-[11px] sm:text-xs text-slate-400">
          <div className="flex items-center gap-2 bg-white/5 px-2.5 sm:px-3 py-1.5 rounded-full border border-white/5 max-w-full overflow-hidden">
            <User className="w-3 h-3 text-orange-500 flex-shrink-0" aria-hidden="true" />
            <span className="text-slate-200 font-medium truncate">{fromName}</span>
            <span className="text-slate-400 hidden sm:inline truncate">&lt;{fromAddress}&gt;</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-3 h-3 text-slate-400" aria-hidden="true" />
            <time dateTime={email.createdAt}>{formatDate(email.createdAt)}</time>
          </div>
        </div>
      </div>

      {/* OTP Kodu Algılandıysa */}
      {otpCode && (
        <div className="otp-glow mx-3 sm:mx-4 mt-3 sm:mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-green-500/[0.07] border border-green-500/20 rounded-xl sm:rounded-2xl p-3 sm:p-4" role="alert">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" aria-hidden="true" />
            </div>
            <div>
              <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-green-500 mb-0.5">
                {t.otpDetected}
              </p>
              <p className="font-mono text-xl sm:text-2xl font-black text-green-400 tracking-[0.2em]" aria-label={`Verification code: ${otpCode.split('').join(' ')}`}>{otpCode}</p>
            </div>
          </div>
          <button
            onClick={handleCopyCode}
            className="w-full sm:w-auto px-4 py-2.5 bg-green-500 hover:bg-green-600 text-black rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shrink-0"
            aria-label={`Copy code ${otpCode}`}
          >
            {codeCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {codeCopied ? 'OK!' : t.copy}
          </button>
        </div>
      )}

      {/* AI Aksiyon Linki Algılandıysa */}
      {!otpCode && actionLink && (
        <div className="mx-3 sm:mx-4 mt-3 sm:mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-orange-500/[0.05] border border-orange-500/20 rounded-xl sm:rounded-2xl p-3 sm:p-4 hover:border-orange-500/40 transition-colors" role="alert">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center flex-shrink-0">
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400 rotate-180" aria-hidden="true" />
            </div>
            <div>
              <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-orange-400 mb-0.5">
                {t.actionLinkFound}
              </p>
              <p className="text-sm sm:text-base font-bold text-slate-200 capitalize truncate max-w-[200px] sm:max-w-xs">{actionLink.label}</p>
            </div>
          </div>
          <a
            href={actionLink.url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-black rounded-xl font-bold text-sm flex items-center justify-center transition-all active:scale-95 shrink-0"
          >
            {t.openLink}
          </a>
        </div>
      )}

      {/* Ek Dosyalar */}
      {email.hasAttachments && email.attachments && email.attachments.length > 0 && (
        <div className="mx-3 sm:mx-4 mt-3 sm:mt-4 p-3 bg-white/[0.02] border border-white/5 rounded-xl sm:rounded-2xl" role="region" aria-label="Attachments">
          <div className="flex items-center gap-2 mb-2">
            <Paperclip className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {email.attachments.length} {t.attachments}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {email.attachments.map((att, i) => (
              <button
                key={att.id || i}
                onClick={() => handleDownloadAttachment(att)}
                className="flex items-center gap-2 px-3 py-2 bg-white/[0.03] border border-white/5 rounded-xl hover:bg-white/[0.06] hover:border-white/10 transition-all cursor-pointer group text-left"
                title={`${lang === 'tr' ? 'İndir' : 'Download'}: ${att.filename}`}
                aria-label={`${lang === 'tr' ? 'İndir' : 'Download'}: ${att.filename}`}
              >
                {getFileIcon(att.contentType)}
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-slate-300 truncate max-w-[120px]">{att.filename}</p>
                  <p className="text-[9px] text-slate-400">{formatSize(att.size)}</p>
                </div>
                {att.contentType.startsWith('image/') ? (
                  <span className="text-[8px] px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded border border-blue-500/20 font-bold">
                    {t.preview}
                  </span>
                ) : (
                  <Download className="w-3.5 h-3.5 text-slate-400 group-hover:text-green-400 transition-colors" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* İçerik - Sandbox iframe veya kaynak kodu veya headers */}
      <div className="flex-grow overflow-y-auto custom-scrollbar relative bg-transparent">
        {showHeaders ? (
          <div className="absolute inset-0 bg-[#050505] p-4 md:p-6 overflow-auto">
            <div className="flex items-center gap-2 mb-4">
              <List className="w-4 h-4 text-orange-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-orange-500">
                {t.emailHeaders}
              </span>
            </div>
            {email.headerFields && Object.keys(email.headerFields).length > 0 ? (
              <div className="space-y-1">
                {Object.entries(email.headerFields).map(([key, value]) => (
                  <div key={key} className="flex gap-3 py-1.5 border-b border-white/5 last:border-0">
                    <span className="text-[11px] font-mono font-bold text-orange-400/80 min-w-[100px] shrink-0">{key}:</span>
                    <span className="text-[11px] font-mono text-slate-400 break-all">{typeof value === 'string' ? value : JSON.stringify(value)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">{t.noHeadersAvailable}</p>
            )}
          </div>
        ) : viewSource ? (
          <div className="absolute inset-0 bg-[#050505] p-4 md:p-6 text-xs font-mono text-green-500/80 overflow-auto">
            <pre className="whitespace-pre-wrap break-all">{`From: ${fromAddress}\nSubject: ${email.subject}\nDate: ${email.createdAt}\n\n${email.html && email.html[0] ? (typeof email.html[0] === 'string' ? email.html[0] : JSON.stringify(email.html[0])) : email.text || ''}`}</pre>
          </div>
        ) : (
          <div className={`w-full min-h-full p-2 transition-all ${previewDevice === 'mobile' ? 'max-w-[375px] mx-auto border-8 border-[#1a1d24] rounded-[36px] bg-black shadow-2xl my-4 overflow-hidden' : ''}`}>
            <iframe
              ref={iframeRef}
              sandbox="allow-same-origin"
              title="Email content"
              className="w-full border-0 rounded-lg sm:rounded-xl min-h-[250px] sm:min-h-[300px]"
              style={{ colorScheme: 'normal', background: '#ffffff' }}
              aria-label="Email body content"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(EmailViewer);