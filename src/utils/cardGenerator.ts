/**
 * Test Card Generation & Luhn Checksum Algorithm Utility
 */

export interface TestCard {
  brand: string;
  cardNumber: string;
  expMonth: string;
  expYear: string;
  cvv: string;
  holder: string;
}

export type CardBrand = 'visa' | 'mastercard' | 'amex' | 'discover';

const BRAND_CONFIGS: Record<CardBrand, { prefix: string; len: number; cvvLen: number }> = {
  visa: { prefix: '4532', len: 16, cvvLen: 3 },
  mastercard: { prefix: '5425', len: 16, cvvLen: 3 },
  amex: { prefix: '3782', len: 15, cvvLen: 4 },
  discover: { prefix: '6011', len: 16, cvvLen: 3 },
};

/**
 * Generate a synthetic test card number conforming to the Luhn algorithm
 */
export function generateLuhnCard(prefix: string, length: number): string {
  let result = prefix;
  while (result.length < length - 1) {
    result += Math.floor(Math.random() * 10).toString();
  }

  // Calculate Luhn check digit
  let sum = 0;
  for (let i = 0; i < result.length; i++) {
    let digit = parseInt(result[result.length - 1 - i], 10);
    if (i % 2 === 0) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return result + checkDigit.toString();
}

/**
 * Validate a card number against the standard Luhn Algorithm (Mod 10)
 */
export function validateLuhnChecksum(cardNumber: string): boolean {
  const digits = cardNumber.replace(/\D/g, '');
  if (!digits || digits.length < 12 || digits.length > 19) return false;

  let sum = 0;
  let shouldDouble = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits.charAt(i), 10);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
}

/**
 * Generate a complete test card object with brand, number, expiry, CVV, and holder
 */
export function generateTestCard(brand: CardBrand = 'visa'): TestCard {
  const config = BRAND_CONFIGS[brand] || BRAND_CONFIGS.visa;
  const rawNum = generateLuhnCard(config.prefix, config.len);
  const formattedNum = rawNum.replace(/(.{4})/g, '$1 ').trim();

  const currentYear = new Date().getFullYear();
  const expYear = (currentYear + Math.floor(Math.random() * 4) + 1).toString();
  const expMonth = (Math.floor(Math.random() * 12) + 1).toString().padStart(2, '0');

  let cvv = '';
  for (let i = 0; i < config.cvvLen; i++) {
    cvv += Math.floor(Math.random() * 10).toString();
  }

  const firstNames = ['Alex', 'Morgan', 'Jordan', 'Taylor', 'Sam', 'Mert', 'Emre', 'Can', 'Chris', 'Robin'];
  const lastNames = ['Yildiz', 'Smith', 'Doe', 'Kaya', 'Demir', 'Miller', 'Taylor', 'Johnson'];
  const holder = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`.toUpperCase();

  return {
    brand: brand.toUpperCase(),
    cardNumber: formattedNum,
    expMonth,
    expYear,
    cvv,
    holder,
  };
}
