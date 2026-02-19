export type AICategory = 'Verification' | 'Security' | 'Newsletter' | 'Other';

export interface Mailbox {
  id: string;
  address: string;
  apiBase: string;
  token?: string;
  password?: string;
  label?: string;        // Alias label (sosyal medya, alışveriş vb.)
  labelColor?: string;   // Alias label rengi
  createdAt?: number;    // Oluşturulma zamanı (timestamp)
  autoDeleteMinutes?: number; // Otomatik silme süresi
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
}

export interface EmailAttachment {
  id: string;
  filename: string;
  contentType: string;
  size: number;
  downloadUrl?: string;
}

// İstatistik tipi
export interface AppStats {
  totalAccountsCreated: number;
  totalEmailsReceived: number;
  categoryBreakdown: Record<AICategory, number>;
  lastActivity: number;
}

// Bildirim filtre tipi
export interface NotificationFilter {
  verification: boolean;
  security: boolean;
  newsletter: boolean;
  other: boolean;
}

// Auto-forward kuralı
export interface ForwardRule {
  id: string;
  fromPattern: string;
  subjectPattern: string;
  targetEmail: string;
  enabled: boolean;
}