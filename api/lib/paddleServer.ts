import crypto from 'node:crypto';

export type PaddleEnvironment = 'production' | 'sandbox';

export interface PaddleConfig {
  env: PaddleEnvironment;
  apiKey: string;
  webhookSecret: string;
  monthlyPriceId: string;
  lifetimePriceId: string;
  clientToken?: string;
}

/**
 * Validates and returns PADDLE_ENV.
 * Fails loudly with an explicit error if missing or invalid.
 * NEVER silently defaults.
 */
export function getPaddleEnv(): PaddleEnvironment {
  const env = process.env.PADDLE_ENV?.trim();
  if (!env) {
    throw new Error(
      "Missing required environment variable: PADDLE_ENV. Expected 'production' | 'sandbox'."
    );
  }
  if (env !== 'production' && env !== 'sandbox') {
    throw new Error(
      `Invalid PADDLE_ENV '${env}'. Expected 'production' | 'sandbox'.`
    );
  }
  return env;
}

/**
 * Returns API base URL based on Paddle environment.
 */
export function getPaddleApiBaseUrl(env?: PaddleEnvironment): string {
  const currentEnv = env || getPaddleEnv();
  return currentEnv === 'sandbox'
    ? 'https://sandbox-api.paddle.com'
    : 'https://api.paddle.com';
}

/**
 * Validates and retrieves all server-side Paddle configuration.
 * Fails loudly if any required server secret or price ID is missing.
 */
export function validatePaddleConfig(): PaddleConfig {
  const env = getPaddleEnv();
  const apiKey = process.env.PADDLE_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('Missing required server secret: PADDLE_API_KEY.');
  }

  const webhookSecret = process.env.PADDLE_WEBHOOK_SECRET?.trim();
  if (!webhookSecret) {
    throw new Error('Missing required server secret: PADDLE_WEBHOOK_SECRET.');
  }

  const monthlyPriceId = process.env.PADDLE_MONTHLY_PRICE_ID?.trim();
  if (!monthlyPriceId) {
    throw new Error('Missing required configuration: PADDLE_MONTHLY_PRICE_ID.');
  }

  const lifetimePriceId = process.env.PADDLE_LIFETIME_PRICE_ID?.trim();
  if (!lifetimePriceId) {
    throw new Error('Missing required configuration: PADDLE_LIFETIME_PRICE_ID.');
  }

  const clientToken = process.env.PADDLE_CLIENT_TOKEN?.trim();

  return {
    env,
    apiKey,
    webhookSecret,
    monthlyPriceId,
    lifetimePriceId,
    clientToken,
  };
}

/**
 * Verifies Paddle webhook HMAC-SHA256 signature.
 * Header format: ts=<timestamp>;h1=<hash>
 * Signed content: ${ts}:${rawBody}
 */
export function verifyPaddleWebhookSignature(
  rawBody: string,
  signatureHeader: string,
  secret: string
): boolean {
  if (!rawBody || typeof rawBody !== 'string' || !signatureHeader || !secret) {
    return false;
  }

  try {
    // Parse key-value pairs (e.g. ts=1671552777;h1=eb32...)
    const pairs = signatureHeader.split(/[;,]/);
    let ts = '';
    let h1 = '';

    for (const item of pairs) {
      const trimmed = item.trim();
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (key === 'ts') ts = val;
      if (key === 'h1') h1 = val;
    }

    if (!ts || !h1) {
      return false;
    }

    const payloadToSign = `${ts}:${rawBody}`;
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payloadToSign);
    const expectedHash = hmac.digest('hex');

    if (h1.length !== expectedHash.length) {
      return false;
    }

    const h1Buffer = Buffer.from(h1, 'hex');
    const expectedBuffer = Buffer.from(expectedHash, 'hex');

    if (h1Buffer.length !== expectedBuffer.length || h1Buffer.length === 0) {
      return false;
    }

    return crypto.timingSafeEqual(h1Buffer, expectedBuffer);
  } catch {
    return false;
  }
}

/**
 * Creates a customer portal session for the specified customer ID via Paddle API.
 */
export async function createCustomerPortalSession(
  customerId: string,
  options?: { apiKey?: string; env?: PaddleEnvironment }
): Promise<{ url: string }> {
  if (!customerId || typeof customerId !== 'string' || !customerId.trim()) {
    throw new Error('customerId is required to create a customer portal session.');
  }

  const cleanCustomerId = customerId.trim();
  const apiKey = options?.apiKey || process.env.PADDLE_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('PADDLE_API_KEY is required to create customer portal session.');
  }

  const env = options?.env || getPaddleEnv();
  const baseUrl = getPaddleApiBaseUrl(env);
  const endpoint = `${baseUrl}/customers/${encodeURIComponent(cleanCustomerId)}/portal-sessions`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Paddle API error (${response.status}): ${errorText}`);
  }

  const data = (await response.json()) as any;
  const portalUrl =
    data?.data?.urls?.general?.overview ||
    data?.data?.urls?.portal ||
    data?.data?.urls?.overview ||
    data?.data?.url ||
    data?.url;

  if (!portalUrl || typeof portalUrl !== 'string') {
    throw new Error('Paddle API returned no valid portal URL in response payload.');
  }

  return { url: portalUrl };
}
