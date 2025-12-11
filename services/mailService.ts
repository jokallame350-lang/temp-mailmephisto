import { Mailbox, EmailSummary, EmailDetail, AICategory } from '../types';

const PROVIDERS = [
  'https://api.mail.tm',
  'https://api.mail.gw'
];

// Fallback for legacy mailboxes saved in local storage without apiBase
const DEFAULT_PROVIDER = 'https://api.mail.gw';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper for API requests
const apiRequest = async (baseUrl: string, endpoint: string, method: string = 'GET', body?: any, token?: string) => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Accept': 'application/ld+json' // Important for Hydra format
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    method,
    headers,
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${baseUrl}${endpoint}`, config);
    
    if (!response.ok) {
      // Try to parse error message, but fallback to status text
      const err = await response.json().catch(() => ({}));
      // Throw object with status to handle 422 specifically
      throw { status: response.status, message: err.message || `API Error: ${response.status}`, details: err };
    }

    // Handle 204 No Content
    if (response.status === 204) return null;

    return response.json();
  } catch (error) {
    throw error;
  }
};

// --- AI Tagging Logic (Frontend Simulation) ---
const determineCategory = (subject: string, intro: string): AICategory => {
  const text = `${subject} ${intro}`.toLowerCase();

  if (/(code|verify|verification|otp|confirm|activation|pin\b)/.test(text)) {
    return 'Verification';
  }
  if (/(security|alert|reset password|suspicious|login attempt)/.test(text)) {
    return 'Security';
  }
  if (/(sale|discount|% off|offer|promo|deal|campaign)/.test(text)) {
    return 'Promotion';
  }
  if (/(unsubscribe|newsletter|digest|weekly|update)/.test(text)) {
    return 'Newsletter';
  }
  return 'Other';
};

// 1. Get available domains from a specific provider
// Returns { domains: string[], apiBase: string }
export const fetchDomains = async (): Promise<{ domains: string[], apiBase: string }> => {
  for (const provider of PROVIDERS) {
    try {
      const data = await apiRequest(provider, '/domains');
      if (data && Array.isArray(data['hydra:member']) && data['hydra:member'].length > 0) {
        return {
          domains: data['hydra:member'].map((d: any) => d.domain),
          apiBase: provider
        };
      }
    } catch (e) {
      console.warn(`Failed to fetch domains from ${provider}`, e);
    }
  }
  throw new Error("Could not fetch domains from any provider.");
};

// 2. Create Custom Account with specific username and domain
export const createCustomMailbox = async (username: string, domain: string, apiBase: string): Promise<Mailbox> => {
  const address = `${username}@${domain}`;
  const password = Math.random().toString(36).substring(2, 14) + "X9@"; // Strong password

  try {
    // Step A: Create Account
    const accountData = await apiRequest(apiBase, '/accounts', 'POST', {
      address,
      password
    });

    // Step B: Get Token
    const tokenData = await apiRequest(apiBase, '/token', 'POST', {
      address,
      password
    });

    return {
      id: accountData.id,
      address: accountData.address,
      password,
      token: tokenData.token,
      apiBase: apiBase
    };
  } catch (error: any) {
    if (error.status === 422) {
      throw new Error("This username is already taken.");
    }
    throw error;
  }
};


// 3. Create Random Account (Iterates through providers with Retry)
export const generateMailbox = async (): Promise<Mailbox> => {
  let lastError;
  const RETRIES = 3; 

  for (let attempt = 0; attempt < RETRIES; attempt++) {
    for (const provider of PROVIDERS) {
      try {
        const domainsData = await apiRequest(provider, '/domains');
        const domains = domainsData?.['hydra:member']?.map((d: any) => d.domain) || [];
        
        if (!domains.length) throw new Error("No domains available");

        const domain = domains[Math.floor(Math.random() * domains.length)];
        const username = Math.random().toString(36).substring(2, 12);
        const password = Math.random().toString(36).substring(2, 14) + "X9@"; 
        const address = `${username}@${domain}`;

        const accountData = await apiRequest(provider, '/accounts', 'POST', {
          address,
          password
        });

        const tokenData = await apiRequest(provider, '/token', 'POST', {
          address,
          password
        });

        return {
          id: accountData.id,
          address: accountData.address,
          password,
          token: tokenData.token,
          apiBase: provider
        };

      } catch (error) {
        lastError = error;
      }
    }
    if (attempt < RETRIES - 1) await delay(1000); 
  }

  console.error("All mailbox providers failed.");
  throw lastError || new Error("Failed to connect to any mail service.");
};

// 4. Get Messages
export const getMessages = async (mailbox: Mailbox): Promise<EmailSummary[]> => {
  if (!mailbox.token) return [];
  const baseUrl = mailbox.apiBase || DEFAULT_PROVIDER;

  try {
    const data = await apiRequest(baseUrl, '/messages?page=1', 'GET', undefined, mailbox.token);
    
    if (!data || !Array.isArray(data['hydra:member'])) {
      return [];
    }

    return data['hydra:member'].map((msg: any) => ({
      id: msg.id,
      from: msg.from,
      subject: msg.subject,
      intro: msg.intro,
      seen: msg.seen,
      createdAt: msg.createdAt,
      aiCategory: determineCategory(msg.subject || '', msg.intro || '')
    }));
  } catch (error) {
    return [];
  }
};

// 5. Get Single Message Detail
export const getMessageDetail = async (mailbox: Mailbox, messageId: string): Promise<EmailDetail | null> => {
  if (!mailbox.token) return null;
  const baseUrl = mailbox.apiBase || DEFAULT_PROVIDER;

  try {
    const msg = await apiRequest(baseUrl, `/messages/${messageId}`, 'GET', undefined, mailbox.token);
    if (!msg) return null;

    const aiCategory = determineCategory(msg.subject || '', msg.intro || '');

    return {
      id: msg.id,
      from: msg.from,
      subject: msg.subject,
      intro: msg.intro,
      seen: msg.seen,
      createdAt: msg.createdAt,
      aiCategory,
      text: msg.text,
      html: msg.html || [], 
      hasAttachments: msg.hasAttachments,
      attachments: (msg.attachments || []).map((att: any) => ({
        id: att.id,
        filename: att.filename,
        contentType: att.contentType,
        size: att.size,
        downloadUrl: `${baseUrl}${att.downloadUrl}`
      }))
    };
  } catch (error) {
    return null;
  }
};

// 6. Delete Message
export const deleteMessage = async (mailbox: Mailbox, messageId: string): Promise<boolean> => {
  if (!mailbox.token) return false;
  const baseUrl = mailbox.apiBase || DEFAULT_PROVIDER;
  try {
    await apiRequest(baseUrl, `/messages/${messageId}`, 'DELETE', undefined, mailbox.token);
    return true;
  } catch (error) {
    return false;
  }
};