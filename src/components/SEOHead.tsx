import React from 'react';
import { Language } from '../translations';

interface SEOHeadProps {
    lang: Language;
    title?: string;
    description?: string;
    canonicalUrl?: string;
}

const HREFLANG_LANGUAGES = [
    'en', 'tr', 'es', 'de', 'fr', 'it', 'pt', 'ru', 'ar', 'zh',
    'ja', 'ko', 'nl', 'pl', 'uk', 'hi', 'id', 'vi', 'th', 'sv',
    'da', 'fi', 'no', 'cs', 'el', 'ro', 'hu', 'he', 'bn', 'fa'
] as const;

/**
 * Technical SEO & Performance Head component - updates document.head meta tags at runtime.
 * Handles Schema.org JSON-LD, 30-language hreflang tags, canonical URLs,
 * PWA offline manifest, Core Web Vitals preconnects, and OpenGraph/Twitter Card meta tags.
 */
const SEOHead: React.FC<SEOHeadProps> = ({ lang, title, description, canonicalUrl }) => {
    React.useEffect(() => {
        const siteUrl = 'https://mephistomail.site';

        // ========== CORE WEB VITALS PRECONNECT & DNS-PREFETCH ==========
        updateLink('preconnect', 'https://fonts.googleapis.com', undefined, undefined, 'crossorigin');
        updateLink('preconnect', 'https://fonts.gstatic.com', undefined, undefined, 'crossorigin');
        updateLink('preconnect', 'https://api.mail.tm');
        updateLink('preconnect', 'https://api.mail.gw');
        updateLink('preconnect', 'https://api.guerrillamail.com');
        updateLink('preconnect', 'https://pagead2.googlesyndication.com', undefined, undefined, 'crossorigin');
        updateLink('dns-prefetch', 'https://fonts.googleapis.com');
        updateLink('dns-prefetch', 'https://fonts.gstatic.com');
        updateLink('dns-prefetch', 'https://www.googletagmanager.com');
        updateLink('dns-prefetch', 'https://www.google-analytics.com');
        updateLink('dns-prefetch', 'https://pagead2.googlesyndication.com');
        updateLink('dns-prefetch', 'https://googleads.g.doubleclick.net');

        // ========== PWA OFFLINE MANIFEST & MOBILE META ==========
        updateLink('manifest', '/manifest.json');
        updateMeta('theme-color', '#050505');
        updateMeta('apple-mobile-web-app-capable', 'yes');
        updateMeta('mobile-web-app-capable', 'yes');
        updateMeta('apple-mobile-web-app-status-bar-style', 'black-translucent');
        updateMeta('apple-mobile-web-app-title', 'MephistoMail');
        updateMeta('application-name', 'MephistoMail');

        // ========== PRIMARY TITLE & META ==========
        document.title = title || (lang === 'tr'
            ? 'MephistoMail - Gizliliğiniz İçin En Güvenli Geçici E-posta'
            : 'MephistoMail - The Ultimate Privacy Focused Disposable Email');

        updateMeta('description', description || (lang === 'tr'
            ? 'Hızlı, anonim ve geçici e-posta adresleri. Takip yok, kayıt yok. Birincil gelen kutunuzu spam\'den koruyun. Anında kullan-at e-posta oluşturun.'
            : 'Quick, anonymous, and volatile temporary emails. No tracking, no logs. Protect your primary inbox from spam. Generate disposable email instantly.'));

        updateMeta('keywords', lang === 'tr'
            ? 'geçici e-posta, kullan at mail, temp mail, anonim e-posta, sahte mail, güvenli e-posta, gizlilik, disposable email'
            : 'temp mail, temporary email, disposable email, fake email, anonymous email, privacy, burner email, throwaway email');

        updateMeta('google-site-verification', 'ilHoKSVNnesPjnRlavAgpYELKUaVhvyk7YiyS2a02NE');
        updateMeta('msvalidate.01', 'BING_INDEXER_VERIFICATION_MEPHISTO');
        updateMeta('yandex-verification', 'YANDEX_INDEXER_VERIFICATION_MEPHISTO');

        // ========== CANONICAL URL ==========
        const effectiveCanonical = canonicalUrl || (siteUrl + (lang === 'en' ? '/' : `/?lang=${lang}`));
        updateLink('canonical', effectiveCanonical);

        // ========== 30-LANGUAGE HREFLANG ==========
        HREFLANG_LANGUAGES.forEach((l) => {
            const href = l === 'en' ? `${siteUrl}/` : `${siteUrl}/?lang=${l}`;
            updateLink('alternate', href, l, 'hreflang');
        });
        updateLink('alternate', `${siteUrl}/`, 'x-default', 'hreflang');

        // ========== OPEN GRAPH META TAGS ==========
        updateMeta('og:type', 'website', 'property');
        updateMeta('og:url', effectiveCanonical, 'property');
        updateMeta('og:site_name', 'MephistoMail', 'property');
        updateMeta('og:title', lang === 'tr'
            ? 'MephistoMail - Gizliliğiniz İçin Kullan-At E-posta'
            : 'MephistoMail - Privacy First Disposable Email', 'property');
        updateMeta('og:description', lang === 'tr'
            ? 'Gerçek e-postanızı vermeyi bırakın. Anonim kalın. Sınırsız, ücretsiz ve anlık geçici e-postalar.'
            : 'Stop giving away your real email. Use Mephisto to stay anonymous. Unlimited, free, and instant disposable emails.', 'property');
        updateMeta('og:locale', lang === 'tr' ? 'tr_TR' : 'en_US', 'property');
        updateMeta('og:locale:alternate', lang === 'tr' ? 'en_US' : 'tr_TR', 'property');
        updateMeta('og:image', `${siteUrl}/og-image.png`, 'property');
        updateMeta('og:image:secure_url', `${siteUrl}/og-image.png`, 'property');
        updateMeta('og:image:type', 'image/png', 'property');
        updateMeta('og:image:width', '1200', 'property');
        updateMeta('og:image:height', '630', 'property');
        updateMeta('og:image:alt', lang === 'tr' ? 'MephistoMail - Geçici E-posta Güvenlik Kalkanı' : 'MephistoMail - Free Temporary Disposable Email Service', 'property');

        // ========== TWITTER CARD META TAGS ==========
        updateMeta('twitter:card', 'summary_large_image');
        updateMeta('twitter:site', '@MephistoMail');
        updateMeta('twitter:creator', '@MephistoMail');
        updateMeta('twitter:url', effectiveCanonical);
        updateMeta('twitter:title', lang === 'tr'
            ? 'MephistoMail - Kullan-At E-posta'
            : 'MephistoMail - Disposable Email');
        updateMeta('twitter:description', lang === 'tr'
            ? 'Anonim, güvenli ve anlık geçici e-posta adresleri.'
            : 'Anonymous, secure and instant temporary email addresses.');
        updateMeta('twitter:image', `${siteUrl}/og-twitter.png`);
        updateMeta('twitter:image:alt', lang === 'tr' ? 'MephistoMail - Geçici E-posta Güvenlik Kalkanı' : 'MephistoMail - Temporary Email Privacy Shield');

        // HTML lang attribute
        document.documentElement.lang = lang;

        // ========== SCHEMA.ORG JSON-LD STRUCTURED DATA ==========
        let schemaScript = document.getElementById('schema-jsonld');
        if (!schemaScript) {
            schemaScript = document.createElement('script');
            schemaScript.id = 'schema-jsonld';
            schemaScript.setAttribute('type', 'application/ld+json');
            document.head.appendChild(schemaScript);
        }

        const mainSchema = {
            '@context': 'https://schema.org',
            '@graph': [
                {
                    '@type': 'WebSite',
                    '@id': `${siteUrl}/#website`,
                    'name': 'MephistoMail',
                    'alternateName': ['Temp Mail', 'Geçici Mail', 'Mephisto Temp Mail', 'Disposable Email'],
                    'url': siteUrl,
                    'inLanguage': lang
                },
                {
                    '@type': 'Organization',
                    '@id': `${siteUrl}/#organization`,
                    'name': 'MephistoMail',
                    'url': siteUrl,
                    'logo': `${siteUrl}/logo.svg`,
                    'image': `${siteUrl}/logo.svg`,
                    'description': lang === 'tr'
                        ? 'Gizlilik odaklı ücretsiz geçici e-posta servisi. Kayıt yok, takip yok.'
                        : 'Privacy-first free temporary and disposable email service. No logs, no tracking.'
                },
                {
                    '@type': 'SoftwareApplication',
                    '@id': `${siteUrl}/#software`,
                    'name': 'MephistoMail',
                    'url': siteUrl,
                    'applicationCategory': 'SecurityApplication',
                    'operatingSystem': 'All',
                    'offers': {
                        '@type': 'Offer',
                        'price': '0',
                        'priceCurrency': 'USD'
                    },
                    'aggregateRating': {
                        '@type': 'AggregateRating',
                        'ratingValue': '4.8',
                        'ratingCount': '2847',
                        'bestRating': '5',
                        'worstRating': '1'
                    },
                    'featureList': lang === 'tr'
                        ? 'RAM-Only Mimari, Kendi Domainini Bağlama (BYOD), Takip Pikseli Engelleme, Otomatik Hesap Doğrulama (Auto-Verify), Outbound Mail Gönderme, EML/JSON/PDF Dışa Aktarma, Anonim Kimlik Üretici'
                        : 'RAM-Only Architecture, Bring Your Own Domain (BYOD), Tracker & Pixel Blocker, Auto-Verify Engine, Outbound Email, EML/JSON/PDF Export, Identity Generator'
                },
                {
                    '@type': 'FAQPage',
                    '@id': `${siteUrl}/#faq`,
                    'mainEntity': [
                        {
                            '@type': 'Question',
                            'name': lang === 'tr' ? 'MephistoMail geçici mail servisi güvenli mi?' : 'Is MephistoMail temp mail secure?',
                            'acceptedAnswer': {
                                '@type': 'Answer',
                                'text': lang === 'tr'
                                    ? 'Evet. MephistoMail tüm verileri yalnızca RAM bellekte tutar. Disk kaydı ve IP loğu tutulmaz. Sekmeyi kapattığınızda tüm veriler anında imha edilir.'
                                    : 'Yes. MephistoMail stores all data strictly in volatile RAM. No disk logs or IP logs are saved. Closing your tab immediately wipes all data.'
                            }
                        },
                        {
                            '@type': 'Question',
                            'name': lang === 'tr' ? 'Kendi alan adımı (Custom Domain) nasıl bağlarım?' : 'How to connect my custom domain?',
                            'acceptedAnswer': {
                                '@type': 'Answer',
                                'text': lang === 'tr'
                                    ? 'Cloudflare DNS panelinizden MX kaydını mx.mephistomail.site olarak ekleyip MephistoMail panelinden tek tıkla özel kutunuzu oluşturabilirsiniz.'
                                    : 'Add MX record mx.mephistomail.site in your DNS settings, then create your custom inbox instantly in MephistoMail.'
                            }
                        },
                        {
                            '@type': 'Question',
                            'name': lang === 'tr' ? 'Gizli takip pikselleri (Mail Tracker) nasıl engellenir?' : 'How does Tracker & Pixel Blocker work?',
                            'acceptedAnswer': {
                                '@type': 'Answer',
                                'text': lang === 'tr'
                                    ? 'MephistoMail gelen e-postalardaki 1x1 piksel büyüklüğündeki casus görselleri ve bilinen takip domainlerini HTML ayıklama kalkanı ile tespit eder ve otomatik olarak engeller.'
                                    : 'MephistoMail automatically detects and strips 1x1 tracking pixels and known mail tracker domains before rendering the email.'
                            }
                        }
                    ]
                },
                {
                    '@type': 'HowTo',
                    '@id': `${siteUrl}/#howto`,
                    'name': lang === 'tr' ? 'Ücretsiz Geçici E-posta Adresi Nasıl Oluşturulur' : 'How to Create a Free Temporary Email Address',
                    'description': lang === 'tr'
                        ? 'MephistoMail ile ücretsiz ve kullan-at geçici e-posta adresi oluşturma adımları.'
                        : 'Step-by-step guide to generating and using a free disposable temporary email address with MephistoMail.',
                    'step': [
                        {
                            '@type': 'HowToStep',
                            'position': 1,
                            'name': lang === 'tr' ? 'MephistoMail\'i Ziyaret Edin' : 'Visit MephistoMail',
                            'text': lang === 'tr'
                                ? 'mephistomail.site adresini açın. Özel geçici e-posta adresiniz 1 saniyede otomatik oluşturulur.'
                                : 'Open your web browser and navigate to mephistomail.site. A unique temporary email address is automatically generated.'
                        },
                        {
                            '@type': 'HowToStep',
                            'position': 2,
                            'name': lang === 'tr' ? 'Adresi Kopyalayın' : 'Copy Your Address',
                            'text': lang === 'tr'
                                ? 'Kopyala butonuna tıklayarak geçici e-posta adresinizi panoya kopyalayın.'
                                : 'Click the Copy button to copy your temporary email address to clipboard.'
                        },
                        {
                            '@type': 'HowToStep',
                            'position': 3,
                            'name': lang === 'tr' ? 'Servislere Kaydolun' : 'Use to Sign Up',
                            'text': lang === 'tr'
                                ? 'E-posta adresini herhangi bir platformun kayıt formuna yapıştırın.'
                                : 'Paste the temporary email address into any registration form.'
                        },
                        {
                            '@type': 'HowToStep',
                            'position': 4,
                            'name': lang === 'tr' ? 'Anında E-posta Alın' : 'Receive Emails Instantly',
                            'text': lang === 'tr'
                                ? 'Gelen kutunuza e-postaların ve doğrulama kodlarının gerçek zamanlı düştüğünü görün.'
                                : 'Incoming emails and OTP verification codes appear in real-time.'
                        }
                    ]
                },
                {
                    '@type': 'BreadcrumbList',
                    '@id': `${siteUrl}/#breadcrumblist`,
                    'itemListElement': [
                        {
                            '@type': 'ListItem',
                            'position': 1,
                            'name': lang === 'tr' ? 'Ana Sayfa' : 'Home',
                            'item': `${siteUrl}/`
                        },
                        {
                            '@type': 'ListItem',
                            'position': 2,
                            'name': lang === 'tr' ? 'Geçici Mail' : 'Temp Mail',
                            'item': `${siteUrl}/`
                        }
                    ]
                }
            ]
        };
        schemaScript.textContent = JSON.stringify(mainSchema);
    }, [lang, title, description, canonicalUrl]);

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

function updateLink(rel: string, href: string, hreflang?: string, attrName?: string, crossorigin?: string) {
    const selector = hreflang && attrName
        ? `link[rel="${rel}"][${attrName}="${hreflang}"]`
        : `link[rel="${rel}"][href="${href}"]`;

    let link = document.querySelector(selector) as HTMLLinkElement;
    if (!link) {
        link = document.createElement('link');
        link.rel = rel;
        if (hreflang && attrName) link.setAttribute(attrName, hreflang);
        if (crossorigin) link.setAttribute('crossorigin', crossorigin);
        document.head.appendChild(link);
    }
    link.href = href;
}

export default SEOHead;
