import { EmailDetail } from '../types';
import { Language } from '../translations';
import DOMPurify from 'dompurify';

/**
 * Utility functions for exporting emails into RFC 822/5322 EML, JSON, TXT, and PDF/Print formats.
 */

export interface PrintLabels {
  from: string;
  date: string;
  category: string;
  noSubject: string;
  defaultTitle: string;
}

export const PRINT_LABELS: Record<Language, PrintLabels> = {
  en: { from: 'From', date: 'Date', category: 'Category', noSubject: '(No Subject)', defaultTitle: 'Email Print' },
  tr: { from: 'Kimden', date: 'Tarih', category: 'Kategori', noSubject: '(Konu Yok)', defaultTitle: 'E-posta Yazdır' },
  es: { from: 'De', date: 'Fecha', category: 'Categoría', noSubject: '(Sin Asunto)', defaultTitle: 'Imprimir correo' },
  de: { from: 'Von', date: 'Datum', category: 'Kategorie', noSubject: '(Kein Betreff)', defaultTitle: 'E-Mail drucken' },
  fr: { from: 'De', date: 'Date', category: 'Catégorie', noSubject: '(Sans objet)', defaultTitle: 'Imprimer l\'e-mail' },
  it: { from: 'Da', date: 'Data', category: 'Categoria', noSubject: '(Nessun oggetto)', defaultTitle: 'Stampa email' },
  pt: { from: 'De', date: 'Data', category: 'Categoria', noSubject: '(Sem Assunto)', defaultTitle: 'Imprimir e-mail' },
  ru: { from: 'От', date: 'Дата', category: 'Категория', noSubject: '(Без темы)', defaultTitle: 'Печать письма' },
  ar: { from: 'من', date: 'التاريخ', category: 'الفئة', noSubject: '(بلا موضوع)', defaultTitle: 'طباعة البريد' },
};

export const LOCALE_MAP: Record<Language, string> = {
  en: 'en-US',
  tr: 'tr-TR',
  es: 'es-ES',
  de: 'de-DE',
  fr: 'fr-FR',
  it: 'it-IT',
  pt: 'pt-BR',
  ru: 'ru-RU',
  ar: 'ar-SA',
};

// Helper to trigger browser file download
const triggerDownload = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// Export as RFC 5322/2822 EML file (standard format with Date, From, To, Subject, MIME-Version, Content-Type, and body)
export const downloadAsEML = (email: EmailDetail) => {
  const senderAddress = typeof email.from === 'string' ? email.from : email.from.address;
  const senderName = typeof email.from === 'object' && email.from.name ? email.from.name : '';
  const fromHeader = senderName ? `"${senderName}" <${senderAddress}>` : senderAddress;
  const toHeader = email.headerFields?.to || email.headerFields?.To || (email as any).to || 'Undisclosed-recipients:;';

  const htmlBody = email.html && email.html.length > 0 ? (typeof email.html[0] === 'string' ? email.html[0] : JSON.stringify(email.html[0])) : '';
  const textBody = email.text || email.intro || '';

  const emlLines: string[] = [
    `Date: ${new Date(email.createdAt).toUTCString()}`,
    `From: ${fromHeader}`,
    `To: ${toHeader}`,
    `Subject: ${email.subject || '(No Subject)'}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/alternative; boundary="----=_MephistoMail_Boundary"`,
    `X-Mailer: MephistoMail Privacy Shield`,
    ``,
    `------=_MephistoMail_Boundary`,
    `Content-Type: text/plain; charset=UTF-8`,
    `Content-Transfer-Encoding: 8bit`,
    ``,
    textBody,
    ``,
  ];

  if (htmlBody) {
    emlLines.push(
      `------=_MephistoMail_Boundary`,
      `Content-Type: text/html; charset=UTF-8`,
      `Content-Transfer-Encoding: 8bit`,
      ``,
      htmlBody,
      ``
    );
  }

  emlLines.push(`------=_MephistoMail_Boundary--`);

  const filename = `${(email.subject || 'email').replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${email.id.substring(0, 8)}.eml`;
  triggerDownload(emlLines.join('\r\n'), filename, 'message/rfc822');
};

// Export as structured JSON dump
export const downloadAsJSON = (email: EmailDetail) => {
  const jsonContent = JSON.stringify(email, null, 2);
  const filename = `${(email.subject || 'email').replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${email.id.substring(0, 8)}.json`;
  triggerDownload(jsonContent, filename, 'application/json');
};

// Export as plain text TXT file
export const downloadAsTXT = (email: EmailDetail) => {
  const senderAddress = typeof email.from === 'string' ? email.from : email.from.address;
  const senderName = typeof email.from === 'object' && email.from.name ? email.from.name : '';
  const fromHeader = senderName ? `"${senderName}" <${senderAddress}>` : senderAddress;
  const toHeader = email.headerFields?.to || email.headerFields?.To || (email as any).to || '';

  const plainText = email.text || email.intro || (email.html && email.html[0] ? (typeof email.html[0] === 'string' ? email.html[0].replace(/<[^>]*>/g, '') : '') : '');

  const txtLines: string[] = [
    `From: ${fromHeader}`,
    ...(toHeader ? [`To: ${toHeader}`] : []),
    `Date: ${new Date(email.createdAt).toLocaleString()}`,
    `Subject: ${email.subject || '(No Subject)'}`,
    `--------------------------------------------------`,
    ``,
    plainText,
  ];

  const filename = `${(email.subject || 'email').replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${email.id.substring(0, 8)}.txt`;
  triggerDownload(txtLines.join('\r\n'), filename, 'text/plain;charset=utf-8');
};

/**
 * Sanitize HTML content safely in browser and Node environments
 */
export const sanitizePrintHtml = (rawHtml: string): string => {
  if (typeof DOMPurify !== 'undefined' && typeof (DOMPurify as any).sanitize === 'function') {
    return (DOMPurify as any).sanitize(rawHtml, {
      USE_PROFILES: { html: true },
      FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'textarea', 'button'],
      FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'onsubmit'],
      ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|data:image\/(?:png|jpeg|jpg|gif|svg\+xml|webp);base64,)/i,
      ALLOW_DATA_ATTR: false,
      ADD_ATTR: ['target'],
    });
  }

  // Robust fallback for non-DOM test runners
  return rawHtml
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, '')
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
};

/**
 * Generate sanitized and localized HTML document for printing or PDF export
 */
export const generateEmailPrintHTML = (
  email: EmailDetail,
  lang: Language = 'en',
  customLabels?: Partial<PrintLabels>
): string => {
  const currentLang = (lang in PRINT_LABELS ? lang : 'en') as Language;
  const baseLabels = PRINT_LABELS[currentLang] || PRINT_LABELS.en;
  const labels: PrintLabels = { ...baseLabels, ...customLabels };
  const localeStr = LOCALE_MAP[currentLang] || 'en-US';

  const senderStr = typeof email.from === 'string' ? email.from : `${email.from?.name || ''} <${email.from?.address || ''}>`.trim();
  const rawBodyContent = (email.html && email.html.length > 0)
    ? (typeof email.html[0] === 'string' ? email.html[0] : JSON.stringify(email.html[0]))
    : `<p style="white-space: pre-wrap;">${email.text || email.intro || ''}</p>`;

  const sanitizedBody = sanitizePrintHtml(rawBodyContent);
  const formattedDate = new Date(email.createdAt).toLocaleString(localeStr);
  const displaySubject = email.subject || labels.noSubject;

  return `<!DOCTYPE html>
<html dir="${currentLang === 'ar' ? 'rtl' : 'ltr'}" lang="${currentLang}">
  <head>
    <title>${email.subject || labels.defaultTitle}</title>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 24px; color: #1e293b; background: #ffffff; }
      .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 20px; }
      .title { font-size: 20px; font-weight: bold; margin-bottom: 8px; }
      .meta { font-size: 13px; color: #64748b; line-height: 1.6; }
      .body-box { font-size: 14px; line-height: 1.6; margin-top: 20px; }
      .footer { margin-top: 40px; padding-top: 12px; border-top: 1px solid #cbd5e1; font-size: 11px; color: #94a3b8; text-align: center; }
    </style>
  </head>
  <body>
    <div class="header">
      <div class="title">${displaySubject}</div>
      <div class="meta">
        <div><strong>${labels.from}:</strong> ${senderStr}</div>
        <div><strong>${labels.date}:</strong> ${formattedDate}</div>
        <div><strong>${labels.category}:</strong> ${email.aiCategory}</div>
      </div>
    </div>
    <div class="body-box">
      ${sanitizedBody}
    </div>
    <div class="footer">
      MephistoMail Privacy Shield — mephistomail.site
    </div>
  </body>
</html>`;
};

// Print / Save as PDF via browser print dialogue
export const printEmailContent = (email: EmailDetail, lang?: Language) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const html = generateEmailPrintHTML(email, lang || 'en');
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 300);
};
