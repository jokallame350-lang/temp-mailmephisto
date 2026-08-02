import { EmailDetail } from '../types';
import DOMPurify from 'dompurify';

/**
 * Utility functions for exporting emails into EML, JSON, and PDF/Print formats.
 */

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

// Export as RFC 822 EML file
export const downloadAsEML = (email: EmailDetail) => {
  const senderAddress = typeof email.from === 'string' ? email.from : email.from.address;
  const senderName = typeof email.from === 'object' && email.from.name ? email.from.name : '';
  const fromHeader = senderName ? `"${senderName}" <${senderAddress}>` : senderAddress;

  const htmlBody = email.html && email.html.length > 0 ? email.html[0] : '';
  const textBody = email.text || email.intro || '';

  const emlLines: string[] = [
    `From: ${fromHeader}`,
    `Subject: ${email.subject || '(No Subject)'}`,
    `Date: ${new Date(email.createdAt).toUTCString()}`,
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

// Print / Save as PDF via browser print dialogue
export const printEmailContent = (email: EmailDetail) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const senderStr = typeof email.from === 'string' ? email.from : `${email.from.name || ''} <${email.from.address}>`;
  const rawBodyContent = (email.html && email.html.length > 0) ? email.html[0] : `<p style="white-space: pre-wrap;">${email.text || email.intro}</p>`;

  const sanitizedBody = DOMPurify.sanitize(rawBodyContent, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'textarea', 'button'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'onsubmit'],
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|data:image\/(?:png|jpeg|jpg|gif|svg\+xml|webp);base64,)/i,
    ALLOW_DATA_ATTR: false,
    ADD_ATTR: ['target'],
  });

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${email.subject || 'Email Print'}</title>
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
          <div class="title">${email.subject || '(Konu Yok)'}</div>
          <div class="meta">
            <div><strong>Kimden:</strong> ${senderStr}</div>
            <div><strong>Tarih:</strong> ${new Date(email.createdAt).toLocaleString()}</div>
            <div><strong>Kategori:</strong> ${email.aiCategory}</div>
          </div>
        </div>
        <div class="body-box">
          ${sanitizedBody}
        </div>
        <div class="footer">
          MephistoMail Privacy Shield — mephistomail.site
        </div>
      </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 300);
};
