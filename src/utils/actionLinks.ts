const actionLinkCache = new Map<string, { url: string; label: string } | null>();

/**
 * Heuristic Action Link / Verification Link Extractor
 */
export const extractActionLinks = (htmlText?: string): { url: string; label: string } | null => {
  if (!htmlText || typeof DOMParser === 'undefined') return null;

  if (actionLinkCache.has(htmlText)) {
    return actionLinkCache.get(htmlText)!;
  }

  // Fast path: If HTML has no <a> tags or http, return null immediately
  if (!htmlText.includes('<a') && !htmlText.includes('<A')) {
    if (actionLinkCache.size > 100) actionLinkCache.clear();
    actionLinkCache.set(htmlText, null);
    return null;
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, 'text/html');
    const links = doc.querySelectorAll('a');

    const targetWords = [
      'verify', 'confirm', 'activate', 'reset', 'unsubscribe',
      'onayla', 'doğrula', 'etkinleştir', 'sıfırla', 'login',
      'sign in', 'giriş', 'şifre', 'click here', 'tıkla', 'hesabımı',
      'kayıt', 'üyelik', 'hesap', 'token', 'auth'
    ];

    let result: { url: string; label: string } | null = null;

    // 1. Öncelikle hedef kelimeler ve buton sınıflarını kontrol et
    for (let i = 0; i < links.length; i++) {
      const link = links[i];
      const textContext = (link.textContent || '').toLowerCase().trim();
      const href = link.getAttribute('href');

      if (!href || (!href.startsWith('http://') && !href.startsWith('https://'))) continue;

      const isAction = targetWords.some(word => textContext.includes(word) || href.toLowerCase().includes(word));
      const isButton = link.getAttribute('style')?.includes('background') ||
                       link.getAttribute('class')?.includes('btn') ||
                       link.getAttribute('class')?.includes('button') ||
                       link.getAttribute('role') === 'button';

      if (isAction || isButton) {
        result = { url: href, label: link.textContent?.trim() || 'Doğrulama Linki' };
        break;
      }
    }

    // 2. Bulunamadıysa e-postadaki ilk geçerli dış linki al (fallback)
    if (!result) {
      for (let i = 0; i < links.length; i++) {
        const href = links[i].getAttribute('href');
        if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
          result = { url: href, label: links[i].textContent?.trim() || 'Doğrulama Linki' };
          break;
        }
      }
    }

    if (actionLinkCache.size > 100) actionLinkCache.clear();
    actionLinkCache.set(htmlText, result);
    return result;
  } catch (e) {
    console.error('Action link parse failed', e);
  }
  return null;
};
