/**
 * Disposable Email & Ephemeral Domain Detection Utility
 */

export const KNOWN_DISPOSABLE_DOMAINS = new Set([
  'mail.tm', 'mail.gw', 'guerrillamail.com', 'guerrillamailblock.com', 'grr.la', 'sharklasers.com',
  'guerrillamail.info', 'guerrillamail.net', 'guerrillamail.de', 'tempmail.org', 'tempmail.com',
  '10minutemail.com', 'mailinator.com', 'throwawaymail.com', 'getnada.com', 'trashmail.com',
  'yopmail.com', 'dispostable.com', 'tempinbox.com', 'fakeinbox.com', 'crazymailing.com',
  'maildrop.cc', 'mohmal.com', 'tempail.com', 'temp-mail.ru', 'mintemail.com', 'burnermail.io',
  'inboxkitten.com', 'tempmail.net', 'mytemp.email', 'generator.email'
]);

export interface DisposableAnalysisResult {
  email: string;
  domain: string;
  isDisposable: boolean;
  riskScore: number; // 0 to 100
  mxStatus: string;
  recommendation: string;
}

/**
 * Check whether an email or domain is recognized as disposable/temporary
 */
export function isDisposableEmail(input: string): boolean {
  if (!input || typeof input !== 'string') return false;
  const normalized = input.trim().toLowerCase();
  const domain = normalized.includes('@') ? normalized.split('@')[1] : normalized;

  if (KNOWN_DISPOSABLE_DOMAINS.has(domain)) {
    return true;
  }

  const disposableKeywords = ['temp', 'fake', 'trash', 'disposable', 'burner', 'throwaway', 'guerrilla'];
  return disposableKeywords.some(keyword => normalized.includes(keyword));
}

/**
 * Perform comprehensive risk and domain analysis on an email address
 */
export function analyzeDisposableEmail(input: string, isTr = false): DisposableAnalysisResult {
  const normalized = (input || '').trim().toLowerCase();
  const parts = normalized.split('@');
  const domain = parts.length > 1 ? parts[1] : normalized;

  const isKnown = isDisposableEmail(normalized);

  const isMajorProvider =
    domain.includes('gmail.com') ||
    domain.includes('outlook.com') ||
    domain.includes('yahoo.com') ||
    domain.includes('hotmail.com') ||
    domain.includes('icloud.com') ||
    domain.includes('proton.me') ||
    domain.includes('protonmail.com');

  const riskScore = isKnown ? 95 : isMajorProvider ? 5 : 40;

  return {
    email: normalized,
    domain,
    isDisposable: isKnown,
    riskScore,
    mxStatus: isKnown ? 'Volatile / Ephemeral' : 'Standard MX Mail Server',
    recommendation: isKnown
      ? (isTr ? 'Bu e-posta bir kullan-at (temp mail) adresidir. Spam riski yüksektir.' : 'This email is a disposable temp address. High spam/fraud risk.')
      : (isTr ? 'Bu e-posta adresi standart bir alan adına aittir.' : 'This email appears to be a standard legitimate domain.')
  };
}
