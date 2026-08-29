import { useState, useEffect, useCallback } from 'react';
import { VipEntitlementResponse } from '../types/paddle';

export interface UseVipEntitlementReturn {
  isVip: boolean;
  plan: string | null;
  status: string | null;
  expiresAt: string | null;
  isLoading: boolean;
  error: string | null;
  setIsVip: (vip: boolean) => void;
  checkEntitlement: (email?: string) => Promise<boolean>;
  activateVip: (planName?: string, customerEmail?: string) => void;
  deactivateVip: () => void;
}

export function useVipEntitlement(): UseVipEntitlementReturn {
  const [isVip, setIsVipState] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('mephisto_vip_active') === 'true';
  });

  const [plan, setPlan] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('mephisto_vip_plan');
  });

  const [status, setStatus] = useState<string | null>(null);

  const [expiresAt, setExpiresAt] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('mephisto_vip_expires_at');
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const syncFromStorage = useCallback(() => {
    if (typeof window === 'undefined') return;
    const localActive = localStorage.getItem('mephisto_vip_active') === 'true';
    const localPlan = localStorage.getItem('mephisto_vip_plan');
    const localExpires = localStorage.getItem('mephisto_vip_expires_at');

    setIsVipState(localActive);
    setPlan(localPlan);
    setExpiresAt(localExpires);
  }, []);

  // Check entitlement against server API
  const checkEntitlement = useCallback(async (customEmail?: string): Promise<boolean> => {
    if (typeof window === 'undefined') return false;

    setIsLoading(true);
    setError(null);

    const email =
      customEmail ||
      localStorage.getItem('mephisto_vip_email') ||
      '';

    // If no email registered, check offline promo / dev keys
    if (!email) {
      const key = (localStorage.getItem('mephisto_vip_key') || '').trim().toUpperCase();
      if (key && (key.includes('MEPHISTO-VIP') || key === 'PRO2026' || key === 'VIP99')) {
        setIsVipState(true);
        setIsLoading(false);
        return true;
      }
      const localActive = localStorage.getItem('mephisto_vip_active') === 'true';
      setIsVipState(localActive);
      setIsLoading(false);
      return localActive;
    }

    try {
      const url = new URL('/api/paddle/entitlement', window.location.origin);
      url.searchParams.set('email', email);

      const res = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });

      if (!res.ok) {
        throw new Error(`Entitlement endpoint returned status ${res.status}`);
      }

      const data = (await res.json()) as VipEntitlementResponse;
      const active = Boolean(data.isVip || data.active);

      if (active) {
        localStorage.setItem('mephisto_vip_active', 'true');
        if (data.plan) {
          localStorage.setItem('mephisto_vip_plan', data.plan);
          setPlan(data.plan);
        }
        if (data.expiresAt) {
          localStorage.setItem('mephisto_vip_expires_at', data.expiresAt);
          setExpiresAt(data.expiresAt);
        }
        if (data.status) {
          setStatus(data.status);
        }
        setIsVipState(true);
      } else {
        const key = (localStorage.getItem('mephisto_vip_key') || '').trim().toUpperCase();
        if (!key || (!key.includes('MEPHISTO-VIP') && key !== 'PRO2026' && key !== 'VIP99')) {
          localStorage.removeItem('mephisto_vip_active');
          localStorage.removeItem('mephisto_vip_plan');
          localStorage.removeItem('mephisto_vip_expires_at');
          setIsVipState(false);
          setPlan(null);
          setExpiresAt(null);
          setStatus(null);
        }
      }

      window.dispatchEvent(new CustomEvent('mephisto-vip-change'));
      return active;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown entitlement check error';
      console.warn('[useVipEntitlement] Error checking entitlement:', message);
      setError(message);
      const fallback = localStorage.getItem('mephisto_vip_active') === 'true';
      setIsVipState(fallback);
      return fallback;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setIsVip = useCallback((vip: boolean) => {
    if (typeof window === 'undefined') return;

    if (vip) {
      localStorage.setItem('mephisto_vip_active', 'true');
    } else {
      localStorage.removeItem('mephisto_vip_active');
      localStorage.removeItem('mephisto_vip_key');
      localStorage.removeItem('mephisto_vip_plan');
      localStorage.removeItem('mephisto_vip_expires_at');
      setPlan(null);
      setStatus(null);
      setExpiresAt(null);
    }
    setIsVipState(vip);
    window.dispatchEvent(new CustomEvent('mephisto-vip-change'));
  }, []);

  const activateVip = useCallback((planName?: string, customerEmail?: string) => {
    if (typeof window === 'undefined') return;

    localStorage.setItem('mephisto_vip_active', 'true');
    if (planName) {
      localStorage.setItem('mephisto_vip_plan', planName);
      setPlan(planName);
    }
    if (customerEmail) {
      localStorage.setItem('mephisto_vip_email', customerEmail);
    }
    setIsVipState(true);
    window.dispatchEvent(new CustomEvent('mephisto-vip-change'));
  }, []);

  const deactivateVip = useCallback(() => {
    setIsVip(false);
  }, [setIsVip]);

  // Sync across tabs and custom events
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (
        !e.key ||
        e.key === 'mephisto_vip_active' ||
        e.key === 'mephisto_vip_plan' ||
        e.key === 'mephisto_vip_expires_at'
      ) {
        syncFromStorage();
      }
    };

    const handleCustomChange = () => {
      syncFromStorage();
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('mephisto-vip-change', handleCustomChange);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('mephisto-vip-change', handleCustomChange);
    };
  }, [syncFromStorage]);

  return {
    isVip,
    plan,
    status,
    expiresAt,
    isLoading,
    error,
    setIsVip,
    checkEntitlement,
    activateVip,
    deactivateVip,
  };
}
