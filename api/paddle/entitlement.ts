import type { IncomingMessage, ServerResponse } from 'node:http';
import { hasVipAccess, getCustomerByEmail } from '../lib/db.ts';
import { createVipAuthToken } from '../lib/paddleServer.ts';

interface CustomRequest extends IncomingMessage {
  body?: any;
  query?: Record<string, string | string[]>;
}

interface CustomResponse extends ServerResponse {
  status: (statusCode: number) => CustomResponse;
  json: (data: any) => void;
}

function sendResponse(res: any, statusCode: number, data: any): void {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  if (typeof res.status === 'function' && typeof res.json === 'function') {
    res.status(statusCode).json(data);
    return;
  }
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

async function parseRequestBody(req: IncomingMessage): Promise<any> {
  if ((req as any).body) return (req as any).body;

  return new Promise((resolve) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer | string) => {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    });
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        resolve({});
      }
    });
    req.on('error', () => {
      resolve({});
    });
  });
}

export default async function handler(
  req: CustomRequest,
  res: CustomResponse
): Promise<void> {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    sendResponse(res, 405, { error: 'Method not allowed. Use GET or POST.' });
    return;
  }

  let email = '';

  // Extract from query string
  if (req.url) {
    const parsedUrl = new URL(req.url, 'http://localhost');
    const queryEmail = parsedUrl.searchParams.get('email') || parsedUrl.searchParams.get('identifier');
    if (queryEmail) {
      email = queryEmail.trim();
    }
  }

  // If not found in query, check query object (Vercel parsed query)
  if (!email && req.query) {
    const qEmail = req.query.email || req.query.identifier;
    if (typeof qEmail === 'string') {
      email = qEmail.trim();
    } else if (Array.isArray(qEmail) && qEmail[0]) {
      email = qEmail[0].trim();
    }
  }

  // If POST request, check JSON body
  if (req.method === 'POST') {
    const body = await parseRequestBody(req);
    if (body && typeof body === 'object') {
      const bodyEmail = body.email || body.identifier;
      if (typeof bodyEmail === 'string' && bodyEmail.trim()) {
        email = bodyEmail.trim();
      }
    }
  }

  if (!email) {
    sendResponse(res, 400, {
      error: 'Missing required email or identifier parameter',
      isVip: false,
    });
    return;
  }

  try {
    const vipStatus = await hasVipAccess(email);
    let vipToken: string | undefined;

    if (vipStatus.isVip) {
      const customer = await getCustomerByEmail(email);
      vipToken = createVipAuthToken({
        email,
        paddleCustomerId: customer?.paddleCustomerId,
        isVip: true,
        plan: vipStatus.plan,
        expiresAt: vipStatus.expiresAt,
      });
    }

    sendResponse(res, 200, {
      isVip: vipStatus.isVip,
      plan: vipStatus.plan,
      status: vipStatus.status,
      expiresAt: vipStatus.expiresAt,
      vipToken,
    });
  } catch (err: any) {
    sendResponse(res, 500, {
      error: `Failed to retrieve entitlement status: ${err?.message || 'unknown error'}`,
      isVip: false,
    });
  }
}
