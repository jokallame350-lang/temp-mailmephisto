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
} from '../src/services/mailService.ts';
import { Mailbox } from '../src/types.ts';

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

// ─── 9. Additional Mail Service Unit Coverage ─────────────────────────────
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
