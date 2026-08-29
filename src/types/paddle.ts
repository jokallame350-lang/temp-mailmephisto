export type VipPlanId = 'monthly' | 'lifetime';
export type VipPlanType = 'subscription' | 'one_time';
export type PaddleEnvironment = 'production' | 'sandbox';

export interface VipPlan {
  id: 'monthly' | 'lifetime';
  name: string;
  description: string;
  features: string[];
  priceId: {
    live: string;
    sandbox?: string;
  };
  type: 'subscription' | 'one_time';
}

export interface PaddleClientConfig {
  environment: PaddleEnvironment;
  clientToken: string;
  monthlyPriceId: string;
  lifetimePriceId: string;
}

export interface PlanPricePreview {
  priceId: string;
  formattedTotal: string;
  currencyCode: string;
  formattedTotals?: {
    subtotal: string;
    tax: string;
    total: string;
    discount?: string;
  };
}

export interface CheckoutOptions {
  priceId: string;
  customerEmail?: string;
  customData?: Record<string, unknown>;
  onSuccess?: (data?: unknown) => void;
  onClose?: () => void;
}

export interface CustomerPortalResponse {
  url?: string;
  portalUrl?: string;
  success?: boolean;
  error?: string;
}

export interface VipEntitlementResponse {
  isVip: boolean;
  active?: boolean;
  plan?: 'monthly' | 'lifetime' | 'license_key' | string;
  planId?: string;
  status?: string;
  expiresAt?: string | null;
  subscriptionId?: string | null;
  customerId?: string | null;
  customerEmail?: string | null;
  cancelUrl?: string | null;
  updateUrl?: string | null;
  error?: string;
}
