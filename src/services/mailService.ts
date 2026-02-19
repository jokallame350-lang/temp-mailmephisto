import { Mailbox, EmailSummary, EmailDetail, AICategory } from '../types';

const API_BASE = 'https://api.mail.tm';

// Rate limit tracking
let rateLimitHit = false;
let rateLimitResetTime = 0;

export const isRateLimited = (): boolean => {
  if (!rateLimitHit) return false;
  if (Date.now() > rateLimitResetTime) {
    rateLimitHit = false;
    return false;
  }
  return true;
};

export const getRateLimitRemainingMs = (): number => {
  if (!rateLimitHit) return 0;
  return Math.max(0, rateLimitResetTime - Date.now());
};

/** Rate limit kontrolü yapan fetch wrapper */
const safeFetch = async (url: string, options?: RequestInit): Promise<Response> => {
  if (isRateLimited()) {
    throw new Error(`Rate limited. Retry after ${Math.ceil(getRateLimitRemainingMs() / 1000)}s`);
  }

  const res = await fetch(url, options);

  if (res.status === 429) {
    rateLimitHit = true;
    const retryAfter = res.headers.get('Retry-After');
    const waitMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : 60000;
    rateLimitResetTime = Date.now() + waitMs;
    throw new Error(`Rate limit exceeded. Please wait ${Math.ceil(waitMs / 1000)} seconds.`);
  }

  return res;
};

/** Rastgele 16 karakterlik şifre üretir */
const generatePassword = (): string => {
  // Kripto güvenli rastgele şifre
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const arr = new Uint8Array(16);
    crypto.getRandomValues(arr);
    return Array.from(arr, b => b.toString(36).padStart(2, '0')).join('').substring(0, 16);
  }
  return Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
};

/** E-posta konu/gönderici/intro'ya göre basit kategori belirler */
const determineCategory = (subject: string, from: string, intro: string): AICategory => {
  const text = `${subject} ${from} ${intro}`.toLowerCase();
  if (/(code|verify|verification|otp|confirm|activation|pin\b|doğrulama|kod|şifre)/.test(text)) return 'Verification';
  if (/(security|alert|reset password|suspicious|login attempt|güvenlik|giriş|uyarı)/.test(text)) return 'Security';
  if (/(newsletter|bülten|weekly|digest|fırsat|indirim|offer|sale)/.test(text)) return 'Newsletter';
  return 'Other';
};

/**
 * Rastgele bir mail.tm hesabı oluşturur ve token alır.
 * Hata durumunda Error fırlatır — asla sahte veri dönmez.
 */
export const generateMailbox = async (): Promise<Mailbox> => {
  // Domain'leri çek
  const domainData = await fetchDomains();
  const domain = domainData.domains[0];
  if (!domain) {
    throw new Error('Kullanılabilir domain bulunamadı.');
  }

  const username = Math.random().toString(36).substring(2, 12);
  const address = `${username}@${domain}`;
  const password = generatePassword();

  // Hesabı oluştur
  const accRes = await safeFetch(`${API_BASE}/accounts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address, password })
  });

  if (!accRes.ok && accRes.status !== 422) {
    throw new Error(`Hesap oluşturulamadı (HTTP ${accRes.status})`);
  }

  // Token al
  const tokenRes = await safeFetch(`${API_BASE}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address, password })
  });

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
    apiBase: 'mail_tm',
    token: tokenData.token,
    password,
  };
};

/**
 * Kullanıcının belirlediği username + domain ile hesap oluşturur.
 */
export const createCustomMailbox = async (username: string, domain: string, _apiBase: string): Promise<Mailbox> => {
  const address = `${username}@${domain}`;
  const password = generatePassword();

  const accRes = await safeFetch(`${API_BASE}/accounts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address, password })
  });

  if (accRes.status === 422) {
    throw new Error('Bu kullanıcı adı zaten alınmış.');
  }

  if (!accRes.ok) {
    throw new Error(`Hesap oluşturulamadı (HTTP ${accRes.status})`);
  }

  const tokenRes = await safeFetch(`${API_BASE}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address, password })
  });

  if (!tokenRes.ok) {
    throw new Error(`Token alınamadı (HTTP ${tokenRes.status})`);
  }

  const tokenData = await tokenRes.json();

  return {
    id: tokenData.id || address,
    address,
    apiBase: 'mail_tm',
    token: tokenData.token,
    password,
  };
};

/**
 * Aktif hesabın gelen kutusundaki mesajları çeker.
 */
export const getMessages = async (mailbox: Mailbox): Promise<EmailSummary[]> => {
  if (!mailbox.token) return [];

  const res = await safeFetch(`${API_BASE}/messages?page=1`, {
    headers: { Authorization: `Bearer ${mailbox.token}` }
  });

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

  const res = await safeFetch(`${API_BASE}/messages/${messageId}`, {
    headers: { Authorization: `Bearer ${mailbox.token}` }
  });

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

  try {
    const res = await safeFetch(`${API_BASE}/messages/${messageId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${mailbox.token}` }
    });
    return res.ok || res.status === 204;
  } catch {
    return false;
  }
};

/**
 * Kullanılabilir domain listesini çeker.
 */
export const fetchDomains = async (): Promise<{ domains: string[]; apiBase: string }> => {
  try {
    const res = await safeFetch(`${API_BASE}/domains`);
    if (!res.ok) throw new Error(`Domain fetch failed (HTTP ${res.status})`);
    const data = await res.json();
    const domains = data['hydra:member']?.map((d: any) => d.domain) || [];
    return { domains, apiBase: 'mail_tm' };
  } catch {
    // Fallback domain listesi
    return { domains: ['karenkey.com'], apiBase: 'mail_tm' };
  }
};