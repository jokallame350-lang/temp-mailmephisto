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
      'sign in', 'giriş', 'şifre', 'click here', 'tıkla'
    ];

    for (let i = 0; i < links.length; i++) {
      const link = links[i];
      const textContext = (link.textContent || '').toLowerCase().trim();
      const href = link.getAttribute('href');

      if (!textContext || !href || (!href.startsWith('http://') && !href.startsWith('https://'))) continue;

      const isAction = targetWords.some(word => textContext.includes(word));

      if (isAction || link.getAttribute('style')?.includes('background') || link.getAttribute('class')?.includes('btn')) {
        return { url: href, label: link.textContent?.trim() || 'Doğrulama Linki' };
      }
    }
  } catch (e) {
    console.error('Action link parse failed', e);
  }
  return null;
};
