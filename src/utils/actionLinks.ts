const actionLinkCache = new Map<string, { url: string; label: string } | null>();
const MAX_CACHE_ENTRIES = 100;
const BLOCKED_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1']);
const PRIVATE_IPV4 = /^(10\.|127\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/;

const isSafeVerificationUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password) return false;
    if (url.port && url.port !== '443') return false;
    const hostname = url.hostname.toLowerCase().replace(/\.$/, '');
    if (!hostname || BLOCKED_HOSTS.has(hostname) || hostname.endsWith('.localhost') || hostname.endsWith('.local')) return false;
    if (PRIVATE_IPV4.test(hostname) || hostname.includes(':')) return false;
    // Never auto-handle javascript/data/blob/file URLs or URLs with an empty origin.
    if (url.origin === 'null') return false;
    return true;
  } catch { return false; }
};

/**
 * Extracts an explicit email-verification link only.
 * The result must never be treated as proof that a destination is trustworthy;
 * callers should present the destination to the user before navigation.
 */
export const extractActionLinks = (htmlText?: string): { url: string; label: string } | null => {
  if (!htmlText || typeof DOMParser === 'undefined') return null;
  const cached = actionLinkCache.get(htmlText);
  if (cached !== undefined) return cached;
  if (!/<a\b/i.test(htmlText)) { actionLinkCache.set(htmlText, null); return null; }

  try {
    const doc = new DOMParser().parseFromString(htmlText, 'text/html');
    const verificationWords = [
      'verify email', 'verify your email', 'email verification', 'verify account',
      'confirm email', 'confirm your email', 'confirmation email', 'activate account',
      'activate your account', 'doğrulama', 'doğrula', 'e-postanı doğrula',
      'e-posta doğrulama', 'onayla e-posta', 'hesabı etkinleştir'
    ];
    let result: { url: string; label: string } | null = null;
    for (const link of Array.from(doc.querySelectorAll('a'))) {
      const href = (link.getAttribute('href') || '').trim();
      const text = (link.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
      if (!href || !text || !isSafeVerificationUrl(href)) continue;
      if (!verificationWords.some(word => text.includes(word))) continue;
      result = { url: href, label: (link.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 120) || 'E-posta Doğrulama Linki' };
      break;
    }
    if (actionLinkCache.size >= MAX_CACHE_ENTRIES) actionLinkCache.clear();
    actionLinkCache.set(htmlText, result);
    return result;
  } catch {
    if (actionLinkCache.size >= MAX_CACHE_ENTRIES) actionLinkCache.clear();
    actionLinkCache.set(htmlText, null);
    return null;
  }
};
