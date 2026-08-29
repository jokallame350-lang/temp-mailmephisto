/**
 * MephistoMail Cloudflare Email Worker Engine
 * Ephemeral Cloudflare KV storage; messages expire after 1 hour.
 * Required binding: MEPHISTO_KV
 * Required secret: MAILBOX_ISSUER_SECRET
 */

const MESSAGE_TTL = 3600;
const MAX_MESSAGES = 50;
const MAX_RAW_BYTES = 512 * 1024;
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

const corsHeaders = (request) => ({
  ...securityHeaders,
  'Access-Control-Allow-Origin': request.headers.get('Origin') === ALLOWED_ORIGIN ? ALLOWED_ORIGIN : ALLOWED_ORIGIN,
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  'Vary': 'Origin',
});

const base64url = (bytes) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
const encode = (text) => base64url(new TextEncoder().encode(text));
const decode = (text) => {
  const normalized = text.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(normalized + '='.repeat((4 - normalized.length % 4) % 4));
  return Uint8Array.from(binary, c => c.charCodeAt(0));
};
const keyFor = (secret) => crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);

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
    const key = await keyFor(secret);
    return crypto.subtle.verify('HMAC', key, decode(signature), new TextEncoder().encode(payload));
  } catch { return false; }
};

const bearer = request => {
  const value = request.headers.get('Authorization') || '';
  return value.startsWith('Bearer ') ? value.slice(7).trim() : '';
};

const authenticate = async (request, address, env) =>
  ADDRESS_RE.test(address) && verifyToken(bearer(request), address, env.MAILBOX_ISSUER_SECRET);

export default {
  async email(message, env) {
    try {
      const recipient = String(message.to || '').toLowerCase().trim();
      if (!ADDRESS_RE.test(recipient)) return;
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
        html: (rawText.match(/Content-Type:\s*text\/html[\s\S]*?\r?\n\r?\n([\s\S]*)/i)?.[1] || '').slice(0, 256000),
        createdAt: new Date().toISOString(),
      };

      const key = `inbox:${recipient}`;
      const existing = await env.MEPHISTO_KV.get(key, 'json');
      const messages = Array.isArray(existing) ? existing : [];
      messages.unshift(emailObj);
      await env.MEPHISTO_KV.put(key, JSON.stringify(messages.slice(0, MAX_MESSAGES)), { expirationTtl: MESSAGE_TTL });
    } catch (err) {
      console.error('[Mephisto Engine] email processing failed:', err?.message || 'unknown');
    }
  },

  async fetch(request, env) {
    const url = new URL(request.url);
    const headers = corsHeaders(request);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });

    if (url.pathname === '/api/domains' && request.method === 'GET') {
      return json({ domains: ['mephistomail.site', 'anon.mephistomail.site'] }, 200, headers);
    }

    // Token issuance is intentionally restricted: the client must prove mailbox creation
    // through a one-time creation nonce stored server-side. Never issue a token for an
    // arbitrary address supplied by an unauthenticated caller.
    if (url.pathname === '/api/mailbox/token' && request.method === 'POST') {
      const body = await request.json().catch(() => null);
      const address = String(body?.address || '').toLowerCase().trim();
      const creationNonce = String(body?.creationNonce || '').trim();
      if (!ADDRESS_RE.test(address) || !creationNonce || creationNonce.length < 32) {
        return json({ error: 'Invalid mailbox credentials' }, 400, headers);
      }
      if (!env.MAILBOX_ISSUER_SECRET) return json({ error: 'Server configuration error' }, 500, headers);

      const nonceKey = `create:${creationNonce}`;
      const claimedAddress = await env.MEPHISTO_KV.get(nonceKey);
      if (claimedAddress !== address) return json({ error: 'Invalid or expired creation nonce' }, 401, headers);
      await env.MEPHISTO_KV.delete(nonceKey);

      const token = await signToken(address, env.MAILBOX_ISSUER_SECRET);
      return json({ token, expiresIn: MESSAGE_TTL }, 200, headers);
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
