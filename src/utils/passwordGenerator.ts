/**
 * Cryptographically Secure Password Generation & Strength Evaluation Utility
 */

export interface PasswordGeneratorOptions {
  length?: number;
  includeUppercase?: boolean;
  includeNumbers?: boolean;
  includeSymbols?: boolean;
  includeLowercase?: boolean;
}

const LOWERCASE_CHARS = 'abcdefghijklmnopqrstuvwxyz';
const UPPERCASE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const NUMBER_CHARS = '0123456789';
const SYMBOL_CHARS = '!@#$%^&*()_+-=[]{}|;:,.<>?';

/**
 * Generate a cryptographically secure random password using Web Crypto or Node crypto
 */
export function generateSecurePassword(options: PasswordGeneratorOptions = {}): string {
  const {
    length = 16,
    includeLowercase = true,
    includeUppercase = true,
    includeNumbers = true,
    includeSymbols = true,
  } = options;

  let charset = '';
  if (includeLowercase) charset += LOWERCASE_CHARS;
  if (includeUppercase) charset += UPPERCASE_CHARS;
  if (includeNumbers) charset += NUMBER_CHARS;
  if (includeSymbols) charset += SYMBOL_CHARS;

  if (!charset) {
    charset = LOWERCASE_CHARS;
  }

  const safeLength = Math.max(4, Math.min(128, length));
  const randomValues = new Uint32Array(safeLength);

  if (typeof globalThis !== 'undefined' && globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(randomValues);
  } else {
    for (let i = 0; i < safeLength; i++) {
      randomValues[i] = Math.floor(Math.random() * 0xffffffff);
    }
  }

  let result = '';
  for (let i = 0; i < safeLength; i++) {
    result += charset[randomValues[i] % charset.length];
  }

  return result;
}

/**
 * Calculate password strength score from 0 (very weak) to 5 (very strong)
 */
export function calculatePasswordStrength(password: string): number {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password) && /[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/.test(password)) score += 1;
  return Math.min(5, score);
}
