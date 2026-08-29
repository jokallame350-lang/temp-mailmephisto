import fs from 'node:fs';
import path from 'node:path';

export interface Customer {
  id: string;
  paddleCustomerId: string;
  email: string;
  createdAt: number;
  updatedAt: number;
}

export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'paused' | 'canceled';

export interface Subscription {
  paddleSubscriptionId: string;
  paddleCustomerId: string;
  customerEmail: string;
  status: SubscriptionStatus;
  priceId: string;
  productId?: string;
  scheduledChangeAction?: string;
  scheduledChangeAt?: number;
  createdAt: number;
  updatedAt: number;
}

export type EntitlementType = 'lifetime' | 'subscription';
export type EntitlementStatus = 'active' | 'revoked';

export interface Entitlement {
  paddleCustomerId: string;
  customerEmail: string;
  type: EntitlementType;
  sourceTransactionId?: string;
  status: EntitlementStatus;
  expiresAt?: number;
  createdAt: number;
  updatedAt: number;
}

export interface ProcessedEvent {
  eventId: string;
  eventType: string;
  processedAt: number;
}

export interface VipAccessResult {
  isVip: boolean;
  plan?: 'lifetime' | 'monthly';
  expiresAt?: number;
  customerPortalUrl?: string;
  status: string;
}

export interface DbAdapter {
  getCustomerByEmail(email: string): Promise<Customer | null>;
  getCustomerByPaddleId(paddleCustomerId: string): Promise<Customer | null>;
  upsertCustomer(customer: Partial<Customer> & { paddleCustomerId: string; email: string }): Promise<Customer>;

  getSubscription(subscriptionId: string): Promise<Subscription | null>;
  getSubscriptionsByEmail(email: string): Promise<Subscription[]>;
  getSubscriptionsByCustomerId(paddleCustomerId: string): Promise<Subscription[]>;
  upsertSubscription(subscription: Subscription): Promise<Subscription>;
  updateSubscriptionStatus(subscriptionId: string, status: SubscriptionStatus): Promise<Subscription | null>;

  getEntitlementsByEmail(email: string): Promise<Entitlement[]>;
  getEntitlementsByCustomerId(paddleCustomerId: string): Promise<Entitlement[]>;
  upsertEntitlement(entitlement: Entitlement): Promise<Entitlement>;

  isWebhookProcessed(eventId: string): Promise<boolean>;
  markWebhookProcessed(eventId: string, eventType: string): Promise<void>;
  claimWebhookEvent(eventId: string, eventType: string): Promise<{ claimed: boolean }>;

  hasVipAccess(identifier: string): Promise<VipAccessResult>;
  reset(): Promise<void>;
}

/**
 * Resilient In-Memory & File-backed Database Adapter.
 */
export class MemoryFileDbAdapter implements DbAdapter {
  private customers = new Map<string, Customer>(); // key: paddleCustomerId
  private emailToCustomerId = new Map<string, string>(); // key: lowercased email -> paddleCustomerId
  private subscriptions = new Map<string, Subscription>(); // key: paddleSubscriptionId
  private entitlements: Entitlement[] = [];
  private processedEvents = new Map<string, ProcessedEvent>(); // key: eventId
  private storageFilePath: string | null = null;

  constructor() {
    const customPath = process.env.MEPHISTO_DB_PATH;
    if (customPath) {
      this.storageFilePath = path.resolve(customPath);
      this.loadFromFile();
    }
  }

  private normalizeEmail(email: string): string {
    return email ? email.trim().toLowerCase() : '';
  }

  private loadFromFile(): void {
    if (!this.storageFilePath) return;
    try {
      if (fs.existsSync(this.storageFilePath)) {
        const raw = fs.readFileSync(this.storageFilePath, 'utf8');
        const parsed = JSON.parse(raw);
        if (parsed.customers) {
          for (const c of parsed.customers) {
            this.customers.set(c.paddleCustomerId, c);
            this.emailToCustomerId.set(this.normalizeEmail(c.email), c.paddleCustomerId);
          }
        }
        if (parsed.subscriptions) {
          for (const s of parsed.subscriptions) {
            this.subscriptions.set(s.paddleSubscriptionId, s);
          }
        }
        if (Array.isArray(parsed.entitlements)) {
          this.entitlements = parsed.entitlements;
        }
        if (parsed.processedEvents) {
          for (const pe of parsed.processedEvents) {
            this.processedEvents.set(pe.eventId, pe);
          }
        }
      }
    } catch {
      // Gracefully continue with in-memory state
    }
  }

  private saveToFile(): void {
    if (!this.storageFilePath) return;
    try {
      const dir = path.dirname(this.storageFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const data = {
        customers: Array.from(this.customers.values()),
        subscriptions: Array.from(this.subscriptions.values()),
        entitlements: this.entitlements,
        processedEvents: Array.from(this.processedEvents.values()),
      };
      fs.writeFileSync(this.storageFilePath, JSON.stringify(data, null, 2), 'utf8');
    } catch {
      // In serverless / read-only filesystem environments, gracefully ignore save errors
    }
  }

  async getCustomerByEmail(email: string): Promise<Customer | null> {
    const norm = this.normalizeEmail(email);
    if (!norm) return null;
    const custId = this.emailToCustomerId.get(norm);
    if (custId) {
      const c = this.customers.get(custId);
      if (c) return c;
    }
    // Fallback scan
    for (const c of this.customers.values()) {
      if (this.normalizeEmail(c.email) === norm) {
        return c;
      }
    }
    return null;
  }

  async getCustomerByPaddleId(paddleCustomerId: string): Promise<Customer | null> {
    if (!paddleCustomerId) return null;
    return this.customers.get(paddleCustomerId) || null;
  }

  async upsertCustomer(
    customer: Partial<Customer> & { paddleCustomerId: string; email: string }
  ): Promise<Customer> {
    const now = Date.now();
    const existing = await this.getCustomerByPaddleId(customer.paddleCustomerId);
    const normEmail = this.normalizeEmail(customer.email);

    const record: Customer = {
      id: customer.id || existing?.id || `cust_${customer.paddleCustomerId}`,
      paddleCustomerId: customer.paddleCustomerId,
      email: normEmail || existing?.email || '',
      createdAt: existing?.createdAt || customer.createdAt || now,
      updatedAt: now,
    };

    this.customers.set(record.paddleCustomerId, record);
    if (record.email) {
      this.emailToCustomerId.set(record.email, record.paddleCustomerId);
    }
    this.saveToFile();
    return record;
  }

  async getSubscription(subscriptionId: string): Promise<Subscription | null> {
    return this.subscriptions.get(subscriptionId) || null;
  }

  async getSubscriptionsByEmail(email: string): Promise<Subscription[]> {
    const norm = this.normalizeEmail(email);
    if (!norm) return [];
    const results: Subscription[] = [];
    for (const sub of this.subscriptions.values()) {
      if (this.normalizeEmail(sub.customerEmail) === norm) {
        results.push(sub);
      }
    }
    return results;
  }

  async getSubscriptionsByCustomerId(paddleCustomerId: string): Promise<Subscription[]> {
    if (!paddleCustomerId) return [];
    const results: Subscription[] = [];
    for (const sub of this.subscriptions.values()) {
      if (sub.paddleCustomerId === paddleCustomerId) {
        results.push(sub);
      }
    }
    return results;
  }

  async upsertSubscription(subscription: Subscription): Promise<Subscription> {
    const existing = await this.getSubscription(subscription.paddleSubscriptionId);
    const now = Date.now();
    const record: Subscription = {
      ...subscription,
      customerEmail: this.normalizeEmail(subscription.customerEmail) || existing?.customerEmail || '',
      createdAt: existing?.createdAt || subscription.createdAt || now,
      updatedAt: now,
    };

    this.subscriptions.set(record.paddleSubscriptionId, record);
    this.saveToFile();
    return record;
  }

  async updateSubscriptionStatus(
    subscriptionId: string,
    status: SubscriptionStatus
  ): Promise<Subscription | null> {
    const sub = await this.getSubscription(subscriptionId);
    if (!sub) return null;
    sub.status = status;
    sub.updatedAt = Date.now();
    this.subscriptions.set(subscriptionId, sub);
    this.saveToFile();
    return sub;
  }

  async getEntitlementsByEmail(email: string): Promise<Entitlement[]> {
    const norm = this.normalizeEmail(email);
    if (!norm) return [];
    return this.entitlements.filter(
      (e) => this.normalizeEmail(e.customerEmail) === norm
    );
  }

  async getEntitlementsByCustomerId(paddleCustomerId: string): Promise<Entitlement[]> {
    if (!paddleCustomerId) return [];
    return this.entitlements.filter((e) => e.paddleCustomerId === paddleCustomerId);
  }

  async upsertEntitlement(entitlement: Entitlement): Promise<Entitlement> {
    const now = Date.now();
    const normEmail = this.normalizeEmail(entitlement.customerEmail);

    const record: Entitlement = {
      ...entitlement,
      customerEmail: normEmail,
      createdAt: entitlement.createdAt || now,
      updatedAt: now,
    };

    const index = this.entitlements.findIndex(
      (e) =>
        e.paddleCustomerId === record.paddleCustomerId &&
        e.type === record.type &&
        (record.sourceTransactionId ? e.sourceTransactionId === record.sourceTransactionId : true)
    );

    if (index >= 0) {
      this.entitlements[index] = {
        ...this.entitlements[index],
        ...record,
        createdAt: this.entitlements[index].createdAt,
        updatedAt: now,
      };
    } else {
      this.entitlements.push(record);
    }

    this.saveToFile();
    return record;
  }

  async isWebhookProcessed(eventId: string): Promise<boolean> {
    if (!eventId) return false;
    return this.processedEvents.has(eventId);
  }

  async markWebhookProcessed(eventId: string, eventType: string): Promise<void> {
    if (!eventId) return;
    this.processedEvents.set(eventId, {
      eventId,
      eventType: eventType || 'unknown',
      processedAt: Date.now(),
    });
    this.saveToFile();
  }

  async claimWebhookEvent(eventId: string, eventType: string): Promise<{ claimed: boolean }> {
    if (!eventId) return { claimed: false };
    if (this.processedEvents.has(eventId)) {
      return { claimed: false };
    }
    this.processedEvents.set(eventId, {
      eventId,
      eventType: eventType || 'unknown',
      processedAt: Date.now(),
    });
    this.saveToFile();
    return { claimed: true };
  }

  /**
   * Authoritative VIP determination function.
   * - Lifetime: active lifetime entitlement -> isVip: true, plan: 'lifetime'.
   * - Monthly: subscription status is 'active' or 'trialing' (even if scheduledChangeAction is 'cancel') -> isVip: true, plan: 'monthly'.
   * - Canceled/paused/past_due -> isVip: false.
   */
  async hasVipAccess(identifier: string): Promise<VipAccessResult> {
    if (!identifier || typeof identifier !== 'string' || !identifier.trim()) {
      return { isVip: false, status: 'none' };
    }

    const clean = identifier.trim();
    const isEmail = clean.includes('@');
    const normEmail = isEmail ? this.normalizeEmail(clean) : '';

    // 1. Check Lifetime Entitlements first
    let entitlements: Entitlement[] = [];
    if (isEmail) {
      entitlements = await this.getEntitlementsByEmail(normEmail);
      if (entitlements.length === 0) {
        const cust = await this.getCustomerByEmail(normEmail);
        if (cust) {
          entitlements = await this.getEntitlementsByCustomerId(cust.paddleCustomerId);
        }
      }
    } else {
      entitlements = await this.getEntitlementsByCustomerId(clean);
    }

    const activeLifetime = entitlements.find(
      (e) => e.type === 'lifetime' && e.status === 'active' && (!e.expiresAt || e.expiresAt > Date.now())
    );

    if (activeLifetime) {
      return {
        isVip: true,
        plan: 'lifetime',
        status: 'active',
        expiresAt: activeLifetime.expiresAt,
      };
    }

    // 2. Check Subscriptions & Subscription Entitlements
    const monthlyPriceId = process.env.PADDLE_MONTHLY_PRICE_ID?.trim();
    const activeSubEntitlement = entitlements.find(
      (e) => e.type === 'subscription' && e.status === 'active' && (!e.expiresAt || e.expiresAt > Date.now())
    );

    let subscriptions: Subscription[] = [];
    if (isEmail) {
      subscriptions = await this.getSubscriptionsByEmail(normEmail);
      if (subscriptions.length === 0) {
        const cust = await this.getCustomerByEmail(normEmail);
        if (cust) {
          subscriptions = await this.getSubscriptionsByCustomerId(cust.paddleCustomerId);
        }
      }
    } else {
      subscriptions = await this.getSubscriptionsByCustomerId(clean);
    }

    // Sort by latest updated
    subscriptions.sort((a, b) => b.updatedAt - a.updatedAt);

    const activeSub = subscriptions.find(
      (s) =>
        (s.status === 'active' || s.status === 'trialing') &&
        (!monthlyPriceId || s.priceId === monthlyPriceId || Boolean(activeSubEntitlement))
    );

    if (activeSub) {
      return {
        isVip: true,
        plan: 'monthly',
        status: activeSub.status,
        expiresAt: activeSub.scheduledChangeAt,
      };
    }

    if (activeSubEntitlement) {
      return {
        isVip: true,
        plan: 'monthly',
        status: 'active',
        expiresAt: activeSubEntitlement.expiresAt,
      };
    }

    // If there's an existing canceled/paused/past_due sub
    if (subscriptions.length > 0) {
      return {
        isVip: false,
        status: subscriptions[0].status,
      };
    }

    return {
      isVip: false,
      status: 'none',
    };
  }

  async reset(): Promise<void> {
    this.customers.clear();
    this.emailToCustomerId.clear();
    this.subscriptions.clear();
    this.entitlements = [];
    this.processedEvents.clear();
  }
}

/**
 * Singleton database instance.
 */
export const db: DbAdapter = new MemoryFileDbAdapter();

// Direct export helpers
export const getCustomerByEmail = (email: string) => db.getCustomerByEmail(email);
export const getCustomerByPaddleId = (id: string) => db.getCustomerByPaddleId(id);
export const upsertCustomer = (customer: Partial<Customer> & { paddleCustomerId: string; email: string }) =>
  db.upsertCustomer(customer);

export const getSubscription = (id: string) => db.getSubscription(id);
export const getSubscriptionsByEmail = (email: string) => db.getSubscriptionsByEmail(email);
export const getSubscriptionsByCustomerId = (id: string) => db.getSubscriptionsByCustomerId(id);
export const upsertSubscription = (subscription: Subscription) => db.upsertSubscription(subscription);
export const updateSubscriptionStatus = (id: string, status: SubscriptionStatus) =>
  db.updateSubscriptionStatus(id, status);

export const getEntitlementsByEmail = (email: string) => db.getEntitlementsByEmail(email);
export const getEntitlementsByCustomerId = (id: string) => db.getEntitlementsByCustomerId(id);
export const upsertEntitlement = (entitlement: Entitlement) => db.upsertEntitlement(entitlement);

export const isWebhookProcessed = (eventId: string) => db.isWebhookProcessed(eventId);
export const markWebhookProcessed = (eventId: string, eventType: string) =>
  db.markWebhookProcessed(eventId, eventType);
export const claimWebhookEvent = (eventId: string, eventType: string) =>
  db.claimWebhookEvent(eventId, eventType);

export const hasVipAccess = (identifier: string) => db.hasVipAccess(identifier);
export const resetDb = () => db.reset();
