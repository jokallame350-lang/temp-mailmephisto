import type { IncomingMessage, ServerResponse } from 'node:http';
import { verifyPaddleWebhookSignature } from '../lib/paddleServer.ts';
import {
  upsertCustomer,
  upsertSubscription,
  updateSubscriptionStatus,
  upsertEntitlement,
  getCustomerByPaddleId,
  claimWebhookEvent,
} from '../lib/db.ts';

export const config = {
  api: {
    bodyParser: false,
  },
};

interface CustomRequest extends IncomingMessage {
  body?: any;
  rawBody?: string | Buffer;
  query?: Record<string, string | string[]>;
}

interface CustomResponse extends ServerResponse {
  status: (statusCode: number) => CustomResponse;
  json: (data: any) => void;
}

/**
 * Extracts the raw request body as string.
 */
export async function getRawBody(req: CustomRequest): Promise<string> {
  if (typeof req.rawBody === 'string') return req.rawBody;
  if (Buffer.isBuffer(req.rawBody)) return req.rawBody.toString('utf8');
  if (typeof req.body === 'string') return req.body;
  if (Buffer.isBuffer(req.body)) return req.body.toString('utf8');
  if (req.body && typeof req.body === 'object' && Object.keys(req.body).length > 0) {
    return JSON.stringify(req.body);
  }

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer | string) => {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    });
    req.on('end', () => {
      resolve(Buffer.concat(chunks).toString('utf8'));
    });
    req.on('error', (err) => {
      reject(err);
    });
  });
}

function sendResponse(res: any, statusCode: number, data: any): void {
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
  if (req.method !== 'POST') {
    sendResponse(res, 405, { error: 'Method not allowed. Only POST is accepted.' });
    return;
  }

  const webhookSecret = process.env.PADDLE_WEBHOOK_SECRET?.trim();
  if (!webhookSecret) {
    console.error('PADDLE_WEBHOOK_SECRET is not configured.');
    sendResponse(res, 500, { error: 'Webhook secret is not configured on server.' });
    return;
  }

  // 1. Read Raw Body
  let rawBody = '';
  try {
    rawBody = await getRawBody(req);
  } catch (err: any) {
    sendResponse(res, 400, { error: `Failed to read request body: ${err?.message || 'unknown error'}` });
    return;
  }

  if (!rawBody) {
    sendResponse(res, 400, { error: 'Empty request body' });
    return;
  }

  // 2. Verify Paddle Signature
  const signatureHeader =
    (req.headers['paddle-signature'] as string) ||
    (req.headers['Paddle-Signature'] as string) ||
    '';

  if (!signatureHeader || !verifyPaddleWebhookSignature(rawBody, signatureHeader, webhookSecret)) {
    sendResponse(res, 401, { error: 'Invalid webhook signature' });
    return;
  }

  // 3. Parse JSON Event Payload
  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    sendResponse(res, 400, { error: 'Invalid JSON payload' });
    return;
  }

  const eventId = event?.event_id || event?.notification_id || event?.id;
  const eventType = event?.event_type || event?.type;

  if (!eventId) {
    sendResponse(res, 400, { error: 'Missing event_id in webhook payload' });
    return;
  }

  // 4. Atomic Idempotency Claim (Eliminates Check-then-Act Race Conditions)
  const claimResult = await claimWebhookEvent(eventId, eventType || 'unknown');
  if (!claimResult.claimed) {
    sendResponse(res, 200, { received: true, duplicate: true });
    return;
  }

  // 5. Handle Event by Type
  const data = event.data || {};
  const lifetimePriceId = process.env.PADDLE_LIFETIME_PRICE_ID?.trim();
  const monthlyPriceId = process.env.PADDLE_MONTHLY_PRICE_ID?.trim();

  try {
    switch (eventType) {
      case 'customer.created':
      case 'customer.updated': {
        const paddleCustomerId = data.id;
        const email = data.email || '';
        if (paddleCustomerId) {
          await upsertCustomer({
            paddleCustomerId,
            email,
          });
        }
        break;
      }

      case 'transaction.completed': {
        const transactionId = data.id;
        const paddleCustomerId = data.customer_id;
        const email = data.customer?.email || (await getCustomerByPaddleId(paddleCustomerId))?.email || '';

        if (paddleCustomerId && email) {
          await upsertCustomer({
            paddleCustomerId,
            email,
          });
        }

        const items = data.items || data.details?.line_items || [];
        const isLifetime = items.some((item: any) => {
          const priceId = item.price?.id || item.price_id || item.id;
          return Boolean(lifetimePriceId && priceId === lifetimePriceId);
        });

        if (isLifetime && paddleCustomerId) {
          await upsertEntitlement({
            paddleCustomerId,
            customerEmail: email,
            type: 'lifetime',
            sourceTransactionId: transactionId,
            status: 'active',
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
        }
        break;
      }

      case 'subscription.created':
      case 'subscription.updated': {
        const subscriptionId = data.id;
        const paddleCustomerId = data.customer_id;
        const status = data.status || 'active';
        const items = data.items || [];
        const priceId = items[0]?.price?.id || items[0]?.price_id || '';
        const productId = items[0]?.price?.product_id || items[0]?.product_id;
        const scheduledChangeAction = data.scheduled_change?.action;
        const scheduledChangeAt = data.scheduled_change?.effective_at
          ? new Date(data.scheduled_change.effective_at).getTime()
          : undefined;

        const email = data.customer?.email || (await getCustomerByPaddleId(paddleCustomerId))?.email || '';

        if (paddleCustomerId && email) {
          await upsertCustomer({
            paddleCustomerId,
            email,
          });
        }

        if (subscriptionId && paddleCustomerId) {
          await upsertSubscription({
            paddleSubscriptionId: subscriptionId,
            paddleCustomerId,
            customerEmail: email,
            status,
            priceId,
            productId,
            scheduledChangeAction,
            scheduledChangeAt,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });

          // Price Security: Only grant VIP if price ID strictly matches PADDLE_MONTHLY_PRICE_ID
          const isMonthlyVipPrice = Boolean(monthlyPriceId && priceId === monthlyPriceId);
          if (isMonthlyVipPrice && (status === 'active' || status === 'trialing')) {
            await upsertEntitlement({
              paddleCustomerId,
              customerEmail: email,
              type: 'subscription',
              status: 'active',
              expiresAt: scheduledChangeAt,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            });
          }
        }
        break;
      }

      case 'subscription.canceled': {
        const subscriptionId = data.id;
        if (subscriptionId) {
          await updateSubscriptionStatus(subscriptionId, 'canceled');
        }
        break;
      }

      default:
        // Other events acknowledged without special DB modification
        break;
    }

    sendResponse(res, 200, { received: true });
  } catch (err: any) {
    console.error('Error processing webhook event:', err);
    sendResponse(res, 500, { error: 'Internal error processing webhook' });
  }
}
