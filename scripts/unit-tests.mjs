import test from 'node:test';
import assert from 'node:assert/strict';

// 1. Action Links Tests
const extractActionLinks = (htmlText) => {
  if (!htmlText) return null;
  const match = htmlText.match(/href=["'](https:\/\/[^"'>]+)["'][^>]*>(.*?)<\/a>/i);
  if (!match) return null;
  const url = match[1];
  const label = match[2].replace(/<[^>]*>/g, '').trim();
  if (url.includes('127.0.0.1') || url.includes('localhost')) return null;
  if (/verify|confirm|activate|doğrula|onayla/i.test(label) || /verify|confirm|activate/i.test(url)) {
    return { url, label: label || 'Action Link' };
  }
  return null;
};

test('extractActionLinks accepts explicit HTTPS verification links', () => {
  const result = extractActionLinks('<a href="https://example.com/verify?token=abc">Verify your email</a>');
  assert.equal(result?.url, 'https://example.com/verify?token=abc');
});

test('extractActionLinks rejects non-HTTPS and local destinations', () => {
  assert.equal(extractActionLinks('<a href="javascript:alert(1)">Verify your email</a>'), null);
  assert.equal(extractActionLinks('<a href="http://example.com/verify">Verify your email</a>'), null);
  assert.equal(extractActionLinks('<a href="https://127.0.0.1/verify">Verify your email</a>'), null);
});

// 2. Attachment Security Tests
const sanitizeAttachmentFilename = (filename) => {
  if (!filename) return 'attachment';
  return filename
    .replace(/[\u0000-\u001f\u007f-\u009f]/g, '')
    .replace(/[/\\]+/g, '_')
    .trim();
};

const normalizeMimeType = (mime) => {
  if (!mime || typeof mime !== 'string' || !mime.includes('/')) return 'application/octet-stream';
  return mime.split(';')[0].trim().toLowerCase();
};

const isBlockedAttachment = (filename, mime) => {
  const lower = filename.toLowerCase();
  if (/\.(exe|bat|cmd|sh|vbs|msi|dll|scr|pif)$/i.test(lower)) return true;
  const normMime = normalizeMimeType(mime);
  if (['application/x-msdownload', 'application/x-executable', 'application/x-sh'].includes(normMime)) return true;
  return false;
};

test('attachment security sanitizes filenames', () => {
  assert.equal(sanitizeAttachmentFilename('../..\\evil.exe\u0000'), '.._.._evil.exe');
});

test('attachment security normalizes MIME parameters', () => {
  assert.equal(normalizeMimeType('Application/PDF; charset=binary'), 'application/pdf');
  assert.equal(normalizeMimeType('not-a-mime'), 'application/octet-stream');
});

test('attachment security blocks executable extensions and MIME types', () => {
  assert.equal(isBlockedAttachment('payload.exe', 'application/octet-stream'), true);
  assert.equal(isBlockedAttachment('payload.bin', 'application/x-msdownload'), true);
  assert.equal(isBlockedAttachment('document.pdf', 'application/pdf'), false);
});

// 3. Category Determination Tests
const determineCategory = (subject = '', from = '', intro = '') => {
  const text = `${subject} ${from} ${intro}`.toLowerCase();
  if (/(code|verify|verification|otp|confirm|activation|pin\b|passcode|doğrulama|kod|şifre|aktivasyon|onay)/i.test(text)) return 'Verification';
  if (/(security|alert|reset password|suspicious|login attempt|unauthorized|2fa|güvenlik|giriş|uyarı|sıfırlama)/i.test(text)) return 'Security';
  if (/(newsletter|bülten|weekly|digest|fırsat|indirim|offer|sale|kampanya|promo|discount|update)/i.test(text)) return 'Newsletter';
  return 'Other';
};

test('determineCategory accurately classifies emails', () => {
  assert.equal(determineCategory('Hesap Doğrulama Kodunuz: 491029', 'no-reply@auth.com'), 'Verification');
  assert.equal(determineCategory('Security Alert: New device login', 'security@discord.com'), 'Security');
  assert.equal(determineCategory('Weekly newsletter & deals', 'news@site.com'), 'Newsletter');
  assert.equal(determineCategory('Team standup meeting notes', 'bob@team.org'), 'Other');
});

// 4. Sender Name Extraction Tests
const formatSenderName = (fromAddress) => {
  if (!fromAddress || fromAddress === 'unknown') return 'Bilinmeyen Gönderen';
  const lower = fromAddress.toLowerCase();
  if (lower.includes('instagram')) return 'Instagram';
  if (lower.includes('cloudflare')) return 'Cloudflare';
  if (lower.includes('google')) return 'Google';
  if (lower.includes('netflix')) return 'Netflix';
  if (lower.includes('github')) return 'GitHub';
  const parts = fromAddress.split('@');
  return parts[0] ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1) : 'Bilinmeyen';
};

test('formatSenderName extracts clean brand names', () => {
  assert.equal(formatSenderName('security@instagram.com'), 'Instagram');
  assert.equal(formatSenderName('alert@cloudflare.com'), 'Cloudflare');
  assert.equal(formatSenderName('no-reply@github.com'), 'GitHub');
});
