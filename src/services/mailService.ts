import { Mailbox, EmailSummary, EmailDetail, AICategory } from '../types';

/**
 * Multi-Provider Temporary Email Service
 * 
 * Supports:
 * - mail.tm    (Hydra REST API)
 * - mail.gw    (Hydra REST API — sister of mail.tm)
 * - guerrilla  (Session-based REST API — different domains)
 */

// ─── Provider Registry ───────────────────────────────────────────────
const HYDRA_PROVIDERS: Record<string, string> = {
  mail_tm: 'https://api.mail.tm',
};

const WORKER_API = 'https://quiet-poetry-1d74.msoqmibt.workers.dev';

const GUERRILLA_API = 'https://api.guerrillamail.com/ajax.php';

// ─── Credential Store (for token refresh) ────────────────────────────
const credentialStore: Record<string, { address: string; password: string }> = {};

export const storeCredentials = (mailboxId: string, address: string, password: string) => {
  credentialStore[mailboxId] = { address, password };
};

const refreshHydraToken = async (provider: string, address: string, password: string): Promise<string | null> => {
  try {
    const apiBase = getApiBase(provider);
    const res = await fetch(`${apiBase}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, password }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.token || null;
  } catch {
    return null;
  }
};

// Event to notify when a token is refreshed
type TokenRefreshCallback = (mailboxId: string, newToken: string) => void;
let tokenRefreshListener: TokenRefreshCallback | null = null;

export const onTokenRefresh = (cb: TokenRefreshCallback) => {
  tokenRefreshListener = cb;
};

// ─── Rate Limit Tracking ─────────────────────────────────────────────
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

// ─── Utilities ───────────────────────────────────────────────────────
const getApiBase = (provider: string): string => {
  return HYDRA_PROVIDERS[provider] || HYDRA_PROVIDERS.mail_tm;
};

const safeFetch = async (
  url: string,
  options?: RequestInit,
  provider = 'mail_tm',
  mailboxId?: string,
  _retried = false
): Promise<Response> => {
  if (isRateLimited(provider)) {
    throw new Error(`Rate limited. Retry after ${Math.ceil(getRateLimitRemainingMs(provider) / 1000)}s`);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 saniye zaman aşımı

  let res: Response;
  try {
    res = await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }

  // Token expired — auto-refresh
  if (res.status === 401 && !_retried && mailboxId && !isGuerrilla(provider)) {
    const creds = credentialStore[mailboxId];
    if (creds) {
      const newToken = await refreshHydraToken(provider, creds.address, creds.password);
      if (newToken) {
        // Notify listener (useMailbox) about refreshed token
        tokenRefreshListener?.(mailboxId, newToken);
        // Retry the request with new token
        const newOptions = {
          ...options,
          headers: {
            ...(options?.headers || {}),
            Authorization: `Bearer ${newToken}`,
          },
        };
        return safeFetch(url, newOptions, provider, mailboxId, true);
      }
    }
  }

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

const generatePassword = (): string => {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const arr = new Uint8Array(16);
    crypto.getRandomValues(arr);
    return Array.from(arr, b => b.toString(36).padStart(2, '0')).join('').substring(0, 16);
  }
  return Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
};

const determineCategory = (subject: string, from: string, intro: string): AICategory => {
  const text = `${subject} ${from} ${intro}`.toLowerCase();
  if (/(code|verify|verification|otp|confirm|activation|pin\b|doğrulama|kod|şifre)/.test(text)) return 'Verification';
  if (/(security|alert|reset password|suspicious|login attempt|güvenlik|giriş|uyarı)/.test(text)) return 'Security';
  if (/(newsletter|bülten|weekly|digest|fırsat|indirim|offer|sale)/.test(text)) return 'Newsletter';
  return 'Other';
};

const formatSenderName = (fromAddress: string): string => {
  if (!fromAddress || fromAddress === 'unknown') return 'Bilinmeyen Gönderen';
  const lower = fromAddress.toLowerCase();
  
  if (lower.includes('instagram')) return 'Instagram';
  if (lower.includes('cloudflare')) return 'Cloudflare';
  if (lower.includes('google')) return 'Google';
  if (lower.includes('netflix')) return 'Netflix';
  if (lower.includes('facebook')) return 'Facebook';
  if (lower.includes('twitter') || lower.includes('x.com')) return 'X (Twitter)';
  if (lower.includes('github')) return 'GitHub';
  if (lower.includes('spotify')) return 'Spotify';
  if (lower.includes('discord')) return 'Discord';
  if (lower.includes('telegram')) return 'Telegram';
  if (lower.includes('steam')) return 'Steam';
  if (lower.includes('epicgames')) return 'Epic Games';
  if (lower.includes('microsoft')) return 'Microsoft';
  if (lower.includes('apple')) return 'Apple';

  const parts = fromAddress.split('@');
  const userPart = parts[0] || '';
  const domainPart = parts[1] || '';

  if (/^(no-reply|noreply|info|support|admin|service|notifications?|mailer-daemon)$/i.test(userPart) && domainPart) {
    const domainClean = domainPart.split('.')[0];
    return domainClean.charAt(0).toUpperCase() + domainClean.slice(1);
  }

  return userPart.charAt(0).toUpperCase() + userPart.slice(1);
};

const formatSmartSubject = (subject: string, excerpt: string, fromAddress: string): string => {
  const cleanSubject = (subject || '').trim();
  if (cleanSubject && cleanSubject !== '(Konu Yok)' && cleanSubject !== 'Konu Yok') {
    return cleanSubject;
  }

  const combined = `${excerpt || ''} ${fromAddress || ''}`.toLowerCase();
  if (combined.includes('instagram')) return 'Instagram Doğrulama Kodu';
  if (combined.includes('cloudflare')) return 'Cloudflare E-Posta Yönlendirme Onayı';
  if (combined.includes('code') || combined.includes('kod') || combined.includes('verify') || combined.includes('confirm')) return 'E-Posta Doğrulama Kodu';
  if (combined.includes('security') || combined.includes('güvenlik')) return 'Güvenlik Bildirimi';

  if (excerpt && excerpt.trim()) {
    return excerpt.slice(0, 45) + (excerpt.length > 45 ? '...' : '');
  }

  return 'Gelen Mesaj';
};

const isGuerrilla = (provider: string): boolean => provider === 'guerrilla';

// ─── Guerrilla Mail Helpers ──────────────────────────────────────────

/** Guerrilla Mail'den kullanılabilir domainleri çeker */
const getGuerrillaDomains = async (): Promise<string[]> => {
  try {
    const res = await safeFetch(`${GUERRILLA_API}?f=get_email_address&lang=en`, undefined, 'guerrilla');
    if (!res.ok) return [];
    const data = await res.json();
    // Guerrilla Mail'in ana domainini al
    const addr: string = data.email_addr || '';
    const domain = addr.split('@')[1];
    // Guerrilla Mail birden fazla domain sunabilir, ama API tek hesap döner
    // Bilinen domainleri de ekleyelim
    const domains = new Set<string>();
    if (domain) domains.add(domain);
    // Guerrilla'nın bilinen domainleri
    ['guerrillamailblock.com', 'guerrillamail.com', 'grr.la', 'sharklasers.com', 'guerrillamail.info', 'guerrillamail.net', 'guerrillamail.de'].forEach(d => domains.add(d));
    return Array.from(domains);
  } catch {
    return [];
  }
};

/** Guerrilla Mail ile hesap oluşturur */
const createGuerrillaMailbox = async (emailUser?: string, domainName?: string): Promise<Mailbox> => {
  // İlk adım: yeni email adresi ve sid_token al
  const res = await safeFetch(`${GUERRILLA_API}?f=get_email_address&lang=en`, undefined, 'guerrilla');
  if (!res.ok) throw new Error(`Guerrilla Mail hesabı oluşturulamadı (HTTP ${res.status})`);
  const data = await res.json();
  const sid = data.sid_token;

  let user = data.email_addr.split('@')[0];
  let dom = domainName || data.email_addr.split('@')[1] || 'guerrillamailblock.com';

  const targetUser = emailUser || user;

  // Kullanıcı adını Guerrilla oturumuna bağla (set_email_user)
  const setRes = await safeFetch(
    `${GUERRILLA_API}?f=set_email_user&email_user=${encodeURIComponent(targetUser)}&lang=en&sid_token=${sid}`,
    undefined, 'guerrilla'
  );
  if (setRes.ok) {
    const setData = await setRes.json();
    user = setData.email_user || targetUser;
  }

  const address = `${user}@${dom}`;

  // Hesabın oluşturulduğu anki en yüksek mail_id'yi kaydet
  let minMailId = 0;
  try {
    const catchAllRes = await safeFetch(
      `${GUERRILLA_API}?f=get_email_list&offset=0&sid_token=2v2ufvgjurlleoocs07esi4j47`,
      undefined, 'guerrilla'
    );
    if (catchAllRes.ok) {
      const catchAllData = await catchAllRes.json();
      if (Array.isArray(catchAllData?.list) && catchAllData.list.length > 0) {
        minMailId = Math.max(...catchAllData.list.map((m: any) => Number(m.mail_id) || 0));
      }
    }
  } catch {}

  return {
    id: sid,
    address,
    apiBase: 'guerrilla',
    token: sid,
    password: '',
    minMailId,
  };
};

const parseGuerrillaDate = (msg: any): string => {
  if (msg.mail_timestamp && Number(msg.mail_timestamp) > 0) {
    const d = new Date(Number(msg.mail_timestamp) * 1000);
    if (!isNaN(d.getTime())) return d.toISOString();
  }
  if (msg.mail_date) {
    const d = new Date(msg.mail_date);
    if (!isNaN(d.getTime())) return d.toISOString();
  }
  return new Date().toISOString();
};

const decodeHTMLEntities = (text: string): string => {
  if (!text) return '';
  if (typeof DOMParser !== 'undefined') {
    try {
      const doc = new DOMParser().parseFromString(text, 'text/html');
      return doc.documentElement.textContent || text;
    } catch {
      return text;
    }
  }
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");
};

// ─── Catch-All Session Manager (msoqmibt) ───────────────────────────
let catchAllSid = '2v2ufvgjurlleoocs07esi4j47';

const getCatchAllSid = async (forceRenew = false): Promise<string> => {
  if (!forceRenew && catchAllSid) return catchAllSid;

  try {
    const res = await safeFetch(`${GUERRILLA_API}?f=get_email_address&lang=en`, undefined, 'guerrilla');
    if (res.ok) {
      const data = await res.json();
      if (data.sid_token) {
        const freshSid = data.sid_token;
        await safeFetch(
          `${GUERRILLA_API}?f=set_email_user&email_user=msoqmibt&lang=en&sid_token=${freshSid}`,
          undefined, 'guerrilla'
        );
        catchAllSid = freshSid;
        return freshSid;
      }
    }
  } catch {}
  return catchAllSid;
};

/** Guerrilla Mail mesajlarını çeker - Hızlı direct get_email_list (90ms) */
const getGuerrillaMessages = async (mailbox: Mailbox): Promise<EmailSummary[]> => {
  let sid = mailbox.token;
  const username = mailbox.address ? mailbox.address.split('@')[0] : '';
  if (!username) return [];

  try {
    // 1. Sid yoksa yeni oturum al ve adresi bağla
    if (!sid) {
      const initRes = await safeFetch(`${GUERRILLA_API}?f=get_email_address&lang=en`, undefined, 'guerrilla');
      if (!initRes.ok) return [];
      const initData = await initRes.json();
      sid = initData.sid_token;
      mailbox.token = sid;
      if (tokenRefreshListener) tokenRefreshListener(mailbox.id, sid);

      await safeFetch(
        `${GUERRILLA_API}?f=set_email_user&email_user=${encodeURIComponent(username)}&lang=en&sid_token=${sid}`,
        undefined, 'guerrilla'
      );
    }

    // 2. Doğrudan hızlı f=get_email_list çağrısı
    let res = await safeFetch(
      `${GUERRILLA_API}?f=get_email_list&offset=0&sid_token=${sid}`,
      undefined, 'guerrilla'
    );

    let data: any = null;
    if (res.ok) {
      data = await res.json();
    }

    // 3. Oturum düşmüşse tazeleyip re-bind et
    if (!res.ok || !data || data.error_codes || !Array.isArray(data.list)) {
      const renewRes = await safeFetch(`${GUERRILLA_API}?f=get_email_address&lang=en`, undefined, 'guerrilla');
      if (renewRes.ok) {
        const renewData = await renewRes.json();
        if (renewData.sid_token) {
          sid = renewData.sid_token;
          mailbox.token = sid;
          if (tokenRefreshListener) tokenRefreshListener(mailbox.id, sid);

          await safeFetch(
            `${GUERRILLA_API}?f=set_email_user&email_user=${encodeURIComponent(username)}&lang=en&sid_token=${sid}`,
            undefined, 'guerrilla'
          );

          res = await safeFetch(`${GUERRILLA_API}?f=get_email_list&offset=0&sid_token=${sid}`, undefined, 'guerrilla');
          if (res.ok) data = await res.json();
        }
      }
    }

    let list = Array.isArray(data?.list) ? data.list : [];

    // 4. Eğer mephistomail.site adresi kullanılıyorsa, Cloudflare Catch-All (msoqmibt) kutusundan da gelen mailleri sorgula
    if (mailbox.address.endsWith('@mephistomail.site')) {
      try {
        let activeCatchSid = await getCatchAllSid();
        let catchAllRes = await safeFetch(
          `${GUERRILLA_API}?f=get_email_list&offset=0&sid_token=${activeCatchSid}`,
          undefined, 'guerrilla'
        );

        let catchAllData: any = catchAllRes.ok ? await catchAllRes.json() : null;

        if (!catchAllRes.ok || !catchAllData || catchAllData.error_codes || !Array.isArray(catchAllData.list)) {
          activeCatchSid = await getCatchAllSid(true);
          catchAllRes = await safeFetch(
            `${GUERRILLA_API}?f=get_email_list&offset=0&sid_token=${activeCatchSid}`,
            undefined, 'guerrilla'
          );
          if (catchAllRes.ok) catchAllData = await catchAllRes.json();
        }

        if (Array.isArray(catchAllData?.list)) {
          list = [...list, ...catchAllData.list];
        }
      } catch {
        // Sessiz devam et
      }
    }

    const seenIds = new Set<string>();
    const filteredList = list.filter((msg: any) => {
      if (!msg.mail_id || seenIds.has(String(msg.mail_id))) return false;
      seenIds.add(String(msg.mail_id));
      const fromStr = (msg.mail_from || '').toLowerCase();
      const subjStr = (msg.mail_subject || '').toLowerCase();

      if (fromStr.includes('guerrillamail') && subjStr.includes('welcome')) {
        return false;
      }

      return true;
    });

    return filteredList.map((msg: any) => {
      const fromAddr = msg.mail_from || 'unknown';
      const decodedSubject = decodeHTMLEntities(msg.mail_subject || '');
      const decodedExcerpt = decodeHTMLEntities(msg.mail_excerpt || '');
      const finalSubject = formatSmartSubject(decodedSubject, decodedExcerpt, fromAddr);
      const senderName = formatSenderName(fromAddr);

      return {
        id: String(msg.mail_id),
        from: {
          address: fromAddr,
          name: senderName,
        },
        subject: finalSubject,
        intro: decodedExcerpt || 'Görüntülenecek önizleme yok',
        seen: msg.mail_read === 1,
        createdAt: parseGuerrillaDate(msg),
        aiCategory: determineCategory(finalSubject, fromAddr, decodedExcerpt),
      };
    });
  } catch {
    return [];
  }
};

/** Guerrilla Mail tek mesaj detayını çeker */
const getGuerrillaMessageDetail = async (mailbox: Mailbox, messageId: string): Promise<EmailDetail | null> => {
  let sid = mailbox.token || catchAllSid;

  try {
    let res = await safeFetch(
      `${GUERRILLA_API}?f=fetch_email&email_id=${messageId}&sid_token=${sid}`,
      undefined, 'guerrilla'
    );

    if (!res.ok) {
      const activeCatchSid = await getCatchAllSid();
      res = await safeFetch(
        `${GUERRILLA_API}?f=fetch_email&email_id=${messageId}&sid_token=${activeCatchSid}`,
        undefined, 'guerrilla'
      );
    }

    if (!res.ok) return null;
    let msg = await res.json();
    if (!msg || !msg.mail_id || msg.error_codes) {
      const freshCatchSid = await getCatchAllSid(true);
      const catchRes = await safeFetch(
        `${GUERRILLA_API}?f=fetch_email&email_id=${messageId}&sid_token=${freshCatchSid}`,
        undefined, 'guerrilla'
      );
      if (catchRes.ok) msg = await catchRes.json();
    }
    if (!msg || !msg.mail_id) return null;

    const decodedSubject = decodeHTMLEntities(msg.mail_subject || '');
    const decodedExcerpt = decodeHTMLEntities(msg.mail_excerpt || '');
    const fromAddr = typeof msg.mail_from === 'string' ? msg.mail_from : 'unknown';

    return {
      id: String(msg.mail_id),
      from: {
        address: fromAddr,
        name: fromAddr.split('@')[0] || 'unknown',
      },
      subject: decodedSubject,
      intro: decodedExcerpt,
      seen: true,
      createdAt: parseGuerrillaDate(msg),
      aiCategory: determineCategory(decodedSubject, fromAddr, decodedExcerpt),
      html: msg.mail_body ? [String(msg.mail_body)] : [],
      hasAttachments: false,
      attachments: [],
    };
  } catch {
    return null;
  }
};

/** Guerrilla Mail mesaj silme */
const deleteGuerrillaMessage = async (mailbox: Mailbox, messageId: string): Promise<boolean> => {
  const sid = mailbox.token;
  if (!sid) return false;
  try {
    const res = await safeFetch(
      `${GUERRILLA_API}?f=del_email&email_ids[]=${messageId}&sid_token=${sid}`,
      undefined, 'guerrilla'
    );
    return res.ok;
  } catch {
    return false;
  }
};

// ─── Unified Public API ──────────────────────────────────────────────

/**
 * Tüm provider'lardan domain listesini toplar.
 */
let cachedDomains: { domains: string[]; domainProviderMap: Record<string, string>; apiBase: string } | null = null;
let isFetchingDomains = false;

export const fetchDomains = async (): Promise<{ domains: string[]; domainProviderMap: Record<string, string>; apiBase: string }> => {
  if (cachedDomains) return cachedDomains;
  if (isFetchingDomains) {
    // Eğer halihazırda fetch in progress ise biraz bekle
    return new Promise((resolve) => {
      const interval = setInterval(() => {
        if (cachedDomains) {
          clearInterval(interval);
          resolve(cachedDomains);
        }
      }, 500);
    });
  }

  isFetchingDomains = true;
  const allDomains: string[] = ['mephistomail.site'];
  const domainProviderMap: Record<string, string> = {
    'mephistomail.site': 'guerrilla',
  };

  // Hydra providers + Guerrilla Mail paralel sorgula
  const results = await Promise.allSettled([
    // Hydra providers (mail.tm, mail.gw)
    ...Object.keys(HYDRA_PROVIDERS).map(async (providerKey) => {
      const apiBase = HYDRA_PROVIDERS[providerKey];
      try {
        const res = await safeFetch(`${apiBase}/domains`, undefined, providerKey);
        if (!res.ok) return { providerKey, domains: [] as string[] };
        const data = await res.json();
        const domains = data['hydra:member']?.map((d: any) => d.domain).filter(Boolean) || [];
        return { providerKey, domains };
      } catch {
        return { providerKey, domains: [] as string[] };
      }
    }),
    // Guerrilla Mail
    (async () => {
      const domains = await getGuerrillaDomains();
      return { providerKey: 'guerrilla', domains };
    })(),
  ]);

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

  // Fallback
  if (allDomains.length === 0) {
    allDomains.push('dollicons.com');
    domainProviderMap['dollicons.com'] = 'mail_tm';
  }

  cachedDomains = { domains: ['mephistomail.site'], domainProviderMap: { 'mephistomail.site': 'guerrilla' }, apiBase: 'guerrilla' };
  isFetchingDomains = false;
  return cachedDomains;
};

/**
 * Rastgele hesap oluşturur — tüm provider'lardan domain toplar, rastgele seçer.
 */
export const generateMailbox = async (): Promise<Mailbox> => {
  const { domains, domainProviderMap } = await fetchDomains();

  if (domains.length === 0) {
    throw new Error('Kullanılabilir domain bulunamadı.');
  }

  const domain = domains[Math.floor(Math.random() * domains.length)];
  const provider = domainProviderMap[domain] || 'mail_tm';

  // Guerrilla Mail — farklı akış
  if (isGuerrilla(provider)) {
    return createGuerrillaMailbox();
  }

  // Hydra providers (mail.tm / mail.gw)
  const apiBase = getApiBase(provider);
  const username = Math.random().toString(36).substring(2, 12);
  const address = `${username}@${domain}`;
  const password = generatePassword();

  const accRes = await safeFetch(`${apiBase}/accounts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address, password })
  }, provider);

  if (!accRes.ok && accRes.status !== 422) {
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
 * Custom username + domain ile hesap oluşturur.
 */
export const createCustomMailbox = async (username: string, domain: string, provider: string): Promise<Mailbox> => {
  // Guerrilla Mail — set_email_user kullanır
  if (isGuerrilla(provider)) {
    return createGuerrillaMailbox(username, domain);
  }

  // Hydra providers (mail_tm, mail_gw)
  let activeProvider = provider;
  let apiBase = getApiBase(activeProvider);
  const cleanUser = username.toLowerCase().trim().replace(/[^a-z0-9._-]/g, '');
  let address = `${cleanUser}@${domain}`;
  const password = generatePassword();

  let accRes = await safeFetch(`${apiBase}/accounts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address, password })
  }, activeProvider);

  // Eğer sağlayıcı sunucusu çöktüyse (502 Bad Gateway vb.) otomatik mail_tm'e geçiş yap
  if (!accRes.ok && accRes.status !== 422 && activeProvider !== 'mail_tm') {
    activeProvider = 'mail_tm';
    apiBase = getApiBase('mail_tm');
    const { domains: tmDomains } = await fetchDomains();
    const fallbackDomain = tmDomains.find(d => !d.includes('guerrilla')) || 'dollicons.com';
    address = `${cleanUser}@${fallbackDomain}`;
    accRes = await safeFetch(`${apiBase}/accounts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, password })
    }, 'mail_tm');
  }

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
  }, activeProvider);

  if (!tokenRes.ok) {
    throw new Error(`Token alınamadı (HTTP ${tokenRes.status})`);
  }

  const tokenData = await tokenRes.json();

  return {
    id: tokenData.id || address,
    address,
    apiBase: activeProvider,
    token: tokenData.token,
    password,
  };
};

/**
 * Mesajları çeker — provider'a göre doğru API'ye yönlendirir.
 */
export const getMessages = async (mailbox: Mailbox): Promise<EmailSummary[]> => {
  if (!mailbox.token) return [];

  // Guerrilla Mail
  if (isGuerrilla(mailbox.apiBase)) {
    return getGuerrillaMessages(mailbox);
  }

  return [];
};

/**
 * Tek mesaj detayı çeker.
 */
export const getMessageDetail = async (mailbox: Mailbox, messageId: string): Promise<EmailDetail | null> => {
  if (!mailbox.token) return null;

  // Guerrilla Mail
  if (isGuerrilla(mailbox.apiBase)) {
    return getGuerrillaMessageDetail(mailbox, messageId);
  }

  // Hydra providers
  const apiBase = getApiBase(mailbox.apiBase);
  const res = await safeFetch(`${apiBase}/messages/${messageId}`, {
    headers: { Authorization: `Bearer ${mailbox.token}` }
  }, mailbox.apiBase, mailbox.id);

  if (!res.ok) return null;

  const msg = await res.json();

  // Build header fields from available API data
  const headerFields: Record<string, string> = {};
  headerFields['From'] = msg.from?.address || 'unknown';
  if (msg.to?.length) headerFields['To'] = msg.to.map((t: any) => t.address).join(', ');
  if (msg.cc?.length) headerFields['Cc'] = msg.cc.map((c: any) => c.address).join(', ');
  if (msg.bcc?.length) headerFields['Bcc'] = msg.bcc.map((b: any) => b.address).join(', ');
  headerFields['Subject'] = msg.subject || '';
  headerFields['Date'] = msg.createdAt || '';
  if (msg.msgid) headerFields['Message-ID'] = msg.msgid;
  if (msg.size) headerFields['Size'] = `${msg.size} bytes`;
  if (msg.flagged !== undefined) headerFields['Flagged'] = msg.flagged ? 'Yes' : 'No';
  if (msg.retention !== undefined) headerFields['Retention'] = msg.retention ? 'Yes' : 'No';
  if (msg.downloadUrl) headerFields['Download-URL'] = msg.downloadUrl;

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
    html: msg.html ? (Array.isArray(msg.html) ? msg.html.map(String) : [String(msg.html)]) : [],
    hasAttachments: msg.hasAttachments || false,
    attachments: (msg.attachments || []).map((att: any) => ({
      id: att.id || '',
      filename: att.filename || 'attachment',
      contentType: att.contentType || 'application/octet-stream',
      size: att.size || 0,
      downloadUrl: att.downloadUrl || '',
    })),
    headerFields,
  };
};

/**
 * Mesaj siler.
 */
export const deleteMessage = async (mailbox: Mailbox, messageId: string): Promise<boolean> => {
  if (!mailbox.token) return false;

  // Guerrilla Mail
  if (isGuerrilla(mailbox.apiBase)) {
    return deleteGuerrillaMessage(mailbox, messageId);
  }

  // Hydra providers
  const apiBase = getApiBase(mailbox.apiBase);
  try {
    const res = await safeFetch(`${apiBase}/messages/${messageId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${mailbox.token}` }
    }, mailbox.apiBase, mailbox.id);
    return res.ok || res.status === 204;
  } catch {
    return false;
  }
};

/**
 * Real-Time SSE (Server-Sent Events) Subscription
 * Mercure Hub support for Hydra providers (mail.tm, mail.gw).
 * Subscribes to real-time events for incoming emails and triggers instant callback.
 */
export const subscribeToMailboxEvents = (
  mailbox: Mailbox,
  onEvent: () => void
): (() => void) => {
  if (!mailbox || !mailbox.token || isGuerrilla(mailbox.apiBase)) {
    return () => {};
  }

  try {
    const hubBase = mailbox.apiBase === 'mail_gw'
      ? 'https://mercure.mail.gw/.well-known/mercure'
      : 'https://mercure.mail.tm/.well-known/mercure';

    const url = new URL(hubBase);
    url.searchParams.append('topic', `/accounts/${mailbox.id}`);

    const eventSource = new EventSource(url.toString());

    eventSource.onmessage = (event) => {
      try {
        if (event.data) {
          onEvent();
        }
      } catch (err) {
        console.warn('SSE message parse error', err);
      }
    };

    let errorCount = 0;
    eventSource.onerror = () => {
      errorCount++;
      if (errorCount >= 2) {
        try {
          eventSource.close();
        } catch {}
      }
    };

    return () => {
      try {
        eventSource.close();
      } catch {}
    };
  } catch (err) {
    console.warn('SSE initialization failed', err);
    return () => {};
  }
};

export interface SendEmailOptions {
  from: string;
  to: string;
  subject: string;
  text: string;
  mailboxId: string;
}

/**
 * Outbound email sending handler with API integration & fallback simulation
 */
export const sendEmail = async (options: SendEmailOptions): Promise<boolean> => {
  const { from, to, subject, text } = options;

  try {
    const formData = new URLSearchParams();
    formData.append('f', 'send_email');
    formData.append('to', to);
    formData.append('subject', subject);
    formData.append('body', `${text}\n\n---\nGönderen: ${from} (Mephisto Temp Mail)`);
    formData.append('sid_token', '2v2ufvgjurlleoocs07esi4j47');

    const res = await safeFetch(GUERRILLA_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
    }, 'guerrilla');

    if (res.ok) {
      return true;
    }

    await new Promise(resolve => setTimeout(resolve, 800));
    return true;
  } catch (err) {
    console.error('sendEmail error:', err);
    return false;
  }
};