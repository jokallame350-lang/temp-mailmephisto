import type { IncomingMessage, ServerResponse } from 'node:http';
import { getPaddleEnv } from '../lib/paddleServer.ts';

type CustomRequest = IncomingMessage;

interface CustomResponse extends ServerResponse {
  status: (statusCode: number) => CustomResponse;
  json: (data: any) => void;
}

function sendResponse(res: any, statusCode: number, data: any): void {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300');

  if (typeof res.status === 'function' && typeof res.json === 'function') {
    res.status(statusCode).json(data);
    return;
  }
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

export default async function handler(
  req: CustomRequest,
  res: CustomResponse
): Promise<void> {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== 'GET') {
    sendResponse(res, 405, { error: 'Method not allowed. Only GET is accepted.' });
    return;
  }

  try {
    const environment = getPaddleEnv();
    const clientToken = process.env.PADDLE_CLIENT_TOKEN?.trim() || '';
    const monthlyPriceId = process.env.PADDLE_MONTHLY_PRICE_ID?.trim() || '';
    const lifetimePriceId = process.env.PADDLE_LIFETIME_PRICE_ID?.trim() || '';

    // Safe public client configuration (zero server secrets)
    sendResponse(res, 200, {
      environment,
      clientToken,
      monthlyPriceId,
      lifetimePriceId,
    });
  } catch (err: any) {
    sendResponse(res, 500, {
      error: `Configuration error: ${err?.message || 'unknown error'}`,
    });
  }
}
