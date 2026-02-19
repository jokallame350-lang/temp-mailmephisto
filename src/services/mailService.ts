import { Mailbox, EmailSummary, EmailDetail, AICategory } from '../types';

/**
 * Multi-Provider Temporary Email Service
 * 
 * Supports:
 * - mail.tm  (primary)
 * - mail.gw  (secondary — same API structure, different domains)
 * 
 * Both providers use identical Hydra-based REST APIs,
 * so all account/message operations work the same way.
 */

const PROVIDERS: Record<string, string> = {
  mail_tm: 'https://api.mail.tm',
  mail_gw: 'https://api.mail.gw',
};

// Rate limit tracking (per-provider)
const rateLimitState: Record<string, { hit: boolean; resetTime: number }> = {};

export const isRateLimited = (provider = 'mail_tm'): boolean => {
  const state = rateLimitState[provider];
  if (!state?.hit) return false;
  if (Date.now() > state.resetTime) {
    state.hit = false;
    return false;
  }
  return true;
};

export const getRateLimitRemainingMs = (provider = 'mail_tm'): number => {
  const state = rateLimitState[provider];
  if (!state?.hit) return 0;
  return Math.max(0, state.resetTime - Date.now());
};

/** Resolve API base URL from provider key */
const getApiBase = (provider: string): string => {
  return PROVIDERS[provider] || PROVIDERS.mail_tm;
};

/** Rate limit kontrolü yapan fetch wrapper */
const safeFetch = async (url: string, options?: RequestInit, provider = 'mail_tm'): Promise<Response> => {
  if (isRateLimited(provider)) {
    throw new Error(`Rate limited. Retry after ${Math.ceil(getRateLimitRemainingMs(provider) / 1000)}s`);
  }

  const res = await fetch(url, options);

  if (res.status === 429) {
    if (!rateLimitState[provider]) rateLimitState[provider] = { hit: false, resetTime: 0 };
    rateLimitState[provider].hit = true;
    const retryAfter = res.headers.get('Retry-After');
    const waitMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : 60000;
    rateLimitState[provider].resetTime = Date.now() + waitMs;
    throw new Error(`Rate limit exceeded. Please wait ${Math.ceil(waitMs / 1000)} seconds.`);
  }

  return res;
};

/** Rastgele 16 karakterlik şifre üretir */
const generatePassword = (): string => {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const arr = new Uint8Array(16);
    crypto.getRandomValues(arr);
    return Array.from(arr, b => b.toString(36).padStart(2, '0')).join('').substring(0, 16);
  }
  return Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
};

/** E-posta konu/gönderici/intro'ya göre kategori belirler */
const determineCategory = (subject: string, from: string, intro: string): AICategory => {
  const text = `${subject} ${from} ${intro}`.toLowerCase();
  if (/(code|verify|verification|otp|confirm|activation|pin\b|doğrulama|kod|şifre)/.test(text)) return 'Verification';
  if (/(security|alert|reset password|suspicious|login attempt|güvenlik|giriş|uyarı)/.test(text)) return 'Security';
  if (/(newsletter|bülten|weekly|digest|fırsat|indirim|offer|sale)/.test(text)) return 'Newsletter';
  return 'Other';
};

/**
 * Tüm provider'lardan domain listesini toplar.
 * Her domain hangi provider'a ait olduğunu da döner.
 */
export const fetchDomains = async (): Promise<{ domains: string[]; domainProviderMap: Record<string, string>; apiBase: string }> => {
  const allDomains: string[] = [];
  const domainProviderMap: Record<string, string> = {};
  const providerKeys = Object.keys(PROVIDERS);

  // Tüm provider'ları paralel olarak sorgula
  const results = await Promise.allSettled(
    providerKeys.map(async (providerKey) => {
      const apiBase = PROVIDERS[providerKey];
      try {
        const res = await safeFetch(`${apiBase}/domains`, undefined, providerKey);
        if (!res.ok) return { providerKey, domains: [] as string[] };
        const data = await res.json();
        const domains = data['hydra:member']?.map((d: any) => d.domain).filter(Boolean) || [];
        return { providerKey, domains };
      } catch {
        return { providerKey, domains: [] as string[] };
      }
    })
  );

  for (const result of results) {
    if (result.status === 'fulfilled' && result.value.domains.length > 0) {
      for (const domain of result.value.domains) {
        if (!allDomains.includes(domain)) {
          allDomains.push(domain);
          domainProviderMap[domain] = result.value.providerKey;
        }
      }
    }
  }

  // Hiç domain bulunamazsa fallback
  if (allDomains.length === 0) {
    allDomains.push('dollicons.com');
    domainProviderMap['dollicons.com'] = 'mail_tm';
  }

  return { domains: allDomains, domainProviderMap, apiBase: 'multi' };
};

/**
 * Rastgele bir hesap oluşturur.
 * Tüm provider'lardan domain toplar, rastgele birini seçer.
 */
export const generateMailbox = async (): Promise<Mailbox> => {
  const { domains, domainProviderMap } = await fetchDomains();

  if (domains.length === 0) {
    throw new Error('Kullanılabilir domain bulunamadı.');
  }

  // Rastgele domain seç
  const domain = domains[Math.floor(Math.random() * domains.length)];
  const provider = domainProviderMap[domain] || 'mail_tm';
  const apiBase = getApiBase(provider);

  const username = Math.random().toString(36).substring(2, 12);
  const address = `${username}@${domain}`;
  const password = generatePassword();

  // Hesabı oluştur
  const accRes = await safeFetch(`${apiBase}/accounts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address, password })
  }, provider);

  if (!accRes.ok && accRes.status !== 422) {
    throw new Error(`Hesap oluşturulamadı (HTTP ${accRes.status})`);
  }

  // Token al
  const tokenRes = await safeFetch(`${apiBase}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address, password })
  }, provider);

  if (!tokenRes.ok) {
    throw new Error(`Token alınamadı (HTTP ${tokenRes.status})`);
  }

  const tokenData = await tokenRes.json();

  if (!tokenData.token) {
    throw new Error('API token döndürmedi');
  }

  return {
    id: tokenData.id || address,
    address,
    apiBase: provider,
    token: tokenData.token,
    password,
  };
};

/**
 * Kullanıcının belirlediği username + domain ile hesap oluşturur.
 * Provider, domain'e göre otomatik belirlenir.
 */
export const createCustomMailbox = async (username: string, domain: string, provider: string): Promise<Mailbox> => {
  const apiBase = getApiBase(provider);
  const address = `${username}@${domain}`;
  const password = generatePassword();

  const accRes = await safeFetch(`${apiBase}/accounts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address, password })
  }, provider);

  if (accRes.status === 422) {
    throw new Error('Bu kullanıcı adı zaten alınmış.');
  }

  if (!accRes.ok) {
    throw new Error(`Hesap oluşturulamadı (HTTP ${accRes.status})`);
  }

  const tokenRes = await safeFetch(`${apiBase}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address, password })
  }, provider);

  if (!tokenRes.ok) {
    throw new Error(`Token alınamadı (HTTP ${tokenRes.status})`);
  }

  const tokenData = await tokenRes.json();

  return {
    id: tokenData.id || address,
    address,
    apiBase: provider,
    token: tokenData.token,
    password,
  };
};

/**
 * Aktif hesabın gelen kutusundaki mesajları çeker.
 * Mailbox'ın apiBase'ine göre doğru provider'a yönlendirir.
 */
export const getMessages = async (mailbox: Mailbox): Promise<EmailSummary[]> => {
  if (!mailbox.token) return [];

  const apiBase = getApiBase(mailbox.apiBase);

  const res = await safeFetch(`${apiBase}/messages?page=1`, {
    headers: { Authorization: `Bearer ${mailbox.token}` }
  }, mailbox.apiBase);

  if (!res.ok) return [];

  const data = await res.json();
  const members = data['hydra:member'];

  if (!Array.isArray(members)) return [];

  return members.map((msg: any) => ({
    id: msg.id,
    from: {
      address: msg.from?.address || 'unknown',
      name: msg.from?.name || msg.from?.address?.split('@')[0] || 'unknown',
    },
    subject: msg.subject || '',
    intro: msg.intro || 'No preview available',
    seen: msg.seen,
    createdAt: msg.createdAt,
    aiCategory: determineCategory(msg.subject || '', msg.from?.address || '', msg.intro || ''),
  }));
};

/**
 * Tek bir mesajın tam detayını çeker.
 */
export const getMessageDetail = async (mailbox: Mailbox, messageId: string): Promise<EmailDetail | null> => {
  if (!mailbox.token) return null;

  const apiBase = getApiBase(mailbox.apiBase);

  const res = await safeFetch(`${apiBase}/messages/${messageId}`, {
    headers: { Authorization: `Bearer ${mailbox.token}` }
  }, mailbox.apiBase);

  if (!res.ok) return null;

  const msg = await res.json();

  return {
    id: msg.id,
    from: {
      address: msg.from?.address || 'unknown',
      name: msg.from?.name || msg.from?.address || 'unknown',
    },
    subject: msg.subject || '',
    intro: msg.intro || '',
    seen: true,
    createdAt: msg.createdAt,
    aiCategory: determineCategory(msg.subject || '', msg.from?.address || '', msg.intro || ''),
    text: msg.text,
    html: msg.html ? [msg.html] : [],
    hasAttachments: msg.hasAttachments || false,
    attachments: (msg.attachments || []).map((att: any) => ({
      id: att.id || '',
      filename: att.filename || 'attachment',
      contentType: att.contentType || 'application/octet-stream',
      size: att.size || 0,
      downloadUrl: att.downloadUrl || '',
    })),
  };
};

/**
 * Bir mesajı siler.
 */
export const deleteMessage = async (mailbox: Mailbox, messageId: string): Promise<boolean> => {
  if (!mailbox.token) return false;

  const apiBase = getApiBase(mailbox.apiBase);

  try {
    const res = await safeFetch(`${apiBase}/messages/${messageId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${mailbox.token}` }
    }, mailbox.apiBase);
    return res.ok || res.status === 204;
  } catch {
    return false;
  }
};