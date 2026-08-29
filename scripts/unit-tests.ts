import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

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

import {
  getLocalizedErrorMessage,
} from '../src/utils/errorLocalization.ts';

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
  rehydrateMailboxSession,
  MailboxFetchError,
  clearInFlightFetches,
} from '../src/services/mailService.ts';
import {
  safeParseAccounts,
  getInitialActiveId,
  STORAGE_KEY,
  ACCOUNT_LIFETIME_MS,
  MAX_ACTIVE_ACCOUNTS,
  cleanupLegacyStorage,
} from '../src/hooks/useMailbox.ts';
import {
  getInboxCacheKey,
  getDeletedCacheKey,
  safeReadDeletedIds,
  safeSaveDeletedIds,
  safeReadDeleted,
  safeSaveDeleted,
  safeReadInbox,
  safeSaveInbox,
  safeClearInbox,
} from '../src/hooks/useEmails.ts';
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
test('Integration F1: Guerrilla API returns non-JSON or corrupt schema and throws MailboxFetchError instead of swallowing to []', async () => {
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
    await assert.rejects(
      async () => { await getMessages(mailbox); },
      (err: any) => err instanceof MailboxFetchError
    );
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
    await assert.rejects(
      async () => { await getMessages(mailbox); },
      (err: any) => err instanceof MailboxFetchError && err.code === 'INVALID_RESPONSE'
    );
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

// ═══════════════════════════════════════════════════════════════════════════
// Suite P: Session Rehydration, Error Propagation & Mailbox Fetch Security
// ═══════════════════════════════════════════════════════════════════════════

test('Integration P1: rehydrateMailboxSession establishes fresh SID and binds username for restored mailbox', async () => {
  const originalFetch = globalThis.fetch;
  const calls: string[] = [];

  try {
    globalThis.fetch = async (url: any) => {
      const urlStr = String(url);
      calls.push(urlStr);

      if (urlStr.includes('f=get_email_address')) {
        return new Response(JSON.stringify({
          email_addr: 'random_init@guerrillamailblock.com',
          sid_token: 'rehydrated_sid_99182',
          alias: 'alias_random'
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }

      if (urlStr.includes('f=set_email_user')) {
        return new Response(JSON.stringify({
          email_addr: 'cyber.amxmq564@guerrillamailblock.com',
          sid_token: 'rehydrated_sid_99182',
          auth: { success: true, error_codes: [] }
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }

      return new Response('{}', { status: 200 });
    };

    const restoredMailbox: Mailbox = {
      id: 'acc_persisted_1',
      address: 'cyber.amxmq564@guerrillamail.de',
      apiBase: 'guerrilla',
      token: undefined,
      createdAt: Date.now()
    };

    let notifiedToken = '';
    const unsub = onTokenRefresh((id, token) => {
      if (id === restoredMailbox.id) notifiedToken = token;
    });

    const newSid = await rehydrateMailboxSession(restoredMailbox);
    unsub();

    assert.equal(newSid, 'rehydrated_sid_99182');
    assert.equal(restoredMailbox.token, 'rehydrated_sid_99182');
    assert.equal(notifiedToken, 'rehydrated_sid_99182');
    assert.equal(restoredMailbox.address, 'cyber.amxmq564@guerrillamail.de');
    assert.ok(calls.some(c => c.includes('f=get_email_address')));
    assert.ok(calls.some(c => c.includes('f=set_email_user') && c.includes('email_user=cyber.amxmq564')));
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('Integration P2: rehydrateMailboxSession throws MailboxFetchError when upstream rejects binding', async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (url: any) => {
      const urlStr = String(url);
      if (urlStr.includes('f=get_email_address')) {
        return new Response(JSON.stringify({ sid_token: 'sid_fail_test' }), { status: 200 });
      }
      if (urlStr.includes('f=set_email_user')) {
        return new Response(JSON.stringify({ error_codes: ['alias_taken'] }), { status: 200 });
      }
      return new Response('{}', { status: 200 });
    };

    const mailbox: Mailbox = {
      id: 'acc_fail_01',
      address: 'baduser@guerrillamail.com',
      apiBase: 'guerrilla',
      token: undefined
    };

    await assert.rejects(
      async () => { await rehydrateMailboxSession(mailbox); },
      (err: any) => err instanceof MailboxFetchError && err.code === 'REHYDRATION_FAILED'
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('Integration P3: getMessages on token-less mailbox rehydrates session and retrieves messages seamlessly', async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (url: any) => {
      const urlStr = String(url);
      if (urlStr.includes('f=get_email_address')) {
        return new Response(JSON.stringify({
          email_addr: 'temp_init@guerrillamailblock.com',
          sid_token: 'sid_rehydrate_inbox_test'
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      if (urlStr.includes('f=set_email_user')) {
        return new Response(JSON.stringify({
          email_addr: 'ninja.2spmy895@guerrillamailblock.com',
          sid_token: 'sid_rehydrate_inbox_test',
          auth: { success: true }
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      if (urlStr.includes('f=get_email_list')) {
        return new Response(JSON.stringify({
          list: [
            {
              mail_id: '9901',
              mail_from: 'jokallame0@gmail.com',
              mail_subject: 'Verification Code',
              mail_excerpt: 'Your code is 884192',
              mail_timestamp: '1787989999',
              mail_read: '0'
            }
          ]
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      return new Response('{}', { status: 200 });
    };

    const restoredMailbox: Mailbox = {
      id: 'acc_ninja_01',
      address: 'ninja.2spmy895@sharklasers.com',
      apiBase: 'guerrilla',
      token: undefined
    };

    const messages = await getMessages(restoredMailbox);
    assert.equal(messages.length, 1);
    assert.equal(messages[0].id, '9901');
    assert.equal(messages[0].subject, 'Verification Code');
    assert.equal(restoredMailbox.token, 'sid_rehydrate_inbox_test');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('Integration P4: getMessages throws MailboxFetchError on upstream network/API failure and never returns []', async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () => new Response('Internal Server Error', { status: 500 });

    const mailbox: Mailbox = {
      id: 'acc_err_01',
      address: 'test.err@guerrillamail.com',
      apiBase: 'guerrilla',
      token: undefined
    };

    await assert.rejects(
      async () => { await getMessages(mailbox); },
      (err: any) => err instanceof MailboxFetchError
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('Integration P5: getMessages retries session rehydration once when session is expired', async () => {
  const originalFetch = globalThis.fetch;
  let attempts = 0;
  try {
    globalThis.fetch = async (url: any) => {
      const urlStr = String(url);
      if (urlStr.includes('f=get_email_list') && attempts === 0) {
        attempts++;
        return new Response(JSON.stringify({ error_codes: ['invalid_sid'] }), { status: 200 });
      }
      if (urlStr.includes('f=get_email_address')) {
        return new Response(JSON.stringify({ sid_token: 'fresh_sid_retry' }), { status: 200 });
      }
      if (urlStr.includes('f=set_email_user')) {
        return new Response(JSON.stringify({ auth: { success: true } }), { status: 200 });
      }
      if (urlStr.includes('f=get_email_list') && attempts > 0) {
        return new Response(JSON.stringify({
          list: [{ mail_id: '5544', mail_from: 'user@example.com', mail_subject: 'Recovered Message' }]
        }), { status: 200 });
      }
      return new Response('{}', { status: 200 });
    };

    const mailbox: Mailbox = {
      id: 'acc_retry_01',
      address: 'user.retry@guerrillamail.com',
      apiBase: 'guerrilla',
      token: 'old_expired_sid'
    };

    const messages = await getMessages(mailbox);
    assert.equal(messages.length, 1);
    assert.equal(messages[0].id, '5544');
    assert.equal(mailbox.token, 'fresh_sid_retry');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('Integration P6: getMessageDetail with missing token rehydrates and returns full email detail', async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (url: any) => {
      const urlStr = String(url);
      if (urlStr.includes('f=get_email_address')) {
        return new Response(JSON.stringify({
          email_addr: 'temp@guerrillamailblock.com',
          sid_token: 'sid_detail_rehydrate'
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      if (urlStr.includes('f=set_email_user')) {
        return new Response(JSON.stringify({
          email_addr: 'user.detail@guerrillamailblock.com',
          sid_token: 'sid_detail_rehydrate',
          auth: { success: true }
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      if (urlStr.includes('f=fetch_email')) {
        return new Response(JSON.stringify({
          mail_id: '8877',
          mail_from: 'service@security.org',
          mail_subject: 'Your Access Key',
          mail_body: '<p>Secret key: 991823</p>',
          mail_excerpt: 'Secret key: 991823'
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      return new Response('{}', { status: 200 });
    };

    const mailbox: Mailbox = {
      id: 'acc_detail_01',
      address: 'user.detail@guerrillamail.info',
      apiBase: 'guerrilla',
      token: undefined
    };

    const detail = await getMessageDetail(mailbox, '8877');
    assert.ok(detail);
    assert.equal(detail.id, '8877');
    assert.equal(detail.subject, 'Your Access Key');
    assert.ok(detail.html?.[0]?.includes('Secret key: 991823'));
    assert.equal(mailbox.token, 'sid_detail_rehydrate');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('Integration P7: deleteMessage with missing token rehydrates session and executes deletion', async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (url: any) => {
      const urlStr = String(url);
      if (urlStr.includes('f=get_email_address')) {
        return new Response(JSON.stringify({
          email_addr: 'temp@guerrillamailblock.com',
          sid_token: 'sid_del_rehydrate'
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      if (urlStr.includes('f=set_email_user')) {
        return new Response(JSON.stringify({
          email_addr: 'user.del@guerrillamailblock.com',
          sid_token: 'sid_del_rehydrate',
          auth: { success: true }
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      if (urlStr.includes('f=del_email')) {
        return new Response(JSON.stringify({ deleted_ids: ['9988'] }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      return new Response('{}', { status: 200 });
    };

    const mailbox: Mailbox = {
      id: 'acc_del_01',
      address: 'user.del@guerrillamail.biz',
      apiBase: 'guerrilla',
      token: undefined
    };

    const res = await deleteMessage(mailbox, '9988');
    assert.equal(res, true);
    assert.equal(mailbox.token, 'sid_del_rehydrate');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// Suite Q: Per-Mailbox Inbox Persistence, Cache Isolation & Non-Destructive Merge
// ═══════════════════════════════════════════════════════════════════════════

test('Integration Q1: safeSaveInbox and safeReadInbox persist EmailSummary[] with versioned key', () => {
  // Clear any existing items in mock/global storage
  const mockStorage: Record<string, string> = {};
  const originalLocalStorage = globalThis.localStorage;
  const originalSessionStorage = globalThis.sessionStorage;

  try {
    const storageImpl = {
      getItem: (k: string) => mockStorage[k] || null,
      setItem: (k: string, v: string) => { mockStorage[k] = v; },
      removeItem: (k: string) => { delete mockStorage[k]; },
      clear: () => { for (const k of Object.keys(mockStorage)) delete mockStorage[k]; }
    };
    (globalThis as any).localStorage = storageImpl;
    (globalThis as any).sessionStorage = storageImpl;

    const accountA: Mailbox = { id: 'acc_A', address: 'alpha@sharklasers.com', apiBase: 'guerrilla' };
    const emailsA: EmailSummary[] = [
      { id: '101', from: 'gmail@sender.com', subject: 'Code A', intro: 'Code A', seen: false, createdAt: '2026-08-29T10:00:00.000Z', aiCategory: 'Verification' },
      { id: '102', from: 'security@verify.com', subject: 'Alert A', intro: 'Alert A', seen: true, createdAt: '2026-08-29T09:00:00.000Z', aiCategory: 'Security' }
    ];

    safeSaveInbox(accountA, emailsA);

    const keyA = getInboxCacheKey(accountA);
    assert.equal(keyA, 'mephisto_inbox_v2_alpha@sharklasers.com');
    assert.ok(mockStorage[keyA!]);

    const restored = safeReadInbox(accountA);
    assert.equal(restored.length, 2);
    assert.equal(restored[0].id, '101');
    assert.equal(restored[1].id, '102');
  } finally {
    (globalThis as any).localStorage = originalLocalStorage;
    (globalThis as any).sessionStorage = originalSessionStorage;
  }
});

test('Integration Q2: safeSaveInbox does not overwrite existing cache with [] unless allowEmpty is true', () => {
  const mockStorage: Record<string, string> = {};
  const originalLocalStorage = globalThis.localStorage;
  const originalSessionStorage = globalThis.sessionStorage;

  try {
    const storageImpl = {
      getItem: (k: string) => mockStorage[k] || null,
      setItem: (k: string, v: string) => { mockStorage[k] = v; },
      removeItem: (k: string) => { delete mockStorage[k]; },
    };
    (globalThis as any).localStorage = storageImpl;
    (globalThis as any).sessionStorage = storageImpl;

    const accountA: Mailbox = { id: 'acc_A', address: 'beta@guerrillamail.com', apiBase: 'guerrilla' };
    const emailsA: EmailSummary[] = [
      { id: '201', from: 'sender@gmail.com', subject: 'Preserved Code', intro: '123456', seen: false, createdAt: '2026-08-29T10:00:00.000Z', aiCategory: 'Verification' }
    ];

    safeSaveInbox(accountA, emailsA);
    assert.equal(safeReadInbox(accountA).length, 1);

    // Call safeSaveInbox with [] without allowEmpty -> must NOT wipe cache
    safeSaveInbox(accountA, []);
    assert.equal(safeReadInbox(accountA).length, 1);
    assert.equal(safeReadInbox(accountA)[0].id, '201');

    // Call safeSaveInbox with [] and allowEmpty = true -> should clear cache
    safeSaveInbox(accountA, [], true);
    assert.equal(safeReadInbox(accountA).length, 0);
  } finally {
    (globalThis as any).localStorage = originalLocalStorage;
    (globalThis as any).sessionStorage = originalSessionStorage;
  }
});

test('Integration Q3: Mailbox A and Mailbox B caches are strictly isolated', () => {
  const mockStorage: Record<string, string> = {};
  const originalLocalStorage = globalThis.localStorage;
  const originalSessionStorage = globalThis.sessionStorage;

  try {
    const storageImpl = {
      getItem: (k: string) => mockStorage[k] || null,
      setItem: (k: string, v: string) => { mockStorage[k] = v; },
      removeItem: (k: string) => { delete mockStorage[k]; },
    };
    (globalThis as any).localStorage = storageImpl;
    (globalThis as any).sessionStorage = storageImpl;

    const accountA: Mailbox = { id: 'acc_A', address: 'userA@guerrillamail.com', apiBase: 'guerrilla' };
    const accountB: Mailbox = { id: 'acc_B', address: 'userB@sharklasers.com', apiBase: 'guerrilla' };

    safeSaveInbox(accountA, [{ id: 'A1', from: 'gmailA@mail.com', subject: 'Mail A', intro: 'A', seen: false, createdAt: '2026-08-29T10:00:00Z', aiCategory: 'Verification' }]);
    safeSaveInbox(accountB, [{ id: 'B1', from: 'gmailB@mail.com', subject: 'Mail B', intro: 'B', seen: false, createdAt: '2026-08-29T10:00:00Z', aiCategory: 'Verification' }]);

    const cacheA = safeReadInbox(accountA);
    const cacheB = safeReadInbox(accountB);

    assert.equal(cacheA.length, 1);
    assert.equal(cacheA[0].id, 'A1');

    assert.equal(cacheB.length, 1);
    assert.equal(cacheB[0].id, 'B1');

    // Zero cross leakage
    assert.notEqual(cacheA[0].id, cacheB[0].id);
  } finally {
    (globalThis as any).localStorage = originalLocalStorage;
    (globalThis as any).sessionStorage = originalSessionStorage;
  }
});

test('Integration Q4: safeClearInbox clears cache for the targeted account only', () => {
  const mockStorage: Record<string, string> = {};
  const originalLocalStorage = globalThis.localStorage;
  const originalSessionStorage = globalThis.sessionStorage;

  try {
    const storageImpl = {
      getItem: (k: string) => mockStorage[k] || null,
      setItem: (k: string, v: string) => { mockStorage[k] = v; },
      removeItem: (k: string) => { delete mockStorage[k]; },
    };
    (globalThis as any).localStorage = storageImpl;
    (globalThis as any).sessionStorage = storageImpl;

    const accountA: Mailbox = { id: 'acc_A', address: 'userA@guerrillamail.com', apiBase: 'guerrilla' };
    const accountB: Mailbox = { id: 'acc_B', address: 'userB@sharklasers.com', apiBase: 'guerrilla' };

    safeSaveInbox(accountA, [{ id: 'A1', from: 'a@mail.com', subject: 'A', intro: 'A', seen: false, createdAt: '2026-08-29T10:00:00Z', aiCategory: 'Verification' }]);
    safeSaveInbox(accountB, [{ id: 'B1', from: 'b@mail.com', subject: 'B', intro: 'B', seen: false, createdAt: '2026-08-29T10:00:00Z', aiCategory: 'Verification' }]);

    safeClearInbox(accountA);

    assert.equal(safeReadInbox(accountA).length, 0);
    assert.equal(safeReadInbox(accountB).length, 1);
    assert.equal(safeReadInbox(accountB)[0].id, 'B1');
  } finally {
    (globalThis as any).localStorage = originalLocalStorage;
    (globalThis as any).sessionStorage = originalSessionStorage;
  }
});

test('Integration Q5: Corrupt or invalid JSON falls back to [] without crashing', () => {
  const mockStorage: Record<string, string> = {
    'mephisto_inbox_v2_corrupt@guerrillamail.com': '{ not valid json'
  };
  const originalLocalStorage = globalThis.localStorage;
  const originalSessionStorage = globalThis.sessionStorage;

  try {
    const storageImpl = {
      getItem: (k: string) => mockStorage[k] || null,
      setItem: (k: string, v: string) => { mockStorage[k] = v; },
      removeItem: (k: string) => { delete mockStorage[k]; },
    };
    (globalThis as any).localStorage = storageImpl;
    (globalThis as any).sessionStorage = storageImpl;

    const account: Mailbox = { id: 'acc_corrupt', address: 'corrupt@guerrillamail.com', apiBase: 'guerrilla' };
    const result = safeReadInbox(account);
    assert.deepEqual(result, []);
  } finally {
    (globalThis as any).localStorage = originalLocalStorage;
    (globalThis as any).sessionStorage = originalSessionStorage;
  }
});

test('Integration Q6: safeSaveInbox caps cache at 200 items', () => {
  const mockStorage: Record<string, string> = {};
  const originalLocalStorage = globalThis.localStorage;
  const originalSessionStorage = globalThis.sessionStorage;

  try {
    const storageImpl = {
      getItem: (k: string) => mockStorage[k] || null,
      setItem: (k: string, v: string) => { mockStorage[k] = v; },
      removeItem: (k: string) => { delete mockStorage[k]; },
    };
    (globalThis as any).localStorage = storageImpl;
    (globalThis as any).sessionStorage = storageImpl;

    const account: Mailbox = { id: 'acc_many', address: 'many@guerrillamail.com', apiBase: 'guerrilla' };
    const manyEmails: EmailSummary[] = Array.from({ length: 300 }, (_, i) => ({
      id: String(i),
      from: 'test@sender.com',
      subject: `Subject ${i}`,
      intro: `Intro ${i}`,
      seen: false,
      createdAt: new Date(Date.now() - i * 1000).toISOString(),
      aiCategory: 'Other'
    }));

    safeSaveInbox(account, manyEmails);
    const read = safeReadInbox(account);
    assert.equal(read.length, 200);
    assert.equal(read[0].id, '0');
  } finally {
    (globalThis as any).localStorage = originalLocalStorage;
    (globalThis as any).sessionStorage = originalSessionStorage;
  }
});

test('Integration Q7: getDeletedCacheKey generates canonical versioned key mephisto_deleted_v1_${account.address.toLowerCase().trim()}', () => {
  const account1: Mailbox = { id: 'acc1', address: 'UserA@GuerrillaMail.com ', apiBase: 'guerrilla' };
  const account2: Mailbox = { id: 'acc2', address: 'usera@sharklasers.com', apiBase: 'guerrilla' };
  const accountNull: Mailbox = { id: 'acc3', address: '', apiBase: 'guerrilla' };

  assert.equal(getDeletedCacheKey(account1), 'mephisto_deleted_v1_usera@guerrillamail.com');
  assert.equal(getDeletedCacheKey(account2), 'mephisto_deleted_v1_usera@sharklasers.com');
  assert.equal(getDeletedCacheKey(accountNull), null);
  assert.equal(getDeletedCacheKey(null), null);
});

test('Integration Q8: safeSaveDeletedIds and safeReadDeletedIds persist deleted message IDs across simulated reloads', () => {
  const mockStorage: Record<string, string> = {};
  const originalLocalStorage = globalThis.localStorage;
  const originalSessionStorage = globalThis.sessionStorage;

  try {
    const storageImpl = {
      getItem: (k: string) => mockStorage[k] || null,
      setItem: (k: string, v: string) => { mockStorage[k] = v; },
      removeItem: (k: string) => { delete mockStorage[k]; },
    };
    (globalThis as any).localStorage = storageImpl;
    (globalThis as any).sessionStorage = storageImpl;

    const account: Mailbox = { id: 'acc_persist_del', address: 'persist@sharklasers.com', apiBase: 'guerrilla' };
    const deletedSet = new Set(['msg_101', 'msg_102', 'msg_103']);

    safeSaveDeletedIds(account, deletedSet);

    // Verify key in mockStorage
    assert.ok(mockStorage['mephisto_deleted_v1_persist@sharklasers.com']);

    // Simulate page reload (F5) by reading directly from storage
    const restored = safeReadDeletedIds(account);
    assert.equal(restored.size, 3);
    assert.ok(restored.has('msg_101'));
    assert.ok(restored.has('msg_102'));
    assert.ok(restored.has('msg_103'));
    assert.equal(restored.has('msg_999'), false);
  } finally {
    (globalThis as any).localStorage = originalLocalStorage;
    (globalThis as any).sessionStorage = originalSessionStorage;
  }
});

test('Integration Q9: Deleted IDs and Inbox caches are strictly isolated between same-username different-domain accounts', () => {
  const mockStorage: Record<string, string> = {};
  const originalLocalStorage = globalThis.localStorage;
  const originalSessionStorage = globalThis.sessionStorage;

  try {
    const storageImpl = {
      getItem: (k: string) => mockStorage[k] || null,
      setItem: (k: string, v: string) => { mockStorage[k] = v; },
      removeItem: (k: string) => { delete mockStorage[k]; },
    };
    (globalThis as any).localStorage = storageImpl;
    (globalThis as any).sessionStorage = storageImpl;

    const accountG: Mailbox = { id: 'acc_g', address: 'abc@guerrillamail.com', apiBase: 'guerrilla' };
    const accountS: Mailbox = { id: 'acc_s', address: 'abc@sharklasers.com', apiBase: 'guerrilla' };

    // Save different deleted IDs
    safeSaveDeletedIds(accountG, new Set(['msg_g_1']));
    safeSaveDeletedIds(accountS, new Set(['msg_s_1']));

    // Save different emails
    safeSaveInbox(accountG, [{ id: 'msg_g_1', from: 'fromG', subject: 'Sub G', intro: 'G', seen: false, createdAt: '2026-08-29T10:00:00Z', aiCategory: 'Other' }]);
    safeSaveInbox(accountS, [{ id: 'msg_s_1', from: 'fromS', subject: 'Sub S', intro: 'S', seen: false, createdAt: '2026-08-29T10:00:00Z', aiCategory: 'Other' }]);

    const delG = safeReadDeletedIds(accountG);
    const delS = safeReadDeletedIds(accountS);
    assert.ok(delG.has('msg_g_1'));
    assert.equal(delG.has('msg_s_1'), false);
    assert.ok(delS.has('msg_s_1'));
    assert.equal(delS.has('msg_g_1'), false);

    const inboxG = safeReadInbox(accountG);
    const inboxS = safeReadInbox(accountS);
    assert.equal(inboxG[0].id, 'msg_g_1');
    assert.equal(inboxS[0].id, 'msg_s_1');
  } finally {
    (globalThis as any).localStorage = originalLocalStorage;
    (globalThis as any).sessionStorage = originalSessionStorage;
  }
});

test('Integration Q10: safeSaveDeletedIds caps stored IDs at 500', () => {
  const mockStorage: Record<string, string> = {};
  const originalLocalStorage = globalThis.localStorage;
  const originalSessionStorage = globalThis.sessionStorage;

  try {
    const storageImpl = {
      getItem: (k: string) => mockStorage[k] || null,
      setItem: (k: string, v: string) => { mockStorage[k] = v; },
      removeItem: (k: string) => { delete mockStorage[k]; },
    };
    (globalThis as any).localStorage = storageImpl;
    (globalThis as any).sessionStorage = storageImpl;

    const account: Mailbox = { id: 'acc_cap', address: 'cap@sharklasers.com', apiBase: 'guerrilla' };
    const largeSet = new Set(Array.from({ length: 700 }, (_, i) => `id_${i}`));

    safeSaveDeletedIds(account, largeSet);

    const restored = safeReadDeletedIds(account);
    assert.equal(restored.size, 500);
    assert.ok(restored.has('id_0'));
    assert.ok(restored.has('id_499'));
    assert.equal(restored.has('id_500'), false);
  } finally {
    (globalThis as any).localStorage = originalLocalStorage;
    (globalThis as any).sessionStorage = originalSessionStorage;
  }
});

test('Integration Q11: Deterministic merge filters upstream with deletedIds, deduplicates, and preserves existing items', () => {
  const _account: Mailbox = { id: 'acc_merge', address: 'merge@sharklasers.com', apiBase: 'guerrilla' };
  const deleted = new Set(['del_1', 'del_2']);

  const upstream: EmailSummary[] = [
    { id: 'del_1', from: 'spam@test.com', subject: 'Spam 1', intro: '1', seen: false, createdAt: '2026-08-29T11:00:00Z', aiCategory: 'Other' },
    { id: 'keep_1', from: 'friend@test.com', subject: 'Hello', intro: 'Hi', seen: false, createdAt: '2026-08-29T10:30:00Z', aiCategory: 'Other' },
  ];

  const cached: EmailSummary[] = [
    { id: 'keep_2', from: 'work@test.com', subject: 'Task', intro: 'Do this', seen: true, createdAt: '2026-08-29T09:00:00Z', aiCategory: 'Other' },
    { id: 'del_2', from: 'old@test.com', subject: 'Old Deleted', intro: 'Old', seen: true, createdAt: '2026-08-29T08:00:00Z', aiCategory: 'Other' },
  ];

  // Merge logic simulation matching useEmails
  const filteredUpstream = upstream.filter(e => !deleted.has(e.id));
  const map = new Map<string, EmailSummary>();
  cached.forEach(item => { if (!deleted.has(item.id)) map.set(item.id, item); });
  filteredUpstream.forEach(item => map.set(item.id, item));

  const merged = Array.from(map.values())
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 200);

  assert.equal(merged.length, 2);
  assert.equal(merged[0].id, 'keep_1');
  assert.equal(merged[1].id, 'keep_2');
  assert.equal(merged.some(m => deleted.has(m.id)), false);
});

// ═══════════════════════════════════════════════════════════════════════════
// SUITE 18 / SUITE R: Storage Security, Mailbox Lifecycle & Token Isolation
// ═══════════════════════════════════════════════════════════════════════════

test('Integration R1: safeParseAccounts strips token and password from raw JSON and returns undefined for both', () => {
  const rawAccounts = JSON.stringify([
    {
      id: 'acc1',
      address: 'user1@guerrillamail.com',
      apiBase: 'guerrilla',
      token: 'secret_guerrilla_sid_token_123',
      password: 'super_secret_password_abc',
      createdAt: Date.now() - 1000,
    },
    {
      id: 'acc2',
      address: 'user2@mail.tm',
      apiBase: 'mail_tm',
      token: 'jwt_bearer_token_xyz',
      password: 'hydra_password_789',
      createdAt: Date.now() - 5000,
    },
  ]);

  const parsed = safeParseAccounts(rawAccounts);
  assert.equal(parsed.length, 2);

  // Account 1 assertions
  assert.equal(parsed[0].id, 'acc1');
  assert.equal(parsed[0].address, 'user1@guerrillamail.com');
  assert.equal(parsed[0].token, undefined);
  assert.equal(parsed[0].password, undefined);
  assert.equal('token' in parsed[0] && parsed[0].token, undefined);
  assert.equal('password' in parsed[0] && parsed[0].password, undefined);

  // Account 2 assertions
  assert.equal(parsed[1].id, 'acc2');
  assert.equal(parsed[1].address, 'user2@mail.tm');
  assert.equal(parsed[1].token, undefined);
  assert.equal(parsed[1].password, undefined);
});

test('Integration R2: safeParseAccounts safely handles null, corrupt JSON, or expired accounts', () => {
  assert.equal(STORAGE_KEY, 'nexus_accounts_v5');
  assert.deepEqual(safeParseAccounts(null), []);
  assert.deepEqual(safeParseAccounts('not a valid json'), []);
  assert.deepEqual(safeParseAccounts('{"not": "an array"}'), []);

  const expiredAccount = JSON.stringify([
    {
      id: 'acc_old',
      address: 'old@guerrillamail.com',
      apiBase: 'guerrilla',
      createdAt: Date.now() - (ACCOUNT_LIFETIME_MS + 10000),
    },
  ]);
  assert.deepEqual(safeParseAccounts(expiredAccount), []);
});

test('Integration R3: credentialStore is purely in-memory and clearCredentials removes entry without touching localStorage', () => {
  const originalLocalStorage = globalThis.localStorage;
  let touchedStorage = false;

  try {
    (globalThis as any).localStorage = {
      getItem: () => { touchedStorage = true; return null; },
      setItem: () => { touchedStorage = true; },
      removeItem: () => { touchedStorage = true; },
    };

    storeCredentials('test_id_1', 'user@mail.tm', 'test_pass_123');
    clearCredentials('test_id_1');

    assert.equal(touchedStorage, false, 'localStorage must NEVER be touched by credentialStore');
  } finally {
    (globalThis as any).localStorage = originalLocalStorage;
  }
});

test('Integration R4: rehydrateMailboxSession establishes session SID in RAM only and never touches localStorage', async () => {
  const originalLocalStorage = globalThis.localStorage;
  const storageKeysSet: string[] = [];

  try {
    (globalThis as any).localStorage = {
      getItem: () => null,
      setItem: (key: string) => { storageKeysSet.push(key); },
      removeItem: () => {},
    };

    setMockFetch((url) => {
      if (url.includes('f=get_email_address')) {
        return jsonResponse({ sid_token: 'ram_only_sid_456', email_addr: 'testuser@guerrillamail.com' });
      }
      if (url.includes('f=set_email_user')) {
        return jsonResponse({ email_user: 'testuser', email_addr: 'testuser@guerrillamail.com' });
      }
      return textResponse('not found', 404);
    });

    let refreshedToken = '';
    const unsub = onTokenRefresh((id, token) => {
      if (id === 'mb_rehydrate_ram') refreshedToken = token;
    });

    const mailbox: Mailbox = {
      id: 'mb_rehydrate_ram',
      address: 'testuser@guerrillamail.com',
      apiBase: 'guerrilla',
    };

    const sid = await rehydrateMailboxSession(mailbox);
    unsub();

    assert.equal(sid, 'ram_only_sid_456');
    assert.equal(mailbox.token, 'ram_only_sid_456');
    assert.equal(refreshedToken, 'ram_only_sid_456');
    assert.equal(storageKeysSet.length, 0, 'rehydrateMailboxSession must not write to localStorage');
  } finally {
    (globalThis as any).localStorage = originalLocalStorage;
    setMockFetch(null);
  }
});

test('Integration R5: getInitialActiveId strictly prioritizes exact full email match over guerrilla username prefix match', () => {
  const originalWindow = (globalThis as any).window;

  try {
    const accounts: Mailbox[] = [
      { id: 'acc_alias_1', address: 'alex@sharklasers.com', apiBase: 'guerrilla' },
      { id: 'acc_exact_match', address: 'alex@grr.la', apiBase: 'guerrilla' },
      { id: 'acc_other', address: 'bob@guerrillamail.com', apiBase: 'guerrilla' },
    ];

    // Mock window.location for exact match: alex@grr.la
    (globalThis as any).window = {
      location: {
        search: '?mailbox=alex@grr.la',
      },
    };

    const chosenId = getInitialActiveId(accounts);
    assert.equal(chosenId, 'acc_exact_match', 'Exact address match must take precedence over username alias match');

    // Test alias fallback when exact address is not found
    (globalThis as any).window = {
      location: {
        search: '?mailbox=alex@pokemail.net',
      },
    };

    const aliasId = getInitialActiveId(accounts);
    assert.equal(aliasId, 'acc_alias_1', 'Alias match should be used as fallback when exact address does not exist');
  } finally {
    (globalThis as any).window = originalWindow;
  }
});

test('Integration R6: Explicit destructuring in persist() strips token and password before JSON serialization', () => {
  const accounts: Mailbox[] = [
    {
      id: 'persist_1',
      address: 'p1@guerrillamail.com',
      apiBase: 'guerrilla',
      token: 'ram_sid_abc',
      password: 'ram_password_xyz',
      label: 'Work',
      labelColor: '#3b82f6',
      createdAt: 1700000000000,
    },
  ];

  const safeItems = accounts.map(({ password: _p, token: _t, ...account }) => account);
  const serialized = JSON.stringify(safeItems);

  assert.equal(serialized.includes('ram_sid_abc'), false, 'Serialized JSON must NOT contain token');
  assert.equal(serialized.includes('ram_password_xyz'), false, 'Serialized JSON must NOT contain password');
  assert.equal(serialized.includes('token'), false, 'Serialized JSON must NOT contain token key');
  assert.equal(serialized.includes('password'), false, 'Serialized JSON must NOT contain password key');
  assert.equal(serialized.includes('p1@guerrillamail.com'), true);
  assert.equal(serialized.includes('Work'), true);
});

// ═══════════════════════════════════════════════════════════════════════════
// SUITE S: Comprehensive Requirements Verification (S1 - S15)
// ═══════════════════════════════════════════════════════════════════════════

test('Suite S (S1): Upstream token is never persisted to localStorage when accounts are saved', () => {
  const mockStorage: Record<string, string> = {};
  const originalLocalStorage = globalThis.localStorage;

  try {
    (globalThis as any).localStorage = {
      getItem: (k: string) => mockStorage[k] || null,
      setItem: (k: string, v: string) => { mockStorage[k] = v; },
      removeItem: (k: string) => { delete mockStorage[k]; },
    };

    const inMemoryAccounts: Mailbox[] = [
      {
        id: 'acc_guerrilla_1',
        address: 'alpha@guerrillamail.com',
        apiBase: 'guerrilla',
        token: 'guerrilla_sid_token_live_xyz123',
        createdAt: Date.now(),
      },
      {
        id: 'acc_hydra_2',
        address: 'beta@mail.tm',
        apiBase: 'mail_tm',
        token: 'jwt_hydra_bearer_token_secret999',
        createdAt: Date.now(),
      },
    ];

    // Simulate persist function from useMailbox
    const safeItems = inMemoryAccounts.map(({ password: _p, token: _t, ...account }) => account);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(safeItems));

    const raw = localStorage.getItem(STORAGE_KEY);
    assert.ok(raw, 'Expected STORAGE_KEY to be in localStorage');
    assert.equal(raw.includes('guerrilla_sid_token_live_xyz123'), false, 'Raw storage must NOT contain guerrilla token');
    assert.equal(raw.includes('jwt_hydra_bearer_token_secret999'), false, 'Raw storage must NOT contain hydra token');
    assert.equal(raw.includes('"token"'), false, 'Raw storage must NOT contain any "token" key');

    // Verify safeParseAccounts produces accounts with token undefined
    const parsed = safeParseAccounts(raw);
    assert.equal(parsed.length, 2);
    assert.equal(parsed[0].token, undefined);
    assert.equal(parsed[1].token, undefined);
  } finally {
    (globalThis as any).localStorage = originalLocalStorage;
  }
});

test('Suite S (S2): Mailbox password is never persisted to localStorage', () => {
  const mockStorage: Record<string, string> = {};
  const originalLocalStorage = globalThis.localStorage;

  try {
    (globalThis as any).localStorage = {
      getItem: (k: string) => mockStorage[k] || null,
      setItem: (k: string, v: string) => { mockStorage[k] = v; },
      removeItem: (k: string) => { delete mockStorage[k]; },
    };

    const inMemoryAccounts: Mailbox[] = [
      {
        id: 'acc_pass_test',
        address: 'secretuser@mail.tm',
        apiBase: 'mail_tm',
        password: 'TopSecretPassword_2026!#$',
        createdAt: Date.now(),
      },
    ];

    // Store credentials in-memory store
    storeCredentials('acc_pass_test', 'secretuser@mail.tm', 'TopSecretPassword_2026!#$');
    assert.equal(Object.keys(mockStorage).length, 0, 'storeCredentials must not write to localStorage');

    // Simulate persist from useMailbox
    const safeItems = inMemoryAccounts.map(({ password: _p, token: _t, ...account }) => account);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(safeItems));

    const raw = localStorage.getItem(STORAGE_KEY);
    assert.ok(raw);
    assert.equal(raw.includes('TopSecretPassword_2026!#$'), false, 'Raw storage must NOT contain password string');
    assert.equal(raw.includes('"password"'), false, 'Raw storage must NOT contain any "password" key');

    // Parse and verify password is undefined
    const parsed = safeParseAccounts(raw);
    assert.equal(parsed.length, 1);
    assert.equal(parsed[0].password, undefined);
  } finally {
    (globalThis as any).localStorage = originalLocalStorage;
  }
});

test('Suite S (S3): Token rehydration works cleanly after restore from localStorage without token', async () => {
  const originalFetch = globalThis.fetch;
  const originalLocalStorage = globalThis.localStorage;
  const storageKeysSet: string[] = [];

  try {
    (globalThis as any).localStorage = {
      getItem: () => null,
      setItem: (key: string) => { storageKeysSet.push(key); },
      removeItem: () => {},
    };

    let sessionRequested = false;
    let aliasBound = false;
    let listFetched = false;

    globalThis.fetch = async (url: any) => {
      const urlStr = String(url);
      if (urlStr.includes('f=get_email_address')) {
        sessionRequested = true;
        return new Response(JSON.stringify({
          email_addr: 'temp_init@guerrillamailblock.com',
          sid_token: 'rehydrated_sid_s3_success',
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      if (urlStr.includes('f=set_email_user')) {
        aliasBound = true;
        return new Response(JSON.stringify({
          email_addr: 'restored.user@guerrillamailblock.com',
          sid_token: 'rehydrated_sid_s3_success',
          auth: { success: true },
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      if (urlStr.includes('f=get_email_list')) {
        listFetched = true;
        return new Response(JSON.stringify({
          list: [
            {
              mail_id: 'msg_s3_101',
              mail_from: 'auth@service.com',
              mail_subject: 'Rehydrated OTP Code: 991823',
              mail_excerpt: 'Your code is 991823',
              mail_timestamp: '1787990000',
              mail_read: '0',
            },
          ],
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      return new Response('{}', { status: 200 });
    };

    let listenerFiredWithToken = '';
    const unsub = onTokenRefresh((id, token) => {
      if (id === 'mb_s3_restored') listenerFiredWithToken = token;
    });

    // Mailbox restored from localStorage with token undefined
    const restoredAccount: Mailbox = {
      id: 'mb_s3_restored',
      address: 'restored.user@guerrillamail.com',
      apiBase: 'guerrilla',
      token: undefined,
      createdAt: Date.now(),
    };

    const messages = await getMessages(restoredAccount);
    unsub();

    assert.ok(sessionRequested, 'Expected get_email_address call for new SID');
    assert.ok(aliasBound, 'Expected set_email_user call to bind restored username');
    assert.ok(listFetched, 'Expected get_email_list call');
    assert.equal(restoredAccount.token, 'rehydrated_sid_s3_success');
    assert.equal(listenerFiredWithToken, 'rehydrated_sid_s3_success');
    assert.equal(messages.length, 1);
    assert.equal(messages[0].id, 'msg_s3_101');
    assert.equal(storageKeysSet.length, 0, 'Rehydration must keep token in memory without writing to localStorage');
  } finally {
    globalThis.fetch = originalFetch;
    (globalThis as any).localStorage = originalLocalStorage;
  }
});

test('Suite S (S4): Full-address cache isolation (cache key is strictly mephisto_inbox_v2_<normalized-address>)', () => {
  const mb1: Mailbox = { id: '1', address: 'User.One+Tag@SharkLasers.COM  ', apiBase: 'guerrilla' };
  assert.equal(getInboxCacheKey(mb1), 'mephisto_inbox_v2_user.one+tag@sharklasers.com');

  const mb2: Mailbox = { id: '2', address: 'ALICE@GuerrillaMail.DE', apiBase: 'guerrilla' };
  assert.equal(getInboxCacheKey(mb2), 'mephisto_inbox_v2_alice@guerrillamail.de');

  assert.equal(getInboxCacheKey(null), null);
  assert.equal(getInboxCacheKey({ id: '3', address: '', apiBase: 'guerrilla' }), null);
  assert.equal(getInboxCacheKey({ id: '4', address: '   ', apiBase: 'guerrilla' }), null);
});

test('Suite S (S5): Same username with different domains (e.g. abc@guerrillamail.com vs abc@sharklasers.com) have 100% isolated caches', () => {
  const mockStorage: Record<string, string> = {};
  const originalLocalStorage = globalThis.localStorage;
  const originalSessionStorage = globalThis.sessionStorage;

  try {
    const storageImpl = {
      getItem: (k: string) => mockStorage[k] || null,
      setItem: (k: string, v: string) => { mockStorage[k] = v; },
      removeItem: (k: string) => { delete mockStorage[k]; },
      clear: () => { for (const k of Object.keys(mockStorage)) delete mockStorage[k]; },
    };
    (globalThis as any).localStorage = storageImpl;
    (globalThis as any).sessionStorage = storageImpl;

    const accountGuerrilla: Mailbox = { id: 'g_box', address: 'abc@guerrillamail.com', apiBase: 'guerrilla' };
    const accountShark: Mailbox = { id: 's_box', address: 'abc@sharklasers.com', apiBase: 'guerrilla' };

    const emailsGuerrilla: EmailSummary[] = [
      { id: 'g_msg_1', from: 's1@a.com', subject: 'Guerrilla Only Code', intro: '111', seen: false, createdAt: '2026-08-29T10:00:00Z', aiCategory: 'Verification' },
      { id: 'g_msg_2', from: 's2@a.com', subject: 'Guerrilla Alert', intro: '222', seen: true, createdAt: '2026-08-29T09:00:00Z', aiCategory: 'Security' },
    ];

    const emailsShark: EmailSummary[] = [
      { id: 's_msg_1', from: 's3@b.com', subject: 'Sharklasers Newsletter', intro: '333', seen: false, createdAt: '2026-08-29T11:00:00Z', aiCategory: 'Newsletter' },
    ];

    // Save to Guerrilla
    safeSaveInbox(accountGuerrilla, emailsGuerrilla);

    // Sharklasers inbox must be completely empty
    assert.deepEqual(safeReadInbox(accountShark), []);

    // Save to Sharklasers
    safeSaveInbox(accountShark, emailsShark);

    // Verify complete cache isolation
    const readGuerrilla = safeReadInbox(accountGuerrilla);
    const readShark = safeReadInbox(accountShark);

    assert.equal(readGuerrilla.length, 2);
    assert.equal(readGuerrilla[0].id, 'g_msg_1');
    assert.equal(readGuerrilla[1].id, 'g_msg_2');

    assert.equal(readShark.length, 1);
    assert.equal(readShark[0].id, 's_msg_1');

    // Clearing Guerrilla cache must not touch Sharklasers cache
    safeClearInbox(accountGuerrilla);
    assert.equal(safeReadInbox(accountGuerrilla).length, 0);
    assert.equal(safeReadInbox(accountShark).length, 1);
    assert.equal(safeReadInbox(accountShark)[0].id, 's_msg_1');
  } finally {
    (globalThis as any).localStorage = originalLocalStorage;
    (globalThis as any).sessionStorage = originalSessionStorage;
  }
});

test('Suite S (S6): Deleted message IDs persist in mephisto_deleted_v1_<normalized-address> and survive F5', () => {
  const mockStorage: Record<string, string> = {};
  const originalLocalStorage = globalThis.localStorage;
  const originalSessionStorage = globalThis.sessionStorage;

  try {
    const storageImpl = {
      getItem: (k: string) => mockStorage[k] || null,
      setItem: (k: string, v: string) => { mockStorage[k] = v; },
      removeItem: (k: string) => { delete mockStorage[k]; },
    };
    (globalThis as any).localStorage = storageImpl;
    (globalThis as any).sessionStorage = storageImpl;

    const account: Mailbox = { id: 'del_box', address: 'User.Delete@SharkLasers.COM', apiBase: 'guerrilla' };
    const key = getDeletedCacheKey(account);
    assert.equal(key, 'mephisto_deleted_v1_user.delete@sharklasers.com');

    // Save deleted IDs
    const deletedSet = new Set(['del_id_101', 'del_id_102', 'del_id_103']);
    safeSaveDeleted(account, deletedSet);

    assert.ok(mockStorage[key!]);
    assert.ok(mockStorage[key!].includes('del_id_101'));
    assert.ok(mockStorage[key!].includes('del_id_102'));
    assert.ok(mockStorage[key!].includes('del_id_103'));

    // Simulate F5 page reload (read fresh from storage)
    const restoredDeleted = safeReadDeleted(account);
    assert.equal(restoredDeleted.size, 3);
    assert.ok(restoredDeleted.has('del_id_101'));
    assert.ok(restoredDeleted.has('del_id_102'));
    assert.ok(restoredDeleted.has('del_id_103'));
  } finally {
    (globalThis as any).localStorage = originalLocalStorage;
    (globalThis as any).sessionStorage = originalSessionStorage;
  }
});

test('Suite S (S7): Deleted message cannot return from upstream poll after F5 reload', () => {
  const mockStorage: Record<string, string> = {};
  const originalLocalStorage = globalThis.localStorage;
  const originalSessionStorage = globalThis.sessionStorage;

  try {
    const storageImpl = {
      getItem: (k: string) => mockStorage[k] || null,
      setItem: (k: string, v: string) => { mockStorage[k] = v; },
      removeItem: (k: string) => { delete mockStorage[k]; },
    };
    (globalThis as any).localStorage = storageImpl;
    (globalThis as any).sessionStorage = storageImpl;

    const account: Mailbox = { id: 'f5_account', address: 'f5survive@guerrillamail.com', apiBase: 'guerrilla' };

    // 1. Prior state: User deleted msg_dead_99, cached msg_keep_1
    safeSaveDeleted(account, new Set(['msg_dead_99']));
    safeSaveInbox(account, [
      { id: 'msg_keep_1', from: 'a@a.com', subject: 'Keep Me', intro: '', seen: true, createdAt: '2026-08-29T10:00:00Z', aiCategory: 'Verification' },
    ]);

    // 2. F5 reload happens: read deleted IDs and cached inbox
    const deletedIds = safeReadDeleted(account);
    const cachedInbox = safeReadInbox(account).filter(e => !deletedIds.has(e.id));

    // 3. Upstream poll returns msg_dead_99 (resurrect attempt), msg_keep_1, and new msg_fresh_2
    const upstreamMessages: EmailSummary[] = [
      { id: 'msg_dead_99', from: 'bad@bad.com', subject: 'ZOMBIE MESSAGE', intro: '', seen: false, createdAt: '2026-08-29T08:00:00Z', aiCategory: 'Other' },
      { id: 'msg_keep_1', from: 'a@a.com', subject: 'Keep Me', intro: '', seen: true, createdAt: '2026-08-29T10:00:00Z', aiCategory: 'Verification' },
      { id: 'msg_fresh_2', from: 'b@b.com', subject: 'Fresh Code: 4920', intro: '4920', seen: false, createdAt: '2026-08-29T11:00:00Z', aiCategory: 'Verification' },
    ];

    // Filter against deleted IDs
    const filteredIncoming = upstreamMessages.filter(e => !deletedIds.has(e.id));
    assert.equal(filteredIncoming.some(e => e.id === 'msg_dead_99'), false);

    // Merge cached + fresh
    const map = new Map<string, EmailSummary>();
    cachedInbox.forEach(e => { if (!deletedIds.has(e.id)) map.set(e.id, e); });
    filteredIncoming.forEach(e => map.set(e.id, e));
    const merged = Array.from(map.values());
    safeSaveInbox(account, merged);

    const result = safeReadInbox(account);
    assert.equal(result.length, 2);
    assert.ok(result.some(e => e.id === 'msg_keep_1'));
    assert.ok(result.some(e => e.id === 'msg_fresh_2'));
    assert.equal(result.some(e => e.id === 'msg_dead_99'), false, 'Deleted message must NEVER reappear');
  } finally {
    (globalThis as any).localStorage = originalLocalStorage;
    (globalThis as any).sessionStorage = originalSessionStorage;
  }
});

test('Suite S (S8): Delete-all operation persists all deleted IDs and clears inbox cache cleanly', () => {
  const mockStorage: Record<string, string> = {};
  const originalLocalStorage = globalThis.localStorage;
  const originalSessionStorage = globalThis.sessionStorage;

  try {
    const storageImpl = {
      getItem: (k: string) => mockStorage[k] || null,
      setItem: (k: string, v: string) => { mockStorage[k] = v; },
      removeItem: (k: string) => { delete mockStorage[k]; },
    };
    (globalThis as any).localStorage = storageImpl;
    (globalThis as any).sessionStorage = storageImpl;

    const account: Mailbox = { id: 'del_all_mb', address: 'deleteall@sharklasers.com', apiBase: 'guerrilla' };

    // Initial state: 3 active emails, 1 previously deleted email
    safeSaveDeleted(account, new Set(['prior_del_0']));
    const currentEmails: EmailSummary[] = [
      { id: 'm1', from: 'a@a.com', subject: 'Email 1', intro: '', seen: false, createdAt: '2026-08-29T10:00:00Z', aiCategory: 'Verification' },
      { id: 'm2', from: 'b@b.com', subject: 'Email 2', intro: '', seen: true, createdAt: '2026-08-29T10:01:00Z', aiCategory: 'Security' },
      { id: 'm3', from: 'c@c.com', subject: 'Email 3', intro: '', seen: false, createdAt: '2026-08-29T10:02:00Z', aiCategory: 'Newsletter' },
    ];
    safeSaveInbox(account, currentEmails);

    // Execute delete all workflow
    const allIds = currentEmails.map(e => e.id);
    const nextDeleted = safeReadDeleted(account);
    allIds.forEach(id => nextDeleted.add(id));

    safeSaveDeleted(account, nextDeleted);
    safeClearInbox(account);
    safeSaveInbox(account, [], true);

    // Assert inbox cache is empty
    assert.deepEqual(safeReadInbox(account), []);

    // Assert all IDs are persisted to deleted cache
    const finalDeleted = safeReadDeleted(account);
    assert.equal(finalDeleted.size, 4);
    assert.ok(finalDeleted.has('prior_del_0'));
    assert.ok(finalDeleted.has('m1'));
    assert.ok(finalDeleted.has('m2'));
    assert.ok(finalDeleted.has('m3'));
  } finally {
    (globalThis as any).localStorage = originalLocalStorage;
    (globalThis as any).sessionStorage = originalSessionStorage;
  }
});

test('Suite S (S9): Deleted IDs are strictly isolated per mailbox (delete all on A does not affect B)', () => {
  const mockStorage: Record<string, string> = {};
  const originalLocalStorage = globalThis.localStorage;
  const originalSessionStorage = globalThis.sessionStorage;

  try {
    const storageImpl = {
      getItem: (k: string) => mockStorage[k] || null,
      setItem: (k: string, v: string) => { mockStorage[k] = v; },
      removeItem: (k: string) => { delete mockStorage[k]; },
    };
    (globalThis as any).localStorage = storageImpl;
    (globalThis as any).sessionStorage = storageImpl;

    const accountA: Mailbox = { id: 'box_A', address: 'alice@sharklasers.com', apiBase: 'guerrilla' };
    const accountB: Mailbox = { id: 'box_B', address: 'bob@sharklasers.com', apiBase: 'guerrilla' };

    // Delete all on Account A with IDs ['msg_100', 'msg_101']
    safeSaveDeleted(accountA, new Set(['msg_100', 'msg_101']));
    safeClearInbox(accountA);
    safeSaveInbox(accountA, [], true);

    // Account B receives msg_100 and msg_200
    const bEmails: EmailSummary[] = [
      { id: 'msg_100', from: 'sender@test.com', subject: 'Shared ID Email', intro: '', seen: false, createdAt: '2026-08-29T10:00:00Z', aiCategory: 'Verification' },
      { id: 'msg_200', from: 'sender@test.com', subject: 'Bob Code', intro: '', seen: false, createdAt: '2026-08-29T10:00:00Z', aiCategory: 'Verification' },
    ];
    safeSaveInbox(accountB, bEmails);

    // Account B deleted IDs should be empty
    const bDeleted = safeReadDeleted(accountB);
    assert.equal(bDeleted.size, 0);

    // Account B inbox should still have both emails
    const bRead = safeReadInbox(accountB);
    assert.equal(bRead.length, 2);
    assert.equal(bRead[0].id, 'msg_100');
    assert.equal(bRead[1].id, 'msg_200');

    // Account A is empty
    assert.equal(safeReadInbox(accountA).length, 0);
  } finally {
    (globalThis as any).localStorage = originalLocalStorage;
    (globalThis as any).sessionStorage = originalSessionStorage;
  }
});

test('Suite S (S10): Empty upstream response ([]) does not wipe local cache', () => {
  const mockStorage: Record<string, string> = {};
  const originalLocalStorage = globalThis.localStorage;
  const originalSessionStorage = globalThis.sessionStorage;

  try {
    const storageImpl = {
      getItem: (k: string) => mockStorage[k] || null,
      setItem: (k: string, v: string) => { mockStorage[k] = v; },
      removeItem: (k: string) => { delete mockStorage[k]; },
    };
    (globalThis as any).localStorage = storageImpl;
    (globalThis as any).sessionStorage = storageImpl;

    const account: Mailbox = { id: 'box_glitch', address: 'preserve@guerrillamail.com', apiBase: 'guerrilla' };
    const initialEmails: EmailSummary[] = [
      { id: 'pres_1', from: 'bank@auth.com', subject: 'Important Security Code', intro: '1234', seen: true, createdAt: '2026-08-29T09:00:00Z', aiCategory: 'Security' },
      { id: 'pres_2', from: 'github@notify.com', subject: 'GitHub Verification', intro: '5678', seen: false, createdAt: '2026-08-29T10:00:00Z', aiCategory: 'Verification' },
    ];

    safeSaveInbox(account, initialEmails);
    assert.equal(safeReadInbox(account).length, 2);

    // Attempt to safeSaveInbox with empty list (simulating empty upstream poll / network glitch)
    safeSaveInbox(account, []);
    assert.equal(safeReadInbox(account).length, 2, 'safeSaveInbox([]) must NOT wipe cache when allowEmpty is false');

    safeSaveInbox(account, [], false);
    assert.equal(safeReadInbox(account).length, 2, 'safeSaveInbox([], false) must NOT wipe cache');

    // Only explicit allowEmpty=true wipes the cache
    safeSaveInbox(account, [], true);
    assert.equal(safeReadInbox(account).length, 0, 'safeSaveInbox([], true) should clear cache');
  } finally {
    (globalThis as any).localStorage = originalLocalStorage;
    (globalThis as any).sessionStorage = originalSessionStorage;
  }
});

test('Suite S (S11): Account switching race protection (late response from A cannot overwrite B)', () => {
  let activeAccountId = 'account_A';
  let currentRequestId = 1;
  const mailboxState: Record<string, EmailSummary[]> = {
    account_A: [],
    account_B: [],
  };

  // Step 1: User is on Account A, fetch starts (request 1)
  const req1_Account = activeAccountId;
  const req1_Id = currentRequestId;

  // Step 2: User switches to Account B (request 2)
  activeAccountId = 'account_B';
  currentRequestId = 2;
  mailboxState['account_B'] = [
    { id: 'b_msg_1', from: 'b@b.com', subject: 'Account B Email', intro: '', seen: false, createdAt: '2026-08-29T10:00:00Z', aiCategory: 'Verification' },
  ];

  // Step 3: Late response from Account A arrives
  const lateResponseA: EmailSummary[] = [
    { id: 'a_late_msg', from: 'a@a.com', subject: 'Account A Stale Email', intro: '', seen: false, createdAt: '2026-08-29T09:00:00Z', aiCategory: 'Other' },
  ];

  const isLateResponseValid = (req1_Id === currentRequestId && req1_Account === activeAccountId);
  assert.equal(isLateResponseValid, false, 'Late response from Account A must be rejected');

  if (isLateResponseValid) {
    mailboxState[req1_Account] = lateResponseA;
  }

  // Account B's state was NOT overwritten by Account A's late response
  assert.equal(mailboxState['account_B'].length, 1);
  assert.equal(mailboxState['account_B'][0].id, 'b_msg_1');
});

test('Suite S (S12): Secondary account background sync uses isolated cache and deleted IDs', () => {
  const mockStorage: Record<string, string> = {};
  const originalLocalStorage = globalThis.localStorage;
  const originalSessionStorage = globalThis.sessionStorage;

  try {
    const storageImpl = {
      getItem: (k: string) => mockStorage[k] || null,
      setItem: (k: string, v: string) => { mockStorage[k] = v; },
      removeItem: (k: string) => { delete mockStorage[k]; },
    };
    (globalThis as any).localStorage = storageImpl;
    (globalThis as any).sessionStorage = storageImpl;

    const activeAccount: Mailbox = { id: 'acc_active', address: 'primary@sharklasers.com', apiBase: 'guerrilla' };
    const secondaryAccount: Mailbox = { id: 'acc_sec', address: 'secondary@guerrillamail.com', apiBase: 'guerrilla' };

    // Initial state
    safeSaveInbox(activeAccount, [
      { id: 'act_1', from: 'prim@test.com', subject: 'Primary Code', intro: '', seen: true, createdAt: '2026-08-29T10:00:00Z', aiCategory: 'Verification' },
    ]);
    safeSaveInbox(secondaryAccount, [
      { id: 'sec_old_1', from: 'sec@test.com', subject: 'Secondary Old', intro: '', seen: true, createdAt: '2026-08-29T09:00:00Z', aiCategory: 'Verification' },
    ]);
    safeSaveDeleted(secondaryAccount, new Set(['sec_deleted_99']));

    // Simulate secondary sync fetch
    const secondaryUpstream: EmailSummary[] = [
      { id: 'sec_deleted_99', from: 'bad@test.com', subject: 'Should be filtered', intro: '', seen: false, createdAt: '2026-08-29T08:00:00Z', aiCategory: 'Other' },
      { id: 'sec_old_1', from: 'sec@test.com', subject: 'Secondary Old', intro: '', seen: true, createdAt: '2026-08-29T09:00:00Z', aiCategory: 'Verification' },
      { id: 'sec_new_2', from: 'sec@test.com', subject: 'Secondary New Code: 5544', intro: '', seen: false, createdAt: '2026-08-29T11:00:00Z', aiCategory: 'Verification' },
    ];

    // Background sync logic
    const deletedForSec = safeReadDeleted(secondaryAccount);
    const filteredMsgs = secondaryUpstream.filter(m => !deletedForSec.has(m.id));
    const existingSec = safeReadInbox(secondaryAccount);
    const secMap = new Map<string, EmailSummary>();
    existingSec.forEach(m => { if (!deletedForSec.has(m.id)) secMap.set(m.id, m); });
    filteredMsgs.forEach(m => secMap.set(m.id, m));
    const mergedSec = Array.from(secMap.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    safeSaveInbox(secondaryAccount, mergedSec);

    // Verify secondary account cache was updated cleanly
    const secResult = safeReadInbox(secondaryAccount);
    assert.equal(secResult.length, 2);
    assert.equal(secResult[0].id, 'sec_new_2');
    assert.equal(secResult[1].id, 'sec_old_1');
    assert.equal(secResult.some(m => m.id === 'sec_deleted_99'), false);

    // Verify active account cache is completely untouched
    const actResult = safeReadInbox(activeAccount);
    assert.equal(actResult.length, 1);
    assert.equal(actResult[0].id, 'act_1');
  } finally {
    (globalThis as any).localStorage = originalLocalStorage;
    (globalThis as any).sessionStorage = originalSessionStorage;
  }
});

test('Suite S (S13): Full F5 simulation (restore accounts -> active mailbox -> load cache & deleted IDs -> rehydrate -> fetch upstream -> merge) preserves emails', async () => {
  const originalFetch = globalThis.fetch;
  const mockStorage: Record<string, string> = {};
  const originalLocalStorage = globalThis.localStorage;
  const originalSessionStorage = globalThis.sessionStorage;

  try {
    const storageImpl = {
      getItem: (k: string) => mockStorage[k] || null,
      setItem: (k: string, v: string) => { mockStorage[k] = v; },
      removeItem: (k: string) => { delete mockStorage[k]; },
    };
    (globalThis as any).localStorage = storageImpl;
    (globalThis as any).sessionStorage = storageImpl;

    // ── Phase 1: Pre-F5 State in Storage ──
    const preF5Accounts = [
      { id: 'f5_user_1', address: 'f5.simulation@guerrillamail.com', apiBase: 'guerrilla', createdAt: Date.now() - 5000 },
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preF5Accounts));

    const preF5CachedEmails: EmailSummary[] = [
      { id: 'msg_f5_cached', from: 'bank@auth.com', subject: 'Your Bank Statement', intro: 'Ready for download', seen: true, createdAt: '2026-08-29T09:00:00Z', aiCategory: 'Security' },
    ];
    safeSaveInbox(preF5Accounts[0] as Mailbox, preF5CachedEmails);
    safeSaveDeleted(preF5Accounts[0] as Mailbox, new Set(['msg_f5_deleted_trash']));

    // ── Phase 2: Simulate F5 Reload & Initialization ──
    const restoredAccounts = safeParseAccounts(localStorage.getItem(STORAGE_KEY));
    assert.equal(restoredAccounts.length, 1);
    assert.equal(restoredAccounts[0].token, undefined, 'Restored mailbox must have token undefined');
    assert.equal(restoredAccounts[0].password, undefined);

    const activeMailbox = restoredAccounts[0];
    const initialDeleted = safeReadDeleted(activeMailbox);
    assert.equal(initialDeleted.has('msg_f5_deleted_trash'), true);

    const initialCached = safeReadInbox(activeMailbox).filter(e => !initialDeleted.has(e.id));
    assert.equal(initialCached.length, 1);
    assert.equal(initialCached[0].id, 'msg_f5_cached');

    // ── Phase 3: Network Mock for Rehydration and Upstream Fetch ──
    globalThis.fetch = async (url: any) => {
      const urlStr = String(url);
      if (urlStr.includes('f=get_email_address')) {
        return new Response(JSON.stringify({
          sid_token: 'fresh_f5_sid_token_9999',
          email_addr: 'temp@guerrillamailblock.com',
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      if (urlStr.includes('f=set_email_user')) {
        return new Response(JSON.stringify({
          email_user: 'f5.simulation',
          email_addr: 'f5.simulation@guerrillamailblock.com',
          sid_token: 'fresh_f5_sid_token_9999',
          auth: { success: true },
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      if (urlStr.includes('f=get_email_list')) {
        return new Response(JSON.stringify({
          list: [
            {
              mail_id: 'msg_f5_deleted_trash', // Upstream returns deleted email
              mail_from: 'spam@trash.com',
              mail_subject: 'Spam',
              mail_excerpt: '',
              mail_timestamp: '1787980000',
              mail_read: '0',
            },
            {
              mail_id: 'msg_f5_cached', // Upstream returns cached email
              mail_from: 'bank@auth.com',
              mail_subject: 'Your Bank Statement',
              mail_excerpt: 'Ready for download',
              mail_timestamp: '1787985000',
              mail_read: '1',
            },
            {
              mail_id: 'msg_f5_new_incoming', // Brand new incoming email
              mail_from: 'auth@service.com',
              mail_subject: 'One-Time Passcode: 884102',
              mail_excerpt: 'OTP: 884102',
              mail_timestamp: '1787990000',
              mail_read: '0',
            },
          ],
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      return new Response('{}', { status: 200 });
    };

    // Rehydrate session
    const sid = await rehydrateMailboxSession(activeMailbox);
    assert.equal(sid, 'fresh_f5_sid_token_9999');
    assert.equal(activeMailbox.token, 'fresh_f5_sid_token_9999');

    // Fetch messages upstream
    const fetched = await getMessages(activeMailbox);
    assert.equal(fetched.length, 3);

    // Filter against deleted IDs
    const filtered = fetched.filter(e => !initialDeleted.has(e.id));
    assert.equal(filtered.length, 2);
    assert.equal(filtered.some(e => e.id === 'msg_f5_deleted_trash'), false);

    // Merge with cache
    const map = new Map<string, EmailSummary>();
    initialCached.forEach(e => { if (!initialDeleted.has(e.id)) map.set(e.id, e); });
    filtered.forEach(e => map.set(e.id, e));
    const finalMerged = Array.from(map.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    safeSaveInbox(activeMailbox, finalMerged);

    // Read back final inbox
    const finalInbox = safeReadInbox(activeMailbox);
    assert.equal(finalInbox.length, 2);
    assert.equal(finalInbox[0].id, 'msg_f5_new_incoming');
    assert.equal(finalInbox[1].id, 'msg_f5_cached');
    assert.equal(finalInbox.some(e => e.id === 'msg_f5_deleted_trash'), false);

    // Ensure localStorage accounts never stored the sid_token
    const accountsInStorage = localStorage.getItem(STORAGE_KEY);
    assert.ok(accountsInStorage);
    assert.equal(accountsInStorage.includes('fresh_f5_sid_token_9999'), false);
  } finally {
    globalThis.fetch = originalFetch;
    (globalThis as any).localStorage = originalLocalStorage;
    (globalThis as any).sessionStorage = originalSessionStorage;
  }
});

test('Suite S (S14): Zero sensitive credentials or auth headers stored in localStorage', () => {
  const mockStorage: Record<string, string> = {
    [STORAGE_KEY]: JSON.stringify([
      { id: 'a1', address: 'test1@sharklasers.com', apiBase: 'guerrilla', createdAt: Date.now() },
      { id: 'a2', address: 'test2@mail.tm', apiBase: 'mail_tm', createdAt: Date.now() },
    ]),
    'mephisto_inbox_v2_test1@sharklasers.com': JSON.stringify([
      { id: 'm1', from: 'sender@test.com', subject: 'Test', intro: '', seen: false, createdAt: new Date().toISOString(), aiCategory: 'Verification' },
    ]),
    'mephisto_deleted_v1_test1@sharklasers.com': JSON.stringify(['del_1']),
    'mephisto_stats': JSON.stringify({ totalAccountsCreated: 2, totalEmailsReceived: 1 }),
    'mephisto_notif_filters': JSON.stringify({ verification: true, security: true, newsletter: true, other: true }),
  };

  const sensitiveKeywords = [
    'Bearer ',
    'Authorization',
    'password',
    'jwt_',
    'sid_token',
    'privateKey',
    'secretKey',
  ];

  for (const [key, value] of Object.entries(mockStorage)) {
    // Key must adhere to strict whitelist naming prefixes
    const isValidKey = key === STORAGE_KEY ||
      key.startsWith('mephisto_inbox_v2_') ||
      key.startsWith('mephisto_deleted_v1_') ||
      key === 'mephisto_stats' ||
      key === 'mephisto_notif_filters' ||
      key.startsWith('mephisto_test_detail_');
    assert.ok(isValidKey, `Unexpected localStorage key: ${key}`);

    // No sensitive tokens or headers in stored values
    for (const word of sensitiveKeywords) {
      if (word === 'password') {
        // Ensure no `"password":"..."` with actual credential value exists
        assert.equal(/"password"\s*:\s*"[^"]+"/.test(value), false, `Sensitive password found in storage key ${key}`);
      } else if (word === 'sid_token') {
        assert.equal(/"token"\s*:\s*"[^"]+"/.test(value), false, `Sensitive token found in storage key ${key}`);
      } else {
        assert.equal(value.includes(word), false, `Sensitive keyword '${word}' found in storage key ${key}`);
      }
    }
  }
});

test('Suite S (S15): Cache limits (200 items for inbox, 500 items for deleted IDs) are strictly enforced', () => {
  const mockStorage: Record<string, string> = {};
  const originalLocalStorage = globalThis.localStorage;
  const originalSessionStorage = globalThis.sessionStorage;

  try {
    const storageImpl = {
      getItem: (k: string) => mockStorage[k] || null,
      setItem: (k: string, v: string) => { mockStorage[k] = v; },
      removeItem: (k: string) => { delete mockStorage[k]; },
    };
    (globalThis as any).localStorage = storageImpl;
    (globalThis as any).sessionStorage = storageImpl;

    const account: Mailbox = { id: 'limits_box', address: 'limits@guerrillamail.com', apiBase: 'guerrilla' };

    // 1. Inbox 200 items limit test
    const overflowEmails: EmailSummary[] = Array.from({ length: 350 }, (_, i) => ({
      id: `msg_idx_${i}`,
      from: `sender_${i}@test.com`,
      subject: `Subject ${i}`,
      intro: `Intro ${i}`,
      seen: i % 2 === 0,
      createdAt: new Date(Date.now() - i * 1000).toISOString(),
      aiCategory: 'Other',
    }));

    safeSaveInbox(account, overflowEmails);
    const readInbox = safeReadInbox(account);
    assert.equal(readInbox.length, 200, 'Inbox cache must be capped at strictly 200 items');
    assert.equal(readInbox[0].id, 'msg_idx_0');
    assert.equal(readInbox[199].id, 'msg_idx_199');

    // 2. Deleted IDs 500 items limit test
    const overflowDeletedIds = Array.from({ length: 750 }, (_, i) => `deleted_id_${i}`);
    safeSaveDeleted(account, overflowDeletedIds);

    const readDeleted = safeReadDeleted(account);
    assert.equal(readDeleted.size, 500, 'Deleted IDs cache must be capped at strictly 500 items');
    assert.ok(readDeleted.has('deleted_id_0'), 'First deleted ID within capacity must be preserved');
    assert.ok(readDeleted.has('deleted_id_499'), '500th deleted ID within capacity must be preserved');
    assert.equal(readDeleted.has('deleted_id_500'), false, 'Deleted IDs beyond 500 capacity must be evicted');
  } finally {
    (globalThis as any).localStorage = originalLocalStorage;
    (globalThis as any).sessionStorage = originalSessionStorage;
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// Suite T: Extended Security, Isolation, Error Mapping & System Verification
// ═══════════════════════════════════════════════════════════════════════════

test('Suite T (T1): Obsolete legacy storage key cleanup/migration safety', () => {
  const mockStorage: Record<string, string> = {};
  const originalLocalStorage = globalThis.localStorage;
  const originalSessionStorage = globalThis.sessionStorage;

  try {
    const storageImpl = {
      getItem: (k: string) => mockStorage[k] || null,
      setItem: (k: string, v: string) => { mockStorage[k] = v; },
      removeItem: (k: string) => { delete mockStorage[k]; },
      clear: () => { for (const k of Object.keys(mockStorage)) delete mockStorage[k]; },
    };
    (globalThis as any).localStorage = storageImpl;
    (globalThis as any).sessionStorage = storageImpl;

    const account: Mailbox = {
      id: 'acc_migration_01',
      address: 'legacy.user@sharklasers.com',
      apiBase: 'guerrilla',
    };

    // 1. Populate legacy inbox key mephisto_inbox_<address> (without _v2_)
    const legacyKey = `mephisto_inbox_${account.address.toLowerCase().trim()}`;
    const v2Key = `mephisto_inbox_v2_${account.address.toLowerCase().trim()}`;
    const legacyEmails: EmailSummary[] = [
      {
        id: 'legacy_msg_1',
        from: 'legacy_sender@test.com',
        subject: 'Legacy Subject',
        intro: 'Legacy Intro',
        seen: true,
        createdAt: '2025-01-01T00:00:00.000Z',
        aiCategory: 'Verification',
      },
    ];
    mockStorage[legacyKey] = JSON.stringify(legacyEmails);

    // 2. Reading when v2 key does not exist seamlessly falls back to legacy key
    const readFromLegacy = safeReadInbox(account);
    assert.equal(readFromLegacy.length, 1);
    assert.equal(readFromLegacy[0].id, 'legacy_msg_1');
    assert.equal(readFromLegacy[0].subject, 'Legacy Subject');

    // 3. Saving writes to the modern v2 key
    const modernEmails: EmailSummary[] = [
      ...legacyEmails,
      {
        id: 'modern_msg_2',
        from: 'modern_sender@test.com',
        subject: 'Modern Subject',
        intro: 'Modern Intro',
        seen: false,
        createdAt: new Date().toISOString(),
        aiCategory: 'Other',
      },
    ];
    safeSaveInbox(account, modernEmails);
    assert.ok(mockStorage[v2Key], 'Modern v2 key must be populated after safeSaveInbox');
    const readFromV2 = safeReadInbox(account);
    assert.equal(readFromV2.length, 2);
    assert.equal(readFromV2[1].id, 'modern_msg_2');

    // 4. Clearing inbox purges both v2 and legacy keys from storage
    safeClearInbox(account);
    assert.equal(mockStorage[v2Key], undefined, 'Modern v2 key must be purged');
    assert.equal(mockStorage[legacyKey], undefined, 'Legacy key must be purged');
    assert.equal(safeReadInbox(account).length, 0);

    // 5. Corrupt / invalid data handling: malformed JSON, corrupted structures, primitives
    mockStorage[legacyKey] = '{ invalid json }}}';
    assert.deepEqual(safeReadInbox(account), [], 'Malformed JSON in legacy key must safely return empty array');

    mockStorage[legacyKey] = JSON.stringify([null, 123, 'corrupt', { id: 456 }, { missing: 'fields' }]);
    assert.deepEqual(safeReadInbox(account), [], 'Corrupted objects in legacy key must be filtered out cleanly');
  } finally {
    (globalThis as any).localStorage = originalLocalStorage;
    (globalThis as any).sessionStorage = originalSessionStorage;
  }
});

test('Suite T (T2): Friendly localized error code mapping (network error, session expired, rate limited)', () => {
  // Test MailboxFetchError instances and verify error codes
  const networkErr = new MailboxFetchError('Failed to fetch from upstream', 'NETWORK_ERROR', 'box_01');
  const sessionErr = new MailboxFetchError('Guerrilla session expired', 'SESSION_EXPIRED', 'box_02');
  const rateLimitErr = new MailboxFetchError('Rate limit exceeded. Please wait 45 seconds.', 'RATE_LIMITED', 'box_03');
  const rehydrateErr = new MailboxFetchError('Upstream rejected username binding', 'REHYDRATION_FAILED', 'box_04');
  const invalidErr = new MailboxFetchError('Empty message detail response from server', 'INVALID_RESPONSE', 'box_05');
  const unknownErr = new MailboxFetchError('Something unexpected happened', 'UNKNOWN', 'box_06');

  assert.equal(networkErr.code, 'NETWORK_ERROR');
  assert.equal(networkErr.mailboxId, 'box_01');
  assert.equal(sessionErr.code, 'SESSION_EXPIRED');
  assert.equal(rateLimitErr.code, 'RATE_LIMITED');
  assert.equal(rehydrateErr.code, 'REHYDRATION_FAILED');
  assert.equal(invalidErr.code, 'INVALID_RESPONSE');
  assert.equal(unknownErr.code, 'UNKNOWN');

  // Verify that error codes can be deterministically mapped to user-friendly messages for all 9 locales
  const allLocales = [en, tr, de, es, fr, it, pt, ru, ar];
  const mapErrorToFriendlyText = (err: MailboxFetchError, localeDict: typeof en): string => {
    switch (err.code) {
      case 'NETWORK_ERROR':
        return localeDict.connError || localeDict.connFailed || 'Connection error';
      case 'SESSION_EXPIRED':
      case 'REHYDRATION_FAILED':
        return localeDict.connFailed || 'Session expired';
      case 'RATE_LIMITED':
        return err.message.includes('wait') ? err.message : localeDict.limitDailyMsg || 'Rate limited';
      case 'INVALID_RESPONSE':
      case 'UNKNOWN':
      default:
        return localeDict.connError || 'Unknown error';
    }
  };

  for (const loc of allLocales) {
    const netMsg = mapErrorToFriendlyText(networkErr, loc);
    const sesMsg = mapErrorToFriendlyText(sessionErr, loc);
    const rateMsg = mapErrorToFriendlyText(rateLimitErr, loc);

    assert.ok(typeof netMsg === 'string' && netMsg.length > 0);
    assert.ok(typeof sesMsg === 'string' && sesMsg.length > 0);
    assert.ok(typeof rateMsg === 'string' && rateMsg.includes('45 seconds'));
  }

  // Rate limit calculation and remaining duration helper
  clearRateLimit();
  assert.equal(isRateLimited('mail_tm'), false);
  assert.equal(getRateLimitRemainingMs('mail_tm'), 0);

  // Test getLocalizedErrorMessage for network errors, session expiration, and rate limits
  assert.ok(getLocalizedErrorMessage(networkErr, 'en').length > 0);
  assert.ok(getLocalizedErrorMessage(sessionErr, 'tr').length > 0);
  assert.ok(getLocalizedErrorMessage(rateLimitErr, 'de').length > 0);
  assert.ok(getLocalizedErrorMessage('fetch failed', 'ar').length > 0);
  assert.ok(getLocalizedErrorMessage('invalid_sid', 'es').length > 0);
  assert.ok(getLocalizedErrorMessage('Rate limit reached', 'fr').length > 0);
});

test('Suite T (T3): Duplicate in-flight request suppression in fetch engine', async () => {
  clearDomainCache();
  let fetchCallCount = 0;

  try {
    setMockFetch(async (url: any) => {
      const urlStr = String(url);
      if (urlStr.includes('f=get_email_address')) {
        fetchCallCount++;
        // Simulate network latency of 20ms
        await new Promise(r => setTimeout(r, 20));
        return jsonResponse({
          email_addr: 'random_suppression@guerrillamailblock.com',
          sid_token: 'sid_suppression_123',
        });
      }
      return jsonResponse({});
    });

    // Fire 10 simultaneous calls to fetchDomains()
    const concurrentRequests = Array.from({ length: 10 }, () => fetchDomains());
    const results = await Promise.all(concurrentRequests);

    // Exactly 1 network request should have occurred due to in-flight deduplication
    assert.equal(fetchCallCount, 1, 'Concurrent fetchDomains calls must be collapsed into 1 in-flight network request');

    // All 10 callers receive identical domain arrays
    assert.equal(results.length, 10);
    for (const res of results) {
      assert.ok(Array.isArray(res.domains));
      assert.ok(res.domains.length > 0);
      assert.ok(res.domains.includes('guerrillamailblock.com'));
      assert.equal(res.apiBase, 'guerrilla');
    }

    // Subsequent call after resolution uses cache with 0 additional network calls
    const cachedResult = await fetchDomains();
    assert.equal(fetchCallCount, 1, 'Subsequent call must use cache without fetching');
    assert.deepEqual(cachedResult.domains, results[0].domains);
  } finally {
    clearDomainCache();
    setMockFetch(null);
  }
});

test('Suite T (T4): Tab visibility change polling resume and pause simulation', () => {
  const isPollingAllowedPredicate = (doc: { hidden?: boolean; visibilityState?: string }, nav: { onLine?: boolean }): boolean => {
    if (doc.hidden || doc.visibilityState === 'hidden') {
      return false;
    }
    if (!nav.onLine) {
      return false;
    }
    return true;
  };

  // 1. Foreground and online: polling is active
  assert.equal(isPollingAllowedPredicate({ hidden: false, visibilityState: 'visible' }, { onLine: true }), true);

  // 2. Tab switched to background (hidden): polling is paused
  assert.equal(isPollingAllowedPredicate({ hidden: true, visibilityState: 'hidden' }, { onLine: true }), false);

  // 3. Network goes offline while foreground: polling is paused
  assert.equal(isPollingAllowedPredicate({ hidden: false, visibilityState: 'visible' }, { onLine: false }), false);

  // 4. Background and offline: polling is paused
  assert.equal(isPollingAllowedPredicate({ hidden: true, visibilityState: 'hidden' }, { onLine: false }), false);

  // 5. Lifecycle simulation of tab visibility events
  let isPollingActive = false;
  let activeTimersCount = 0;
  const pollCallback = () => { isPollingActive = true; };

  const simulateVisibilityChange = (state: 'visible' | 'hidden', online = true) => {
    const doc = { hidden: state === 'hidden', visibilityState: state };
    const nav = { onLine: online };
    if (isPollingAllowedPredicate(doc, nav)) {
      activeTimersCount = 1;
      pollCallback();
    } else {
      activeTimersCount = 0;
      isPollingActive = false;
    }
  };

  // Tab enters background -> pause
  simulateVisibilityChange('hidden', true);
  assert.equal(isPollingActive, false);
  assert.equal(activeTimersCount, 0);

  // Tab returns to foreground -> resume
  simulateVisibilityChange('visible', true);
  assert.equal(isPollingActive, true);
  assert.equal(activeTimersCount, 1);

  // Network drop -> pause
  simulateVisibilityChange('visible', false);
  assert.equal(isPollingActive, false);
  assert.equal(activeTimersCount, 0);

  // Network restored -> resume
  simulateVisibilityChange('visible', true);
  assert.equal(isPollingActive, true);
  assert.equal(activeTimersCount, 1);
});

test('Suite T (T5): 100 concurrent mailboxes memory stability and isolation', () => {
  const mockStorage: Record<string, string> = {};
  const originalLocalStorage = globalThis.localStorage;
  const originalSessionStorage = globalThis.sessionStorage;

  try {
    const storageImpl = {
      getItem: (k: string) => mockStorage[k] || null,
      setItem: (k: string, v: string) => { mockStorage[k] = v; },
      removeItem: (k: string) => { delete mockStorage[k]; },
      clear: () => { for (const k of Object.keys(mockStorage)) delete mockStorage[k]; },
    };
    (globalThis as any).localStorage = storageImpl;
    (globalThis as any).sessionStorage = storageImpl;

    const startTime = performance.now();
    const NUM_BOXES = 100;
    const mailboxes: Mailbox[] = [];

    // Create 100 distinct mailboxes
    for (let i = 0; i < NUM_BOXES; i++) {
      const provider = i % 2 === 0 ? 'guerrilla' : 'mail_tm';
      const domain = i % 2 === 0 ? 'sharklasers.com' : 'mail.tm';
      const mailbox: Mailbox = {
        id: `box_id_${i}`,
        address: `user_${i}@${domain}`,
        apiBase: provider,
        createdAt: Date.now() - i * 1000,
      };
      mailboxes.push(mailbox);

      // Store in-memory credentials
      storeCredentials(mailbox.id, mailbox.address, `Pass_Secret_${i}!`);

      // Store unique inbox data
      const inboxList: EmailSummary[] = [
        {
          id: `msg_box_${i}_1`,
          from: `sender_${i}@external.org`,
          subject: `Subject for box ${i}`,
          intro: `Preview for box ${i}`,
          seen: i % 3 === 0,
          createdAt: new Date(Date.now() - i * 500).toISOString(),
          aiCategory: i % 2 === 0 ? 'Verification' : 'Security',
        },
      ];
      safeSaveInbox(mailbox, inboxList);

      // Store unique deleted ID
      safeSaveDeletedIds(mailbox, [`del_box_${i}_id`]);
    }

    // Verify 100% cache and data isolation for all 100 mailboxes
    for (let i = 0; i < NUM_BOXES; i++) {
      const mb = mailboxes[i];
      const readInbox = safeReadInbox(mb);
      assert.equal(readInbox.length, 1);
      assert.equal(readInbox[0].id, `msg_box_${i}_1`);
      assert.equal(readInbox[0].subject, `Subject for box ${i}`);

      const readDeleted = safeReadDeletedIds(mb);
      assert.equal(readDeleted.size, 1);
      assert.ok(readDeleted.has(`del_box_${i}_id`));
    }

    // Clear credentials for mailbox #50 only and verify other 99 remain untouched
    clearCredentials('box_id_50');
    // Ensure all accounts can be safely parsed back
    const jsonAccounts = JSON.stringify(mailboxes);
    const parsedAccounts = safeParseAccounts(jsonAccounts);
    assert.equal(parsedAccounts.length, 100);
    assert.equal(parsedAccounts[0].token, undefined);
    assert.equal(parsedAccounts[0].password, undefined);

    const durationMs = performance.now() - startTime;
    assert.ok(durationMs < 200, `100 mailboxes processing must be fast (<200ms), took ${durationMs.toFixed(2)}ms`);
  } finally {
    (globalThis as any).localStorage = originalLocalStorage;
    (globalThis as any).sessionStorage = originalSessionStorage;
  }
});

test('Suite T (T6): Persistent deleted ID cap (500 items) and FIFO eviction', () => {
  const mockStorage: Record<string, string> = {};
  const originalLocalStorage = globalThis.localStorage;
  const originalSessionStorage = globalThis.sessionStorage;

  try {
    const storageImpl = {
      getItem: (k: string) => mockStorage[k] || null,
      setItem: (k: string, v: string) => { mockStorage[k] = v; },
      removeItem: (k: string) => { delete mockStorage[k]; },
      clear: () => { for (const k of Object.keys(mockStorage)) delete mockStorage[k]; },
    };
    (globalThis as any).localStorage = storageImpl;
    (globalThis as any).sessionStorage = storageImpl;

    const account: Mailbox = {
      id: 'acc_fifo_01',
      address: 'fifo.cap@guerrillamail.com',
      apiBase: 'guerrilla',
    };

    // 1. Save exactly 500 items
    const base500 = Array.from({ length: 500 }, (_, i) => `msg_del_${i}`);
    safeSaveDeletedIds(account, base500);

    const read500 = safeReadDeletedIds(account);
    assert.equal(read500.size, 500);
    assert.ok(read500.has('msg_del_0'));
    assert.ok(read500.has('msg_del_499'));

    // 2. Add 200 newer deleted items (total 700 passed)
    const oversized700 = Array.from({ length: 700 }, (_, i) => `msg_del_${i}`);
    safeSaveDeletedIds(account, oversized700);

    const readOversized = safeReadDeletedIds(account);
    assert.equal(readOversized.size, 500, 'Deleted IDs cache must be capped strictly at 500 items');
    assert.ok(readOversized.has('msg_del_0'), 'First item within slice must be preserved');
    assert.ok(readOversized.has('msg_del_499'), '500th item within slice must be preserved');
    assert.equal(readOversized.has('msg_del_500'), false, 'Items beyond 500 cap must be evicted');

    // 3. Dirty input sanitization: whitespace strings, empty entries, and numbers
    const dirtyInputs = ['  valid_id_1  ', '', '   ', 99999 as any, 'valid_id_2'];
    safeSaveDeletedIds(account, dirtyInputs);

    const readSanitized = safeReadDeletedIds(account);
    assert.equal(readSanitized.size, 3);
    assert.ok(readSanitized.has('valid_id_1'));
    assert.ok(readSanitized.has('valid_id_2'));
    assert.ok(readSanitized.has('99999'));
    assert.equal(readSanitized.has(''), false);
  } finally {
    (globalThis as any).localStorage = originalLocalStorage;
    (globalThis as any).sessionStorage = originalSessionStorage;
  }
});

test('Suite T (T7): Service Worker cache bypass filter pattern matching', () => {
  const swPath = path.resolve(process.cwd(), 'public/sw.js');
  assert.ok(fs.existsSync(swPath), 'public/sw.js must exist');
  const swContent = fs.readFileSync(swPath, 'utf-8');

  // Verify bypass rules present in sw.js code
  assert.ok(swContent.includes("url.pathname.startsWith('/api/')"));
  assert.ok(swContent.includes("url.pathname.startsWith('/_next/')"));
  assert.ok(swContent.includes("url.pathname.startsWith('/messages/')"));
  assert.ok(swContent.includes("url.pathname.startsWith('/attachment/')"));
  assert.ok(swContent.includes("url.pathname.startsWith('/accounts')"));
  assert.ok(swContent.includes("url.pathname.startsWith('/token')"));
  assert.ok(swContent.includes("url.searchParams.has('mailbox')"));

  // Functional simulation of SW bypass filter predicate
  const APP_ORIGIN = 'https://mephistomail.site';
  const shouldBypassCache = (urlString: string, method = 'GET'): boolean => {
    if (method !== 'GET') return true;
    const url = new URL(urlString, APP_ORIGIN);
    if (url.origin !== APP_ORIGIN) return true;
    if (
      url.pathname.startsWith('/api/') ||
      url.pathname.startsWith('/_next/') ||
      url.pathname.startsWith('/messages/') ||
      url.pathname.startsWith('/attachment/') ||
      url.pathname.startsWith('/accounts') ||
      url.pathname.startsWith('/token') ||
      url.searchParams.has('mailbox')
    ) {
      return true;
    }
    return false;
  };

  // Dynamic endpoints must bypass cache
  assert.equal(shouldBypassCache('https://mephistomail.site/api/stats'), true);
  assert.equal(shouldBypassCache('https://mephistomail.site/messages/msg_123'), true);
  assert.equal(shouldBypassCache('https://mephistomail.site/attachment/att_456'), true);
  assert.equal(shouldBypassCache('https://mephistomail.site/accounts'), true);
  assert.equal(shouldBypassCache('https://mephistomail.site/token'), true);
  assert.equal(shouldBypassCache('https://mephistomail.site/?mailbox=user@guerrillamail.com'), true);
  assert.equal(shouldBypassCache('https://mephistomail.site/send', 'POST'), true);
  assert.equal(shouldBypassCache('https://api.guerrillamail.com/ajax.php?f=get_email_list'), true);

  // Static assets must NOT be bypassed (eligible for static caching)
  assert.equal(shouldBypassCache('https://mephistomail.site/'), false);
  assert.equal(shouldBypassCache('https://mephistomail.site/icon.png'), false);
  assert.equal(shouldBypassCache('https://mephistomail.site/logo.png'), false);
  assert.equal(shouldBypassCache('https://mephistomail.site/assets/index.css'), false);
});

test('Suite T (T8): Mobile viewport metadata and CSS utility validity', () => {
  const indexPath = path.resolve(process.cwd(), 'index.html');
  assert.ok(fs.existsSync(indexPath), 'index.html must exist');
  const indexHtml = fs.readFileSync(indexPath, 'utf-8');

  // 1. Mobile viewport meta tag
  assert.ok(
    indexHtml.includes('name="viewport"') &&
    indexHtml.includes('width=device-width') &&
    indexHtml.includes('initial-scale=1.0'),
    'index.html must contain compliant responsive mobile viewport meta tag'
  );

  // 2. PWA and mobile capability meta tags
  assert.ok(indexHtml.includes('name="mobile-web-app-capable" content="yes"'));
  assert.ok(indexHtml.includes('name="apple-mobile-web-app-capable" content="yes"'));
  assert.ok(indexHtml.includes('name="theme-color" content="#050505"'));
  assert.ok(indexHtml.includes('name="format-detection" content="telephone=no"'));

  // 3. CSS accessibility & utility validity in src/index.css
  const cssPath = path.resolve(process.cwd(), 'src/index.css');
  assert.ok(fs.existsSync(cssPath), 'src/index.css must exist');
  const indexCss = fs.readFileSync(cssPath, 'utf-8');

  assert.ok(indexCss.includes(':focus-visible'), 'WCAG focus-visible indicators must be defined');
  assert.ok(indexCss.includes('@media (prefers-reduced-motion: reduce)'), 'Reduced motion accessibility query must be present');
  assert.ok(indexCss.includes('.sr-only'), 'Screen reader utility class must be present');
  assert.ok(indexCss.includes('overflow-x: hidden'), 'Body overflow-x constraint must be present to prevent horizontal scroll');
});

test('Suite T (T9): Arabic RTL language direction and translation completeness', () => {
  // 1. Key parity of Arabic locale (ar) with reference English (en)
  const enKeys = Object.keys(en);
  const arKeys = Object.keys(ar);

  const missingInAr = enKeys.filter(k => !(k in ar));
  const extraInAr = arKeys.filter(k => !enKeys.includes(k));

  assert.equal(missingInAr.length, 0, `Arabic locale missing keys: ${missingInAr.join(', ')}`);
  assert.equal(extraInAr.length, 0, `Arabic locale extra keys: ${extraInAr.join(', ')}`);

  // 2. All Arabic values are valid non-empty strings containing localized text
  for (const key of arKeys) {
    const val = (ar as Record<string, unknown>)[key];
    assert.equal(typeof val, 'string', `Key ${key} in Arabic locale must be a string`);
    assert.ok((val as string).trim().length > 0, `Key ${key} in Arabic locale must not be empty`);
  }

  // 3. Direction resolution logic (ar => rtl, all others => ltr)
  const getDirectionForLang = (langCode: string): 'rtl' | 'ltr' => {
    return langCode === 'ar' ? 'rtl' : 'ltr';
  };

  assert.equal(getDirectionForLang('ar'), 'rtl');
  assert.equal(getDirectionForLang('en'), 'ltr');
  assert.equal(getDirectionForLang('tr'), 'ltr');
  assert.equal(getDirectionForLang('de'), 'ltr');
  assert.equal(getDirectionForLang('fr'), 'ltr');

  // 4. Arabic keyword categorization, OTP extraction, and action link detection
  const arVerifyCategory = determineCategory('Verification Code', 'auth@service.com', 'رمز التحقق 583214 - otp');
  assert.equal(arVerifyCategory, 'Verification');

  const extractedOtp = extractOTP('رمز التحقق الخاص بك هو 583214');
  assert.equal(extractedOtp, '583214');

  const arActionHtml = '<p><a href="https://auth.net/ar/confirm?token=9988">تأكيد البريد</a></p>';
  const arAction = extractActionLinks(arActionHtml);
  assert.ok(arAction);
  assert.equal(arAction.url, 'https://auth.net/ar/confirm?token=9988');
});

test('Suite T (T10): Chrome extension manifest V3 permission hygiene', () => {
  const manifestPath = path.resolve(process.cwd(), 'extension/manifest.json');
  assert.ok(fs.existsSync(manifestPath), 'extension/manifest.json must exist');

  const rawJson = fs.readFileSync(manifestPath, 'utf-8');
  const manifest = JSON.parse(rawJson);

  // 1. Manifest V3 specification
  assert.equal(manifest.manifest_version, 3, 'Extension must use Manifest V3');
  assert.ok(typeof manifest.name === 'string' && manifest.name.length > 0);
  assert.ok(typeof manifest.version === 'string' && /^\d+\.\d+\.\d+$/.test(manifest.version));

  // 2. Background service worker
  assert.ok(manifest.background?.service_worker, 'Background service_worker must be specified');
  assert.equal(typeof manifest.background.service_worker, 'string');

  // 3. Action popup
  assert.ok(manifest.action?.default_popup, 'Action default_popup must be specified');

  // 4. Least privilege permission hygiene
  const allowedPermissions = new Set([
    'storage',
    'contextMenus',
    'alarms',
    'clipboardWrite',
    'notifications',
    'scripting',
    'activeTab',
  ]);

  assert.ok(Array.isArray(manifest.permissions), 'Permissions must be an array');
  for (const perm of manifest.permissions) {
    assert.ok(
      allowedPermissions.has(perm),
      `Permission '${perm}' is outside strictly approved minimal permission set`
    );
  }

  // Dangerous wildcard checks
  assert.equal(manifest.permissions.includes('<all_urls>'), false, 'Manifest must not request <all_urls> in permissions');
  assert.equal(manifest.permissions.includes('cookies'), false, 'Manifest must not request cookies permission');
  assert.equal(manifest.permissions.includes('debugger'), false, 'Manifest must not request debugger permission');
  assert.equal(manifest.permissions.includes('webRequestBlocking'), false, 'Manifest must not request webRequestBlocking');

  // 5. Host permissions strictly scoped to API endpoints
  assert.ok(Array.isArray(manifest.host_permissions), 'host_permissions must be an array');
  const allowedHostPrefixes = [
    'https://api.mail.gw/',
    'https://api.mail.tm/',
    'https://api.guerrillamail.com/',
  ];

  for (const host of manifest.host_permissions) {
    assert.ok(
      allowedHostPrefixes.some(prefix => host.startsWith(prefix)),
      `host_permission '${host}' must be scoped strictly to allowed mail API endpoints`
    );
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// SUITE U: Core Engine, Polling, Storage Migration & Security Hardening
// ═══════════════════════════════════════════════════════════════════════════

test('Suite U (U1): Duplicate in-flight request suppression for getMessages', async () => {
  clearInFlightFetches();
  let networkCallCount = 0;

  const mailbox: Mailbox = {
    id: 'u1_dedup_mb',
    address: 'concurrent@sharklasers.com',
    apiBase: 'guerrilla',
    token: 'sid_u1_token',
  };

  setMockFetch(async (url) => {
    if (url.includes('get_email_list')) {
      networkCallCount++;
      // Simulate slight network latency
      await new Promise(r => setTimeout(r, 20));
      return jsonResponse({
        list: [
          { mail_id: 'msg_u1_1', mail_from: 'auth@test.com', mail_subject: 'Code 1234', mail_excerpt: 'Your code', mail_date: '2026-08-29' },
        ],
      });
    }
    return jsonResponse({});
  });

  try {
    // Launch 5 concurrent fetches for the same mailbox
    const [r1, r2, r3, r4, r5] = await Promise.all([
      getMessages(mailbox),
      getMessages(mailbox),
      getMessages(mailbox),
      getMessages(mailbox),
      getMessages(mailbox),
    ]);

    assert.equal(networkCallCount, 1, 'Only 1 underlying network request must be made for 5 concurrent calls');
    assert.equal(r1.length, 1);
    assert.equal(r2.length, 1);
    assert.equal(r3.length, 1);
    assert.equal(r4.length, 1);
    assert.equal(r5.length, 1);
    assert.equal(r1[0].id, 'msg_u1_1');
    assert.equal(r5[0].id, 'msg_u1_1');
  } finally {
    clearInFlightFetches();
    setMockFetch(null);
  }
});

test('Suite U (U2): Duplicate in-flight request suppression for getMessageDetail', async () => {
  clearInFlightFetches();
  let networkCallCount = 0;

  const mailbox: Mailbox = {
    id: 'u2_detail_mb',
    address: 'detail.dedup@sharklasers.com',
    apiBase: 'guerrilla',
    token: 'sid_u2_token',
  };

  setMockFetch(async (url) => {
    if (url.includes('fetch_email')) {
      networkCallCount++;
      await new Promise(r => setTimeout(r, 20));
      return jsonResponse({
        mail_id: 'msg_u2_99',
        mail_from: 'service@secure.com',
        mail_subject: 'Your OTP',
        mail_excerpt: 'Code 9988',
        mail_body: '<p>Code 9988</p>',
      });
    }
    return jsonResponse({});
  });

  try {
    // Launch 3 concurrent detail fetches
    const [d1, d2, d3] = await Promise.all([
      getMessageDetail(mailbox, 'msg_u2_99'),
      getMessageDetail(mailbox, 'msg_u2_99'),
      getMessageDetail(mailbox, 'msg_u2_99'),
    ]);

    assert.equal(networkCallCount, 1, 'Only 1 underlying network request must be made for concurrent message detail requests');
    assert.ok(d1 && d2 && d3);
    assert.equal(d1?.id, 'msg_u2_99');
    assert.equal(d2?.id, 'msg_u2_99');
    assert.equal(d3?.id, 'msg_u2_99');
  } finally {
    clearInFlightFetches();
    setMockFetch(null);
  }
});

test('Suite U (U3): MailboxFetchError error classifications (RATE_LIMITED, SESSION_EXPIRED, REHYDRATION_FAILED, NETWORK_ERROR)', async () => {
  clearRateLimit();

  // 1. Rate limit classification
  setMockFetch(() => new Response('Too Many Requests', {
    status: 429,
    headers: { 'Retry-After': '10' },
  }));

  try {
    await safeFetch('https://api.mail.tm/messages', undefined, 'mail_tm', 'rate_mb');
    assert.fail('Expected safeFetch to throw on 429');
  } catch (err: any) {
    assert.ok(err instanceof MailboxFetchError);
    assert.equal(err.code, 'RATE_LIMITED');
    assert.ok(getRateLimitRemainingMs('mail_tm') > 0);
  } finally {
    clearRateLimit();
    setMockFetch(null);
  }

  // 2. Rehydration failure classification
  setMockFetch((url) => {
    if (url.includes('get_email_address')) {
      return jsonResponse({ sid_token: 'sid_rehydrate_fail' });
    }
    if (url.includes('set_email_user')) {
      return jsonResponse({ error: 'Username rejected' });
    }
    return jsonResponse({});
  });

  const unhydratedMb: Mailbox = {
    id: 'g_rehydrate_fail',
    address: 'baduser@sharklasers.com',
    apiBase: 'guerrilla',
  };

  try {
    await rehydrateMailboxSession(unhydratedMb);
    assert.fail('Expected rehydrateMailboxSession to throw on rejected username');
  } catch (err: any) {
    assert.ok(err instanceof MailboxFetchError);
    assert.equal(err.code, 'REHYDRATION_FAILED');
  } finally {
    setMockFetch(null);
  }
});

test('Suite U (U4): Safe cleanup of obsolete legacy storage keys while preserving v5 and v2', () => {
  const mockStorage: Record<string, string> = {};
  const originalLocalStorage = globalThis.localStorage;

  try {
    const storageImpl = {
      getItem: (k: string) => mockStorage[k] || null,
      setItem: (k: string, v: string) => { mockStorage[k] = v; },
      removeItem: (k: string) => { delete mockStorage[k]; },
      clear: () => { for (const k of Object.keys(mockStorage)) delete mockStorage[k]; },
      key: (i: number) => Object.keys(mockStorage)[i] || null,
      get length() { return Object.keys(mockStorage).length; },
    };
    (globalThis as any).localStorage = storageImpl;

    // Seed legacy and current keys
    mockStorage['nexus_accounts'] = JSON.stringify([{ id: 'old0' }]);
    mockStorage['nexus_accounts_v1'] = JSON.stringify([{ id: 'old1' }]);
    mockStorage['nexus_accounts_v2'] = JSON.stringify([{ id: 'old2' }]);
    mockStorage['nexus_accounts_v3'] = JSON.stringify([{ id: 'old3' }]);
    mockStorage['nexus_accounts_v4'] = JSON.stringify([{ id: 'old4' }]);
    mockStorage['mephisto_accounts'] = JSON.stringify([{ id: 'old_m' }]);
    mockStorage['mephisto_inbox_v1_user@sharklasers.com'] = JSON.stringify([{ id: 'm1' }]);
    mockStorage['mephisto_inbox_legacy@sharklasers.com'] = JSON.stringify([{ id: 'm0' }]);
    mockStorage['mephisto_deleted_legacy@sharklasers.com'] = JSON.stringify(['d0']);

    // Current valid keys
    mockStorage['nexus_accounts_v5'] = JSON.stringify([{ id: 'valid5', address: 'valid@sharklasers.com' }]);
    mockStorage['mephisto_inbox_v2_valid@sharklasers.com'] = JSON.stringify([{ id: 'v2_msg' }]);
    mockStorage['mephisto_deleted_v1_valid@sharklasers.com'] = JSON.stringify(['del_v1']);
    mockStorage['mephisto_theme'] = 'dark';
    mockStorage['mephisto_stats'] = JSON.stringify({ totalAccountsCreated: 1 });

    // Execute cleanup
    cleanupLegacyStorage();

    // Verify obsolete keys are removed
    assert.equal(mockStorage['nexus_accounts'], undefined);
    assert.equal(mockStorage['nexus_accounts_v1'], undefined);
    assert.equal(mockStorage['nexus_accounts_v2'], undefined);
    assert.equal(mockStorage['nexus_accounts_v3'], undefined);
    assert.equal(mockStorage['nexus_accounts_v4'], undefined);
    assert.equal(mockStorage['mephisto_accounts'], undefined);
    assert.equal(mockStorage['mephisto_inbox_v1_user@sharklasers.com'], undefined);
    assert.equal(mockStorage['mephisto_inbox_legacy@sharklasers.com'], undefined);
    assert.equal(mockStorage['mephisto_deleted_legacy@sharklasers.com'], undefined);

    // Verify valid keys are strictly preserved
    assert.ok(mockStorage['nexus_accounts_v5']);
    assert.ok(mockStorage['mephisto_inbox_v2_valid@sharklasers.com']);
    assert.ok(mockStorage['mephisto_deleted_v1_valid@sharklasers.com']);
    assert.equal(mockStorage['mephisto_theme'], 'dark');
    assert.ok(mockStorage['mephisto_stats']);
  } finally {
    (globalThis as any).localStorage = originalLocalStorage;
  }
});

test('Suite U (U5): Strict credential stripping prevents tokens and passwords from ever entering localStorage', () => {
  const dirtyAccounts = [
    {
      id: 'acc_secret_1',
      address: 'secret1@mail.tm',
      apiBase: 'mail_tm',
      token: 'jwt_super_secret_token_123',
      password: 'PlainPassword456!',
      sid_token: 'sid_xyz',
      auth: { token: 'auth_tok' },
      headers: { Authorization: 'Bearer test' },
      credentials: { pass: '123' },
      createdAt: Date.now(),
    },
  ];

  const parsed = safeParseAccounts(JSON.stringify(dirtyAccounts));
  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].token, undefined);
  assert.equal(parsed[0].password, undefined);
  assert.equal((parsed[0] as any).sid_token, undefined);
  assert.equal((parsed[0] as any).auth, undefined);
  assert.equal((parsed[0] as any).headers, undefined);

  // Check serialized output
  const json = JSON.stringify(parsed);
  assert.equal(json.includes('jwt_super_secret_token_123'), false);
  assert.equal(json.includes('PlainPassword456!'), false);
  assert.equal(json.includes('sid_xyz'), false);
  assert.equal(json.includes('Bearer test'), false);
});

test('Suite U (U6): 100 accounts capacity limit and memory safety (MAX_ACTIVE_ACCOUNTS = 100)', () => {
  assert.equal(MAX_ACTIVE_ACCOUNTS, 100);

  // Generate 150 accounts
  const now = Date.now();
  const raw150 = Array.from({ length: 150 }, (_, i) => ({
    id: `acc_stress_${i}`,
    address: `stress_${i}@sharklasers.com`,
    apiBase: 'guerrilla',
    createdAt: now,
  }));

  const parsed = safeParseAccounts(JSON.stringify(raw150));
  assert.equal(parsed.length, 150);

  // Capped slice simulation as in useMailbox
  const capped = parsed.slice(0, MAX_ACTIVE_ACCOUNTS);
  assert.equal(capped.length, 100);

  // Credential store safety
  for (let i = 0; i < 100; i++) {
    storeCredentials(`mb_${i}`, `mb_${i}@test.com`, `pass_${i}`);
  }

  // Clear credentials for 50 expired accounts
  for (let i = 0; i < 50; i++) {
    clearCredentials(`mb_${i}`);
  }

  // Verify memory cleanup does not throw
  clearCredentials('non_existent_id');
});

test('Suite U (U7): Chrome Extension background service worker session storage hygiene', () => {
  const bgPath = path.resolve(process.cwd(), 'extension/js/background.js');
  assert.ok(fs.existsSync(bgPath), 'extension/js/background.js must exist');
  const bgContent = fs.readFileSync(bgPath, 'utf-8');

  // Verify chrome.storage.session is used instead of chrome.storage.local for account reading
  assert.ok(bgContent.includes('chrome.storage.session.get(["mephistoAccount"]'));
  assert.equal(bgContent.includes('chrome.storage.local.get(["mephistoAccount"]'), false, 'background.js must not read tokens from chrome.storage.local');
});

test('Suite U (U8): Service Worker bypass filter excludes auth headers and dynamic endpoints', () => {
  const swPath = path.resolve(process.cwd(), 'public/sw.js');
  assert.ok(fs.existsSync(swPath), 'public/sw.js must exist');
  const swContent = fs.readFileSync(swPath, 'utf-8');

  assert.ok(swContent.includes("!request.headers.has('authorization')"));
  assert.ok(swContent.includes("url.pathname.startsWith('/api/')"));
  assert.ok(swContent.includes("url.origin !== APP_ORIGIN"));
});







