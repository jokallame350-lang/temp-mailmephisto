import { initializePaddle as initPaddleJs, Paddle, PaddleEventData } from '@paddle/paddle-js';
import { getPaddleClientConfig } from '../config/paddle';
import { CheckoutOptions, PlanPricePreview, CustomerPortalResponse } from '../types/paddle';

let paddleInstance: Paddle | undefined = undefined;
let paddleInitPromise: Promise<Paddle | undefined> | null = null;
let currentCheckoutCallbacks: {
  onSuccess?: (data?: unknown) => void;
  onClose?: () => void;
} | null = null;

const handlePaddleEvent = (event: PaddleEventData) => {
  if (!event || !event.name) return;

  switch (event.name) {
    case 'checkout.completed': {
      if (currentCheckoutCallbacks?.onSuccess) {
        currentCheckoutCallbacks.onSuccess(event.data);
      }
      // Store local VIP flag proactively on successful checkout
      try {
        localStorage.setItem('mephisto_vip_active', 'true');
        if (event.data?.customer?.email) {
          localStorage.setItem('mephisto_vip_email', event.data.customer.email);
        }
        if (event.data?.customer?.id) {
          localStorage.setItem('mephisto_paddle_customer_id', event.data.customer.id);
        }
        window.dispatchEvent(new CustomEvent('mephisto-vip-change'));
      } catch (e) {
        console.warn('[Paddle] Error saving checkout session to localStorage:', e);
      }

      // If not already navigating to successUrl, redirect to /welcome
      const currentPath = window.location.pathname;
      if (currentPath !== '/welcome') {
        window.location.href = '/welcome';
      }
      break;
    }
    case 'checkout.closed': {
      if (currentCheckoutCallbacks?.onClose) {
        currentCheckoutCallbacks.onClose();
      }
      currentCheckoutCallbacks = null;
      break;
    }
    default:
      break;
  }
};

/**
 * Initializes Paddle.js with environment and client token.
 */
export async function initializePaddle(): Promise<Paddle | undefined> {
  if (paddleInstance) {
    return paddleInstance;
  }
  if (paddleInitPromise) {
    return paddleInitPromise;
  }

  let config;
  try {
    config = getPaddleClientConfig();
  } catch (err) {
    console.error('[Paddle] Config error:', err);
    return undefined;
  }

  if (!config.clientToken) {
    console.warn('[Paddle] VITE_PADDLE_CLIENT_TOKEN is not set. Paddle checkout will remain inactive.');
    return undefined;
  }

  paddleInitPromise = initPaddleJs({
    environment: config.environment,
    token: config.clientToken,
    eventCallback: handlePaddleEvent,
    checkout: {
      settings: {
        displayMode: 'overlay',
        theme: 'dark',
        variant: 'one-page',
        successUrl: typeof window !== 'undefined' ? `${window.location.origin}/welcome` : undefined,
      },
    },
  })
    .then((instance) => {
      paddleInstance = instance;
      return instance;
    })
    .catch((error) => {
      console.error('[Paddle] Initialization failed:', error);
      paddleInitPromise = null;
      return undefined;
    });

  return paddleInitPromise;
}

/**
 * Calls Paddle.PricePreview() and extracts formattedTotals directly
 * without frontend math or currency conversions.
 */
export async function fetchPricePreviews(
  priceIds: string[]
): Promise<Record<string, PlanPricePreview>> {
  const validIds = priceIds.filter((id) => Boolean(id && typeof id === 'string' && id.trim().length > 0));
  if (validIds.length === 0) {
    return {};
  }

  const paddle = await initializePaddle();
  if (!paddle) {
    return {};
  }

  try {
    const previewResponse = await paddle.PricePreview({
      items: validIds.map((priceId) => ({
        priceId,
        quantity: 1,
      })),
    });

    const result: Record<string, PlanPricePreview> = {};
    const lineItems = previewResponse?.data?.details?.lineItems || [];
    const currencyCode = previewResponse?.data?.currencyCode || 'USD';

    for (const item of lineItems) {
      const priceId = item.price.id;
      const formattedTotal = item.formattedTotals?.total || '';

      result[priceId] = {
        priceId,
        formattedTotal,
        currencyCode,
        formattedTotals: {
          subtotal: item.formattedTotals?.subtotal || '',
          tax: item.formattedTotals?.tax || '',
          total: formattedTotal,
          discount: item.formattedTotals?.discount || undefined,
        },
      };
    }

    return result;
  } catch (error) {
    console.warn('[Paddle] PricePreview request failed:', error);
    return {};
  }
}

/**
 * Opens Paddle checkout in overlay mode (variant: one-page),
 * prefilling customer email if available and redirecting to /welcome on success.
 */
export async function openPaddleCheckout({
  priceId,
  customerEmail,
  customData,
  onSuccess,
  onClose,
}: CheckoutOptions): Promise<void> {
  if (!priceId) {
    throw new Error('Price ID is required to open checkout.');
  }

  const paddle = await initializePaddle();
  if (!paddle) {
    throw new Error('Paddle is not initialized. Check your client token and environment configuration.');
  }

  currentCheckoutCallbacks = {
    onSuccess,
    onClose,
  };

  const successUrl = typeof window !== 'undefined' ? `${window.location.origin}/welcome` : '/welcome';

  paddle.Checkout.open({
    settings: {
      displayMode: 'overlay',
      theme: 'dark',
      variant: 'one-page',
      successUrl,
    },
    items: [
      {
        priceId,
        quantity: 1,
      },
    ],
    customer: customerEmail
      ? {
          email: customerEmail,
        }
      : undefined,
    customData,
  });
}

/**
 * Requests a Customer Portal URL from backend (/api/paddle/customer-portal) and opens it.
 */
export async function requestCustomerPortal(customerEmail?: string): Promise<string> {
  const emailToUse =
    customerEmail ||
    (typeof window !== 'undefined' ? localStorage.getItem('mephisto_vip_email') : null) ||
    '';

  const response = await fetch('/api/paddle/customer-portal', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: emailToUse || undefined,
    }),
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => ({}))) as { error?: string; message?: string };
    const errMsg = errorBody.error || errorBody.message || `Customer portal request failed with status ${response.status}`;
    throw new Error(errMsg);
  }

  const data = (await response.json()) as CustomerPortalResponse;
  const portalUrl = data.portalUrl || data.url;

  if (!portalUrl) {
    throw new Error('No customer portal URL returned by server.');
  }

  if (typeof window !== 'undefined') {
    window.open(portalUrl, '_blank', 'noopener,noreferrer');
  }

  return portalUrl;
}
