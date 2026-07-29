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

export interface TrackerBlockerResult {
  cleanHtml: string;
  trackerCount: number;
  trackerDomains: string[];
}

export const sanitizeAndBlockTrackers = (htmlContent: string): TrackerBlockerResult => {
  if (!htmlContent) {
    return { cleanHtml: '', trackerCount: 0, trackerDomains: [] };
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
      const src = (img.getAttribute('src') || '').toLowerCase();
      const widthAttr = img.getAttribute('width');
      const heightAttr = img.getAttribute('height');
      const style = (img.getAttribute('style') || '').toLowerCase();

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
      const matchedDomain = KNOWN_TRACKER_DOMAINS.find(domain => src.includes(domain));

      if (isOnePixel || matchedDomain) {
        trackerCount++;
        if (matchedDomain) {
          trackerDomainsSet.add(matchedDomain);
        } else {
          try {
            const url = new URL(src);
            trackerDomainsSet.add(url.hostname);
          } catch {
            trackerDomainsSet.add('Hidden Pixel Tracker');
          }
        }

        // Replace tracker img with non-tracking empty placeholder
        img.setAttribute('src', 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7');
        img.setAttribute('alt', '🛡️ Engellenen Takip Pikseli');
        img.setAttribute('style', 'display: none !important;');
        img.setAttribute('data-blocked-tracker', 'true');
      }
    });

    return {
      cleanHtml: doc.body.innerHTML,
      trackerCount,
      trackerDomains: Array.from(trackerDomainsSet),
    };
  } catch (error) {
    console.error('Tracker blocker error:', error);
    return { cleanHtml: htmlContent, trackerCount: 0, trackerDomains: [] };
  }
};
