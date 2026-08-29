/**
 * Email Tracker & Pixel Blocker Utility
 * Detects and strips 1x1 tracking pixels, hidden images, and known email open trackers.
 */

const KNOWN_TRACKER_DOMAINS = [
  'sendgrid.net',
  'mailchimp.com',
  'mandrillapp.com',
  'hubspot.com',
  'hs-analytics.net',
  'salesforce.com',
  'activehosted.com',
  'klaviyo.com',
  'convertkit.com',
  'customer.io',
  'intercom.io',
  'drip.com',
  'sendinblue.com',
  'brevo.com',
  'getresponse.com',
  'mailjet.com',
  'postmarkapp.com',
  'cmail1.com',
  'cmail2.com',
  'litmus.com',
  'open.endless.com',
  'pixel.gif',
  'track.',
  'tracker.',
  'open.php',
  'tr.php',
];

const trackerCache = new Map<string, TrackerBlockerResult>();

export interface TrackerBlockerResult {
  cleanHtml: string;
  trackerCount: number;
  trackerDomains: string[];
}

export const sanitizeAndBlockTrackers = (htmlContent: string): TrackerBlockerResult => {
  if (!htmlContent) {
    return { cleanHtml: '', trackerCount: 0, trackerDomains: [] };
  }

  if (trackerCache.has(htmlContent)) {
    return trackerCache.get(htmlContent)!;
  }

  // Fast path: if no img tag or local file protocol, return immediately without parsing DOM
  const lower = htmlContent.toLowerCase();
  if (!lower.includes('<img') && !lower.includes('file:') && !lower.includes('content:')) {
    const result: TrackerBlockerResult = { cleanHtml: htmlContent, trackerCount: 0, trackerDomains: [] };
    if (trackerCache.size > 100) trackerCache.clear();
    trackerCache.set(htmlContent, result);
    return result;
  }

  let trackerCount = 0;
  const trackerDomainsSet = new Set<string>();

  // Browser DOMParser environment check
  if (typeof DOMParser === 'undefined') {
    return { cleanHtml: htmlContent, trackerCount: 0, trackerDomains: [] };
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');

    const images = Array.from(doc.querySelectorAll('img'));

    images.forEach(img => {
      const src = (img.getAttribute('src') || '').trim();
      const lowerSrc = src.toLowerCase();
      const widthAttr = img.getAttribute('width');
      const heightAttr = img.getAttribute('height');
      const style = (img.getAttribute('style') || '').toLowerCase();

      // Detect file:/// or unsafe local protocols and block immediately
      const isUnsafeProtocol =
        lowerSrc.startsWith('file:') ||
        lowerSrc.startsWith('file:/') ||
        lowerSrc.startsWith('file://') ||
        lowerSrc.startsWith('content:') ||
        lowerSrc.startsWith('chrome:') ||
        lowerSrc.startsWith('resource:') ||
        lowerSrc.startsWith('filesystem:') ||
        lowerSrc.startsWith('javascript:') ||
        lowerSrc.startsWith('vbscript:') ||
        lowerSrc.startsWith('about:') ||
        lowerSrc.startsWith('blob:') ||
        (lowerSrc.startsWith('data:') && !lowerSrc.startsWith('data:image/'));


      // Detect 1x1 or zero dimension pixel
      const isOnePixel =
        widthAttr === '1' ||
        heightAttr === '1' ||
        widthAttr === '0' ||
        heightAttr === '0' ||
        style.includes('width:1px') ||
        style.includes('height:1px') ||
        style.includes('width: 1px') ||
        style.includes('height: 1px') ||
        style.includes('width:0px') ||
        style.includes('height:0px') ||
        style.includes('display:none') ||
        style.includes('visibility:hidden');

      // Detect known tracker domain
      const matchedDomain = KNOWN_TRACKER_DOMAINS.find(domain => lowerSrc.includes(domain));

      if (isUnsafeProtocol || isOnePixel || matchedDomain) {
        trackerCount++;
        if (matchedDomain) {
          trackerDomainsSet.add(matchedDomain);
        } else if (isUnsafeProtocol) {
          trackerDomainsSet.add('Blocked Local/File Resource');
        } else if (lowerSrc.startsWith('http://') || lowerSrc.startsWith('https://')) {
          try {
            const url = new URL(src);
            trackerDomainsSet.add(url.hostname);
          } catch {
            trackerDomainsSet.add('Hidden Pixel Tracker');
          }
        } else {
          trackerDomainsSet.add('Hidden Pixel Tracker');
        }

        // Replace tracker/unsafe img with non-tracking empty placeholder
        img.setAttribute('src', 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7');
        img.setAttribute('alt', isUnsafeProtocol ? '🛡️ Engellenen Yerel Dosya' : '🛡️ Engellenen Takip Pikseli');
        img.setAttribute('style', 'display: none !important;');
        img.setAttribute('data-blocked-tracker', 'true');
      }
    });

    const finalResult: TrackerBlockerResult = {
      cleanHtml: doc.body.innerHTML,
      trackerCount,
      trackerDomains: Array.from(trackerDomainsSet),
    };
    if (trackerCache.size > 100) trackerCache.clear();
    trackerCache.set(htmlContent, finalResult);
    return finalResult;
  } catch (error) {
    console.error('Tracker blocker error:', error);
    return { cleanHtml: htmlContent, trackerCount: 0, trackerDomains: [] };
  }
};
