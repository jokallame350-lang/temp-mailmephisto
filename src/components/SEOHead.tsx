import React from 'react';
import { Language } from '../translations';

interface SEOHeadProps {
    lang: Language;
    title?: string;
    description?: string;
    canonicalUrl?: string;
}

/**
 * SEO Head component - runtime'da document.head meta etiketlerini günceller.
 * Schema.org markup, hreflang, canonical URL, ve dil bazlı meta taglar.
 */
const SEOHead: React.FC<SEOHeadProps> = ({ lang, title, description, canonicalUrl }) => {
    React.useEffect(() => {
        const siteUrl = 'https://mephistomail.site';

        // Title
        document.title = title || (lang === 'tr'
            ? 'MephistoMail - Gizliliğiniz İçin En Güvenli Geçici E-posta'
            : 'MephistoMail - The Ultimate Privacy Focused Disposable Email');

        // Meta description
        updateMeta('description', description || (lang === 'tr'
            ? 'Hızlı, anonim ve geçici e-posta adresleri. Takip yok, kayıt yok. Birincil gelen kutunuzu spam\'den koruyun. Anında kullan-at e-posta oluşturun.'
            : 'Quick, anonymous, and volatile temporary emails. No tracking, no logs. Protect your primary inbox from spam. Generate disposable email instantly.'));

        // Keywords
        updateMeta('keywords', lang === 'tr'
            ? 'geçici e-posta, kullan at mail, temp mail, anonim e-posta, sahte mail, güvenli e-posta, gizlilik, disposable email'
            : 'temp mail, temporary email, disposable email, fake email, anonymous email, privacy, burner email, throwaway email');

        // Google Site Verification
        updateMeta('google-site-verification', 'ilHoKSVNnesPjnRlavAgpYELKUaVhvyk7YiyS2a02NE');

        // Canonical
        updateLink('canonical', canonicalUrl || (siteUrl + '/'));

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
            ? 'Gerçek e-postanızı vermeyi bırakın. Anonim kalın. Sınırsız, ücretsiz ve anlık geçici e-postalar.'
            : 'Stop giving away your real email. Use Mephisto to stay anonymous. Unlimited, free, and instant disposable emails.', 'property');
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
        const mainSchema = {
            '@context': 'https://schema.org',
            '@graph': [
                {
                    '@type': 'SoftwareApplication',
                    'name': 'MephistoMail',
                    'url': siteUrl,
                    'applicationCategory': 'SecurityApplication',
                    'operatingSystem': 'All',
                    'offers': {
                        '@type': 'Offer',
                        'price': '0',
                        'priceCurrency': 'USD',
                    },
                    'aggregateRating': {
                        '@type': 'AggregateRating',
                        'ratingValue': '4.9',
                        'ratingCount': '1420'
                    },
                    'featureList': lang === 'tr'
                        ? 'RAM-Only Mimari, Kendi Domainini Bağlama (BYOD), Takip Pikseli Engelleme, Otomatik Hesap Doğrulama (Auto-Verify), Outbound Mail Gönderme, EML/JSON/PDF Dışa Aktarma, Anonim Kimlik Üretici'
                        : 'RAM-Only Architecture, Bring Your Own Domain (BYOD), Tracker & Pixel Blocker, Auto-Verify Engine, Outbound Email, EML/JSON/PDF Export, Identity Generator'
                },
                {
                    '@type': 'FAQPage',
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
                }
            ]
        };
        schemaScript.textContent = JSON.stringify(mainSchema);
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
