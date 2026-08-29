import test from 'node:test';
import assert from 'node:assert/strict';

// ─── Import REAL Production Code ──────────────────────────────────────────
import {
  sanitizeAttachmentFilename,
  normalizeMimeType,
  isBlockedAttachment,
  validateAttachmentMetadata,
  validateAttachmentResponse,
} from '../src/utils/attachmentSecurity.ts';

import {
  extractActionLinks,
  isSafeVerificationUrl,
} from '../src/utils/actionLinks.ts';

import {
  extractOTP,
} from '../src/utils/otp.ts';

import {
  determineCategory,
  formatSenderName,
  formatSmartSubject,
  decodeHTMLEntities,
  isGuerrilla,
  GUERRILLA_DOMAINS,
} from '../src/services/mailService.ts';

// ─── 1. Email Categorization (determineCategory) ─────────────────────────
test('determineCategory identifies Verification emails (EN & TR)', () => {
  assert.equal(determineCategory('Your verification code is 123456', 'auth@service.com', ''), 'Verification');
  assert.equal(determineCategory('Hesap Doğrulama Kodu', 'no-reply@instagram.com', 'Lütfen onaylayın'), 'Verification');
  assert.equal(determineCategory('Activate your account', 'team@github.com', 'Click here to activate'), 'Verification');
  assert.equal(determineCategory('Şifre sıfırlama onay kodu', 'security@bank.com', 'Kod: 948291'), 'Verification');
  assert.equal(determineCategory('', 'otp@service.com', 'Your OTP passcode is 8829'), 'Verification');
});

test('determineCategory identifies Security emails (EN & TR)', () => {
  assert.equal(determineCategory('Security Alert: New login from London', 'no-reply@google.com', ''), 'Security');
  assert.equal(determineCategory('Hesabınıza yeni giriş yapıldı', 'guvenlik@trendyol.com', 'Güvenlik uyarısı'), 'Security');
  assert.equal(determineCategory('Suspicious login attempt detected', 'alert@netflix.com', ''), 'Security');
  assert.equal(determineCategory('Reset password notification', 'support@discord.com', ''), 'Security');
});

test('determineCategory identifies Newsletter & Marketing emails (EN & TR)', () => {
  assert.equal(determineCategory('Weekly Digest & Top Stories', 'digest@medium.com', ''), 'Newsletter');
  assert.equal(determineCategory('Haftalık Bülten: Özel İndirim Fırsatları', 'bulten@site.com', ''), 'Newsletter');
  assert.equal(determineCategory('Big Summer Sale: 50% discount today only', 'promo@store.com', ''), 'Newsletter');
});

test('determineCategory handles Other and empty/null inputs gracefully', () => {
  assert.equal(determineCategory('Meeting notes for tomorrow standup', 'john@company.com', 'See attached notes'), 'Other');
  assert.equal(determineCategory('', '', ''), 'Other');
  assert.equal(determineCategory(undefined as any, undefined as any, undefined as any), 'Other');
});

// ─── 2. Sender Name Formatting (formatSenderName) ────────────────────────
test('formatSenderName recognizes prominent tech brands', () => {
  assert.equal(formatSenderName('security@instagram.com'), 'Instagram');
  assert.equal(formatSenderName('notifications@github.com'), 'GitHub');
  assert.equal(formatSenderName('no-reply@cloudflare.com'), 'Cloudflare');
  assert.equal(formatSenderName('service@spotify.com'), 'Spotify');
  assert.equal(formatSenderName('noreply@discord.com'), 'Discord');
  assert.equal(formatSenderName('support@google.com'), 'Google');
  assert.equal(formatSenderName('billing@microsoft.com'), 'Microsoft');
  assert.equal(formatSenderName('newsletter@apple.com'), 'Apple');
});

test('formatSenderName formats noreply and system addresses cleanly', () => {
  assert.equal(formatSenderName('noreply@uber.com'), 'Uber');
  assert.equal(formatSenderName('no-reply@airbnb.com'), 'Airbnb');
  assert.equal(formatSenderName('notifications@slack.com'), 'Slack');
  assert.equal(formatSenderName('admin@example.org'), 'Example');
});

test('formatSenderName handles unknown and edge cases', () => {
  assert.equal(formatSenderName('unknown'), 'Bilinmeyen Gönderen');
  assert.equal(formatSenderName(''), 'Bilinmeyen Gönderen');
  assert.equal(formatSenderName(null as any), 'Bilinmeyen Gönderen');
  assert.equal(formatSenderName('alexander@customdomain.io'), 'Alexander');
});

// ─── 3. Smart Subject Formatting (formatSmartSubject) ────────────────────
test('formatSmartSubject preserves valid clean subjects', () => {
  assert.equal(formatSmartSubject('Your Order #10293 has shipped', '', 'orders@store.com'), 'Your Order #10293 has shipped');
  assert.equal(formatSmartSubject('Welcome to MephistoMail!', 'Get started now', 'team@mephistomail.site'), 'Welcome to MephistoMail!');
});

test('formatSmartSubject infers subjects when missing or (No Subject)', () => {
  assert.equal(formatSmartSubject('', 'Please enter this verification code', 'security@instagram.com'), 'Instagram Doğrulama Kodu');
  assert.equal(formatSmartSubject('(No Subject)', '', 'notify@cloudflare.com'), 'Cloudflare E-posta Yönlendirme Onayı');
  assert.equal(formatSmartSubject('(Konu Yok)', 'Your OTP code is 49281', 'auth@service.com'), 'E-posta Doğrulama Kodu');
  assert.equal(formatSmartSubject('', 'Security alert for your account', 'service@site.com'), 'Güvenlik Bildirimi');
});

test('formatSmartSubject truncates long excerpt fallbacks to 45 chars', () => {
  const longExcerpt = 'This is a very long email snippet that exceeds forty-five characters and needs truncation';
  const result = formatSmartSubject('', longExcerpt, 'plain@site.com');
  assert.ok(result.endsWith('...'));
  assert.ok(result.length <= 48);
});

// ─── 4. OTP / PIN Code Extraction (extractOTP) ───────────────────────────
test('extractOTP extracts 4 to 8 digit verification codes', () => {
  assert.equal(extractOTP('Your verification code is 849201. Do not share.'), '849201');
  assert.equal(extractOTP('Doğrulama kodunuz: #948210'), '948210');
  assert.equal(extractOTP('Enter PIN: 9382 to log in'), '9382');
  assert.equal(extractOTP('Your GitHub activation code is: 49281736'), '49281736');
  assert.equal(extractOTP('Doğrulama kodu: 58291'), '58291');
});

test('extractOTP handles empty, null, and non-code strings safely', () => {
  assert.equal(extractOTP(''), null);
  assert.equal(extractOTP(undefined as any), null);
  assert.equal(extractOTP(null as any), null);
  assert.equal(extractOTP('Hello, how are you today? Let us meet at 5pm.'), null);
});

// ─── 5. Action Links & Verification URLs (extractActionLinks) ────────────
test('isSafeVerificationUrl validates safe HTTPS destinations and rejects unsafe protocols', () => {
  assert.equal(isSafeVerificationUrl('https://example.com/verify?token=abc123xyz'), true);
  assert.equal(isSafeVerificationUrl('http://example.com/verify'), false); // HTTP rejected
  assert.equal(isSafeVerificationUrl('javascript:alert(1)'), false);
  assert.equal(isSafeVerificationUrl('file:///etc/passwd'), false);
  assert.equal(isSafeVerificationUrl('data:text/html,<script>'), false);
  assert.equal(isSafeVerificationUrl('blob:https://example.com/uuid'), false);
  assert.equal(isSafeVerificationUrl('https://127.0.0.1/verify'), false); // Localhost rejected
  assert.equal(isSafeVerificationUrl('https://localhost:8080/verify'), false);
  assert.equal(isSafeVerificationUrl('https://192.168.1.1/verify'), false); // Private IP rejected
  assert.equal(isSafeVerificationUrl('https://10.0.0.1/verify'), false);
});

test('extractActionLinks extracts explicit verification links from HTML', () => {
  const html = '<p>Welcome!</p><a href="https://auth.company.com/verify-email?token=8921">Verify Your Email</a>';
  const result = extractActionLinks(html);
  assert.ok(result);
  assert.equal(result?.url, 'https://auth.company.com/verify-email?token=8921');
  assert.equal(result?.label, 'Verify Your Email');
});

test('extractActionLinks rejects malicious, non-HTTPS or non-action links', () => {
  assert.equal(extractActionLinks('<a href="javascript:steal()">Verify Email</a>'), null);
  assert.equal(extractActionLinks('<a href="https://127.0.0.1/admin">Verify Account</a>'), null);
  assert.equal(extractActionLinks('<a href="https://example.com/privacy-policy">Privacy Policy</a>'), null);
  assert.equal(extractActionLinks(''), null);
  assert.equal(extractActionLinks(undefined as any), null);
});

// ─── 6. Attachment Security (attachmentSecurity) ─────────────────────────
test('sanitizeAttachmentFilename prevents directory traversal and control chars', () => {
  assert.equal(sanitizeAttachmentFilename('../../evil.exe\u0000'), '.._.._evil.exe');
  assert.equal(sanitizeAttachmentFilename('..\\..\\malware.dll'), '.._.._malware.dll');
  assert.equal(sanitizeAttachmentFilename('document.pdf'), 'document.pdf');
  assert.equal(sanitizeAttachmentFilename(''), 'attachment');
  assert.equal(sanitizeAttachmentFilename(undefined as any), 'attachment');
});

test('normalizeMimeType strips parameters and lowercases MIME strings', () => {
  assert.equal(normalizeMimeType('Application/PDF; charset=binary'), 'application/pdf');
  assert.equal(normalizeMimeType('IMAGE/PNG'), 'image/png');
  assert.equal(normalizeMimeType('not-a-mime'), 'application/octet-stream');
  assert.equal(normalizeMimeType(''), 'application/octet-stream');
});

test('isBlockedAttachment blocks executable extensions and hazardous types', () => {
  assert.equal(isBlockedAttachment('virus.exe', 'application/octet-stream'), true);
  assert.equal(isBlockedAttachment('script.bat', 'text/plain'), true);
  assert.equal(isBlockedAttachment('macro.vbs', 'text/plain'), true);
  assert.equal(isBlockedAttachment('installer.msi', 'application/octet-stream'), true);
  assert.equal(isBlockedAttachment('library.dll', 'application/octet-stream'), true);
  assert.equal(isBlockedAttachment('payload.bin', 'application/x-msdownload'), true);
  assert.equal(isBlockedAttachment('report.pdf', 'application/pdf'), false);
  assert.equal(isBlockedAttachment('photo.png', 'image/png'), false);
});

test('validateAttachmentMetadata rejects files exceeding 25MB limit', () => {
  const safe = validateAttachmentMetadata('invoice.pdf', 'application/pdf', 5 * 1024 * 1024);
  assert.equal(safe.ok, true);

  const oversized = validateAttachmentMetadata('bigfile.zip', 'application/zip', 30 * 1024 * 1024);
  assert.equal(oversized.ok, false);
  assert.equal(oversized.reason, 'Attachment exceeds the 25 MB limit.');

  const blocked = validateAttachmentMetadata('malware.exe', 'application/octet-stream', 1024);
  assert.equal(blocked.ok, false);
});

test('validateAttachmentResponse detects response MIME and size mismatches', () => {
  if (typeof Blob !== 'undefined') {
    const validBlob = new Blob(['sample data'], { type: 'application/pdf' });
    const validRes = validateAttachmentResponse(validBlob, 'application/pdf', 11);
    assert.equal(validRes.ok, true);

    const mismatchedBlob = new Blob(['html'], { type: 'text/html' });
    const mismatchRes = validateAttachmentResponse(mismatchedBlob, 'application/pdf', 4);
    assert.equal(mismatchRes.ok, false);
  }
});

// ─── 7. HTML Entity Decoding (decodeHTMLEntities) ─────────────────────────
test('decodeHTMLEntities converts HTML entities correctly', () => {
  assert.equal(decodeHTMLEntities('&lt;b&gt;Hello &amp; Welcome&lt;/b&gt;'), '<b>Hello & Welcome</b>');
  assert.equal(decodeHTMLEntities('Don&#039;t worry &quot;friend&quot; &apos;tag&apos; &nbsp;'), "Don't worry \"friend\" 'tag'  ");
  assert.equal(decodeHTMLEntities(''), '');
});

// ─── 8. Guerrilla Domains & Provider Type Guards ─────────────────────────
test('isGuerrilla correctly identifies Guerrilla provider string', () => {
  assert.equal(isGuerrilla('guerrilla'), true);
  assert.equal(isGuerrilla('mail_tm'), false);
  assert.equal(isGuerrilla('mail_gw'), false);
});

test('GUERRILLA_DOMAINS contains active high-reputation domain pool', () => {
  assert.ok(Array.isArray(GUERRILLA_DOMAINS));
  assert.ok(GUERRILLA_DOMAINS.includes('sharklasers.com'));
  assert.ok(GUERRILLA_DOMAINS.includes('guerrillamail.com'));
  assert.ok(GUERRILLA_DOMAINS.includes('grr.la'));
});
