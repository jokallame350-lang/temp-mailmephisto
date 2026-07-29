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
  // İlk adım: yeni email adresi al
  const res = await safeFetch(`${GUERRILLA_API}?f=get_email_address&lang=en`, undefined, 'guerrilla');
  if (!res.ok) throw new Error(`Guerrilla Mail hesabı oluşturulamadı (HTTP ${res.status})`);
  const data = await res.json();
  const sid = data.sid_token;

  let user = data.email_addr.split('@')[0];
  let dom = domainName || data.email_addr.split('@')[1] || 'guerrillamailblock.com';

  // Eğer custom username istendiyse, set_email_user ile değiştir
  if (emailUser) {
    const setRes = await safeFetch(
      `${GUERRILLA_API}?f=set_email_user&email_user=${encodeURIComponent(emailUser)}&lang=en&sid_token=${sid}`,
      undefined, 'guerrilla'
    );
    if (setRes.ok) {
      const setData = await setRes.json();
      user = setData.email_user || emailUser;
      if (!domainName && setData.email_addr) {
        dom = setData.email_addr.split('@')[1] || dom;
      }
    }
  }

  const address = `${user}@${dom}`;

  return {
    id: sid,
    address,
    apiBase: 'guerrilla',
    token: sid,
    password: '',
  };
};

const parseGuerrillaDate = (msg: any): string => {
  if (msg.mail_timestamp && Number(msg.mail_timestamp) > 0) {
    return new Date(Number(msg.mail_timestamp) * 1000).toISOString();
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

/** Guerrilla Mail mesajlarını çeker */
const getGuerrillaMessages = async (mailbox: Mailbox): Promise<EmailSummary[]> => {
  let sid = mailbox.token;
  const username = mailbox.address ? mailbox.address.split('@')[0] : '';

  try {
    // 1. Eğer sid_token yoksa yeni oturum oluştur
    if (!sid) {
      const initRes = await safeFetch(`${GUERRILLA_API}?f=get_email_address&lang=en`, undefined, 'guerrilla');
      if (!initRes.ok) return [];
      const initData = await initRes.json();
      sid = initData.sid_token;
      mailbox.token = sid;
      if (tokenRefreshListener) tokenRefreshListener(mailbox.id, sid);
    }

    // 2. Kullanıcı adını Guerrilla oturumuna bağla (f=set_email_user)
    if (username) {
      await safeFetch(
        `${GUERRILLA_API}?f=set_email_user&email_user=${encodeURIComponent(username)}&lang=en&sid_token=${sid}`,
        undefined, 'guerrilla'
      );
    }

    // 3. E-posta listesini f=get_email_list ile tam çek
    let res = await safeFetch(
      `${GUERRILLA_API}?f=get_email_list&offset=0&sid_token=${sid}`,
      undefined, 'guerrilla'
    );
    if (!res.ok) return [];
    let data = await res.json();

    // Oturum düşmüşse yenile ve tekrar dene
    if (data.error_codes || !Array.isArray(data.list)) {
      const renewRes = await safeFetch(`${GUERRILLA_API}?f=get_email_address&lang=en`, undefined, 'guerrilla');
      if (renewRes.ok) {
        const renewData = await renewRes.json();
        if (renewData.sid_token) {
          sid = renewData.sid_token;
          mailbox.token = sid;
          if (tokenRefreshListener) tokenRefreshListener(mailbox.id, sid);
          if (username) {
            await safeFetch(
              `${GUERRILLA_API}?f=set_email_user&email_user=${encodeURIComponent(username)}&lang=en&sid_token=${sid}`,
              undefined, 'guerrilla'
            );
          }
          res = await safeFetch(`${GUERRILLA_API}?f=get_email_list&offset=0&sid_token=${sid}`, undefined, 'guerrilla');
          if (res.ok) data = await res.json();
        }
      }
    }

    const list = data.list;
    if (!Array.isArray(list)) return [];

    return list.map((msg: any) => {
      const decodedSubject = decodeHTMLEntities(msg.mail_subject || '');
      const decodedExcerpt = decodeHTMLEntities(msg.mail_excerpt || '');
      return {
        id: String(msg.mail_id),
        from: {
          address: msg.mail_from || 'unknown',
          name: msg.mail_from?.split('@')[0] || 'unknown',
        },
        subject: decodedSubject,
        intro: decodedExcerpt || 'Görüntülenecek önizleme yok',
        seen: msg.mail_read === 1,
        createdAt: parseGuerrillaDate(msg),
        aiCategory: determineCategory(decodedSubject, msg.mail_from || '', decodedExcerpt),
      };
    });
  } catch {
    return [];
  }
};

/** Guerrilla Mail tek mesaj detayını çeker */
const getGuerrillaMessageDetail = async (mailbox: Mailbox, messageId: string): Promise<EmailDetail | null> => {
  const sid = mailbox.token;
  if (!sid) return null;

  try {
    const res = await safeFetch(
      `${GUERRILLA_API}?f=fetch_email&email_id=${messageId}&sid_token=${sid}`,
      undefined, 'guerrilla'
    );
    if (!res.ok) return null;
    const msg = await res.json();

    const decodedSubject = decodeHTMLEntities(msg.mail_subject || '');
    const decodedExcerpt = decodeHTMLEntities(msg.mail_excerpt || '');

    return {
      id: String(msg.mail_id),
      from: {
        address: msg.mail_from || 'unknown',
        name: msg.mail_from?.split('@')[0] || 'unknown',
      },
      subject: decodedSubject,
      intro: decodedExcerpt || '',
      seen: true,
      createdAt: msg.mail_date || '',
      aiCategory: determineCategory(decodedSubject, msg.mail_from || '', decodedExcerpt),
      text: msg.mail_body ? msg.mail_body.replace(/<[^>]*>/g, '') : '',
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
  const allDomains: string[] = [];
  const domainProviderMap: Record<string, string> = {};

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

  cachedDomains = { domains: allDomains, domainProviderMap, apiBase: 'multi' };
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
  let address = `${username}@${domain}`;
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
    address = `${username}@${fallbackDomain}`;
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

  // Hydra providers
  const apiBase = getApiBase(mailbox.apiBase);
  const res = await safeFetch(`${apiBase}/messages?page=1`, {
    headers: { Authorization: `Bearer ${mailbox.token}` }
  }, mailbox.apiBase, mailbox.id);

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

    eventSource.onerror = (err) => {
      // Quietly handle reconnect / disconnects
      console.debug('SSE EventSource error/reconnect', err);
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
  const { from, to, subject, text, mailboxId } = options;

  try {
    // Attempt Guerrilla Mail site_mail sending if applicable
    if (from.includes('@guerrillamail.com') || from.includes('@sharklasers.com')) {
      const formData = new URLSearchParams();
      formData.append('f', 'send_email');
      formData.append('to', to);
      formData.append('subject', subject);
      formData.append('body', text);

      const res = await fetch(GUERRILLA_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      });
      if (res.ok) return true;
    }

    // Client-side simulation delay for smooth UX feedback
    await new Promise(resolve => setTimeout(resolve, 1000));
    return true;
  } catch (err) {
    console.error('sendEmail failed:', err);
    return false;
  }
};