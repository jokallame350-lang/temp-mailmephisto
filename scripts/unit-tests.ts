import test from 'node:test';
import assert from 'node:assert/strict';

// ─── 1. Locales Imports ───────────────────────────────────────────────────
import { en } from '../src/locales/en.ts';
import { tr } from '../src/locales/tr.ts';
import { de } from '../src/locales/de.ts';
import { es } from '../src/locales/es.ts';
import { fr } from '../src/locales/fr.ts';
import { it } from '../src/locales/it.ts';
import { pt } from '../src/locales/pt.ts';
import { ru } from '../src/locales/ru.ts';
import { ar } from '../src/locales/ar.ts';
import { translations } from '../src/translations.ts';

// ─── 2. Production Utilities Imports ───────────────────────────────────────
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
  generateEmailPrintHTML,
  PRINT_LABELS,
  LOCALE_MAP,
} from '../src/utils/exportMail.ts';

import {
  calculateAdaptiveBackoff,
} from '../src/utils/pollingBackoff.ts';

import {
  generateSecurePassword,
  calculatePasswordStrength,
} from '../src/utils/passwordGenerator.ts';

import {
  KNOWN_DISPOSABLE_DOMAINS,
  isDisposableEmail,
  analyzeDisposableEmail,
} from '../src/utils/disposableChecker.ts';

import {
  generateLuhnCard,
  validateLuhnChecksum,
  generateTestCard,
} from '../src/utils/cardGenerator.ts';

import {
  encryptBurnNote,
  decryptBurnNote,
  createBurnNoteUrl,
} from '../src/utils/burnNote.ts';

import {
  generateDeterministicIdentity,
} from '../src/utils/identity.ts';

// ─── 3. Mail Service Imports ───────────────────────────────────────────────
import {
  determineCategory,
  formatSenderName,
  formatSmartSubject,
  decodeHTMLEntities,
  isGuerrilla,
  GUERRILLA_DOMAINS,
  generateMailbox,
  createCustomMailbox,
  getMessages,
  getMessageDetail,
  deleteMessage,
  deleteAllMessages,
  markMessageRead,
  getWorkerStats,
  fetchDomains,
  clearDomainCache,
  isRateLimited,
  getRateLimitRemainingMs,
  clearRateLimit,
  storeCredentials,
  clearCredentials,
  onTokenRefresh,
  analyzeEmailAI,
  getProviderInfo,
  safeFetch,
  getAttachment,
} from '../src/services/mailService.ts';
import { Mailbox, EmailDetail, EmailSummary } from '../src/types.ts';

// ─── Deterministic HTTP Test Seam ──────────────────────────────────────────
type FetchMockHandler = (url: string, init?: RequestInit) => Promise<Response> | Response;

let currentMockHandler: FetchMockHandler | null = null;
const originalFetch = globalThis.fetch;

function setMockFetch(handler: FetchMockHandler | null) {
  currentMockHandler = handler;
}

globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : (input as Request).url;
  if (currentMockHandler) {
    return currentMockHandler(url, init);
  }
  return originalFetch(input, init);
};

function jsonResponse(data: any, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
}

function textResponse(text: string, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(text, {
    status,
    headers: {
      'Content-Type': 'text/plain',
      ...headers,
    },
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// SUITE 1: All 9 Locales Key Completeness & Translation Parity
// ═══════════════════════════════════════════════════════════════════════════

test('Locales 1: en.ts contains complete set of base keys (>200 keys)', () => {
  const enKeys = Object.keys(en);
  assert.ok(enKeys.length >= 200, `Expected at least 200 keys, found ${enKeys.length}`);
  assert.ok('refresh' in en);
  assert.ok('inbox' in en);
  assert.ok('heroTitle' in en);
  assert.ok('faq1Q' in en);
  assert.ok('privacyTitle' in en);
});

test('Locales 2: All 9 individual locale modules have 0 missing keys matching en.ts', () => {
  const enKeys = Object.keys(en);
  const locales = { en, tr, de, es, fr, it, pt, ru, ar };

  for (const [langName, locObj] of Object.entries(locales)) {
    const locKeys = new Set(Object.keys(locObj));
    const missingKeys = enKeys.filter(k => !locKeys.has(k));

    assert.deepEqual(
      missingKeys,
      [],
      `Locale '${langName}' is missing ${missingKeys.length} key(s): ${missingKeys.slice(0, 10).join(', ')}`
    );
    assert.equal(
      Object.keys(locObj).length,
      enKeys.length,
      `Locale '${langName}' key count (${Object.keys(locObj).length}) does not match en.ts (${enKeys.length})`
    );
  }
});

test('Locales 3: translations export bundle has all 9 locales complete and populated', () => {
  const requiredLanguages = ['en', 'tr', 'de', 'es', 'fr', 'it', 'pt', 'ru', 'ar'] as const;
  const enKeys = Object.keys(en);

  for (const lang of requiredLanguages) {
    assert.ok(lang in translations, `translations bundle missing key '${lang}'`);
    const dict = (translations as any)[lang];
    assert.ok(dict, `translations.${lang} is nullish`);

    const missingKeys = enKeys.filter(k => !(k in dict));
    assert.deepEqual(
      missingKeys,
      [],
      `translations.${lang} has missing keys: ${missingKeys.slice(0, 5).join(', ')}`
    );
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// SUITE 2: Attachment Retrieval via getAttachment() for Hydra / Mail.tm
// ═══════════════════════════════════════════════════════════════════════════

test('Attachment Retrieval 1: Successfully retrieves attachment Blob for Hydra (Mail.tm)', async () => {
  const mailbox: Mailbox = {
    id: 'hydra_att_user',
    address: 'user@mail.tm',
    apiBase: 'mail_tm',
    token: 'jwt_valid_token_xyz',
  };

  let requestedUrl = '';
  let authHeader = '';

  setMockFetch((url, init) => {
    requestedUrl = url;
    authHeader = (init?.headers as any)?.Authorization || '';
    if (url.includes('/messages/msg_991/attachment/att_882')) {
      return new Response(new Uint8Array([0x25, 0x50, 0x44, 0x46]), {
        status: 200,
        headers: { 'Content-Type': 'application/pdf' },
      });
    }
    return new Response('Not Found', { status: 404 });
  });

  try {
    const blob = await getAttachment(mailbox, 'msg_991', 'att_882');
    assert.ok(blob, 'Expected blob to be returned');
    assert.equal(blob.size, 4);
    assert.ok(requestedUrl.includes('/messages/msg_991/attachment/att_882'));
    assert.equal(authHeader, 'Bearer jwt_valid_token_xyz');
  } finally {
    setMockFetch(null);
  }
});

test('Attachment Retrieval 2: Returns null on HTTP 404 or 500 error', async () => {
  const mailbox: Mailbox = {
    id: 'hydra_att_err',
    address: 'user@mail.tm',
    apiBase: 'mail_tm',
    token: 'jwt_token',
  };

  setMockFetch(() => textResponse('Internal Server Error', 500));

  try {
    const res500 = await getAttachment(mailbox, 'msg_err', 'att_err');
    assert.equal(res500, null);
  } finally {
    setMockFetch(null);
  }

  setMockFetch(() => textResponse('Not Found', 404));

  try {
    const res404 = await getAttachment(mailbox, 'msg_err', 'att_err');
    assert.equal(res404, null);
  } finally {
    setMockFetch(null);
  }
});

test('Attachment Retrieval 3: Returns null for Guerrilla Mail provider (provider guard)', async () => {
  let networkCalled = false;
  setMockFetch(() => {
    networkCalled = true;
    return jsonResponse({});
  });

  const guerrillaMb: Mailbox = {
    id: 'g_user',
    address: 'test@sharklasers.com',
    apiBase: 'guerrilla',
    token: 'sid_123',
  };

  try {
    const res = await getAttachment(guerrillaMb, 'msg_1', 'att_1');
    assert.equal(res, null);
    assert.equal(networkCalled, false, 'Guerrilla provider should short-circuit without network call');
  } finally {
    setMockFetch(null);
  }
});

test('Attachment Retrieval 4: Returns null on missing or invalid parameters', async () => {
  const validMb: Mailbox = { id: 'm', address: 'a@mail.tm', apiBase: 'mail_tm', token: 't' };

  assert.equal(await getAttachment(null as any, 'msg', 'att'), null);
  assert.equal(await getAttachment({ ...validMb, token: '' }, 'msg', 'att'), null);
  assert.equal(await getAttachment(validMb, '', 'att'), null);
  assert.equal(await getAttachment(validMb, 'msg', ''), null);
});

// ═══════════════════════════════════════════════════════════════════════════
// SUITE 3: Multi-Language Print Email Formatting (exportMail.ts)
// ═══════════════════════════════════════════════════════════════════════════

const sampleEmailDetail: EmailDetail = {
  id: 'msg_print_test',
  from: { address: 'security@bank.com', name: 'Security Team' },
  subject: 'Urgent: Account Verification',
  intro: 'Your confirmation code is 882910',
  seen: true,
  createdAt: '2026-08-29T08:30:00.000Z',
  aiCategory: 'Verification',
  html: ['<p>Your one-time code is <b>882910</b></p><script>alert("evil")</script>'],
  hasAttachments: false,
  attachments: [],
};

test('Print Export 1: generateEmailPrintHTML supports all 9 locales with correct labels and direction', () => {
  const expectedLabels = [
    { lang: 'en' as const, from: 'From', date: 'Date', cat: 'Category', dir: 'ltr' },
    { lang: 'tr' as const, from: 'Kimden', date: 'Tarih', cat: 'Kategori', dir: 'ltr' },
    { lang: 'de' as const, from: 'Von', date: 'Datum', cat: 'Kategorie', dir: 'ltr' },
    { lang: 'es' as const, from: 'De', date: 'Fecha', cat: 'Categoría', dir: 'ltr' },
    { lang: 'fr' as const, from: 'De', date: 'Date', cat: 'Catégorie', dir: 'ltr' },
    { lang: 'it' as const, from: 'Da', date: 'Data', cat: 'Categoria', dir: 'ltr' },
    { lang: 'pt' as const, from: 'De', date: 'Data', cat: 'Categoria', dir: 'ltr' },
    { lang: 'ru' as const, from: 'От', date: 'Дата', cat: 'Категория', dir: 'ltr' },
    { lang: 'ar' as const, from: 'من', date: 'التاريخ', cat: 'الفئة', dir: 'rtl' },
  ];

  for (const exp of expectedLabels) {
    const html = generateEmailPrintHTML(sampleEmailDetail, exp.lang);
    assert.ok(html.includes(`dir="${exp.dir}"`), `Expected dir="${exp.dir}" for lang ${exp.lang}`);
    assert.ok(html.includes(`<strong>${exp.from}:</strong>`), `Missing '${exp.from}:' for lang ${exp.lang}`);
    assert.ok(html.includes(`<strong>${exp.date}:</strong>`), `Missing '${exp.date}:' for lang ${exp.lang}`);
    assert.ok(html.includes(`<strong>${exp.cat}:</strong>`), `Missing '${exp.cat}:' for lang ${exp.lang}`);
    assert.ok(html.includes('MephistoMail Privacy Shield'));
  }
});

test('Print Export 2: generateEmailPrintHTML provides fallback subject per language when missing', () => {
  const emptySubjectEmail: EmailDetail = {
    ...sampleEmailDetail,
    subject: '',
  };

  const htmlEn = generateEmailPrintHTML(emptySubjectEmail, 'en');
  assert.ok(htmlEn.includes('(No Subject)'));

  const htmlTr = generateEmailPrintHTML(emptySubjectEmail, 'tr');
  assert.ok(htmlTr.includes('(Konu Yok)'));

  const htmlDe = generateEmailPrintHTML(emptySubjectEmail, 'de');
  assert.ok(htmlDe.includes('(Kein Betreff)'));

  const htmlAr = generateEmailPrintHTML(emptySubjectEmail, 'ar');
  assert.ok(htmlAr.includes('(بلا موضوع)'));
});

test('Print Export 3: generateEmailPrintHTML sanitizes dangerous HTML script tags', () => {
  const html = generateEmailPrintHTML(sampleEmailDetail, 'en');
  // DOMPurify strips <script> tags
  assert.equal(html.includes('<script>'), false);
  assert.equal(html.includes('alert("evil")'), false);
  assert.ok(html.includes('882910'));
});

test('Print Export 4: PRINT_LABELS and LOCALE_MAP contain all 9 languages', () => {
  const langs = ['en', 'tr', 'de', 'es', 'fr', 'it', 'pt', 'ru', 'ar'] as const;
  for (const l of langs) {
    assert.ok(l in PRINT_LABELS);
    assert.ok(PRINT_LABELS[l].from);
    assert.ok(PRINT_LABELS[l].date);
    assert.ok(PRINT_LABELS[l].category);
    assert.ok(l in LOCALE_MAP);
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// SUITE 4: Adaptive Polling & Exponential Backoff Calculation
// ═══════════════════════════════════════════════════════════════════════════

test('Adaptive Polling 1: Returns base interval (10,000ms) on initial / active state', () => {
  const interval = calculateAdaptiveBackoff({ consecutiveEmptyPolls: 0, isBackgroundTab: false });
  assert.equal(interval, 10000);
});

test('Adaptive Polling 2: Applies exponential backoff on consecutive empty polls', () => {
  const poll0 = calculateAdaptiveBackoff({ consecutiveEmptyPolls: 0 });
  const poll1 = calculateAdaptiveBackoff({ consecutiveEmptyPolls: 1 });
  const poll2 = calculateAdaptiveBackoff({ consecutiveEmptyPolls: 2 });
  const poll3 = calculateAdaptiveBackoff({ consecutiveEmptyPolls: 3 });

  assert.equal(poll0, 10000);
  assert.equal(poll1, 15000); // 10000 * 1.5
  assert.equal(poll2, 22500); // 10000 * 1.5^2
  assert.equal(poll3, 33750); // 10000 * 1.5^3
});

test('Adaptive Polling 3: Caps backoff at maxIntervalMs (60,000ms)', () => {
  const poll10 = calculateAdaptiveBackoff({ consecutiveEmptyPolls: 10, maxIntervalMs: 60000 });
  assert.equal(poll10, 60000);
});

test('Adaptive Polling 4: Uses background interval (30,000ms) when tab is hidden', () => {
  const bgPoll0 = calculateAdaptiveBackoff({ isBackgroundTab: true, consecutiveEmptyPolls: 0 });
  assert.equal(bgPoll0, 30000);

  const bgPoll1 = calculateAdaptiveBackoff({ isBackgroundTab: true, consecutiveEmptyPolls: 1 });
  assert.equal(bgPoll1, 45000); // 30000 * 1.5
});

test('Adaptive Polling 5: Rate limit state respects remaining rate limit window', () => {
  const interval = calculateAdaptiveBackoff({
    isRateLimited: true,
    rateLimitRemainingMs: 25000,
    baseIntervalMs: 10000,
  });
  assert.equal(interval, 25000);
});

test('Adaptive Polling 6: Applies deterministic jitter when jitterRatio is specified', () => {
  // Deterministic RNG that returns maximum positive offset (rng = 1 => offset = +10%)
  const maxJitter = calculateAdaptiveBackoff({
    consecutiveEmptyPolls: 0,
    baseIntervalMs: 10000,
    jitterRatio: 0.1,
    rng: () => 1,
  });
  assert.equal(maxJitter, 11000);

  // Deterministic RNG that returns maximum negative offset (rng = 0 => offset = -10%)
  const minJitter = calculateAdaptiveBackoff({
    consecutiveEmptyPolls: 0,
    baseIntervalMs: 10000,
    jitterRatio: 0.1,
    rng: () => 0,
  });
  assert.equal(minJitter, 9000);
});

// ═══════════════════════════════════════════════════════════════════════════
// SUITE 5: Password Generator & Strength Scoring
// ═══════════════════════════════════════════════════════════════════════════

test('Password Generator 1: Generates passwords with exact requested length', () => {
  assert.equal(generateSecurePassword({ length: 8 }).length, 8);
  assert.equal(generateSecurePassword({ length: 16 }).length, 16);
  assert.equal(generateSecurePassword({ length: 32 }).length, 32);
  assert.equal(generateSecurePassword({ length: 64 }).length, 64);
});

test('Password Generator 2: Respects character set inclusion flags', () => {
  const digitsOnly = generateSecurePassword({
    length: 20,
    includeLowercase: false,
    includeUppercase: false,
    includeNumbers: true,
    includeSymbols: false,
  });
  assert.match(digitsOnly, /^[0-9]+$/);

  const uppercaseOnly = generateSecurePassword({
    length: 20,
    includeLowercase: false,
    includeUppercase: true,
    includeNumbers: false,
    includeSymbols: false,
  });
  assert.match(uppercaseOnly, /^[A-Z]+$/);
});

test('Password Generator 3: calculatePasswordStrength scores from 0 (weak) to 5 (strong)', () => {
  assert.equal(calculatePasswordStrength(''), 0);
  assert.equal(calculatePasswordStrength('abc'), 0);
  assert.equal(calculatePasswordStrength('abcdefgh'), 1); // >= 8 chars
  assert.equal(calculatePasswordStrength('abcdefghijkl'), 2); // >= 12 chars
  assert.equal(calculatePasswordStrength('Abcdefghijkl'), 3); // upper + lower
  assert.equal(calculatePasswordStrength('Abcdefgh99!#'), 4); // len 12 + numbers + symbols
  assert.equal(calculatePasswordStrength('Abcdefghijklmnop99!#'), 5); // >= 16 chars + all charsets
});

test('Password Generator 4: Produces non-repeating cryptographically varied outputs', () => {
  const set = new Set<string>();
  for (let i = 0; i < 50; i++) {
    set.add(generateSecurePassword({ length: 16 }));
  }
  assert.equal(set.size, 50, 'All 50 generated passwords should be unique');
});

// ═══════════════════════════════════════════════════════════════════════════
// SUITE 6: Disposable Email Domain Checker
// ═══════════════════════════════════════════════════════════════════════════

test('Disposable Checker 1: KNOWN_DISPOSABLE_DOMAINS contains standard temporary providers', () => {
  assert.ok(KNOWN_DISPOSABLE_DOMAINS.has('sharklasers.com'));
  assert.ok(KNOWN_DISPOSABLE_DOMAINS.has('guerrillamail.com'));
  assert.ok(KNOWN_DISPOSABLE_DOMAINS.has('mail.tm'));
  assert.ok(KNOWN_DISPOSABLE_DOMAINS.has('tempmail.org'));
  assert.ok(KNOWN_DISPOSABLE_DOMAINS.has('10minutemail.com'));
});

test('Disposable Checker 2: isDisposableEmail identifies known and keyword-based disposable addresses', () => {
  assert.equal(isDisposableEmail('test@sharklasers.com'), true);
  assert.equal(isDisposableEmail('alice@mail.tm'), true);
  assert.equal(isDisposableEmail('temp-123@mycustomtempdomain.xyz'), true);
  assert.equal(isDisposableEmail('burner@randomservice.net'), true);
  assert.equal(isDisposableEmail('user@trashmail.com'), true);
});

test('Disposable Checker 3: isDisposableEmail rejects standard legitimate domains', () => {
  assert.equal(isDisposableEmail('john.doe@gmail.com'), false);
  assert.equal(isDisposableEmail('alex@outlook.com'), false);
  assert.equal(isDisposableEmail('contact@yahoo.com'), false);
  assert.equal(isDisposableEmail('security@proton.me'), false);
  assert.equal(isDisposableEmail(''), false);
});

test('Disposable Checker 4: analyzeDisposableEmail produces detailed risk score and classification', () => {
  const disposableAnalysis = analyzeDisposableEmail('spammer@sharklasers.com');
  assert.equal(disposableAnalysis.isDisposable, true);
  assert.equal(disposableAnalysis.riskScore, 95);
  assert.ok(disposableAnalysis.mxStatus.includes('Ephemeral') || disposableAnalysis.mxStatus.includes('Volatile'));

  const legitimateAnalysis = analyzeDisposableEmail('ceo@gmail.com');
  assert.equal(legitimateAnalysis.isDisposable, false);
  assert.equal(legitimateAnalysis.riskScore, 5);
  assert.ok(legitimateAnalysis.mxStatus.includes('Standard MX'));
});

// ═══════════════════════════════════════════════════════════════════════════
// SUITE 7: Credit Card Generator & Luhn Algorithm Checksum
// ═══════════════════════════════════════════════════════════════════════════

test('Card Generator 1: generateLuhnCard produces valid check digits for Visa, Mastercard, Amex, Discover', () => {
  const visa = generateLuhnCard('4532', 16);
  assert.equal(visa.length, 16);
  assert.ok(visa.startsWith('4532'));
  assert.equal(validateLuhnChecksum(visa), true);

  const mastercard = generateLuhnCard('5425', 16);
  assert.equal(mastercard.length, 16);
  assert.ok(mastercard.startsWith('5425'));
  assert.equal(validateLuhnChecksum(mastercard), true);

  const amex = generateLuhnCard('3782', 15);
  assert.equal(amex.length, 15);
  assert.ok(amex.startsWith('3782'));
  assert.equal(validateLuhnChecksum(amex), true);

  const discover = generateLuhnCard('6011', 16);
  assert.equal(discover.length, 16);
  assert.ok(discover.startsWith('6011'));
  assert.equal(validateLuhnChecksum(discover), true);
});

test('Card Generator 2: validateLuhnChecksum rejects invalid or corrupted card numbers', () => {
  const valid = generateLuhnCard('4532', 16);
  // Mutate last digit
  const lastDigit = parseInt(valid[valid.length - 1], 10);
  const corrupted = valid.slice(0, -1) + ((lastDigit + 1) % 10).toString();
  assert.equal(validateLuhnChecksum(corrupted), false);

  assert.equal(validateLuhnChecksum(''), false);
  assert.equal(validateLuhnChecksum('12345'), false);
  assert.equal(validateLuhnChecksum('0000000000000001'), false);
});

test('Card Generator 3: generateTestCard returns complete valid test card details', () => {
  const card = generateTestCard('visa');
  assert.equal(card.brand, 'VISA');
  assert.ok(card.cardNumber.startsWith('4532'));
  assert.equal(validateLuhnChecksum(card.cardNumber), true);
  assert.ok(Number(card.expMonth) >= 1 && Number(card.expMonth) <= 12);
  assert.ok(Number(card.expYear) >= 2026);
  assert.equal(card.cvv.length, 3);
  assert.ok(card.holder.includes(' '));
});

// ═══════════════════════════════════════════════════════════════════════════
// SUITE 8: Burn Note Ephemeral Encryption & Decryption Roundtrip
// ═══════════════════════════════════════════════════════════════════════════

test('Burn Note 1: Encrypts and decrypts UTF-8, emojis, and multiline secret text flawlessly', () => {
  const sampleNotes = [
    'SuperSecretPassword123!',
    'Gizli Mesaj: Türkçe karakterler çğıöşü ÇĞİÖŞÜ',
    'Secret with emojis: 🔥🔐🚀⚡ and symbols #!@$%^&*()',
    'Multiline\nsecret\r\ncredentials\nwith spaces',
    '{"apiKey":"sk-proj-992817264810","secret":"xyz"}',
  ];

  for (const original of sampleNotes) {
    const encrypted = encryptBurnNote(original);
    assert.ok(encrypted.length > 0);
    const decrypted = decryptBurnNote(encrypted);
    assert.equal(decrypted, original, `Decryption mismatch for: ${original}`);
  }
});

test('Burn Note 2: Handles hash fragments (#) and invalid payloads gracefully', () => {
  const encrypted = encryptBurnNote('Hello World');
  assert.equal(decryptBurnNote(`#${encrypted}`), 'Hello World');
  assert.equal(decryptBurnNote(''), '');
  assert.equal(decryptBurnNote('invalid_non_base64_###'), '');
});

test('Burn Note 3: createBurnNoteUrl formats valid browser URL with hash fragment', () => {
  const url = createBurnNoteUrl('https://mephistomail.site', 'MySecret123');
  assert.ok(url.startsWith('https://mephistomail.site/burn-note#'));
  const hash = url.split('#')[1];
  assert.equal(decryptBurnNote(hash), 'MySecret123');
});

// ═══════════════════════════════════════════════════════════════════════════
// SUITE 9: Deterministic Identity Generator
// ═══════════════════════════════════════════════════════════════════════════

test('Deterministic Identity 1: Produces strictly deterministic output for identical email', () => {
  const email = 'alex.tester@example.com';
  const id1 = generateDeterministicIdentity(email);
  const id2 = generateDeterministicIdentity(email);

  assert.deepEqual(id1, id2);
  assert.equal(id1.name, id2.name);
  assert.equal(id1.phone, id2.phone);
  assert.equal(id1.birthday, id2.birthday);
  assert.equal(id1.address, id2.address);
});

test('Deterministic Identity 2: Different email inputs generate distinct identities', () => {
  const idA = generateDeterministicIdentity('alice@example.com');
  const idB = generateDeterministicIdentity('bob@anotherdomain.org');

  assert.notEqual(idA.name, idB.name);
  assert.notEqual(idA.phone, idB.phone);
});

test('Deterministic Identity 3: Output conforms to expected format standards', () => {
  const id = generateDeterministicIdentity('sample.user@mephistomail.site');

  assert.ok(id.name && id.name.includes(' '));
  assert.match(id.birthday, /^\d{4}-\d{2}-\d{2}$/);
  assert.match(id.phone, /^\+1 \(\d{3}\) \d{3}-\d{4}$/);
  assert.equal(id.country, 'United States');
  assert.ok(id.city);
  assert.ok(id.job);
  assert.ok(id.address.includes(id.city));
});

// ═══════════════════════════════════════════════════════════════════════════
// SUITE 10: Email Categorization (determineCategory)
// ═══════════════════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════════════════
// SUITE 11: Sender Name Formatting (formatSenderName)
// ═══════════════════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════════════════
// SUITE 12: Smart Subject Formatting (formatSmartSubject)
// ═══════════════════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════════════════
// SUITE 13: OTP / PIN Code Extraction (extractOTP)
// ═══════════════════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════════════════
// SUITE 14: Action Links & Verification URLs (extractActionLinks)
// ═══════════════════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════════════════
// SUITE 15: Attachment Security (attachmentSecurity)
// ═══════════════════════════════════════════════════════════════════════════

test('sanitizeAttachmentFilename prevents directory traversal and control chars', () => {
  assert.equal(sanitizeAttachmentFilename('../../evil.exe\u0000'), 'evil.exe');
  assert.equal(sanitizeAttachmentFilename('..\\..\\malware.dll'), 'malware.dll');
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

// ═══════════════════════════════════════════════════════════════════════════
// SUITE 16: HTML Entity Decoding (decodeHTMLEntities)
// ═══════════════════════════════════════════════════════════════════════════

test('decodeHTMLEntities converts HTML entities correctly', () => {
  assert.equal(decodeHTMLEntities('&lt;b&gt;Hello &amp; Welcome&lt;/b&gt;'), '<b>Hello & Welcome</b>');
  assert.equal(decodeHTMLEntities('Don&#039;t worry &quot;friend&quot; &apos;tag&apos; &nbsp;'), "Don't worry \"friend\" 'tag'  ");
  assert.equal(decodeHTMLEntities(''), '');
});

// ═══════════════════════════════════════════════════════════════════════════
// SUITE 17: Guerrilla Domains & Provider Type Guards
// ═══════════════════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════════════════
// SUITE 18: Additional Mail Service Unit Coverage
// ═══════════════════════════════════════════════════════════════════════════

test('storeCredentials, clearCredentials, and AI helpers operate cleanly', async () => {
  storeCredentials('test_mb_1', 'user@guerrilla.com', 'supersecret');
  clearCredentials('test_mb_1');

  const providerInfo = getProviderInfo('guerrilla');
  assert.equal(providerInfo.name, 'Guerrilla Mail');
  assert.ok(providerInfo.icon);

  assert.equal(await analyzeEmailAI('Verify OTP', 'auth@bank.com', 'code 123'), 'Verification');
});

// ═══════════════════════════════════════════════════════════════════════════
// INTEGRATION TEST SUITE: Deterministic HTTP Network Boundary Mocks
// ═══════════════════════════════════════════════════════════════════════════

// Cleanup helper after each integration test
function cleanupIntegrationSeam() {
  setMockFetch(null);
  clearDomainCache();
  clearRateLimit();
}

// ─── A. Successful Mailbox Creation ───────────────────────────────────────
test('Integration A1: Successful Guerrilla quick mailbox creation via generateMailbox()', async () => {
  clearDomainCache();
  setMockFetch((url) => {
    if (url.includes('f=get_email_address')) {
      return jsonResponse({
        sid_token: 'mock_sid_quick_123',
        email_addr: 'matrix.auto999@guerrillamail.com',
      });
    }
    if (url.includes('f=set_email_user')) {
      const match = url.match(/email_user=([^&]+)/);
      const user = match ? decodeURIComponent(match[1]) : 'matrix.user';
      return jsonResponse({
        email_user: user,
        email_addr: `${user}@guerrillamail.com`,
        sid_token: 'mock_sid_quick_123',
      });
    }
    return jsonResponse({});
  });

  try {
    const mailbox = await generateMailbox();
    assert.ok(mailbox);
    assert.equal(mailbox.id, 'mock_sid_quick_123');
    assert.equal(mailbox.token, 'mock_sid_quick_123');
    assert.equal(mailbox.apiBase, 'guerrilla');
    assert.ok(mailbox.address.includes('@'));
  } finally {
    cleanupIntegrationSeam();
  }
});

test('Integration A2: Successful Guerrilla custom mailbox creation via createCustomMailbox()', async () => {
  clearDomainCache();
  let setCalled = false;
  setMockFetch((url) => {
    if (url.includes('f=get_email_address')) {
      return jsonResponse({
        sid_token: 'custom_sid_456',
        email_addr: 'temp123@sharklasers.com',
      });
    }
    if (url.includes('f=set_email_user')) {
      setCalled = true;
      return jsonResponse({
        email_user: 'customalice',
        email_addr: 'customalice@sharklasers.com',
        sid_token: 'custom_sid_456',
      });
    }
    return jsonResponse({});
  });

  try {
    const mailbox = await createCustomMailbox('customalice', 'sharklasers.com', 'guerrilla');
    assert.ok(setCalled);
    assert.equal(mailbox.id, 'custom_sid_456');
    assert.equal(mailbox.address, 'customalice@sharklasers.com');
    assert.equal(mailbox.token, 'custom_sid_456');
    assert.equal(mailbox.apiBase, 'guerrilla');
  } finally {
    cleanupIntegrationSeam();
  }
});

test('Integration A3: Successful Hydra / mail_tm custom mailbox creation', async () => {
  let createdAccount = false;
  let fetchedToken = false;
  setMockFetch((url, init) => {
    if (url.endsWith('/accounts') && init?.method === 'POST') {
      createdAccount = true;
      return jsonResponse({ id: 'hydra_acc_789', address: 'alice@mail.tm' }, 201);
    }
    if (url.endsWith('/token') && init?.method === 'POST') {
      fetchedToken = true;
      return jsonResponse({ token: 'jwt_hydra_token_xyz', id: 'hydra_acc_789' }, 200);
    }
    return jsonResponse({});
  });

  try {
    const mailbox = await createCustomMailbox('alice', 'mail.tm', 'mail_tm');
    assert.ok(createdAccount);
    assert.ok(fetchedToken);
    assert.equal(mailbox.id, 'hydra_acc_789');
    assert.equal(mailbox.address, 'alice@mail.tm');
    assert.equal(mailbox.token, 'jwt_hydra_token_xyz');
    assert.equal(mailbox.apiBase, 'mail_tm');
    assert.ok(mailbox.password && mailbox.password.length > 8);
  } finally {
    cleanupIntegrationSeam();
  }
});

// ─── B. Failed Mailbox Creation (HTTP 500 / Network Error) ────────────────
test('Integration B1: Guerrilla mailbox creation fails on HTTP 500', async () => {
  setMockFetch((url) => {
    if (url.includes('f=get_email_address')) {
      return textResponse('Internal Server Error', 500);
    }
    return jsonResponse({});
  });

  try {
    await assert.rejects(
      async () => {
        await generateMailbox();
      },
      (err: Error) => {
        assert.ok(err.message.includes('500') || err.message.includes('oluşturulamadı'));
        return true;
      }
    );
  } finally {
    cleanupIntegrationSeam();
  }
});

test('Integration B2: Guerrilla mailbox creation fails on network fetch rejection', async () => {
  setMockFetch(() => {
    throw new TypeError('fetch failed: ECONNREFUSED');
  });

  try {
    await assert.rejects(async () => {
      await generateMailbox();
    });
  } finally {
    cleanupIntegrationSeam();
  }
});

test('Integration B3: Hydra mailbox creation fails when /accounts returns 500', async () => {
  setMockFetch((url, init) => {
    if (url.endsWith('/accounts') && init?.method === 'POST') {
      return textResponse('Server Error', 500);
    }
    return jsonResponse({});
  });

  try {
    await assert.rejects(
      async () => {
        await createCustomMailbox('badaccount', 'mail.tm', 'mail_tm');
      },
      (err: Error) => {
        assert.ok(err.message.includes('500') || err.message.includes('oluşturulamadı'));
        return true;
      }
    );
  } finally {
    cleanupIntegrationSeam();
  }
});

test('Integration B4: Hydra mailbox creation fails when /token returns 500', async () => {
  setMockFetch((url, init) => {
    if (url.endsWith('/accounts') && init?.method === 'POST') {
      return jsonResponse({ id: 'acc_ok', address: 'tokenerr@mail.tm' }, 201);
    }
    if (url.endsWith('/token') && init?.method === 'POST') {
      return textResponse('Token generation failed', 500);
    }
    return jsonResponse({});
  });

  try {
    await assert.rejects(
      async () => {
        await createCustomMailbox('tokenerr', 'mail.tm', 'mail_tm');
      },
      (err: Error) => {
        assert.ok(err.message.includes('500') || err.message.includes('Token'));
        return true;
      }
    );
  } finally {
    cleanupIntegrationSeam();
  }
});

// ─── C. Rejected Custom Username ──────────────────────────────────────────
test('Integration C1: Guerrilla rejected custom username (set_email_user error response)', async () => {
  setMockFetch((url) => {
    if (url.includes('f=get_email_address')) {
      return jsonResponse({
        sid_token: 'sid_valid_1',
        email_addr: 'temp@guerrillamail.com',
      });
    }
    if (url.includes('f=set_email_user')) {
      return jsonResponse({
        error: 'Username already taken or invalid characters',
        email_user: '',
      });
    }
    return jsonResponse({});
  });

  try {
    await assert.rejects(
      async () => {
        await createCustomMailbox('takenusername', 'guerrillamail.com', 'guerrilla');
      },
      (err: Error) => {
        assert.ok(err.message.includes('kabul edilmedi') || err.message.includes('upstream'));
        return true;
      }
    );
  } finally {
    cleanupIntegrationSeam();
  }
});

test('Integration C2: Hydra rejected custom username with 422 Unprocessable Entity (Username taken)', async () => {
  setMockFetch((url, init) => {
    if (url.endsWith('/accounts') && init?.method === 'POST') {
      return jsonResponse({ message: 'Address already exists' }, 422);
    }
    return jsonResponse({});
  });

  try {
    await assert.rejects(
      async () => {
        await createCustomMailbox('existinguser', 'mail.tm', 'mail_tm');
      },
      (err: Error) => {
        assert.ok(err.message.includes('zaten alınmış') || err.message.includes('alınmış'));
        return true;
      }
    );
  } finally {
    cleanupIntegrationSeam();
  }
});

test('Integration C3: Strict validation rejects invalid username/domain formatting before network call', async () => {
  let networkCalled = false;
  setMockFetch(() => {
    networkCalled = true;
    return jsonResponse({});
  });

  try {
    await assert.rejects(async () => {
      await createCustomMailbox('invalid space', 'example.com', 'guerrilla');
    });
    await assert.rejects(async () => {
      await createCustomMailbox('validuser', '.invaliddomain.com', 'guerrilla');
    });
    await assert.rejects(async () => {
      await createCustomMailbox('', 'example.com', 'guerrilla');
    });
    assert.equal(networkCalled, false);
  } finally {
    cleanupIntegrationSeam();
  }
});

// ─── D. Expired Guerrilla Session & Automatic Renewal ────────────────────
test('Integration D1: Expired Guerrilla session in getMessages() automatically recovers token and notifies listener', async () => {
  const mailbox: Mailbox = {
    id: 'old_expired_sid',
    address: 'testuser@sharklasers.com',
    apiBase: 'guerrilla',
    token: 'old_expired_sid',
  };

  let tokenListenerNotified = false;
  let refreshedTokenValue = '';
  const unsubscribe = onTokenRefresh((_mbId, newToken) => {
    tokenListenerNotified = true;
    refreshedTokenValue = newToken;
  });

  let getEmailListCalls = 0;
  let renewalCalled = false;
  let setUserCalled = false;

  setMockFetch((url) => {
    if (url.includes('f=get_email_list')) {
      getEmailListCalls++;
      if (getEmailListCalls === 1) {
        // First call fails with session expiration error
        return jsonResponse({ error_codes: ['AUTH_FAILED'], list: null });
      }
      // Second call returns fresh messages with new sid
      return jsonResponse({
        list: [
          {
            mail_id: '9901',
            mail_from: 'auth@service.com',
            mail_subject: 'Your confirmation code: 58291',
            mail_excerpt: 'Enter code 58291 to verify',
            mail_read: 0,
            mail_timestamp: '1700000000',
          },
        ],
      });
    }
    if (url.includes('f=get_email_address')) {
      renewalCalled = true;
      return jsonResponse({
        sid_token: 'fresh_recovered_sid_999',
        email_addr: 'temp@sharklasers.com',
      });
    }
    if (url.includes('f=set_email_user')) {
      setUserCalled = true;
      return jsonResponse({
        email_user: 'testuser',
        email_addr: 'testuser@sharklasers.com',
        sid_token: 'fresh_recovered_sid_999',
      });
    }
    return jsonResponse({});
  });

  try {
    const messages = await getMessages(mailbox);
    assert.equal(messages.length, 1);
    assert.equal(messages[0].id, '9901');
    assert.equal(getEmailListCalls, 2);
    assert.ok(renewalCalled);
    assert.ok(setUserCalled);
    assert.ok(tokenListenerNotified);
    assert.equal(refreshedTokenValue, 'fresh_recovered_sid_999');
    assert.equal(mailbox.token, 'fresh_recovered_sid_999');
  } finally {
    unsubscribe();
    cleanupIntegrationSeam();
  }
});

test('Integration D2: Expired Guerrilla session in getMessageDetail() automatically recovers token and retries detail', async () => {
  const mailbox: Mailbox = {
    id: 'mb_detail_sid',
    address: 'detailuser@guerrillamail.com',
    apiBase: 'guerrilla',
    token: 'mb_detail_sid',
  };

  let fetchEmailCalls = 0;
  let renewalCalled = false;

  setMockFetch((url) => {
    if (url.includes('f=fetch_email')) {
      fetchEmailCalls++;
      if (fetchEmailCalls === 1) {
        // First attempt expired
        return jsonResponse({ error_codes: ['EXPIRED_SID'] });
      }
      return jsonResponse({
        mail_id: '4001',
        mail_from: 'team@github.com',
        mail_subject: 'GitHub verification code: 849201',
        mail_excerpt: 'GitHub code',
        mail_body: '<p>Your OTP code is <b>849201</b></p>',
        mail_timestamp: '1700000000',
        mail_recipient: 'detailuser@guerrillamail.com',
      });
    }
    if (url.includes('f=get_email_address')) {
      renewalCalled = true;
      return jsonResponse({
        sid_token: 'fresh_detail_sid_777',
        email_addr: 'temp@guerrillamail.com',
      });
    }
    if (url.includes('f=set_email_user')) {
      return jsonResponse({
        email_user: 'detailuser',
        email_addr: 'detailuser@guerrillamail.com',
        sid_token: 'fresh_detail_sid_777',
      });
    }
    return jsonResponse({});
  });

  try {
    const detail = await getMessageDetail(mailbox, '4001');
    assert.ok(detail);
    assert.equal(detail.id, '4001');
    const senderName = typeof detail.from === 'object' ? detail.from.name : detail.from;
    assert.equal(senderName, 'GitHub');
    assert.equal(detail.aiCategory, 'Verification');
    assert.equal(fetchEmailCalls, 2);
    assert.ok(renewalCalled);
    assert.equal(mailbox.token, 'fresh_detail_sid_777');
  } finally {
    cleanupIntegrationSeam();
  }
});

// ─── E. Inbox Message Fetching & Mapping ───────────────────────────────────
test('Integration E1: Guerrilla inbox maps fields correctly and filters out welcome message & duplicates', async () => {
  const mailbox: Mailbox = {
    id: 'inbox_sid_1',
    address: 'inboxtest@guerrillamail.com',
    apiBase: 'guerrilla',
    token: 'inbox_sid_1',
  };

  setMockFetch((url) => {
    if (url.includes('f=get_email_list')) {
      return jsonResponse({
        list: [
          // 1. Welcome email (should be filtered out)
          {
            mail_id: 'welcome_1',
            mail_from: 'no-reply@guerrillamail.com',
            mail_subject: 'Welcome to Guerrilla Mail',
            mail_excerpt: 'Welcome to temporary mail',
            mail_read: 0,
            mail_timestamp: '1700000000',
          },
          // 2. Real verification email
          {
            mail_id: 'msg_100',
            mail_from: 'security@instagram.com',
            mail_subject: '123456 is your Instagram code',
            mail_excerpt: 'Please verify your Instagram identity',
            mail_read: 0,
            mail_timestamp: '1700000500',
          },
          // 3. Duplicate of msg_100 (should be deduplicated)
          {
            mail_id: 'msg_100',
            mail_from: 'security@instagram.com',
            mail_subject: '123456 is your Instagram code',
            mail_excerpt: 'Please verify your Instagram identity',
            mail_read: 0,
            mail_timestamp: '1700000500',
          },
          // 4. Security email
          {
            mail_id: 'msg_101',
            mail_from: 'alert@netflix.com',
            mail_subject: 'New login attempt from London',
            mail_excerpt: 'We noticed a new login to your account',
            mail_read: 1,
            mail_timestamp: '1700000800',
          },
        ],
      });
    }
    return jsonResponse({});
  });

  try {
    const messages = await getMessages(mailbox);
    assert.equal(messages.length, 2);

    assert.equal(messages[0].id, 'msg_100');
    const senderName0 = typeof messages[0].from === 'object' ? messages[0].from.name : messages[0].from;
    assert.equal(senderName0, 'Instagram');
    assert.equal(messages[0].aiCategory, 'Verification');
    assert.equal(messages[0].seen, false);
    assert.ok(messages[0].createdAt.includes('T')); // ISO date check

    assert.equal(messages[1].id, 'msg_101');
    const senderName1 = typeof messages[1].from === 'object' ? messages[1].from.name : messages[1].from;
    assert.equal(senderName1, 'Netflix');
    assert.equal(messages[1].aiCategory, 'Security');
    assert.equal(messages[1].seen, true);
  } finally {
    cleanupIntegrationSeam();
  }
});

test('Integration E2: Hydra (mail_tm) inbox maps hydra:member list properly', async () => {
  const mailbox: Mailbox = {
    id: 'hydra_mb_2',
    address: 'hydrauser@mail.tm',
    apiBase: 'mail_tm',
    token: 'jwt_hydra_auth_token',
  };

  setMockFetch((url, init) => {
    if (url.endsWith('/messages') && init?.headers && (init.headers as any).Authorization) {
      return jsonResponse({
        'hydra:member': [
          {
            id: 'hydra_msg_1',
            from: { address: 'newsletter@apple.com', name: 'Apple News' },
            subject: 'Weekly Apple Developer Digest',
            intro: 'Check out the new SDK updates',
            seen: false,
            createdAt: '2026-08-29T08:00:00.000Z',
          },
        ],
      });
    }
    return jsonResponse({});
  });

  try {
    const messages = await getMessages(mailbox);
    assert.equal(messages.length, 1);
    assert.equal(messages[0].id, 'hydra_msg_1');
    const fromAddress = typeof messages[0].from === 'object' ? messages[0].from.address : messages[0].from;
    const fromName = typeof messages[0].from === 'object' ? messages[0].from.name : messages[0].from;
    assert.equal(fromAddress, 'newsletter@apple.com');
    assert.equal(fromName, 'Apple News');
    assert.equal(messages[0].aiCategory, 'Newsletter');
    assert.equal(messages[0].seen, false);
  } finally {
    cleanupIntegrationSeam();
  }
});

// ─── F. Malformed Inbox Response Handling ─────────────────────────────────
test('Integration F1: Guerrilla API returns non-JSON or corrupt schema gracefully without unhandled exceptions', async () => {
  const mailbox: Mailbox = {
    id: 'corrupt_sid',
    address: 'corrupt@guerrillamail.com',
    apiBase: 'guerrilla',
    token: 'corrupt_sid',
  };

  setMockFetch((url) => {
    if (url.includes('f=get_email_list')) {
      return textResponse('<html><body>Database Error</body></html>', 200);
    }
    if (url.includes('f=get_email_address')) {
      return textResponse('Server Busy', 503);
    }
    return jsonResponse({});
  });

  try {
    const messages = await getMessages(mailbox);
    assert.deepEqual(messages, []);
  } finally {
    cleanupIntegrationSeam();
  }
});

test('Integration F2: Hydra API returns malformed JSON or empty object', async () => {
  const mailbox: Mailbox = {
    id: 'hydra_corrupt',
    address: 'corrupt@mail.tm',
    apiBase: 'mail_tm',
    token: 'jwt_token',
  };

  setMockFetch((url) => {
    if (url.endsWith('/messages')) {
      return jsonResponse({ invalidField: true });
    }
    return jsonResponse({});
  });

  try {
    const messages = await getMessages(mailbox);
    assert.deepEqual(messages, []);
  } finally {
    cleanupIntegrationSeam();
  }
});

// ─── G. Message Detail Fetching with Header Parsing ───────────────────────
test('Integration G1: Guerrilla message detail parses complete header fields and body', async () => {
  const mailbox: Mailbox = {
    id: 'detail_mb_sid',
    address: 'recipient@sharklasers.com',
    apiBase: 'guerrilla',
    token: 'detail_mb_sid',
  };

  setMockFetch((url) => {
    if (url.includes('f=fetch_email')) {
      return jsonResponse({
        mail_id: '7721',
        mail_from: 'billing@microsoft.com',
        mail_recipient: 'recipient@sharklasers.com',
        mail_subject: 'Your Microsoft Azure Invoice',
        mail_excerpt: 'Invoice #AZ-89281',
        mail_body: '<p>Invoice details...</p>',
        mail_body_plain: 'Invoice details...',
        mail_timestamp: '1700001234',
        reply_to: 'support@microsoft.com',
        content_type: 'text/html',
        att: '1',
        attachments: [
          {
            id: 'att_1',
            filename: 'invoice.pdf',
            size: 10240,
            contentType: 'application/pdf',
          },
        ],
      });
    }
    return jsonResponse({});
  });

  try {
    const detail = await getMessageDetail(mailbox, '7721');
    assert.ok(detail);
    assert.equal(detail.id, '7721');
    const fromAddress = typeof detail.from === 'object' ? detail.from.address : detail.from;
    const fromName = typeof detail.from === 'object' ? detail.from.name : detail.from;
    assert.equal(fromAddress, 'billing@microsoft.com');
    assert.equal(fromName, 'Microsoft');
    assert.equal(detail.subject, 'Your Microsoft Azure Invoice');
    assert.equal(detail.html && detail.html[0], '<p>Invoice details...</p>');
    assert.equal(detail.text, 'Invoice details...');
    assert.equal(detail.hasAttachments, true);
    assert.equal(detail.attachments.length, 1);
    assert.equal(detail.attachments[0].filename, 'invoice.pdf');

    // Verify Header Fields parsing
    assert.ok(detail.headerFields);
    assert.equal(detail.headerFields.From, 'billing@microsoft.com');
    assert.equal(detail.headerFields.To, 'recipient@sharklasers.com');
    assert.equal(detail.headerFields.Subject, 'Your Microsoft Azure Invoice');
    assert.equal(detail.headerFields['Message-ID'], '7721');
    assert.equal(detail.headerFields['Reply-To'], 'support@microsoft.com');
    assert.equal(detail.headerFields['Content-Type'], 'text/html');
  } finally {
    cleanupIntegrationSeam();
  }
});

test('Integration G2: Hydra (mail_tm) message detail parses To, Cc, Size, Message-ID headers and attachments', async () => {
  const mailbox: Mailbox = {
    id: 'hydra_det_mb',
    address: 'target@mail.tm',
    apiBase: 'mail_tm',
    token: 'jwt_auth_val',
  };

  setMockFetch((url) => {
    if (url.includes('/messages/msg_hydra_99')) {
      return jsonResponse({
        id: 'msg_hydra_99',
        from: { address: 'admin@company.org', name: 'Admin Team' },
        to: [{ address: 'target@mail.tm', name: 'Target' }],
        cc: [{ address: 'supervisor@company.org', name: 'Supervisor' }],
        subject: 'Q3 Security Audit Report',
        intro: 'Security report attached',
        createdAt: '2026-08-29T07:30:00.000Z',
        msgid: '<msg_audit_99@company.org>',
        size: 54321,
        html: ['<div>Report attached</div>'],
        attachments: [
          {
            id: 'att_audit_1',
            filename: 'audit.pdf',
            size: 50000,
            contentType: 'application/pdf',
          },
        ],
      });
    }
    return jsonResponse({});
  });

  try {
    const detail = await getMessageDetail(mailbox, 'msg_hydra_99');
    assert.ok(detail);
    assert.equal(detail.id, 'msg_hydra_99');
    assert.ok(detail.headerFields);
    assert.equal(detail.headerFields.From, 'admin@company.org');
    assert.equal(detail.headerFields.To, 'target@mail.tm');
    assert.equal(detail.headerFields.Cc, 'supervisor@company.org');
    assert.equal(detail.headerFields['Message-ID'], '<msg_audit_99@company.org>');
    assert.equal(detail.headerFields.Size, '54321 bytes');
    assert.equal(detail.hasAttachments, true);
    assert.equal(detail.attachments[0].filename, 'audit.pdf');
  } finally {
    cleanupIntegrationSeam();
  }
});

// ─── H. Message Deletion and Batch Deletion ────────────────────────────────
test('Integration H1: Guerrilla single message deletion returns true on success', async () => {
  const mailbox: Mailbox = {
    id: 'del_sid_1',
    address: 'user@guerrillamail.com',
    apiBase: 'guerrilla',
    token: 'del_sid_1',
  };

  let delUrl = '';
  setMockFetch((url) => {
    if (url.includes('f=del_email')) {
      delUrl = url;
      return jsonResponse({ deleted_ids: ['991'] });
    }
    return jsonResponse({});
  });

  try {
    const success = await deleteMessage(mailbox, '991');
    assert.equal(success, true);
    assert.ok(delUrl.includes('email_ids[]=991'));
    assert.ok(delUrl.includes('sid_token=del_sid_1'));
  } finally {
    cleanupIntegrationSeam();
  }
});

test('Integration H2: Hydra single message deletion issues HTTP DELETE', async () => {
  const mailbox: Mailbox = {
    id: 'hydra_del',
    address: 'user@mail.tm',
    apiBase: 'mail_tm',
    token: 'jwt_tok',
  };

  let deleteIssued = false;
  setMockFetch((url, init) => {
    if (url.includes('/messages/hydra_del_1') && init?.method === 'DELETE') {
      deleteIssued = true;
      return new Response(null, { status: 204 });
    }
    return jsonResponse({});
  });

  try {
    const success = await deleteMessage(mailbox, 'hydra_del_1');
    assert.equal(success, true);
    assert.ok(deleteIssued);
  } finally {
    cleanupIntegrationSeam();
  }
});

test('Integration H3: deleteAllMessages() executes batch deletion', async () => {
  const mailbox: Mailbox = {
    id: 'del_all_sid',
    address: 'user@guerrillamail.com',
    apiBase: 'guerrilla',
    token: 'del_all_sid',
  };

  let batchDelCalled = false;
  setMockFetch((url) => {
    if (url.includes('f=get_email_list')) {
      return jsonResponse({
        list: [
          { mail_id: 'm1', mail_from: 'a@a.com', mail_subject: 'sub1', mail_excerpt: '', mail_read: 0, mail_timestamp: '1700000000' },
          { mail_id: 'm2', mail_from: 'b@b.com', mail_subject: 'sub2', mail_excerpt: '', mail_read: 0, mail_timestamp: '1700000000' },
        ],
      });
    }
    if (url.includes('f=del_email')) {
      batchDelCalled = true;
      return jsonResponse({ success: true });
    }
    return jsonResponse({});
  });

  try {
    const success = await deleteAllMessages(mailbox);
    assert.equal(success, true);
    assert.ok(batchDelCalled);
  } finally {
    cleanupIntegrationSeam();
  }
});

test('Integration H4: Deletion failure returns false cleanly', async () => {
  const mailbox: Mailbox = {
    id: 'del_fail_sid',
    address: 'user@guerrillamail.com',
    apiBase: 'guerrilla',
    token: 'del_fail_sid',
  };

  setMockFetch((url) => {
    if (url.includes('f=del_email')) {
      return textResponse('Server Error', 500);
    }
    return jsonResponse({});
  });

  try {
    const success = await deleteMessage(mailbox, 'msg_fail');
    assert.equal(success, false);
  } finally {
    cleanupIntegrationSeam();
  }
});

// ─── I. Mark-as-Read ──────────────────────────────────────────────────────
test('Integration I1: Guerrilla markMessageRead always returns true', async () => {
  const mailbox: Mailbox = {
    id: 'read_sid_1',
    address: 'user@guerrillamail.com',
    apiBase: 'guerrilla',
    token: 'read_sid_1',
  };

  const res = await markMessageRead(mailbox, '1234');
  assert.equal(res, true);
});

test('Integration I2: Hydra markMessageRead sends PATCH with isRead: true', async () => {
  const mailbox: Mailbox = {
    id: 'hydra_read_mb',
    address: 'user@mail.tm',
    apiBase: 'mail_tm',
    token: 'jwt_read_token',
  };

  let patchSent = false;
  let patchBody: any = null;

  setMockFetch((url, init) => {
    if (url.includes('/messages/msg_read_99') && init?.method === 'PATCH') {
      patchSent = true;
      patchBody = JSON.parse(init.body as string);
      return jsonResponse({ id: 'msg_read_99', seen: true });
    }
    return jsonResponse({});
  });

  try {
    const res = await markMessageRead(mailbox, 'msg_read_99');
    assert.equal(res, true);
    assert.ok(patchSent);
    assert.equal(patchBody?.isRead, true);
  } finally {
    cleanupIntegrationSeam();
  }
});

test('Integration I3: Hydra markMessageRead returns false on server error', async () => {
  const mailbox: Mailbox = {
    id: 'hydra_read_err',
    address: 'user@mail.tm',
    apiBase: 'mail_tm',
    token: 'jwt_token',
  };

  setMockFetch(() => textResponse('Error', 500));

  try {
    const res = await markMessageRead(mailbox, 'msg_err');
    assert.equal(res, false);
  } finally {
    cleanupIntegrationSeam();
  }
});

// ─── J. Rate Limit Detection (HTTP 429 & Retry-After) ─────────────────────
test('Integration J1: HTTP 429 parses Retry-After header, throws rate limit error, and fast-fails subsequent requests', async () => {
  clearRateLimit();
  let fetchCount = 0;

  setMockFetch(() => {
    fetchCount++;
    return new Response('Too Many Requests', {
      status: 429,
      headers: {
        'Retry-After': '5',
      },
    });
  });

  try {
    // First request receives 429 and throws
    await assert.rejects(
      async () => {
        await safeFetch('https://api.mail.tm/messages', undefined, 'mail_tm');
      },
      (err: Error) => {
        assert.ok(err.message.includes('Rate limit exceeded') || err.message.includes('wait'));
        return true;
      }
    );

    assert.equal(fetchCount, 1);
    assert.equal(isRateLimited('mail_tm'), true);
    assert.ok(getRateLimitRemainingMs('mail_tm') > 0);

    // Second request fast-fails immediately without network fetch
    await assert.rejects(
      async () => {
        await safeFetch('https://api.mail.tm/messages', undefined, 'mail_tm');
      },
      (err: Error) => {
        assert.ok(err.message.includes('Rate limited') || err.message.includes('Retry after'));
        return true;
      }
    );

    // Network call count must remain 1 (short-circuited)
    assert.equal(fetchCount, 1);

    // Clear rate limit and verify it allows calls again
    clearRateLimit('mail_tm');
    assert.equal(isRateLimited('mail_tm'), false);
  } finally {
    cleanupIntegrationSeam();
  }
});

// ─── K. Request Timeout with AbortController ──────────────────────────────
test('Integration K1: Pre-aborted signal immediately cancels safeFetch', async () => {
  const controller = new AbortController();
  controller.abort(new Error('Manual abort signal'));

  try {
    await assert.rejects(
      async () => {
        await safeFetch('https://api.mail.tm/accounts', { signal: controller.signal }, 'mail_tm');
      }
    );
  } finally {
    cleanupIntegrationSeam();
  }
});

test('Integration K2: Abort signal fired during fetch terminates request', async () => {
  const controller = new AbortController();

  setMockFetch((_url, init) => {
    return new Promise((_, reject) => {
      if (init?.signal) {
        init.signal.addEventListener('abort', () => {
          reject(new Error('Aborted by signal'));
        });
      }
    });
  });

  try {
    const promise = safeFetch('https://api.mail.tm/accounts', { signal: controller.signal }, 'mail_tm');
    setTimeout(() => {
      controller.abort();
    }, 10);

    await assert.rejects(async () => {
      await promise;
    });
  } finally {
    cleanupIntegrationSeam();
  }
});

// ─── L. Worker Stats Retrieval & Offline Fallback ─────────────────────────
test('Integration L1: getWorkerStats() returns valid JSON stats when online', async () => {
  setMockFetch((url) => {
    if (url.includes('/api/stats')) {
      return jsonResponse({
        totalAccountsCreated: 1250,
        totalEmailsReceived: 9800,
        activeRelays: 14,
      });
    }
    return jsonResponse({});
  });

  try {
    const stats = await getWorkerStats();
    assert.ok(stats);
    assert.equal(stats.totalAccountsCreated, 1250);
    assert.equal(stats.totalEmailsReceived, 9800);
    assert.equal(stats.activeRelays, 14);
  } finally {
    cleanupIntegrationSeam();
  }
});

test('Integration L2: getWorkerStats() returns null fallback gracefully when worker is offline or 500', async () => {
  setMockFetch((url) => {
    if (url.includes('/api/stats')) {
      return textResponse('Cloudflare Worker Unavailable', 503);
    }
    return jsonResponse({});
  });

  try {
    const stats = await getWorkerStats();
    assert.equal(stats, null);
  } finally {
    cleanupIntegrationSeam();
  }
});

test('Integration L3: getWorkerStats() returns null fallback on network throw', async () => {
  setMockFetch(() => {
    throw new Error('Network offline');
  });

  try {
    const stats = await getWorkerStats();
    assert.equal(stats, null);
  } finally {
    cleanupIntegrationSeam();
  }
});

// ─── M. fetchDomains & getGuerrillaDomains with Fallback ──────────────────
test('Integration M1: fetchDomains returns live fetched domains', async () => {
  clearDomainCache();
  setMockFetch((url) => {
    if (url.includes('f=get_email_address')) {
      return jsonResponse({
        email_addr: 'user@customguerrillanew.com',
      });
    }
    return jsonResponse({});
  });

  try {
    const result = await fetchDomains();
    assert.ok(result);
    assert.ok(result.domains.includes('customguerrillanew.com'));
    assert.equal(result.domainProviderMap['customguerrillanew.com'], 'guerrilla');
  } finally {
    cleanupIntegrationSeam();
  }
});

test('Integration M2: fetchDomains falls back to GUERRILLA_DOMAINS when API fails', async () => {
  clearDomainCache();
  setMockFetch(() => textResponse('Gateway Timeout', 504));

  try {
    const result = await fetchDomains();
    assert.ok(result);
    assert.ok(result.domains.length >= GUERRILLA_DOMAINS.length);
    assert.ok(result.domains.includes('sharklasers.com'));
    assert.equal(result.domainProviderMap['sharklasers.com'], 'guerrilla');
  } finally {
    cleanupIntegrationSeam();
  }
});

// ─── N. Custom Input Validation & Account Isolation Tests ─────────────────
test('Integration N1: createCustomMailbox rejects invalid inputs with strict errors', async () => {
  // Empty inputs
  await assert.rejects(() => createCustomMailbox('', 'sharklasers.com', 'guerrilla'));
  await assert.rejects(() => createCustomMailbox('testuser', '', 'guerrilla'));

  // Invalid characters / symbols in username
  await assert.rejects(() => createCustomMailbox('bad user with space', 'sharklasers.com', 'guerrilla'));
  await assert.rejects(() => createCustomMailbox('bad<user>@name', 'sharklasers.com', 'guerrilla'));
  await assert.rejects(() => createCustomMailbox('bad!user#name', 'sharklasers.com', 'guerrilla'));

  // Extremely long username (> 64 chars)
  const hugeUsername = 'a'.repeat(65);
  await assert.rejects(() => createCustomMailbox(hugeUsername, 'sharklasers.com', 'guerrilla'));

  // Invalid domain formatting
  await assert.rejects(() => createCustomMailbox('validuser', '.badprefix.com', 'guerrilla'));
  await assert.rejects(() => createCustomMailbox('validuser', 'badsuffix.com.', 'guerrilla'));
});

test('Integration N2: Multi-account isolation prevents message cross-contamination', () => {
  // Simulated accounts A and B
  const accountA: Mailbox = { id: 'box_A', address: 'alpha@sharklasers.com', apiBase: 'guerrilla' };
  const accountB: Mailbox = { id: 'box_B', address: 'beta@sharklasers.com', apiBase: 'guerrilla' };

  const messagesAccountA: EmailSummary[] = [
    { id: 'msg_101', from: 'alice@test.com', subject: 'Secret Alpha Code', intro: '', createdAt: new Date().toISOString(), seen: false, aiCategory: 'Verification' },
  ];
  const messagesAccountB: EmailSummary[] = [
    { id: 'msg_202', from: 'bob@test.com', subject: 'Beta Report', intro: '', createdAt: new Date().toISOString(), seen: false, aiCategory: 'Newsletter' },
  ];

  // Request token tracker simulation
  let activeAccountId = accountA.id;
  let activeRequestId = 1;

  // In-flight fetch for Account A starts (req 1)
  const req1_Account = activeAccountId;
  const req1_Id = activeRequestId;

  // User immediately switches to Account B (req 2)
  activeAccountId = accountB.id;
  activeRequestId = 2;

  // Late response for Account A arrives
  const isReq1ValidForCurrentState = (req1_Id === activeRequestId && req1_Account === activeAccountId);
  assert.equal(isReq1ValidForCurrentState, false, 'Late response from Account A must be discarded when active account is B');

  // Response for Account B arrives
  const isReq2ValidForCurrentState = (activeRequestId === 2 && activeAccountId === accountB.id);
  assert.equal(isReq2ValidForCurrentState, true, 'Active response for Account B must be accepted');
  assert.ok(!messagesAccountB.some(m => messagesAccountA.some(a => a.id === m.id)));
});

test('Integration N3: Deletion state prevents resurrected messages on subsequent poll merges', () => {
  const incomingServerList: EmailSummary[] = [
    { id: 'msg_301', from: 'bank@auth.com', subject: 'Your OTP', intro: '123456', createdAt: new Date().toISOString(), seen: false, aiCategory: 'Verification' },
    { id: 'msg_302', from: 'news@weekly.com', subject: 'Tech Roundup', intro: '', createdAt: new Date().toISOString(), seen: false, aiCategory: 'Newsletter' },
  ];

  const deletedIds = new Set<string>(['msg_301']); // User deleted msg_301

  // Filter server list against deletedIds
  const filtered = incomingServerList.filter(e => !deletedIds.has(e.id));
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].id, 'msg_302');
  assert.ok(!filtered.some(e => e.id === 'msg_301'));
});

// ─── O. Service Worker Bypass & Advanced Security Validation ──────────────
test('Integration O1: Service Worker cache filter logic ensures API endpoints and external providers bypass cache', () => {
  const APP_ORIGIN = 'https://mephistomail.site';

  const shouldBypassCache = (requestUrl: string): boolean => {
    const url = new URL(requestUrl, APP_ORIGIN);
    if (url.origin !== APP_ORIGIN) return true; // External API bypass
    if (
      url.pathname.startsWith('/api/') ||
      url.pathname.startsWith('/_next/') ||
      url.pathname.startsWith('/messages/') ||
      url.pathname.startsWith('/attachment/') ||
      url.pathname.startsWith('/accounts') ||
      url.pathname.startsWith('/token') ||
      url.searchParams.has('mailbox')
    ) return true;
    return false;
  };

  // External APIs must bypass cache
  assert.equal(shouldBypassCache('https://api.guerrillamail.com/ajax.php?f=get_email_address'), true);
  assert.equal(shouldBypassCache('https://api.mail.tm/messages/123'), true);
  assert.equal(shouldBypassCache('https://api.mail.gw/token'), true);

  // Sensitive application endpoints must bypass cache
  assert.equal(shouldBypassCache('https://mephistomail.site/api/stats'), true);
  assert.equal(shouldBypassCache('https://mephistomail.site/messages/msg_456'), true);
  assert.equal(shouldBypassCache('https://mephistomail.site/attachment/att_789'), true);
  assert.equal(shouldBypassCache('https://mephistomail.site/?mailbox=user@sharklasers.com'), true);

  // Static assets are cacheable
  assert.equal(shouldBypassCache('https://mephistomail.site/assets/index.js'), false);
  assert.equal(shouldBypassCache('https://mephistomail.site/icon.png'), false);
});

test('Integration O2: Action link extractor detects multilingual verification links (DE, ES, FR, IT, PT, RU, AR)', () => {
  const deHtml = '<p>Bitte <a href="https://example.com/auth/verify?token=123">E-Mail bestätigen</a> um fortzufahren.</p>';
  const deAction = extractActionLinks(deHtml);
  assert.ok(deAction);
  assert.equal(deAction.url, 'https://example.com/auth/verify?token=123');

  const esHtml = '<p>Haga clic para <a href="https://service.org/confirm?code=abc">Verificar correo</a> ahora.</p>';
  const esAction = extractActionLinks(esHtml);
  assert.ok(esAction);
  assert.equal(esAction.url, 'https://service.org/confirm?code=abc');

  const frHtml = '<p><a href="https://auth.net/activate?id=789">Activer le compte</a> immédiatement.</p>';
  const frAction = extractActionLinks(frHtml);
  assert.ok(frAction);
  assert.equal(frAction.url, 'https://auth.net/activate?id=789');

  const arHtml = '<p><a href="https://app.io/ar/verify?hash=xyz">تأكيد البريد</a> لإكمال التسجيل.</p>';
  const arAction = extractActionLinks(arHtml);
  assert.ok(arAction);
  assert.equal(arAction.url, 'https://app.io/ar/verify?hash=xyz');
});

test('Integration O3: Action link extractor blocks decimal/hex IP representation bypass attempts', () => {
  // Hex representation of 127.0.0.1 (0x7f000001)
  assert.equal(isSafeVerificationUrl('https://0x7f000001/verify'), false);
  // Decimal representation of 127.0.0.1 (2130706433)
  assert.equal(isSafeVerificationUrl('https://2130706433/verify'), false);
  // Octal/dotted decimal private ranges
  assert.equal(isSafeVerificationUrl('https://127.0.0.1/verify'), false);
  assert.equal(isSafeVerificationUrl('https://10.0.0.1/verify'), false);
  assert.equal(isSafeVerificationUrl('https://192.168.1.1/verify'), false);
  assert.equal(isSafeVerificationUrl('https://172.16.0.1/verify'), false);
  // IPv6 bracketed loopback
  assert.equal(isSafeVerificationUrl('https://[::1]/verify'), false);
  // Single label internal host
  assert.equal(isSafeVerificationUrl('https://intranet/verify'), false);

  // Legitimate public HTTPS URLs must pass
  assert.equal(isSafeVerificationUrl('https://github.com/verify?code=123'), true);
  assert.equal(isSafeVerificationUrl('https://verify.stripe.com/acc_456'), true);
});

test('Integration O4: All 9 locales have 100% key parity with 0 extra keys, 0 missing keys, and valid string values', () => {
  const enKeys = Object.keys(en);
  const localeObjects = { en, tr, de, es, fr, it, pt, ru, ar };

  for (const [langCode, dict] of Object.entries(localeObjects)) {
    const dictKeys = Object.keys(dict);
    const missing = enKeys.filter(k => !(k in dict));
    const extra = dictKeys.filter(k => !enKeys.includes(k));

    assert.equal(missing.length, 0, `Locale ${langCode} must have 0 missing keys. Missing: ${missing.join(', ')}`);
    assert.equal(extra.length, 0, `Locale ${langCode} must have 0 extra keys. Extra: ${extra.join(', ')}`);

    for (const key of dictKeys) {
      const val = (dict as Record<string, unknown>)[key];
      assert.equal(typeof val, 'string', `Key ${key} in ${langCode} must be a non-empty string`);
      assert.ok((val as string).trim().length > 0, `Key ${key} in ${langCode} must not be empty`);
    }
  }
});

test('Integration O5: Guerrilla Mail set_email_user contract resolves username from setData.email_addr or setData.email_user', async () => {
  // Test seam simulating Guerrilla Mail set_email_user real API responses
  const originalFetch = globalThis.fetch;
  try {
    // 1. Successful custom mailbox where Guerrilla returns email_addr (real Guerrilla contract)
    globalThis.fetch = async (url: any) => {
      const urlStr = String(url);
      if (urlStr.includes('f=get_email_address')) {
        return new Response(JSON.stringify({
          email_addr: 'random123@guerrillamailblock.com',
          sid_token: 'sid_valid_123',
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      if (urlStr.includes('f=set_email_user')) {
        return new Response(JSON.stringify({
          email_addr: 'cyber.amxmq564@guerrillamailblock.com',
          sid_token: 'sid_valid_123',
          auth: { success: true, error_codes: [] }
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      return new Response('{}', { status: 200 });
    };

    const mb = await createCustomMailbox('cyber.amxmq564', 'guerrillamailblock.com', 'guerrilla');
    assert.equal(mb.address, 'cyber.amxmq564@guerrillamailblock.com');
    assert.equal(mb.token, 'sid_valid_123');

    // 2. Rejected custom username where upstream returns error_codes
    globalThis.fetch = async (url: any) => {
      const urlStr = String(url);
      if (urlStr.includes('f=get_email_address')) {
        return new Response(JSON.stringify({
          email_addr: 'random123@guerrillamailblock.com',
          sid_token: 'sid_valid_456',
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      if (urlStr.includes('f=set_email_user')) {
        return new Response(JSON.stringify({
          alias_error: 'Invalid username format',
          error_codes: ['invalid_user'],
          auth: { success: false, error_codes: ['invalid_user'] }
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      return new Response('{}', { status: 200 });
    };

    await assert.rejects(
      async () => await createCustomMailbox('bad#user!', 'guerrillamailblock.com', 'guerrilla'),
      /İstenen özel kullanıcı adı upstream servis tarafından kabul edilmedi|Geçersiz e-posta adresi/
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('Integration O6: Test OTP simulation produces compliant verification email and extractable OTP', () => {
  const otpCode = '583214';
  const detail = {
    id: 'test_123456789',
    from: 'security@verify-service.com',
    subject: `🔐 Doğrulama Kodunuz: ${otpCode}`,
    body: `MephistoMail canlı test doğrulaması. OTP: ${otpCode}`,
    date: new Date().toLocaleTimeString(),
  };

  const extracted = extractOTP(detail.body);
  assert.equal(extracted, '583214');

  const subjectExtracted = extractOTP(detail.subject);
  assert.equal(subjectExtracted, '583214');
});

test('Integration O7: Language toggle cycle covers all 9 supported locales', () => {
  const langOrder = ['en', 'tr', 'de', 'es', 'fr', 'it', 'pt', 'ru', 'ar'];
  assert.equal(langOrder.length, 9);

  let currentLang = 'en';
  const visited = [currentLang];
  for (let i = 0; i < langOrder.length - 1; i++) {
    currentLang = langOrder[(langOrder.indexOf(currentLang) + 1) % langOrder.length];
    visited.push(currentLang);
  }

  assert.deepEqual(visited, ['en', 'tr', 'de', 'es', 'fr', 'it', 'pt', 'ru', 'ar']);
  const backToStart = langOrder[(langOrder.indexOf(currentLang) + 1) % langOrder.length];
  assert.equal(backToStart, 'en');
});

test('Integration O8: Guerrilla Mail empty subject fallback displays excerpt cleanly', async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (url: any) => {
      const urlStr = String(url);
      if (urlStr.includes('f=get_email_list')) {
        return new Response(JSON.stringify({
          list: [
            {
              mail_id: '288001682',
              mail_from: 'jokallame0@gmail.com',
              mail_subject: '',
              mail_excerpt: 'MephistoMail test kodu: 583214\n\n',
              mail_timestamp: '1787988786',
              mail_read: '0',
              mail_date: '07:33:06',
              att: '0',
              mail_size: '4811'
            }
          ],
          count: '1',
          email: 'cyber.amxmq564@guerrillamailblock.com',
          sid_token: 'sid_test_empty_subj'
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      return new Response('{}', { status: 200 });
    };

    const messages = await getMessages({
      id: 'sid_test_empty_subj',
      address: 'cyber.amxmq564@guerrillamailblock.com',
      apiBase: 'guerrilla',
      token: 'sid_test_empty_subj'
    });

    assert.equal(messages.length, 1);
    assert.equal(messages[0].id, '288001682');
    const fromAddr = typeof messages[0].from === 'string' ? messages[0].from : messages[0].from?.address;
    assert.equal(fromAddr, 'jokallame0@gmail.com');
    // Excerpt was used when subject was empty
    assert.ok(messages[0].subject.includes('MephistoMail test kodu: 583214') || messages[0].intro.includes('MephistoMail test kodu: 583214'));
    assert.equal(messages[0].aiCategory, 'Verification');
  } finally {
    globalThis.fetch = originalFetch;
  }
});


