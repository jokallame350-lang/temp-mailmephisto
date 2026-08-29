/**
 * MephistoMail Cloudflare Email Worker Engine
 * Ephemeral Cloudflare KV storage; messages expire after 1 hour.
 * Required binding: MEPHISTO_KV
 * Required secret: MAILBOX_ISSUER_SECRET
 */

const MESSAGE_TTL = 3600;
const MAX_MESSAGES = 50;
const MAX_RAW_BYTES = 512 * 1024;
const MAX_HTML_BYTES = 256 * 1024;
const MAIL_DOMAINS = ['mephistomail.site', 'anon.mephistomail.site'];
const ADDRESS_RE = /^[a-z0-9][a-z0-9._-]{0,63}@[a-z0-9.-]+\.[a-z]{2,}$/i;
const ALLOWED_ORIGIN = 'https://mephistomail.site';

const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'X-Frame-Options': 'DENY',
  'Cache-Control': 'no-store, max-age=0',
};

const json = (body, status = 200, extra = {}) => new Response(JSON.stringify(body), {
  status,
  headers: { 'Content-Type': 'application/json; charset=utf-8', ...securityHeaders, ...extra },
});

const corsHeaders = request => {
  const origin = request.headers.get('Origin');
  return {
    ...securityHeaders,
    ...(origin === ALLOWED_ORIGIN ? { 'Access-Control-Allow-Origin': ALLOWED_ORIGIN, 'Vary': 'Origin' } : {}),
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  };
};

const base64url = bytes => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
const encode = text => base64url(new TextEncoder().encode(text));
const decode = text => {
  const normalized = text.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(normalized + '='.repeat((4 - normalized.length % 4) % 4));
  return Uint8Array.from(binary, c => c.charCodeAt(0));
};
const keyFor = secret => crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);

const signToken = async (address, secret) => {
  const payload = encode(JSON.stringify({ sub: address, exp: Math.floor(Date.now() / 1000) + MESSAGE_TTL, v: 1 }));
  const key = await keyFor(secret);
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload)));
  return `${payload}.${base64url(sig)}`;
};

const verifyToken = async (token, address, secret) => {
  try {
    if (!token || !secret) return false;
    const parts = token.split('.');
    if (parts.length !== 2) return false;
    const [payload, signature] = parts;
    const data = JSON.parse(new TextDecoder().decode(decode(payload)));
    if (data.sub !== address || !Number.isFinite(data.exp) || data.exp <= Math.floor(Date.now() / 1000)) return false;
    return crypto.subtle.verify('HMAC', await keyFor(secret), decode(signature), new TextEncoder().encode(payload));
  } catch { return false; }
};

const bearer = request => {
  const value = request.headers.get('Authorization') || '';
  return value.startsWith('Bearer ') ? value.slice(7).trim() : '';
};

const authenticate = async (request, address, env) =>
  ADDRESS_RE.test(address) && verifyToken(bearer(request), address, env.MAILBOX_ISSUER_SECRET);

const randomLocalPart = () => {
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  return `m${base64url(bytes).toLowerCase()}`.replace(/[^a-z0-9]/g, '').slice(0, 24);
};

const createMailbox = async env => {
  if (!env.MEPHISTO_KV || !env.MAILBOX_ISSUER_SECRET) throw new Error('Server configuration error');
  const address = `${randomLocalPart()}@${MAIL_DOMAINS[0]}`;
  // Reserve the mailbox briefly. The email handler can still receive mail for it,
  // while the token proves the caller obtained this exact mailbox from the service.
  const reservation = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
  await env.MEPHISTO_KV.put(`mailbox:${address}`, '1', { expirationTtl: MESSAGE_TTL });
  await env.MEPHISTO_KV.put(`reservation:${reservation}`, address, { expirationTtl: 300 });
  const token = await signToken(address, env.MAILBOX_ISSUER_SECRET);
  return { address, token, expiresIn: MESSAGE_TTL, reservation };
};

export default {
  async email(message, env) {
    try {
      const recipient = String(message.to || '').toLowerCase().trim();
      if (!ADDRESS_RE.test(recipient) || !MAIL_DOMAINS.includes(recipient.split('@')[1])) return;
      const raw = await new Response(message.raw).arrayBuffer();
      if (raw.byteLength > MAX_RAW_BYTES) return;

      const rawText = new TextDecoder().decode(raw);
      const emailObj = {
        id: `msg_${crypto.randomUUID()}`,
        from: String(message.from || '').slice(0, 320),
        to: recipient,
        subject: String(message.headers.get('subject') || '(No Subject)').slice(0, 500),
        intro: rawText.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 150),
        text: rawText.slice(0, MAX_RAW_BYTES),
        html: (rawText.match(/Content-Type:\s*text\/html[\s\S]*?\r?\n\r?\n([\s\S]*)/i)?.[1] || '').slice(0, MAX_HTML_BYTES),
        createdAt: new Date().toISOString(),
      };

      const key = `inbox:${recipient}`;
      const existing = await env.MEPHISTO_KV.get(key, 'json');
      const messages = Array.isArray(existing) ? existing : [];
      messages.unshift(emailObj);
      await env.MEPHISTO_KV.put(key, JSON.stringify(messages.slice(0, MAX_MESSAGES)), { expirationTtl: MESSAGE_TTL });
      await env.MEPHISTO_KV.put(`mailbox:${recipient}`, '1', { expirationTtl: MESSAGE_TTL });
    } catch (err) {
      console.error('[Mephisto Engine] email processing failed:', err?.message || 'unknown error');
    }
  },

  async fetch(request, env) {
    const url = new URL(request.url);
    const headers = corsHeaders(request);
    if (request.method === 'OPTIONS') {
      if (request.headers.get('Origin') !== ALLOWED_ORIGIN) return new Response(null, { status: 403, headers });
      return new Response(null, { status: 204, headers });
    }
    if (request.headers.get('Origin') && request.headers.get('Origin') !== ALLOWED_ORIGIN) {
      return json({ error: 'Origin not allowed' }, 403, headers);
    }

    if (url.pathname === '/api/domains' && request.method === 'GET') {
      return json({ domains: MAIL_DOMAINS }, 200, headers);
    }

    if (url.pathname === '/api/mailbox/create' && request.method === 'POST') {
      try {
        const result = await createMailbox(env);
        return json(result, 201, headers);
      } catch {
        return json({ error: 'Server configuration error' }, 500, headers);
      }
    }

    if (url.pathname === '/api/messages' && request.method === 'GET') {
      const address = String(url.searchParams.get('address') || '').toLowerCase().trim();
      if (!await authenticate(request, address, env)) return json({ error: 'Unauthorized' }, 401, headers);
      const messages = await env.MEPHISTO_KV.get(`inbox:${address}`, 'json');
      return json({ messages: Array.isArray(messages) ? messages : [] }, 200, headers);
    }

    return json({ service: 'MephistoMail Cloudflare Engine', status: 'online' }, 200, headers);
  },
};
