const actionLinkCache = new Map<string, { url: string; label: string } | null>();

const BLOCKED_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1']);

const isSafeVerificationUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:') return false;
    if (url.username || url.password) return false;
    if (url.port && url.port !== '443') return false;
    const hostname = url.hostname.toLowerCase();
    if (BLOCKED_HOSTS.has(hostname) || hostname.endsWith('.localhost') || hostname.endsWith('.local')) return false;
    if (/^(10\.|127\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(hostname)) return false;
    if (hostname.includes(':')) return false;
    return true;
  } catch {
    return false;
  }
};

/**
 * Extract only explicit email-verification links.
 * This function deliberately does not fall back to arbitrary links because
 * callers may automatically request the returned URL.
 */
export const extractActionLinks = (htmlText?: string): { url: string; label: string } | null => {
  if (!htmlText || typeof DOMParser === 'undefined') return null;
  if (actionLinkCache.has(htmlText)) return actionLinkCache.get(htmlText)!;
  if (!htmlText.includes('<a') && !htmlText.includes('<A')) {
    actionLinkCache.set(htmlText, null);
    return null;
  }

  try {
    const doc = new DOMParser().parseFromString(htmlText, 'text/html');
    const links = Array.from(doc.querySelectorAll('a'));
    const verificationWords = [
      'verify email', 'verify your email', 'email verification', 'verify account',
      'confirm email', 'confirm your email', 'confirmation email', 'activate account',
      'activate your account', 'doğrulama', 'doğrula', 'e-postanı doğrula',
      'e-posta doğrulama', 'onayla e-posta', 'hesabı etkinleştir'
    ];

    let result: { url: string; label: string } | null = null;
    for (const link of links) {
      const text = (link.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
      const href = link.getAttribute('href') || '';
      if (!isSafeVerificationUrl(href)) continue;
      const isExplicitVerification = verificationWords.some(word => text.includes(word));
      if (!isExplicitVerification) continue;
      result = { url: href, label: link.textContent?.trim() || 'E-posta Doğrulama Linki' };
      break;
    }

    if (actionLinkCache.size >= 100) actionLinkCache.clear();
    actionLinkCache.set(htmlText, result);
    return result;
  } catch {
    if (actionLinkCache.size >= 100) actionLinkCache.clear();
    actionLinkCache.set(htmlText, null);
    return null;
  }
};
