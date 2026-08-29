/**
 * MephistoMail Cloudflare Email Worker Engine
 *
 * IMPORTANT: This worker uses Cloudflare KV for ephemeral storage.
 * It is not RAM-only. Messages expire automatically after 1 hour.
 *
 * Required binding:
 *   MEPHISTO_KV -> Cloudflare KV namespace
 *
 * Required secret:
 *   MAILBOX_ISSUER_SECRET -> long random secret used to sign mailbox access tokens
 */

const MESSAGE_TTL = 3600;
const MAX_MESSAGES = 50;
const MAX_RAW_BYTES = 512 * 1024;
const ADDRESS_RE = /^[a-z0-9][a-z0-9._-]{0,63}@[a-z0-9.-]+\.[a-z]{2,}$/i;

const json = (body, status = 200, extra = {}) => new Response(JSON.stringify(body), {
  status,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store, max-age=0',
    ...extra,
  },
});

const base64url = (bytes) => btoa(String.fromCharCode(...bytes))
  .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');

const base64urlEncode = (text) => base64url(new TextEncoder().encode(text));

const base64urlDecode = (text) => {
  const normalized = text.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - normalized.length % 4) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, c => c.charCodeAt(0));
};

const hmacKey = async (secret) => crypto.subtle.importKey(
  'raw', new TextEncoder().encode(secret),
  { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']
);

const signMailboxToken = async (address, secret) => {
  const payload = base64urlEncode(JSON.stringify({
    sub: address,
    exp: Math.floor(Date.now() / 1000) + MESSAGE_TTL,
    v: 1,
  }));
  const key = await hmacKey(secret);
  const signature = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload)));
  return `${payload}.${base64url(signature)}`;
};

const verifyMailboxToken = async (token, address, secret) => {
  try {
    if (!token || !secret) return false;
    const [payload, signature] = token.split('.');
    if (!payload || !signature) return false;
    const data = JSON.parse(new TextDecoder().decode(base64urlDecode(payload)));
    if (data.sub !== address || !Number.isFinite(data.exp) || data.exp < Math.floor(Date.now() / 1000)) return false;
    const key = await hmacKey(secret);
    return crypto.subtle.verify('HMAC', key, base64urlDecode(signature), new TextEncoder().encode(payload));
  } catch {
    return false;
  }
};

const getBearer = (request) => {
  const value = request.headers.get('Authorization') || '';
  return value.startsWith('Bearer ') ? value.slice(7).trim() : '';
};

const authenticate = async (request, address, env) => {
  if (!ADDRESS_RE.test(address)) return false;
  return verifyMailboxToken(getBearer(request), address, env.MAILBOX_ISSUER_SECRET);
};

const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'X-Frame-Options': 'DENY',
};

export default {
  async email(message, env) {
    try {
      const recipient = String(message.to || '').toLowerCase().trim();
      if (!ADDRESS_RE.test(recipient)) return;

      const raw = await new Response(message.raw).arrayBuffer();
      if (raw.byteLength > MAX_RAW_BYTES) return;

      const sender = String(message.from || '').slice(0, 320);
      const subject = String(message.headers.get('subject') || '(No Subject)').slice(0, 500);
      const rawText = new TextDecoder().decode(raw);
      const date = new Date().toISOString();
      const messageId = `msg_${crypto.randomUUID()}`;

      // Keep the worker deliberately simple: the frontend sanitizes HTML before display.
      const bodyText = rawText.slice(0, MAX_RAW_BYTES);
      const htmlMatch = rawText.match(/Content-Type:\s*text\/html[\s\S]*?\r?\n\r?\n([\s\S]*)/i);
      const bodyHtml = htmlMatch?.[1]?.slice(0, 256000) || '';
      const intro = bodyText.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 150);

      const emailObj = {
        id: messageId,
        from: sender,
        to: recipient,
        subject,
        intro,
        text: bodyText,
        html: bodyHtml,
        createdAt: date,
      };

      const key = `inbox:${recipient}`;
      const existing = await env.MEPHISTO_KV.get(key, 'json');
      const messages = Array.isArray(existing) ? existing : [];
      messages.unshift(emailObj);
      const trimmed = messages.slice(0, MAX_MESSAGES);
      await env.MEPHISTO_KV.put(key, JSON.stringify(trimmed), { expirationTtl: MESSAGE_TTL });
    } catch (err) {
      console.error('[Mephisto Engine] Error processing email:', err?.message || 'unknown error');
    }
  },

  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin');
    const allowedOrigin = origin === 'https://mephistomail.site' ? origin : 'https://mephistomail.site';
    const corsHeaders = {
      ...securityHeaders,
      'Access-Control-Allow-Origin': allowedOrigin,
      'Vary': 'Origin',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    };

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });

    if (url.pathname === '/api/domains' && request.method === 'GET') {
      return json({ domains: ['mephistomail.site', 'anon.mephistomail.site'] }, 200, corsHeaders);
    }

    if (url.pathname === '/api/mailbox/token' && request.method === 'POST') {
      const body = await request.json().catch(() => null);
      const address = String(body?.address || '').toLowerCase().trim();
      if (!ADDRESS_RE.test(address)) return json({ error: 'Invalid address' }, 400, corsHeaders);
      if (!env.MAILBOX_ISSUER_SECRET) return json({ error: 'Server configuration error' }, 500, corsHeaders);
      const token = await signMailboxToken(address, env.MAILBOX_ISSUER_SECRET);
      return json({ token, expiresIn: MESSAGE_TTL }, 200, corsHeaders);
    }

    if (url.pathname === '/api/messages' && request.method === 'GET') {
      const address = String(url.searchParams.get('address') || '').toLowerCase().trim();
      if (!await authenticate(request, address, env)) return json({ error: 'Unauthorized' }, 401, corsHeaders);
      const messages = await env.MEPHISTO_KV.get(`inbox:${address}`, 'json');
      return json({ messages: Array.isArray(messages) ? messages : [] }, 200, corsHeaders);
    }

    return json({ service: 'MephistoMail Cloudflare Engine', status: 'online' }, 200, corsHeaders);
  },
};
