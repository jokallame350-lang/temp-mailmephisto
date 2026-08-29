const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024;
const MAX_FILENAME_LENGTH = 180;

const BLOCKED_MIME_TYPES = new Set([
  'application/x-msdownload',
  'application/x-msdos-program',
  'application/x-ms-installer',
  'application/x-sh',
  'application/x-bat',
  'application/x-csh',
  'application/x-httpd-php',
  'application/x-executable',
]);

const BLOCKED_EXTENSIONS = new Set([
  'exe','dll','com','scr','msi','msp','mst','bat','cmd','ps1','psm1','vbs','vbe','js','jse','ws','wsc','wsh','hta','cpl','jar','apk','appx','deb','rpm','dmg','pkg','sh','bash','zsh','fish'
]);

export const sanitizeAttachmentFilename = (filename: unknown): string => {
  const raw = typeof filename === 'string' ? filename : '';
  const normalized = raw.replace(/[\u0000-\u001f\u007f]/g, '').replace(/[\\/]+/g, '_').trim();
  const basename = normalized.split(/[\\/]/).pop() || '';
  const safe = basename.replace(/^\.+$/, '').slice(0, MAX_FILENAME_LENGTH);
  return safe || 'attachment';
};

export const normalizeMimeType = (contentType: unknown): string => {
  if (typeof contentType !== 'string') return 'application/octet-stream';
  const value = contentType.split(';', 1)[0].trim().toLowerCase();
  return /^[a-z0-9!#$&^_.+-]+\/[a-z0-9!#$&^_.+-]+$/.test(value) ? value : 'application/octet-stream';
};

export const isBlockedAttachment = (filename: unknown, contentType: unknown): boolean => {
  const name = sanitizeAttachmentFilename(filename).toLowerCase();
  const ext = name.includes('.') ? name.split('.').pop() || '' : '';
  return BLOCKED_EXTENSIONS.has(ext) || BLOCKED_MIME_TYPES.has(normalizeMimeType(contentType));
};

export const validateAttachmentMetadata = (filename: unknown, contentType: unknown, size: unknown): { ok: boolean; filename: string; contentType: string; size: number; reason?: string } => {
  const safeFilename = sanitizeAttachmentFilename(filename);
  const safeType = normalizeMimeType(contentType);
  const safeSize = typeof size === 'number' && Number.isFinite(size) && size >= 0 ? Math.floor(size) : 0;

  if (safeSize > MAX_ATTACHMENT_BYTES) {
    return { ok: false, filename: safeFilename, contentType: safeType, size: safeSize, reason: 'Attachment exceeds the 25 MB limit.' };
  }
  if (isBlockedAttachment(safeFilename, safeType)) {
    return { ok: false, filename: safeFilename, contentType: safeType, size: safeSize, reason: 'Attachment type is blocked.' };
  }
  return { ok: true, filename: safeFilename, contentType: safeType, size: safeSize };
};

export const validateAttachmentResponse = (blob: Blob, declaredType?: string, declaredSize?: number): { ok: boolean; reason?: string } => {
  if (blob.size > MAX_ATTACHMENT_BYTES) return { ok: false, reason: 'Downloaded attachment exceeds the 25 MB limit.' };
  if (typeof declaredSize === 'number' && declaredSize >= 0 && blob.size > declaredSize + 1024 * 1024) {
    return { ok: false, reason: 'Downloaded attachment size differs unexpectedly from metadata.' };
  }
  const actual = normalizeMimeType(blob.type);
  const declared = normalizeMimeType(declaredType);
  if (actual !== 'application/octet-stream' && declared !== 'application/octet-stream' && actual !== declared) {
    return { ok: false, reason: 'Attachment MIME type does not match its metadata.' };
  }
  return { ok: true };
};

export const getMaxAttachmentBytes = (): number => MAX_ATTACHMENT_BYTES;
