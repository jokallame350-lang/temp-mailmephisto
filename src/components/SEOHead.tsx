import React from 'react';
import { Language } from '../translations';

interface SEOHeadProps {
    lang: Language;
}

/**
 * SEO Head component - runtime'da document.head meta etiketlerini günceller.
 * Schema.org markup, hreflang, canonical URL, ve dil bazlı meta taglar.
 */
const SEOHead: React.FC<SEOHeadProps> = ({ lang }) => {
    React.useEffect(() => {
        const siteUrl = 'https://mephistomail.site';

        // Title
        document.title = lang === 'tr'
            ? 'MephistoMail - Gizliliğiniz İçin Nihai Kalkan | Geçici E-posta'
            : 'MephistoMail - The Ultimate Shield For Your Privacy | Disposable Email';

        // Meta description
        updateMeta('description', lang === 'tr'
            ? 'Hızlı, anonim ve geçici e-posta adresleri. Takip yok, kayıt yok. Birincil gelen kutunuzu spam\'den koruyun. Anında kullan-at e-posta oluşturun.'
            : 'Quick, anonymous, and volatile temporary emails. No tracking, no logs. Protect your primary inbox from spam. Generate disposable email instantly.');

        // Keywords
        updateMeta('keywords', lang === 'tr'
            ? 'geçici e-posta, kullan at mail, temp mail, anonim e-posta, sahte mail, güvenli e-posta, gizlilik, disposable email'
            : 'temp mail, temporary email, disposable email, fake email, anonymous email, privacy, burner email, throwaway email');

        // Google Site Verification
        updateMeta('google-site-verification', 'ilHoKSVNnesPjnRlavAgpYELKUaVhvyk7YiyS2a02NE');

        // Canonical
        updateLink('canonical', siteUrl + '/');

        // hreflang
        updateLink('alternate', siteUrl + '/', 'en', 'hreflang');
        updateLink('alternate', siteUrl + '/?lang=tr', 'tr', 'hreflang');
        updateLink('alternate', siteUrl + '/?lang=es', 'es', 'hreflang');
        updateLink('alternate', siteUrl + '/?lang=de', 'de', 'hreflang');
        updateLink('alternate', siteUrl + '/?lang=fr', 'fr', 'hreflang');
        updateLink('alternate', siteUrl + '/', 'x-default', 'hreflang');

        // OG tags
        updateMeta('og:title', lang === 'tr'
            ? 'MephistoMail - Gizliliğiniz İçin Kullan-At E-posta'
            : 'MephistoMail - Privacy First Disposable Email', 'property');
        updateMeta('og:description', lang === 'tr'
            ? 'Gerçek e-postanızı vermeyi bırakın. Anonim kalın. Takip yok, kayıt yok.'
            : 'Stop giving away your real email. Use Mephisto to stay anonymous. No logs, no tracking.', 'property');
        updateMeta('og:locale', lang === 'tr' ? 'tr_TR' : 'en_US', 'property');
        updateMeta('og:locale:alternate', lang === 'tr' ? 'en_US' : 'tr_TR', 'property');

        // Twitter
        updateMeta('twitter:title', lang === 'tr'
            ? 'MephistoMail - Kullan-At E-posta'
            : 'MephistoMail - Disposable Email');
        updateMeta('twitter:description', lang === 'tr'
            ? 'Anonim, güvenli ve anlık geçici e-posta adresleri.'
            : 'Anonymous, secure and instant temporary email addresses.');

        // HTML lang attribute
        document.documentElement.lang = lang;

        // Schema.org JSON-LD
        let schemaScript = document.getElementById('schema-jsonld');
        if (!schemaScript) {
            schemaScript = document.createElement('script');
            schemaScript.id = 'schema-jsonld';
            schemaScript.setAttribute('type', 'application/ld+json');
            document.head.appendChild(schemaScript);
        }
        schemaScript.textContent = JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            'name': 'MephistoMail',
            'url': siteUrl,
            'description': lang === 'tr'
                ? 'Geçici e-posta adresi oluşturma servisi. Anonim, güvenli ve ücretsiz.'
                : 'Disposable email address generator. Anonymous, secure and free.',
            'applicationCategory': 'UtilitiesApplication',
            'operatingSystem': 'All',
            'browserRequirements': 'Requires JavaScript',
            'offers': {
                '@type': 'Offer',
                'price': '0',
                'priceCurrency': 'USD',
            },
            'author': {
                '@type': 'Organization',
                'name': 'MephistoMail',
                'url': siteUrl,
            },
            'inLanguage': [lang === 'tr' ? 'tr-TR' : 'en-US'],
            'isAccessibleForFree': true,
        });
    }, [lang]);

    return null;
};

function updateMeta(name: string, content: string, attr: string = 'name') {
    let meta = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement;
    if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attr, name);
        document.head.appendChild(meta);
    }
    meta.content = content;
}

function updateLink(rel: string, href: string, hreflang?: string, attrName?: string) {
    const selector = hreflang && attrName
        ? `link[rel="${rel}"][${attrName}="${hreflang}"]`
        : `link[rel="${rel}"]:not([hreflang])`;

    let link = document.querySelector(selector) as HTMLLinkElement;
    if (!link) {
        link = document.createElement('link');
        link.rel = rel;
        if (hreflang && attrName) link.setAttribute(attrName, hreflang);
        document.head.appendChild(link);
    }
    link.href = href;
}

export default SEOHead;
