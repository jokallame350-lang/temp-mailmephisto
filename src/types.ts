export type AICategory = 'Verification' | 'Security' | 'Newsletter' | 'Other';

export interface Mailbox {
  id: string;
  address: string;
  apiBase: string;
  token?: string;
  password?: string;
  label?: string;
  labelColor?: string;
  createdAt?: number;
  autoDeleteMinutes?: number;
  isCustomDomain?: boolean;
  customDomainName?: string;
  minMailId?: number;
}

export interface EmailSummary {
  id: string;
  from: string | {
    address: string;
    name: string;
  };
  subject: string;
  intro: string;
  seen: boolean;
  createdAt: string;
  aiCategory: AICategory;
}

export interface EmailDetail extends EmailSummary {
  text?: string;
  html?: string[];
  hasAttachments: boolean;
  attachments: EmailAttachment[];
  headerFields?: Record<string, string>;
  blockedTrackersCount?: number;
  blockedTrackerDomains?: string[];
}

export interface EmailAttachment {
  id: string;
  filename: string;
  contentType: string;
  size: number;
  downloadUrl?: string;
  disposition?: 'inline' | 'attachment' | string;
  contentId?: string;
  detectedContentType?: string;
  blocked?: boolean;
  blockReason?: string;
}

export interface ComposeMailData {
  to?: string;
  subject?: string;
  body?: string;
  inReplyToId?: string;
}

export interface AppStats {
  totalAccountsCreated: number;
  totalEmailsReceived: number;
  categoryBreakdown: Record<AICategory, number>;
  lastActivity: number;
}

export interface NotificationFilter {
  verification: boolean;
  security: boolean;
  newsletter: boolean;
  other: boolean;
}

export interface ForwardRule {
  id: string;
  fromPattern: string;
  subjectPattern: string;
  targetEmail: string;
  enabled: boolean;
}

export * from './types/paddle';