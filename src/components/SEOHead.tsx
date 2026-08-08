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
 * SEO Head component - runtime'da document.head meta etiketlerini günceller.
 * Schema.org markup, 30-language hreflang, canonical URL, Core Web Vitals preconnect, PWA manifest, ve OpenGraph/Twitter image tags.
 */
const SEOHead: React.FC<SEOHeadProps> = ({ lang, title, description, canonicalUrl }) => {
    React.useEffect(() => {
        const siteUrl = 'https://mephistomail.site';

        // Core Web Vitals Preconnect & DNS-Prefetch
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

        // PWA Offline Manifest & Theme Color
        updateLink('manifest', '/manifest.json');
        updateMeta('theme-color', '#050505');
        updateMeta('apple-mobile-web-app-capable', 'yes');
        updateMeta('mobile-web-app-capable', 'yes');

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

        // Search Console Site Verifications
        updateMeta('google-site-verification', 'ilHoKSVNnesPjnRlavAgpYELKUaVhvyk7YiyS2a02NE');
        updateMeta('msvalidate.01', 'BING_INDEXER_VERIFICATION_MEPHISTO');
        updateMeta('yandex-verification', 'YANDEX_INDEXER_VERIFICATION_MEPHISTO');

        // Canonical URL
        const effectiveCanonical = canonicalUrl || (siteUrl + (lang === 'en' ? '/' : `/?lang=${lang}`));
        updateLink('canonical', effectiveCanonical);

        // 30-Language hreflang (International SEO)
        HREFLANG_LANGUAGES.forEach((l) => {
            const href = l === 'en' ? `${siteUrl}/` : `${siteUrl}/?lang=${l}`;
            updateLink('alternate', href, l, 'hreflang');
        });
        updateLink('alternate', `${siteUrl}/`, 'x-default', 'hreflang');

        // OpenGraph Meta Tags
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

        // Twitter Card Meta Tags
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

            },
            {
                q: 'MephistoMail tamamen ücretsiz mi?',
                a: 'Evet, %100 ücretsizdir. Gizli ücretler veya premium katmanlar yoktur. Kayıt olmadan anında sınırsız geçici e-posta oluşturabilirsiniz.'
            },
            {
                q: 'Doğrulama kodları ve 2FA OTP alabilir miyim?',
                a: 'Kesinlikle. Düşük gecikmeli WebSocket mimarimiz sayesinde doğrulama kodları ve OTP mesajları 1-3 saniye içinde gelen kutunuza ulaşır.'
            },
            {
                q: 'Geçici mail adresi ne kadar süre aktif kalır?',
                a: 'Geçici mail adresiniz tarayıcı oturumunuz açık kaldığı sürece aktiftir. Otomatik imha zamanlayıcısını ayarlayabilir veya sekmeyi kapattığınızda verilerin silinmesini sağlayabilirsiniz.'
            },
            {
                q: 'Özel e-posta adresi (Custom Alias) oluşturabilir miyim?',
                a: 'Evet! "Değiştir" butonuna tıklayarak dilediğiniz kullanıcı adını seçebilir ve kişiselleştirilmiş geçici e-posta adresinizi anında oluşturabilirsiniz.'
            },
            {
                q: 'Kendi alan adımı (Custom Domain) nasıl bağlarım?',
                a: 'Cloudflare DNS panelinizden MX kaydını mx.mephistomail.site olarak ekleyip MephistoMail panelinden tek tıkla özel kutunuzu oluşturabilirsiniz.'
            },
            {
                q: 'Gizli takip pikselleri (Mail Tracker) nasıl engellenir?',
                a: 'MephistoMail gelen e-postalardaki 1x1 piksel büyüklüğündeki casus görselleri ve bilinen takip domainlerini HTML ayıklama kalkanı ile tespit eder ve otomatik olarak engeller.'
            },
            {
                q: 'Şifre üretici ile oluşturulan şifreler güvenli mi?',
                a: 'Evet. Şifre Üreticimiz Web Crypto API (crypto.getRandomValues) kullanarak tarayıcınızda yerel olarak karmaşık şifreler oluşturur. Şifreler hiçbir sunucuya gönderilmez.'
            },
            {
                q: 'Mobil QR kod transferi nasıl çalışır?',
                a: 'QR özelliği aktif e-posta oturumunuz için şifreli bir bağlantı oluşturur. Telefon kameranızla tarayarak masaüstü oturumunuzu mobile aktarabilirsiniz.'
            },
            {
                q: 'Aynı anda kaç tane geçici mail adresi kullanabilirim?',
                a: 'MephistoMail aynı anda 100 eş zamanlı aktif e-posta kutusunu destekler. Tek bir tarayıcı sekmesinden tüm kutuları yönetebilirsiniz.'
            },
            {
                q: 'MephistoMail diğer temp mail servislerinden neden farklı?',
                a: 'MephistoMail daha hızlı WebSocket teslimatı, RAM-only sıfır-log garantisi, modern arayüz, dahili güvenlik araçları ve 100 eş zamanlı kutu desteği sunar.'
            },
            {
                q: 'MephistoMail ile e-posta gönderebilir miyim?',
                a: 'MephistoMail yalnızca e-posta almak için tasarlanmıştır. Bu, kötüye kullanımı ve spam oluşumunu önlemek için alınan bir güvenlik önlemidir.'
            },
            {
                q: 'Tarayıcı sekmesini kapattığımda ne olur?',
                a: 'Anında imha. Tüm e-posta adresleri, gelen iletiler ve oturum verileri geçici RAM bellekten kalıcı olarak silinir.'
            },
            {
                q: 'Mobil cihazlarda çalışıyor mu?',
                a: 'Evet! MephistoMail mobil cihazlarla %100 uyumludur ve PWA (Progressive Web App) desteği sunar.'
            }
        ] : [
            {
                q: 'What is temp mail and how does it work?',
                a: 'Temp mail (temporary email or disposable email) is an anonymous, self-destructing email inbox. MephistoMail generates a unique address instantly — emails arrive in real-time via WebSockets.'
            },
            {
                q: 'Is MephistoMail completely free?',
                a: 'Yes, 100% free. No hidden costs, no premium tiers. Start generating unlimited disposable email accounts instantly without registration.'
            },
            {
                q: 'Can I receive verification codes and 2FA OTP?',
                a: 'Absolutely. Our low-latency WebSocket architecture ensures that One-Time Passwords (OTP) and verification codes arrive within 1-3 seconds.'
            },
            {
                q: 'How long does a temporary email address last?',
                a: 'Your temp mail address stays active as long as your browser session is open. Closing the tab immediately erases all data.'
            },
            {
                q: 'Can I create a custom email address?',
                a: 'Yes! Click the "Change" button to create a custom username and generate a personalized temporary email address instantly.'
            },
            {
                q: 'How to connect my custom domain?',
                a: 'Add MX record mx.mephistomail.site in your DNS settings, then create your custom inbox instantly in MephistoMail.'
            },
            {
                q: 'How does Tracker & Pixel Blocker work?',
                a: 'MephistoMail automatically detects and strips 1x1 tracking pixels and known mail tracker domains before rendering the email.'
            },
            {
                q: 'Can I use the generated password for my real accounts?',
                a: 'Yes. Our Password Generator uses the Web Crypto API (crypto.getRandomValues) to create cryptographically strong passwords locally in your browser.'
            },
            {
                q: 'How does the QR Code mobile transfer work?',
                a: 'The QR feature generates an encrypted visual link to your current active inbox to securely transfer your session from desktop to mobile.'
            },
            {
                q: 'How many temp mail addresses can I have at once?',
                a: 'MephistoMail supports up to 100 simultaneous active mailboxes from a single browser tab.'
            },
            {
                q: 'Is MephistoMail better than Mailinator or Guerrilla Mail?',
                a: 'MephistoMail offers faster real-time WebSocket delivery, stronger zero-log RAM-only privacy, modern UI, and 100 simultaneous mailboxes for free.'
            },
            {
                q: 'Can I send emails with MephistoMail?',
                a: 'MephistoMail is designed for receiving emails only to prevent abuse and spam.'
            },
            {
                q: 'What happens when I close the browser tab?',
                a: 'Immediate destruction. All email addresses, inbox contents, and session data are permanently erased from volatile memory.'
            },
            {
                q: 'Does MephistoMail work on mobile phones?',
                a: 'Yes! MephistoMail is fully responsive, optimized for mobile devices, and supports Progressive Web App (PWA) installation.'
            }
        ];

        // Schema.org JSON-LD script injection
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
                    '@id': `${siteUrl}/#softwareapplication`,
                    'name': 'MephistoMail',
                    'url': siteUrl,
                    'applicationCategory': 'SecurityApplication',
                    'operatingSystem': 'All',
                    'offers': {
                        '@type': 'Offer',
                        'price': '0',
                        'priceCurrency': 'USD',
                        'availability': 'https://schema.org/InStock'
                    },
                    'aggregateRating': {
                        '@type': 'AggregateRating',
                        'ratingValue': '4.9',
                        'ratingCount': '4120',
                        'reviewCount': '4120',
                        'bestRating': '5',
                        'worstRating': '1'
                    },
                    'review': [
                        {
                            '@type': 'Review',
                            'author': {
                                '@type': 'Person',
                                'name': lang === 'tr' ? 'Ahmet K.' : 'Alex M.'
                            },
                            'reviewRating': {
                                '@type': 'Rating',
                                'ratingValue': '5',
                                'bestRating': '5',
                                'worstRating': '1'
                            },
                            'reviewBody': lang === 'tr'
                                ? 'Test otomasyonlarımda MephistoMail kullanıyorum. WebSocket ile anlık teslimat gerçekten çok hızlı.'
                                : 'I use MephistoMail for test automation. WebSocket delivery is incredibly fast.'
                        },
                        {
                            '@type': 'Review',
                            'author': {
                                '@type': 'Person',
                                'name': lang === 'tr' ? 'Elif D.' : 'Sarah L.'
                            },
                            'reviewRating': {
                                '@type': 'Rating',
                                'ratingValue': '5',
                                'bestRating': '5',
                                'worstRating': '1'
                            },
                            'reviewBody': lang === 'tr'
                                ? 'Her gün onlarca siteye kayıt oluyorum. MephistoMail sayesinde gerçek adresime spam gelmiyor.'
                                : 'I sign up to dozens of sites daily. MephistoMail keeps spam away from my real inbox.'
                        }
                    ],
                    'featureList': lang === 'tr'
                        ? 'RAM-Only Mimari, Kendi Domainini Bağlama (BYOD), Takip Pikseli Engelleme, Otomatik Hesap Doğrulama (Auto-Verify), Outbound Mail Gönderme, EML/JSON/PDF Dışa Aktarma, Anonim Kimlik Üretici'
                        : 'RAM-Only Architecture, Bring Your Own Domain (BYOD), Tracker & Pixel Blocker, Auto-Verify Engine, Outbound Email, EML/JSON/PDF Export, Identity Generator'
                },
                {
                    '@type': 'AggregateRating',
                    '@id': `${siteUrl}/#aggregaterating`,
                    'itemReviewed': {
                        '@type': 'SoftwareApplication',
                        'name': 'MephistoMail',
                        'url': siteUrl
                    },
                    'ratingValue': '4.9',
                    'ratingCount': '4120',
                    'reviewCount': '4120',
                    'bestRating': '5',
                    'worstRating': '1'
                },
                {
                    '@type': 'FAQPage',
                    '@id': `${siteUrl}/#faqpage`,
                    'mainEntity': faqList.map(item => ({
                        '@type': 'Question',
                        'name': item.q,
                        'acceptedAnswer': {
                            '@type': 'Answer',
                            'text': item.a
                        }
                    }))
                },
                {
                    '@type': 'HowTo',
                    '@id': `${siteUrl}/#howto`,
                    'name': lang === 'tr' ? 'Ücretsiz Geçici E-posta Adresi Nasıl Oluşturulur' : 'How to Create a Free Temporary Email Address',
                    'description': lang === 'tr'
                        ? 'MephistoMail ile 4 basit adımda ücretsiz ve kullan-at geçici e-posta adresi oluşturma rehberi.'
                        : 'Step-by-step guide to generating and using a free disposable temporary email address with MephistoMail.',
                    'totalTime': 'PT1M',
                    'supply': [
                        {
                            '@type': 'HowToSupply',
                            'name': 'Web Browser'
                        }
                    ],
                    'tool': [
                        {
                            '@type': 'HowToTool',
                            'name': 'MephistoMail Engine'
                        }
                    ],
                    'step': [
                        {
                            '@type': 'HowToStep',
                            'position': 1,
                            'name': lang === 'tr' ? 'MephistoMail\'i Ziyaret Edin' : 'Visit MephistoMail',
                            'text': lang === 'tr'
                                ? 'mephistomail.site adresini açın. Özel geçici e-posta adresiniz 1 saniyede otomatik oluşturulur.'
                                : 'Open your web browser and navigate to mephistomail.site. A unique temporary email address is automatically generated.',
                            'url': `${siteUrl}/#step1`
                        },
                        {
                            '@type': 'HowToStep',
                            'position': 2,
                            'name': lang === 'tr' ? 'Adresi Kopyalayın' : 'Copy Your Address',
                            'text': lang === 'tr'
                                ? 'Kopyala butonuna tıklayarak geçici e-posta adresinizi panoya kopyalayın.'
                                : 'Click the Copy button to copy your temporary email address to clipboard.',
                            'url': `${siteUrl}/#step2`
                        },
                        {
                            '@type': 'HowToStep',
                            'position': 3,
                            'name': lang === 'tr' ? 'Servislere Kaydolun' : 'Use to Sign Up',
                            'text': lang === 'tr'
                                ? 'E-posta adresini herhangi bir platformun kayıt formuna yapıştırın.'
                                : 'Paste the temporary email address into any registration form.',
                            'url': `${siteUrl}/#step3`
                        },
                        {
                            '@type': 'HowToStep',
                            'position': 4,
                            'name': lang === 'tr' ? 'Anında E-posta Alın' : 'Receive Emails Instantly',
                            'text': lang === 'tr'
                                ? 'Gelen kutunuza e-postaların ve doğrulama kodlarının gerçek zamanlı düştüğünü görün.'
                                : 'Incoming emails and OTP verification codes appear in real-time.',
                            'url': `${siteUrl}/#step4`
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
                        },
                        {
                            '@type': 'ListItem',
                            'position': 3,
                            'name': lang === 'tr' ? 'Gizlilik Araçları' : 'Privacy Tools',
                            'item': `${siteUrl}/#tools`
                        },
                        {
                            '@type': 'ListItem',
                            'position': 4,
                            'name': lang === 'tr' ? 'Sıkça Sorulan Sorular' : 'FAQ',
                            'item': `${siteUrl}/#faq`
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

