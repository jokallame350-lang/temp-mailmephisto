/**
 * Adaptive Polling & Exponential Backoff Utility for Mailbox Syncing
 */

export interface AdaptiveBackoffOptions {
  /** Base interval in milliseconds when active (default: 10,000 ms) */
  baseIntervalMs?: number;
  /** Maximum interval in milliseconds (default: 60,000 ms) */
  maxIntervalMs?: number;
  /** Minimum interval in milliseconds (default: 1,000 ms) */
  minIntervalMs?: number;
  /** Multiplier applied per consecutive empty response (default: 1.5) */
  backoffFactor?: number;
  /** Number of consecutive polls that returned no new emails (default: 0) */
  consecutiveEmptyPolls?: number;
  /** Whether the browser tab / window is in the background (default: false) */
  isBackgroundTab?: boolean;
  /** Base interval when tab is in background (default: 30,000 ms) */
  backgroundIntervalMs?: number;
  /** Whether the provider is currently in a rate-limited state */
  isRateLimited?: boolean;
  /** Remaining rate limit delay in milliseconds */
  rateLimitRemainingMs?: number;
  /** Random jitter ratio between 0 and 1 (e.g., 0.1 for +/- 10% jitter) */
  jitterRatio?: number;
  /** Optional deterministic RNG function (returns 0..1, defaults to Math.random) */
  rng?: () => number;
}

/**
 * Calculates adaptive polling interval based on mailbox activity, tab visibility, and rate limits.
 */
export function calculateAdaptiveBackoff(options: AdaptiveBackoffOptions = {}): number {
  const {
    baseIntervalMs = 10000,
    maxIntervalMs = 60000,
    minIntervalMs = 1000,
    backoffFactor = 1.5,
    consecutiveEmptyPolls = 0,
    isBackgroundTab = false,
    backgroundIntervalMs = 30000,
    isRateLimited = false,
    rateLimitRemainingMs = 0,
    jitterRatio = 0,
    rng = Math.random,
  } = options;

  // 1. If currently rate limited, prioritize waiting for the rate limit to expire
  if (isRateLimited && rateLimitRemainingMs > 0) {
    let interval = Math.max(baseIntervalMs, rateLimitRemainingMs);
    if (jitterRatio > 0) {
      const jitterRange = interval * jitterRatio;
      const jitterOffset = (rng() * 2 - 1) * jitterRange;
      interval += jitterOffset;
    }
    return Math.max(minIntervalMs, Math.round(interval));
  }

  // 2. Base interval selection (active vs background tab)
  const initialBase = isBackgroundTab ? backgroundIntervalMs : baseIntervalMs;

  // 3. Exponential backoff calculation based on consecutive empty polls
  const safeEmptyCount = Math.max(0, consecutiveEmptyPolls);
  const multiplier = Math.pow(backoffFactor, Math.min(safeEmptyCount, 10));
  let calculated = initialBase * multiplier;

  // 4. Cap at maximum configured interval
  calculated = Math.min(calculated, maxIntervalMs);
  calculated = Math.max(calculated, minIntervalMs);

  // 5. Apply optional jitter to prevent synchronized thundering herds
  if (jitterRatio > 0) {
    const jitterRange = calculated * jitterRatio;
    const jitterOffset = (rng() * 2 - 1) * jitterRange;
    calculated = Math.max(minIntervalMs, Math.min(maxIntervalMs, calculated + jitterOffset));
  }

  return Math.round(calculated);
}
