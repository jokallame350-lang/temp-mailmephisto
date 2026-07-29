/**
 * Heuristic Action Link / Verification Link Extractor
 */
export const extractActionLinks = (htmlText?: string): { url: string; label: string } | null => {
  if (!htmlText || typeof DOMParser === 'undefined') return null;
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
        return { url: href, label: link.textContent?.trim() || 'Doğrulama Linki' };
      }
    }

    // 2. Bulunamadıysa e-postadaki ilk geçerli dış linki al (fallback)
    for (let i = 0; i < links.length; i++) {
      const href = links[i].getAttribute('href');
      if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
        return { url: href, label: links[i].textContent?.trim() || 'Doğrulama Linki' };
      }
    }
  } catch (e) {
    console.error('Action link parse failed', e);
  }
  return null;
};
