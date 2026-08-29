import { VipPlan, PaddleClientConfig, PaddleEnvironment } from '../types/paddle';

export const VIP_PLANS: Record<'monthly' | 'lifetime', VipPlan> = {
  monthly: {
    id: 'monthly',
    name: 'Monthly VIP',
    description: 'Billed monthly. Cancel anytime.',
    features: [
      '100% Ad-Free Experience',
      'Custom & EDU Domain Support',
      'Instant <1s Priority OTP Routing',
      '1-Click RFC 5322 (.eml) & JSON Export',
      'Extended Retention & Unlimited Aliases'
    ],
    priceId: {
      live: 'pri_01jm01monthlyliveexample0000000',
      sandbox: 'pri_01jm01monthlysbxexample0000000',
    },
    type: 'subscription',
  },
  lifetime: {
    id: 'lifetime',
    name: 'Lifetime PRO',
    description: 'One-time payment. Forever access.',
    features: [
      '100% Ad-Free Experience Forever',
      'Custom & EDU Domain Support',
      'Instant <1s Priority OTP Routing',
      '1-Click RFC 5322 (.eml) & JSON Export',
      'Unlimited Aliases & Lifetime Priority',
      'All Future VIP Features Included'
    ],
    priceId: {
      live: 'pri_01jm01lifetimeliveexample0000000',
      sandbox: 'pri_01jm01lifetimesbxexample0000000',
    },
    type: 'one_time',
  },
};

export const getPaddleClientConfig = (): PaddleClientConfig => {
  const rawEnv = (import.meta.env.VITE_PADDLE_ENV || 'sandbox').toString().trim().toLowerCase();
  if (rawEnv !== 'sandbox' && rawEnv !== 'production') {
    throw new Error(`Invalid VITE_PADDLE_ENV: "${rawEnv}". Must be 'sandbox' or 'production'.`);
  }

  const environment: PaddleEnvironment = rawEnv as PaddleEnvironment;
  const clientToken = (import.meta.env.VITE_PADDLE_CLIENT_TOKEN || '').toString().trim();
  const monthlyPriceId = (
    import.meta.env.VITE_PADDLE_MONTHLY_PRICE_ID ||
    VIP_PLANS.monthly.priceId[environment] ||
    VIP_PLANS.monthly.priceId.live
  ).toString().trim();
  const lifetimePriceId = (
    import.meta.env.VITE_PADDLE_LIFETIME_PRICE_ID ||
    VIP_PLANS.lifetime.priceId[environment] ||
    VIP_PLANS.lifetime.priceId.live
  ).toString().trim();

  return {
    environment,
    clientToken,
    monthlyPriceId,
    lifetimePriceId,
  };
};
