import { Language, translations } from '../translations';

/**
 * Maps raw technical errors or error codes to user-friendly, localized error strings.
 * Never leaks raw technical strings like "Error: fetch failed", "invalid_sid", or HTTP status codes.
 */
export function getLocalizedErrorMessage(err: unknown, lang: Language): string {
  const t = translations[lang] || translations.en;

  if (!err) return '';

  const rawMessage = typeof err === 'string' 
    ? err 
    : err instanceof Error 
      ? err.message 
      : String(err);

  const lower = rawMessage.toLowerCase().trim();

  // Rate limiting errors
  if (
    lower.includes('rate limit') ||
    lower.includes('too many requests') ||
    lower.includes('429') ||
    lower.includes('retry after')
  ) {
    return t.errorRateLimit || 'Rate limit reached. Auto-retrying shortly...';
  }

  // Network or offline errors
  if (
    lower.includes('fetch failed') ||
    lower.includes('failed to fetch') ||
    lower.includes('network error') ||
    lower.includes('timeout') ||
    lower.includes('offline') ||
    lower.includes('networkrequestfailed') ||
    lower.includes('aborterror')
  ) {
    return t.errorNetwork || 'Connection lost. Reconnecting to mail servers...';
  }

  // Session / Authentication / Token errors
  if (
    lower.includes('invalid_sid') ||
    lower.includes('session_expired') ||
    lower.includes('rehydration_failed') ||
    lower.includes('token') ||
    lower.includes('unauthorized') ||
    lower.includes('401')
  ) {
    return t.errorSession || 'Session refreshed securely.';
  }

  // Username collision / taken errors
  if (
    lower.includes('taken') ||
    lower.includes('already taken') ||
    lower.includes('kullanımda') ||
    lower.includes('alınmış')
  ) {
    return t.usernameTaken || 'Username already taken';
  }

  // Upstream sync or parsing errors
  if (
    lower.includes('guerrilla') ||
    lower.includes('hydra') ||
    lower.includes('upstream') ||
    lower.includes('invalid_response') ||
    lower.includes('json') ||
    lower.includes('500') ||
    lower.includes('502') ||
    lower.includes('503') ||
    lower.includes('504')
  ) {
    return t.errorSync || 'Temporary sync delay. Listening for new emails...';
  }

  return t.errorGeneric || t.connError || 'Service temporarily unavailable. Retrying...';
}

export default getLocalizedErrorMessage;
