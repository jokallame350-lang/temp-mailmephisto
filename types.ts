export type AICategory = 'Verification' | 'Security' | 'Newsletter' | 'Other';

export interface Mailbox {
  id: string;
  address: string;
  apiBase: string;
  token?: string;    
  password?: string; 
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
  createdAt: string;
  aiCategory: AICategory;
}

export interface EmailDetail extends EmailSummary {
  text?: string;
  html?: string[];
  hasAttachments: boolean;
  attachments: any[];
}