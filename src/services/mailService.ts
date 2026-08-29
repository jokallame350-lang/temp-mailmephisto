import { Mailbox, EmailSummary, EmailDetail, AICategory, EmailAttachment } from '../types';

const HYDRA_PROVIDERS: Record<string, string> = {
  mail_tm: 'https://api.mail.tm',
};

const WORKER_API = 'https://quiet-poetry-1d74.msoqmibt.workers.dev';
const GUERRILLA_API = 'https://api.guerrillamail.com/ajax.php';

// Credentials are kept only in memory and are removed when a mailbox is deleted.
const credentialStore = new Map<
  string,
  { address: string; password: string }
>();

export const storeCredentials = (
  mailboxId: string,
  address: string,
  password: string
) => {
  if (!mailboxId || !address || !password) return;
  credentialStore.set(mailboxId, { address, password });
};

export const clearCredentials = (mailboxId: string) => {
  if (mailboxId) credentialStore.delete(mailboxId);
};

type TokenRefreshCallback = (mailboxId: string, newToken: string) => void;

const tokenRefreshListeners = new Set<TokenRefreshCallback>();

export const onTokenRefresh = (cb: TokenRefreshCallback) => {
  tokenRefreshListeners.add(cb);

  return () => {
    tokenRefreshListeners.delete(cb);
  };
};

export const subscribeToMailboxEvents = (
  _mailbox: Mailbox,
  callback: () => void
) => {
  if (typeof window === 'undefined') return () => {};

  const handler = () => {
    if (document.visibilityState !== 'hidden') {
      callback();
    }
  };

  window.addEventListener('focus', handler);
  window.addEventListener('online', handler);

  return () => {
    window.removeEventListener('focus', handler);
    window.removeEventListener('online', handler);
  };
};

const emitTokenRefresh = (mailboxId: string, token: string) => {
  for (const cb of tokenRefreshListeners) {
    try {
      cb(mailboxId, token);
    } catch (err) {
      console.warn('Token refresh listener failed', err);
    }
  }
};

const getApiBase = (provider: string): string => {
  return HYDRA_PROVIDERS[provider] || HYDRA_PROVIDERS.mail_tm;
};

const refreshHydraToken = async (
  provider: string,
  address: string,
  password: string
): Promise<string | null> => {
  try {
    const apiBase = getApiBase(provider);

    const res = await fetch(`${apiBase}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        address,
        password,
      }),
    });

    if (!res.ok) return null;

    const data = await res.json();

    return typeof data?.token === 'string' && data.token
      ? data.token
      : null;
  } catch {
    return null;
  }
};

const rateLimitState: Record<
  string,
  {
    hit: boolean;
    resetTime: number;
  }
> = {};

export const isRateLimited = (provider = 'mail_tm'): boolean => {
  const state = rateLimitState[provider];

  if (!state?.hit) return false;

  if (Date.now() >= state.resetTime) {
    state.hit = false;
    return false;
  }

  return true;
};

export const getRateLimitRemainingMs = (
  provider = 'mail_tm'
): number => {
  return Math.max(
    0,
    (rateLimitState[provider]?.resetTime || 0) - Date.now()
  );
};

export const clearRateLimit = (provider?: string) => {
  if (provider) {
    delete rateLimitState[provider];
  } else {
    for (const key of Object.keys(rateLimitState)) {
      delete rateLimitState[key];
    }
  }
};

export const safeFetch = async (
  url: string,
  options?: RequestInit,
  provider = 'mail_tm',
  mailboxId?: string,
  retried = false
): Promise<Response> => {
  if (isRateLimited(provider)) {
    const waitSec = Math.max(1, Math.ceil(getRateLimitRemainingMs(provider) / 1000));
    throw new Error(
      `Rate limited. Retry after ${waitSec}s`
    );
  }

  const controller = new AbortController();
  const timeoutMs = 8000;
  const timeoutId = setTimeout(() => {
    controller.abort(new Error('Request timeout'));
  }, timeoutMs);

  let unhookSignal: (() => void) | undefined;
  if (options?.signal) {
    if (options.signal.aborted) {
      clearTimeout(timeoutId);
      controller.abort(options.signal.reason);
    } else {
      const onAbort = () => {
        clearTimeout(timeoutId);
        controller.abort(options.signal?.reason);
      };
      options.signal.addEventListener('abort', onAbort, { once: true });
      unhookSignal = () => options.signal?.removeEventListener('abort', onAbort);
    }
  }

  let res: Response;

  try {
    res = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } catch (err: any) {
    if (controller.signal.aborted && !options?.signal?.aborted) {
      throw new Error(`Request timeout (${url})`);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
    unhookSignal?.();
  }

  if (
    res.status === 401 &&
    !retried &&
    mailboxId &&
    !isGuerrilla(provider)
  ) {
    const creds = credentialStore.get(mailboxId);

    if (creds) {
      const newToken = await refreshHydraToken(
        provider,
        creds.address,
        creds.password
      );

      if (newToken) {
        emitTokenRefresh(mailboxId, newToken);

        return safeFetch(
          url,
          {
            ...options,
            headers: {
              ...(options?.headers || {}),
              Authorization: `Bearer ${newToken}`,
            },
          },
          provider,
          mailboxId,
          true
        );
      }
    }
  }

  if (res.status === 429) {
    if (!rateLimitState[provider]) {
      rateLimitState[provider] = {
        hit: false,
        resetTime: 0,
      };
    }

    const retryHeader = res.headers.get('Retry-After');
    let waitMs = 60000;

    if (retryHeader) {
      const retryAfter = Number.parseInt(retryHeader, 10);
      if (Number.isFinite(retryAfter) && retryAfter >= 0) {
        waitMs = Math.min(retryAfter * 1000, 300000);
      } else {
        const parsedDate = new Date(retryHeader).getTime();
        if (!isNaN(parsedDate) && parsedDate > Date.now()) {
          waitMs = Math.min(parsedDate - Date.now(), 300000);
        }
      }
    }

    rateLimitState[provider] = {
      hit: true,
      resetTime: Date.now() + waitMs,
    };

    throw new Error(
      `Rate limit exceeded. Please wait ${Math.ceil(
        waitMs / 1000
      )} seconds.`
    );
  }

  return res;
};

const randomInt = (max: number): number => {
  if (!Number.isInteger(max) || max <= 0) return 0;

  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.getRandomValues === 'function'
  ) {
    const maxUint = 0x100000000;
    const limit = Math.floor(maxUint / max) * max;
    const buf = new Uint32Array(1);

    do {
      crypto.getRandomValues(buf);
    } while (buf[0] >= limit);

    return buf[0] % max;
  }

  return Date.now() % max;
};

const generatePassword = (): string => {
  if (
    typeof crypto === 'undefined' ||
    typeof crypto.getRandomValues !== 'function'
  ) {
    throw new Error('Secure random generator unavailable');
  }

  const alphabet =
    'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*_-';

  const bytes = new Uint8Array(24);

  crypto.getRandomValues(bytes);

  let out = '';

  for (const b of bytes) {
    out += alphabet[b % alphabet.length];
  }

  return out;
};

export const normalizeSearchText = (text?: string): string => {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c');
};

export const determineCategory = (
  subject: string,
  from: string,
  intro: string
): AICategory => {
  const raw = `${subject || ''} ${from || ''} ${intro || ''}`;
  const text = normalizeSearchText(raw);

  if (
    /(code|verify|verification|otp|confirm|activation|activate|pin\b|passcode|dogrulama|kod|sifre|aktivasyon|etkinlestir|onay)/i.test(
      text
    )
  ) {
    return 'Verification';
  }

  if (
    /(security|alert|reset password|suspicious|login attempt|unauthorized|2fa|guvenlik|giris|uyari|sifirlama)/i.test(
      text
    )
  ) {
    return 'Security';
  }

  if (
    /(newsletter|bulten|weekly|digest|firsat|indirim|offer|sale|kampanya|promo|discount)/i.test(
      text
    )
  ) {
    return 'Newsletter';
  }

  return 'Other';
};

export const formatSenderName = (fromAddress: string): string => {
  if (!fromAddress || fromAddress === 'unknown') {
    return 'Bilinmeyen Gönderen';
  }

  const lower = fromAddress.toLowerCase();

  const brands: Record<string, string> = {
    instagram: 'Instagram',
    cloudflare: 'Cloudflare',
    google: 'Google',
    netflix: 'Netflix',
    facebook: 'Facebook',
    twitter: 'X (Twitter)',
    'x.com': 'X (Twitter)',
    github: 'GitHub',
    spotify: 'Spotify',
    discord: 'Discord',
    telegram: 'Telegram',
    steam: 'Steam',
    epicgames: 'Epic Games',
    microsoft: 'Microsoft',
    apple: 'Apple',
  };

  for (const [key, value] of Object.entries(brands)) {
    if (lower.includes(key)) {
      return value;
    }
  }

  const [userPart = '', domainPart = ''] =
    fromAddress.split('@');

  if (
    /^(no-reply|noreply|info|support|admin|service|notifications?|mailer-daemon)$/i.test(
      userPart
    ) &&
    domainPart
  ) {
    const clean = domainPart.split('.')[0];

    return (
      clean.charAt(0).toUpperCase() +
      clean.slice(1)
    );
  }

  return (
    userPart.charAt(0).toUpperCase() +
    userPart.slice(1)
  );
};

export const formatSmartSubject = (
  subject: string,
  excerpt: string,
  fromAddress: string
): string => {
  const clean = (subject || '').trim();

  if (
    clean &&
    clean !== '(Konu Yok)' &&
    clean !== 'Konu Yok' &&
    clean !== '(No Subject)' &&
    clean !== 'No Subject'
  ) {
    return clean;
  }

  const combined = normalizeSearchText(`${excerpt || ''} ${fromAddress || ''}`);

  if (combined.includes('instagram')) {
    return 'Instagram Doğrulama Kodu';
  }

  if (combined.includes('cloudflare')) {
    return 'Cloudflare E-posta Yönlendirme Onayı';
  }

  if (/code|kod|verify|confirm|dogrulama|onay|otp|passcode/.test(combined)) {
    return 'E-posta Doğrulama Kodu';
  }

  if (/security|alert|guvenlik|uyari|sifirlama/.test(combined)) {
    return 'Güvenlik Bildirimi';
  }

  return excerpt?.trim()
    ? excerpt.trim().slice(0, 45) +
        (excerpt.length > 45 ? '...' : '')
    : 'Gelen Mesaj';
};

export const isGuerrilla = (provider: string): boolean => {
  return provider === 'guerrilla';
};

export const GUERRILLA_DOMAINS = [
  'guerrillamail.com',
  'grr.la',
  'sharklasers.com',
  'guerrillamail.info',
  'guerrillamailblock.com',
  'guerrillamail.net',
  'guerrillamail.biz',
  'guerrillamail.de',
  'pokemail.net',
  'spam4.me',
];

export const getGuerrillaDomains = async (): Promise<string[]> => {
  const domains = new Set<string>();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, 3500);

  try {
    const res = await fetch(
      `${GUERRILLA_API}?f=get_email_address&lang=en`,
      {
        signal: controller.signal,
      }
    );

    if (res?.ok) {
      const data = await res.json().catch(() => null);

      const domain = String(
        data?.email_addr || ''
      ).split('@')[1];

      if (domain) {
        domains.add(domain);
      }
    }
  } catch {
    // Offline or timeout fallback
  } finally {
    clearTimeout(timeoutId);
  }

  GUERRILLA_DOMAINS.forEach((domain) => {
    domains.add(domain);
  });

  return [...domains];
};

const createGuerrillaMailbox = async (
  emailUser?: string,
  domainName?: string
): Promise<Mailbox> => {
  const res = await safeFetch(
    `${GUERRILLA_API}?f=get_email_address&lang=en`,
    undefined,
    'guerrilla'
  );

  if (!res.ok) {
    throw new Error(
      `Guerrilla Mail hesabı oluşturulamadı (HTTP ${res.status})`
    );
  }

  const data = await res.json().catch(() => null);

  const sid =
    typeof data?.sid_token === 'string'
      ? data.sid_token
      : '';

  if (!sid || typeof data?.email_addr !== 'string') {
    throw new Error(
      'Geçersiz Guerrilla Mail oturumu'
    );
  }

  let user = data.email_addr.split('@')[0];

  const dom =
    domainName ||
    data.email_addr.split('@')[1] ||
    GUERRILLA_DOMAINS[0];

  if (emailUser) {
    const setRes = await safeFetch(
      `${GUERRILLA_API}?f=set_email_user&email_user=${encodeURIComponent(
        emailUser
      )}&lang=en&sid_token=${encodeURIComponent(sid)}`,
      undefined,
      'guerrilla'
    );

    if (!setRes.ok) {
      throw new Error(
        `Özel e-posta adresi ayarlanamadı (HTTP ${setRes.status})`
      );
    }

    const setData = await setRes.json().catch(() => null);
    const userFromAddr = typeof setData?.email_addr === 'string' ? setData.email_addr.split('@')[0] : '';
    const userFromUser = typeof setData?.email_user === 'string' ? setData.email_user : '';
    const resolvedUser = userFromUser || userFromAddr || emailUser;

    const hasError =
      !setData ||
      !resolvedUser ||
      (Array.isArray(setData.error_codes) && setData.error_codes.length > 0) ||
      (Array.isArray(setData.auth?.error_codes) && setData.auth.error_codes.length > 0) ||
      Boolean(setData.error) ||
      Boolean(setData.alias_error);

    if (hasError) {
      throw new Error(
        'İstenen özel kullanıcı adı upstream servis tarafından kabul edilmedi.'
      );
    }

    user = resolvedUser;
  }

  return {
    id: sid,
    address: `${user}@${dom}`,
    apiBase: 'guerrilla',
    token: sid,
    password: '',
    createdAt: Date.now(),
  };
};

const parseGuerrillaDate = (msg: any): string => {
  const ts = Number(msg?.mail_timestamp);

  if (ts > 0) {
    const d = new Date(ts * 1000);

    if (!isNaN(d.getTime())) {
      return d.toISOString();
    }
  }

  const d = new Date(msg?.mail_date || '');

  return !isNaN(d.getTime())
    ? d.toISOString()
    : new Date().toISOString();
};

export class MailboxFetchError extends Error {
  public readonly code: 'NETWORK_ERROR' | 'SESSION_EXPIRED' | 'RATE_LIMITED' | 'REHYDRATION_FAILED' | 'INVALID_RESPONSE' | 'UNKNOWN';
  public readonly mailboxId?: string;

  constructor(
    message: string,
    code: 'NETWORK_ERROR' | 'SESSION_EXPIRED' | 'RATE_LIMITED' | 'REHYDRATION_FAILED' | 'INVALID_RESPONSE' | 'UNKNOWN' = 'UNKNOWN',
    mailboxId?: string
  ) {
    super(message);
    this.name = 'MailboxFetchError';
    this.code = code;
    this.mailboxId = mailboxId;
  }
}

export const decodeHTMLEntities = (text: string): string => {
  if (!text) return '';

  if (typeof DOMParser !== 'undefined') {
    try {
      return (
        new DOMParser()
          .parseFromString(text, 'text/html')
          .documentElement.textContent || text
      );
    } catch {}
  }

  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ');
};

export const rehydrateMailboxSession = async (
  mailbox: Mailbox
): Promise<string> => {
  if (mailbox.token) {
    return mailbox.token;
  }

  if (isGuerrilla(mailbox.apiBase)) {
    const username = mailbox.address?.split('@')[0]?.trim();
    if (!username) {
      throw new MailboxFetchError('Mailbox address is missing username', 'INVALID_RESPONSE', mailbox.id);
    }

    try {
      const r = await safeFetch(
        `${GUERRILLA_API}?f=get_email_address&lang=en`,
        undefined,
        'guerrilla',
        mailbox.id
      );
      if (!r.ok) {
        throw new MailboxFetchError(`Guerrilla session initialization failed (HTTP ${r.status})`, 'NETWORK_ERROR', mailbox.id);
      }
      const d = await r.json().catch(() => null);
      const sid = d?.sid_token;
      if (!sid || typeof sid !== 'string') {
        throw new MailboxFetchError('Guerrilla API did not return a valid sid_token', 'REHYDRATION_FAILED', mailbox.id);
      }

      const setRes = await safeFetch(
        `${GUERRILLA_API}?f=set_email_user&email_user=${encodeURIComponent(
          username
        )}&lang=en&sid_token=${encodeURIComponent(sid)}`,
        undefined,
        'guerrilla',
        mailbox.id
      );

      if (!setRes.ok) {
        throw new MailboxFetchError(`Guerrilla username binding failed (HTTP ${setRes.status})`, 'NETWORK_ERROR', mailbox.id);
      }
      const setData = await setRes.json().catch(() => null);
      const hasError =
        !setData ||
        (Array.isArray(setData.error_codes) && setData.error_codes.length > 0) ||
        (Array.isArray(setData.auth?.error_codes) && setData.auth.error_codes.length > 0) ||
        Boolean(setData.error) ||
        Boolean(setData.alias_error);

      if (hasError) {
        throw new MailboxFetchError('Guerrilla rejected username binding', 'REHYDRATION_FAILED', mailbox.id);
      }

      mailbox.token = sid;
      emitTokenRefresh(mailbox.id, sid);
      return sid;
    } catch (err: unknown) {
      if (err instanceof MailboxFetchError) throw err;
      throw new MailboxFetchError(
        err instanceof Error ? err.message : 'Unknown rehydration failure',
        'NETWORK_ERROR',
        mailbox.id
      );
    }
  }

  // Hydra / Mail.tm provider credentials
  const creds = credentialStore.get(mailbox.id);
  if (creds?.password && mailbox.address) {
    try {
      const apiBase = getApiBase(mailbox.apiBase);
      const res = await safeFetch(
        `${apiBase}/token`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            address: mailbox.address,
            password: creds.password,
          }),
        },
        mailbox.apiBase,
        mailbox.id
      );
      if (res.ok) {
        const data = await res.json().catch(() => null);
        if (data?.token && typeof data.token === 'string') {
          mailbox.token = data.token;
          emitTokenRefresh(mailbox.id, data.token);
          return data.token;
        }
      }
      throw new MailboxFetchError('Hydra token refresh failed', 'SESSION_EXPIRED', mailbox.id);
    } catch (err: unknown) {
      if (err instanceof MailboxFetchError) throw err;
      throw new MailboxFetchError(
        err instanceof Error ? err.message : 'Hydra rehydration failed',
        'NETWORK_ERROR',
        mailbox.id
      );
    }
  }

  throw new MailboxFetchError('Mailbox credentials missing for rehydration', 'SESSION_EXPIRED', mailbox.id);
};

const getGuerrillaMessages = async (
  mailbox: Mailbox
): Promise<EmailSummary[]> => {
  let sid = mailbox.token;

  const username =
    mailbox.address?.split('@')[0] || '';

  if (!username) {
    throw new MailboxFetchError('Mailbox username is missing', 'INVALID_RESPONSE', mailbox.id);
  }

  if (!sid) {
    sid = await rehydrateMailboxSession(mailbox);
  }

  let res = await safeFetch(
    `${GUERRILLA_API}?f=get_email_list&offset=0&sid_token=${encodeURIComponent(
      sid
    )}`,
    undefined,
    'guerrilla',
    mailbox.id
  );

  let data: any = res.ok
    ? await res.json().catch(() => null)
    : null;

  if (
    !res.ok ||
    !data ||
    data.error_codes ||
    !Array.isArray(data.list)
  ) {
    // Attempt token rehydration and retry once
    mailbox.token = undefined;
    sid = await rehydrateMailboxSession(mailbox);

    res = await safeFetch(
      `${GUERRILLA_API}?f=get_email_list&offset=0&sid_token=${encodeURIComponent(
        sid
      )}`,
      undefined,
      'guerrilla',
      mailbox.id
    );

    data = res.ok
      ? await res.json().catch(() => null)
      : null;
  }

  if (!data || !Array.isArray(data.list)) {
    throw new MailboxFetchError(
      'Guerrilla API returned an invalid message list format',
      'INVALID_RESPONSE',
      mailbox.id
    );
  }

  const seen = new Set<string>();

  const list = data.list.filter((msg: any) => {
    const id = String(msg?.mail_id || '');

    if (!id || seen.has(id)) {
      return false;
    }

    seen.add(id);

    return !(
      String(msg?.mail_from || '')
        .toLowerCase()
        .includes('guerrillamail') &&
      String(msg?.mail_subject || '')
        .toLowerCase()
        .includes('welcome')
    );
  });

  return list.map((msg: any) => {
    const fromAddr = String(
      msg.mail_from || 'unknown'
    );

    const subject = formatSmartSubject(
      decodeHTMLEntities(
        String(msg.mail_subject || '')
      ),
      decodeHTMLEntities(
        String(msg.mail_excerpt || '')
      ),
      fromAddr
    );

    const intro = decodeHTMLEntities(
      String(msg.mail_excerpt || '')
    );

    return {
      id: String(msg.mail_id),
      from: {
        address: fromAddr,
        name: formatSenderName(fromAddr),
      },
      subject,
      intro:
        intro || 'Görüntülenecek önizleme yok',
      seen: msg.mail_read === '1' || msg.mail_read === 1 || Boolean(msg.seen),
      createdAt: parseGuerrillaDate(msg),
      aiCategory: determineCategory(
        subject,
        fromAddr,
        intro
      ),
    };
  });
};

const getGuerrillaMessageDetail = async (
  mailbox: Mailbox,
  messageId: string,
  retried = false
): Promise<EmailDetail | null> => {
  if (!messageId) return null;
  let sid = mailbox.token;

  if (!sid) {
    sid = await rehydrateMailboxSession(mailbox);
  }

  try {
    let res = await safeFetch(
      `${GUERRILLA_API}?f=fetch_email&email_id=${encodeURIComponent(
        messageId
      )}&sid_token=${encodeURIComponent(sid)}`,
      undefined,
      'guerrilla',
      mailbox.id
    );

    let msg = res.ok ? await res.json().catch(() => null) : null;

    if ((!res.ok || !msg?.mail_id || msg.error_codes) && !retried) {
      mailbox.token = undefined;
      sid = await rehydrateMailboxSession(mailbox);

      res = await safeFetch(
        `${GUERRILLA_API}?f=fetch_email&email_id=${encodeURIComponent(
          messageId
        )}&sid_token=${encodeURIComponent(sid)}`,
        undefined,
        'guerrilla',
        mailbox.id
      );

      msg = res.ok ? await res.json().catch(() => null) : null;
    }

    if (!msg?.mail_id && (!msg?.mail_body && !msg?.mail_excerpt)) {
      throw new MailboxFetchError('Failed to fetch message detail from upstream', 'INVALID_RESPONSE', mailbox.id);
    }

    const subject = decodeHTMLEntities(
      String(msg.mail_subject || '')
    );

    const intro = decodeHTMLEntities(
      String(msg.mail_excerpt || '')
    );

    const fromAddr =
      typeof msg.mail_from === 'string'
        ? msg.mail_from
        : 'unknown';

    const createdAt = parseGuerrillaDate(msg);

    const headerFields: Record<string, string> = {
      From: fromAddr,
      Subject: subject,
      Date: createdAt,
    };

    if (msg.mail_recipient || mailbox.address) {
      headerFields.To = msg.mail_recipient || mailbox.address;
    }

    if (msg.mail_id) {
      headerFields['Message-ID'] = String(msg.mail_id);
    }

    if (msg.reply_to) {
      headerFields['Reply-To'] = msg.reply_to;
    }

    if (msg.content_type) {
      headerFields['Content-Type'] = msg.content_type;
    }

    const attachments: EmailAttachment[] = Array.isArray(msg.attachments)
      ? msg.attachments.map((a: any) => ({
          id: String(a.id || a.mail_id || ''),
          filename: a.filename || a.name || 'attachment',
          size: a.size || 0,
          contentType: a.contentType || a.type || 'application/octet-stream',
        }))
      : [];

    return {
      id: String(msg.mail_id),
      from: {
        address: fromAddr,
        name:
          formatSenderName(fromAddr),
      },
      subject,
      intro,
      seen: true,
      createdAt,
      aiCategory: determineCategory(
        subject,
        fromAddr,
        intro
      ),
      html: msg.mail_body
        ? [String(msg.mail_body)]
        : [],
      text: msg.mail_body_plain || undefined,
      hasAttachments: Boolean((msg.att && Number(msg.att) > 0) || attachments.length > 0),
      attachments,
      headerFields,
    };
  } catch {
    return null;
  }
};

const deleteGuerrillaMessage = async (
  mailbox: Mailbox,
  messageId: string
): Promise<boolean> => {
  const sid = mailbox.token;

  if (!sid || !messageId) return false;

  try {
    const res = await safeFetch(
      `${GUERRILLA_API}?f=del_email&email_ids[]=${encodeURIComponent(
        messageId
      )}&sid_token=${encodeURIComponent(sid)}`,
      undefined,
      'guerrilla'
    );

    return res.ok;
  } catch {
    return false;
  }
};

let cachedDomains: {
  domains: string[];
  domainProviderMap: Record<string, string>;
  apiBase: string;
} | null = null;

let isFetchingDomains = false;

export const clearDomainCache = () => {
  cachedDomains = null;
  isFetchingDomains = false;
};

export const fetchDomains = async () => {
  if (cachedDomains?.domains?.length) {
    return cachedDomains;
  }

  if (isFetchingDomains) {
    return new Promise<any>((resolve) => {
      const started = Date.now();

      const i = setInterval(() => {
        if (
          cachedDomains ||
          Date.now() - started > 5000
        ) {
          clearInterval(i);

          resolve(
            cachedDomains || {
              domains: GUERRILLA_DOMAINS,
              domainProviderMap:
                Object.fromEntries(
                  GUERRILLA_DOMAINS.map(
                    (d) => [d, 'guerrilla']
                  )
                ),
              apiBase: 'guerrilla',
            }
          );
        }
      }, 100);
    });
  }

  isFetchingDomains = true;

  try {
    const domains = await getGuerrillaDomains();

    const map: Record<string, string> = {};

    domains.forEach((d) => {
      map[d] = 'guerrilla';
    });

    cachedDomains = {
      domains,
      domainProviderMap: map,
      apiBase: 'guerrilla',
    };

    return cachedDomains;
  } finally {
    isFetchingDomains = false;
  }
};

export const generateMailbox =
  async (): Promise<Mailbox> => {
    const {
      domains,
      domainProviderMap,
    } = await fetchDomains();

    const list = (domains || []).filter(
      (d) => d !== 'mephistomail.site'
    );

    const domainList =
      list.length ? list : GUERRILLA_DOMAINS;

    const domain =
      domainList[randomInt(domainList.length)] || GUERRILLA_DOMAINS[0];

    const provider =
      (domainProviderMap && domainProviderMap[domain]) || 'guerrilla';

    const prefixes = [
      'matrix',
      'vector',
      'nexus',
      'shadow',
      'cyber',
      'phantom',
      'ninja',
      'alpha',
      'delta',
      'vortex',
      'hyper',
      'pulse',
      'signal',
      'crypto',
    ];

    const prefix =
      prefixes[randomInt(prefixes.length)];

    const suffix = randomInt(900) + 100;

    const randomUser = `${prefix}.${Date.now()
      .toString(36)
      .slice(-5)}${suffix}`;

    if (isGuerrilla(provider)) {
      return createGuerrillaMailbox(
        randomUser,
        domain
      );
    }

    const cleanUser = randomUser
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9._-]/g, '');

    const address = `${cleanUser}@${domain}`;

    const password = generatePassword();

    const apiBase = getApiBase(provider);

    const accRes = await safeFetch(
      `${apiBase}/accounts`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address,
          password,
        }),
      },
      provider
    );

    if (!accRes.ok) {
      throw new Error(
        `Hesap oluşturulamadı (HTTP ${accRes.status})`
      );
    }

    const tokenRes = await safeFetch(
      `${apiBase}/token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address,
          password,
        }),
      },
      provider
    );

    if (!tokenRes.ok) {
      throw new Error(
        `Token alınamadı (HTTP ${tokenRes.status})`
      );
    }

    const tokenData = await tokenRes.json().catch(() => null);

    if (!tokenData || typeof tokenData.token !== 'string' || !tokenData.token) {
      throw new Error('Geçersiz token yanıtı alındı');
    }

    return {
      id: tokenData.id || address,
      address,
      apiBase: provider,
      token: tokenData.token,
      password,
      createdAt: Date.now(),
    };
  };

export const createCustomMailbox =
  async (
    username: string,
    domain: string,
    provider: string
  ): Promise<Mailbox> => {
    if (
      !username ||
      !domain ||
      !/^[a-zA-Z0-9._-]{1,64}$/.test(username) ||
      !/^[a-zA-Z0-9.-]{1,253}$/.test(domain) ||
      domain.startsWith('.') ||
      domain.endsWith('.')
    ) {
      throw new Error(
        'Geçersiz e-posta adresi'
      );
    }

    if (isGuerrilla(provider)) {
      return createGuerrillaMailbox(
        username,
        domain
      );
    }

    const apiBase = getApiBase(provider);

    const cleanUser = username
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9._-]/g, '');

    const address =
      `${cleanUser}@${domain.toLowerCase()}`;

    const password = generatePassword();

    const accRes = await safeFetch(
      `${apiBase}/accounts`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address,
          password,
        }),
      },
      provider
    );

    if (accRes.status === 422) {
      throw new Error(
        'Bu kullanıcı adı zaten alınmış.'
      );
    }

    if (!accRes.ok) {
      throw new Error(
        `Hesap oluşturulamadı (HTTP ${accRes.status})`
      );
    }

    const tokenRes = await safeFetch(
      `${apiBase}/token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address,
          password,
        }),
      },
      provider
    );

    if (!tokenRes.ok) {
      throw new Error(
        `Token alınamadı (HTTP ${tokenRes.status})`
      );
    }

    const tokenData = await tokenRes.json().catch(() => null);

    if (!tokenData || typeof tokenData.token !== 'string' || !tokenData.token) {
      throw new Error('Geçersiz token yanıtı alındı');
    }

    return {
      id: tokenData.id || address,
      address,
      apiBase: provider,
      token: tokenData.token,
      password,
      createdAt: Date.now(),
    };
  };

export const getMessages = async (
  mailbox: Mailbox
): Promise<EmailSummary[]> => {
  if (isGuerrilla(mailbox.apiBase)) {
    return await getGuerrillaMessages(mailbox);
  }

  if (!mailbox.token) {
    await rehydrateMailboxSession(mailbox);
  }

  const apiBase = getApiBase(mailbox.apiBase);

  const res = await safeFetch(
    `${apiBase}/messages`,
    {
      headers: {
        Authorization: `Bearer ${mailbox.token}`,
      },
    },
    mailbox.apiBase,
    mailbox.id
  );

  if (!res.ok) {
    if (res.status === 401) {
      mailbox.token = undefined;
      await rehydrateMailboxSession(mailbox);
      const retryRes = await safeFetch(
        `${apiBase}/messages`,
        {
          headers: {
            Authorization: `Bearer ${mailbox.token}`,
          },
        },
        mailbox.apiBase,
        mailbox.id
      );
      if (!retryRes.ok) throw new MailboxFetchError(`Hydra HTTP error ${retryRes.status}`, 'SESSION_EXPIRED', mailbox.id);
      const retryData = await retryRes.json().catch(() => null);
      const rawList = Array.isArray(retryData?.['hydra:member'])
        ? retryData['hydra:member']
        : Array.isArray(retryData)
        ? retryData
        : [];
      return rawList.map((msg: any) => {
        const fromAddr = msg.from?.address || 'unknown';
        const subject = formatSmartSubject(
          msg.subject || '',
          msg.intro || '',
          fromAddr
        );
        const intro = msg.intro || '';
        return {
          id: String(msg.id),
          from: {
            address: fromAddr,
            name: msg.from?.name || formatSenderName(fromAddr),
          },
          subject,
          intro: intro || 'Görüntülenecek önizleme yok',
          seen: Boolean(msg.seen),
          createdAt: msg.createdAt || new Date().toISOString(),
          aiCategory: determineCategory(
            subject,
            fromAddr,
            intro
          ),
        };
      });
    }
    throw new MailboxFetchError(`HTTP error ${res.status}`, 'NETWORK_ERROR', mailbox.id);
  }

  const data = await res.json().catch(() => null);
  const rawList = Array.isArray(data?.['hydra:member'])
    ? data['hydra:member']
    : Array.isArray(data)
    ? data
    : [];

  return rawList.map((msg: any) => {
    const fromAddr = msg.from?.address || 'unknown';
    const subject = formatSmartSubject(
      msg.subject || '',
      msg.intro || '',
      fromAddr
    );
    const intro = msg.intro || '';

    return {
      id: String(msg.id),
      from: {
        address: fromAddr,
        name: msg.from?.name || formatSenderName(fromAddr),
      },
      subject,
      intro: intro || 'Görüntülenecek önizleme yok',
      seen: Boolean(msg.seen),
      createdAt: msg.createdAt || new Date().toISOString(),
      aiCategory: determineCategory(
        subject,
        fromAddr,
        intro
      ),
    };
  });
};

export const getMessageDetail = async (
  mailbox: Mailbox,
  messageId: string
): Promise<EmailDetail | null> => {
  if (!messageId) {
    return null;
  }

  if (isGuerrilla(mailbox.apiBase)) {
    return await getGuerrillaMessageDetail(
      mailbox,
      messageId
    );
  }

  if (!mailbox.token) {
    await rehydrateMailboxSession(mailbox);
  }

  const apiBase = getApiBase(mailbox.apiBase);

  try {
    const res = await safeFetch(
      `${apiBase}/messages/${encodeURIComponent(
        messageId
      )}`,
      {
        headers: {
          Authorization: `Bearer ${mailbox.token}`,
        },
      },
      mailbox.apiBase,
      mailbox.id
    );

    if (!res.ok) {
      throw new MailboxFetchError(`Failed to fetch message detail (HTTP ${res.status})`, 'NETWORK_ERROR', mailbox.id);
    }

    const msg = await res.json().catch(() => null);
    if (!msg || !msg.id) {
      throw new MailboxFetchError('Empty message detail response from server', 'INVALID_RESPONSE', mailbox.id);
    }

    const headerFields: Record<string, string> = {
      From: msg.from?.address || 'unknown',
      Subject: msg.subject || '',
      Date: msg.createdAt || '',
    };

    if (msg.to?.length) {
      headerFields.To = msg.to
        .map((t: any) => t.address)
        .join(', ');
    }

    if (msg.cc?.length) {
      headerFields.Cc = msg.cc
        .map((c: any) => c.address)
        .join(', ');
    }

    if (msg.msgid) {
      headerFields['Message-ID'] = msg.msgid;
    }

    if (msg.size) {
      headerFields.Size = `${msg.size} bytes`;
    }

    const attachments: EmailAttachment[] = Array.isArray(msg.attachments)
      ? msg.attachments.map((a: any) => ({
          id: String(a.id || ''),
          filename:
            a.filename ||
            a.name ||
            'attachment',
          size: a.size || 0,
          contentType:
            a.contentType ||
            'application/octet-stream',
        }))
      : [];

    return {
      id: String(msg.id),
      from: {
        address:
          msg.from?.address || 'unknown',
        name:
          msg.from?.name ||
          msg.from?.address ||
          'unknown',
      },
      subject: msg.subject || '',
      intro: msg.intro || '',
      seen: true,
      createdAt: msg.createdAt,
      aiCategory: determineCategory(
        msg.subject || '',
        msg.from?.address || '',
        msg.intro || ''
      ),
      html: msg.html ? (Array.isArray(msg.html) ? msg.html : [String(msg.html)]) : [],
      text: msg.text,
      hasAttachments:
        attachments.length > 0,
      attachments,
      headerFields,
    };
  } catch (err: unknown) {
    if (err instanceof MailboxFetchError) throw err;
    throw new MailboxFetchError(
      err instanceof Error ? err.message : 'Failed to fetch message detail',
      'NETWORK_ERROR',
      mailbox.id
    );
  }
};

export const deleteMessage = async (
  mailbox: Mailbox,
  messageId: string
): Promise<boolean> => {
  if (!messageId) {
    return false;
  }

  if (!mailbox.token) {
    const rehydrated = await rehydrateMailboxSession(mailbox);
    if (!rehydrated) return false;
  }

  if (isGuerrilla(mailbox.apiBase)) {
    return deleteGuerrillaMessage(
      mailbox,
      messageId
    );
  }

  const apiBase = getApiBase(mailbox.apiBase);

  try {
    const res = await safeFetch(
      `${apiBase}/messages/${encodeURIComponent(
        messageId
      )}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${mailbox.token}`,
        },
      },
      mailbox.apiBase,
      mailbox.id
    );

    return res.ok;
  } catch {
    return false;
  }
};

export const deleteAllMessages = async (
  mailbox: Mailbox
): Promise<boolean> => {
  const messages = await getMessages(mailbox);
  if (messages.length === 0) return true;

  if (isGuerrilla(mailbox.apiBase) && mailbox.token) {
    try {
      const query = messages
        .map((m) => `email_ids[]=${encodeURIComponent(m.id)}`)
        .join('&');
      const res = await safeFetch(
        `${GUERRILLA_API}?f=del_email&${query}&sid_token=${encodeURIComponent(
          mailbox.token
        )}`,
        undefined,
        'guerrilla'
      );
      if (res.ok) return true;
    } catch {
      // fallback to individual delete
    }
  }

  const results = await Promise.allSettled(
    messages.map((m) =>
      deleteMessage(mailbox, m.id)
    )
  );

  return results.every(
    (r) =>
      r.status === 'fulfilled' &&
      r.value === true
  );
};

export const sendEmail = async (
  _mailbox: Mailbox,
  _data?: any
): Promise<boolean> => {
  return false;
};

export const markMessageRead = async (
  mailbox: Mailbox,
  messageId: string
): Promise<boolean> => {
  if (!mailbox.token || !messageId) {
    return false;
  }

  if (isGuerrilla(mailbox.apiBase)) {
    return true;
  }

  const apiBase = getApiBase(mailbox.apiBase);

  try {
    const res = await safeFetch(
      `${apiBase}/messages/${encodeURIComponent(
        messageId
      )}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${mailbox.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isRead: true,
        }),
      },
      mailbox.apiBase,
      mailbox.id
    );

    return res.ok;
  } catch {
    return false;
  }
};

export const getAttachment = async (
  mailbox: Mailbox,
  messageId: string,
  attachmentId: string
): Promise<Blob | null> => {
  if (!mailbox?.token || !messageId || !attachmentId) {
    return null;
  }

  if (isGuerrilla(mailbox.apiBase)) {
    return null;
  }

  const apiBase = getApiBase(mailbox.apiBase);

  try {
    const res = await safeFetch(
      `${apiBase}/messages/${encodeURIComponent(
        messageId
      )}/attachment/${encodeURIComponent(attachmentId)}`,
      {
        headers: {
          Authorization: `Bearer ${mailbox.token}`,
          Accept: '*/*',
        },
      },
      mailbox.apiBase,
      mailbox.id
    );

    if (!res.ok) return null;

    return await res.blob();
  } catch {
    return null;
  }
};

export const analyzeEmailAI = async (
  subject: string,
  from: string,
  intro: string
): Promise<AICategory> => {
  return determineCategory(
    subject,
    from,
    intro
  );
};

export const getProviderInfo = (
  _provider: string
) => ({
  name: 'Guerrilla Mail',
  icon: '⚡',
  color: '#f59e0b',
  apiBase: GUERRILLA_API,
});

export const getWorkerStats = async () => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, 5000);

  try {
    const r = await fetch(
      `${WORKER_API}/api/stats`,
      {
        signal: controller.signal,
      }
    );

    return r.ok ? await r.json() : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
};
