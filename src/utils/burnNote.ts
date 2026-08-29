/**
 * Burn Note Ephemeral Encryption / Decryption & Hash URL Utility
 */

/**
 * Encrypt / encode a secret note into a URL-safe Base64 payload
 */
export function encryptBurnNote(text: string): string {
  if (!text) return '';
  const uriEncoded = encodeURIComponent(text);
  if (typeof btoa === 'function') {
    return btoa(uriEncoded);
  }
  return Buffer.from(uriEncoded, 'utf-8').toString('base64');
}

/**
 * Decrypt / decode a secret note from a URL Base64 payload
 */
export function decryptBurnNote(hash: string): string {
  if (!hash) return '';
  // Clean hash string in case it includes leading '#'
  const cleanHash = hash.startsWith('#') ? hash.slice(1) : hash;
  try {
    let decodedUri = '';
    if (typeof atob === 'function') {
      decodedUri = atob(cleanHash);
    } else {
      decodedUri = Buffer.from(cleanHash, 'base64').toString('utf-8');
    }
    return decodeURIComponent(decodedUri);
  } catch {
    return '';
  }
}

/**
 * Build a full burn note URL from origin and secret text
 */
export function createBurnNoteUrl(origin: string, text: string): string {
  const hash = encryptBurnNote(text);
  const base = origin.replace(/\/+$/, '');
  return `${base}/burn-note#${hash}`;
}
