import type { IncomingMessage, ServerResponse } from 'node:http';
import { getCustomerByEmail, getSubscriptionsByEmail, getEntitlementsByEmail } from '../lib/db.ts';
import { createCustomerPortalSession } from '../lib/paddleServer.ts';

interface CustomRequest extends IncomingMessage {
  body?: any;
}

interface CustomResponse extends ServerResponse {
  status: (statusCode: number) => CustomResponse;
  json: (data: any) => void;
}

function sendResponse(res: any, statusCode: number, data: any): void {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

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
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    sendResponse(res, 405, { error: 'Method not allowed. Only POST is accepted.' });
    return;
  }

  const body = await parseRequestBody(req);
  const email = body?.email?.trim();

  if (!email) {
    sendResponse(res, 400, { error: 'Missing required customer email in request body.' });
    return;
  }

  try {
    // Look up paddle customer ID server-side. NEVER trust client-supplied paddle_customer_id!
    const customer = await getCustomerByEmail(email);
    let paddleCustomerId = customer?.paddleCustomerId;

    if (!paddleCustomerId) {
      // Fallback: check subscriptions or entitlements
      const subs = await getSubscriptionsByEmail(email);
      if (subs.length > 0 && subs[0].paddleCustomerId) {
        paddleCustomerId = subs[0].paddleCustomerId;
      } else {
        const ents = await getEntitlementsByEmail(email);
        if (ents.length > 0 && ents[0].paddleCustomerId) {
          paddleCustomerId = ents[0].paddleCustomerId;
        }
      }
    }

    if (!paddleCustomerId) {
      sendResponse(res, 404, {
        error: 'Customer record not found. No active or past billing account associated with this email.',
      });
      return;
    }

    const session = await createCustomerPortalSession(paddleCustomerId);
    sendResponse(res, 200, { portalUrl: session.url });
  } catch (err: any) {
    console.error('Customer portal session error:', err);
    sendResponse(res, 500, {
      error: `Failed to create customer portal session: ${err?.message || 'unknown error'}`,
    });
  }
}
