import { describe, expect, it } from 'vitest';
import {
  sanitizeAttachmentFilename,
  normalizeMimeType,
  isBlockedAttachment,
  validateAttachmentMetadata,
  validateAttachmentResponse,
} from './attachmentSecurity';

describe('attachment security', () => {
  it('removes path traversal and control characters from filenames', () => {
    expect(sanitizeAttachmentFilename('../..\\evil.exe\u0000')).toBe('.._.._evil.exe');
  });

  it('normalizes MIME parameters', () => {
    expect(normalizeMimeType('Application/PDF; charset=binary')).toBe('application/pdf');
    expect(normalizeMimeType('not-a-mime')).toBe('application/octet-stream');
  });

  it('blocks executable extensions and MIME types', () => {
    expect(isBlockedAttachment('payload.exe', 'application/octet-stream')).toBe(true);
    expect(isBlockedAttachment('payload.bin', 'application/x-msdownload')).toBe(true);
    expect(isBlockedAttachment('document.pdf', 'application/pdf')).toBe(false);
  });

  it('rejects oversized attachments', () => {
    const result = validateAttachmentMetadata('large.pdf', 'application/pdf', 26 * 1024 * 1024);
    expect(result.ok).toBe(false);
  });

  it('rejects response MIME mismatches', () => {
    const result = validateAttachmentResponse(
      new Blob(['hello'], { type: 'text/plain' }),
      'application/pdf',
      5,
    );
    expect(result.ok).toBe(false);
  });
});
