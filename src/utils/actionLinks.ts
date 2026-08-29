const actionLinkCache = new Map<string, { url: string; label: string } | null>();
const MAX_CACHE_ENTRIES = 100;
const BLOCKED_HOSTS = new Set([
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
  'ip6-localhost',
  'ip6-loopback',
  'localhost.localdomain',
]);

const PRIVATE_IPV4 = /^(0\.|10\.|127\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.|100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.|192\.0\.0\.|192\.0\.2\.|198\.51\.100\.|203\.0\.113\.|22[4-9]\.|23\d\.|24\d\.|25[0-5]\.)/;

const BLOCKED_TLDS = ['.localhost', '.local', '.internal', '.lan', '.home', '.corp', '.localdomain', '.invalid', '.test', '.example', '.onion'];

export const isSafeVerificationUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password) return false;
    if (url.port && url.port !== '443') return false;
    const hostname = url.hostname.toLowerCase().replace(/\.$/, '');
    if (!hostname || BLOCKED_HOSTS.has(hostname)) return false;
    if (BLOCKED_TLDS.some(tld => hostname.endsWith(tld))) return false;
    // Decimal / hex / single-integer IP representations
    if (/^(0x[0-9a-f]+|\d+)$/i.test(hostname)) return false;
    if (PRIVATE_IPV4.test(hostname) || hostname.includes(':') || hostname.startsWith('[') || hostname.endsWith(']')) return false;
    if (!hostname.includes('.')) return false; // Block single-label internal hosts (e.g., "router", "intranet")
    if (url.origin === 'null') return false;
    return true;
  } catch { return false; }
};

/**
 * Extracts an explicit email-verification link only.
 * Operates with DOMParser in browser and regex fallback in server/test environments.
 */
export const extractActionLinks = (htmlText?: string): { url: string; label: string } | null => {
  if (!htmlText) return null;
  const cached = actionLinkCache.get(htmlText);
  if (cached !== undefined) return cached;
  if (!/<a\b/i.test(htmlText)) { actionLinkCache.set(htmlText, null); return null; }

  const verificationWords = [
    // English
    'verify email', 'verify your email', 'email verification', 'verify account',
    'confirm email', 'confirm your email', 'confirmation email', 'activate account',
    'activate your account',
    // Turkish
    'doğrulama', 'doğrula', 'e-postanı doğrula', 'e-posta doğrulama', 'onayla e-posta', 'hesabı etkinleştir',
    // German
    'e-mail bestätigen', 'konto aktivieren', 'verifizieren', 'bestätigen sie',
    // Spanish
    'verificar correo', 'confirmar correo', 'activar cuenta', 'verificar mi cuenta',
    // French
    'vérifier l\'e-mail', 'confirmer l\'e-mail', 'activer le compte', 'activer mon compte',
    // Italian
    'verifica email', 'conferma email', 'attiva account', 'conferma il tuo indirizzo',
    // Portuguese
    'verificar email', 'confirmar email', 'ativar conta', 'confirmar sua conta',
    // Russian
    'подтвердить email', 'подтвердить почту', 'активировать аккаунт', 'подтвердите адрес',
    // Arabic
    'تأكيد البريد', 'تفعيل الحساب', 'التحقق من البريد'
  ];

  try {
    if (typeof DOMParser !== 'undefined') {
      const doc = new DOMParser().parseFromString(htmlText, 'text/html');
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
    }

    const anchorRegex = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi;
    let match;
    while ((match = anchorRegex.exec(htmlText)) !== null) {
      const href = (match[1] || '').trim();
      const rawText = (match[2] || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
      const text = rawText.toLowerCase();
      if (!href || !text || !isSafeVerificationUrl(href)) continue;
      if (!verificationWords.some(word => text.includes(word))) continue;
      const result = { url: href, label: rawText.slice(0, 120) || 'E-posta Doğrulama Linki' };
      if (actionLinkCache.size >= MAX_CACHE_ENTRIES) actionLinkCache.clear();
      actionLinkCache.set(htmlText, result);
      return result;
    }

    if (actionLinkCache.size >= MAX_CACHE_ENTRIES) actionLinkCache.clear();
    actionLinkCache.set(htmlText, null);
    return null;
  } catch {
    if (actionLinkCache.size >= MAX_CACHE_ENTRIES) actionLinkCache.clear();
    actionLinkCache.set(htmlText, null);
    return null;
  }
};
