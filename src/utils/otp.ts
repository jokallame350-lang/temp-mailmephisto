/**
 * OTP / Verification PIN Extractor with In-Memory LRU Cache
 */
const otpCache = new Map<string, string | null>();

export const extractOTP = (text?: string): string | null => {
  if (!text) return null;
  if (otpCache.has(text)) return otpCache.get(text)!;

  const patterns = [
    /(?:code|kod|verification|doğrulama|pin|otp|passcode|şifre)[:\s#-]*(\d{4,8})/i,
    /\b(\d{6})\b/,
    /\b(\d{8})\b/,
    /\b(\d{5})\b/,
    /\b(\d{4})\b/,
  ];
  let found: string | null = null;
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      found = match[1];
      break;
    }
  }

  if (otpCache.size > 200) {
    const keys = Array.from(otpCache.keys()).slice(0, 100);
    keys.forEach(k => otpCache.delete(k));
  }
  otpCache.set(text, found);
  return found;
};
