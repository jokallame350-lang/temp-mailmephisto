export type AICategory = 'Verification' | 'Promotion' | 'Newsletter' | 'Security' | 'Other';

export interface Mailbox {
  id: string;
  address: string;
  password?: string;
  token?: string; // JWT token for Mail.tm
  apiBase?: string; // The API provider URL used for this mailbox
}

export interface EmailSummary {
  id: string;
  from: {
    address: string;
    name: string;
  };
  subject: string;
  intro: string;
  seen: boolean;
  createdAt: string; // ISO Date string
  aiCategory: AICategory;
}

export interface EmailDetail extends EmailSummary {
  text?: string;
  html?: string[];
  hasAttachments: boolean;
  attachments: Array<{
    id: string;
    filename: string;
    contentType: string;
    size: number;
    downloadUrl: string;
  }>;
}