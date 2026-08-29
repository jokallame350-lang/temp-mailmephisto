import {
  getMaxAttachmentBytes,
  normalizeMimeType,
  validateAttachmentMetadata,
  validateAttachmentResponse,
  sanitizeAttachmentFilename,
} from '../utils/attachmentSecurity';
import type { EmailAttachment } from '../types';

export interface SecureAttachmentResult {
  ok: boolean;
  blob?: Blob;
  filename: string;
  contentType: string;
  reason?: string;
}

/**
 * Fetch an attachment only when its metadata has passed local validation.
 * This deliberately does not execute or preview the returned file.
 */
export const fetchSecureAttachment = async (
  url: string,
  attachment: EmailAttachment,
  signal?: AbortSignal,
): Promise<SecureAttachmentResult> => {
  const metadata = validateAttachmentMetadata(
    attachment.filename,
    attachment.contentType,
    attachment.size,
  );

  if (!metadata.ok) {
    return {
      ok: false,
      filename: metadata.filename,
      contentType: metadata.contentType,
      reason: metadata.reason,
    };
  }

  if (!/^https:\/\//i.test(url)) {
    return {
      ok: false,
      filename: metadata.filename,
      contentType: metadata.contentType,
      reason: 'Attachment URL must use HTTPS.',
    };
  }

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 15000);
  const onAbort = () => controller.abort();
  signal?.addEventListener('abort', onAbort, { once: true });

  try {
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'omit',
      redirect: 'error',
      cache: 'no-store',
      signal: controller.signal,
    });

    if (!response.ok) {
      return {
        ok: false,
        filename: metadata.filename,
        contentType: metadata.contentType,
        reason: `Attachment request failed (HTTP ${response.status}).`,
      };
    }

    const declaredLength = Number(response.headers.get('Content-Length') || '');
    if (Number.isFinite(declaredLength) && declaredLength > getMaxAttachmentBytes()) {
      return {
        ok: false,
        filename: metadata.filename,
        contentType: metadata.contentType,
        reason: 'Attachment exceeds the 25 MB limit.',
      };
    }

    const blob = await response.blob();
    const responseValidation = validateAttachmentResponse(
      blob,
      attachment.contentType,
      attachment.size,
    );

    if (!responseValidation.ok) {
      return {
        ok: false,
        filename: metadata.filename,
        contentType: normalizeMimeType(blob.type || attachment.contentType),
        reason: responseValidation.reason,
      };
    }

    return {
      ok: true,
      blob,
      filename: sanitizeAttachmentFilename(attachment.filename),
      contentType: normalizeMimeType(blob.type || attachment.contentType),
    };
  } catch (error) {
    return {
      ok: false,
      filename: metadata.filename,
      contentType: metadata.contentType,
      reason: error instanceof DOMException && error.name === 'AbortError'
        ? 'Attachment request timed out or was cancelled.'
        : 'Attachment request failed.',
    };
  } finally {
    window.clearTimeout(timeout);
    signal?.removeEventListener('abort', onAbort);
  }
};
