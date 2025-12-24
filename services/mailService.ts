import { Mailbox, EmailSummary, EmailDetail, AICategory } from '../appTypes';

// HEDEF: Mail.tm
const API_BASE = "https://api.mail.tm";

const generatePassword = () => {
  return Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
};

const determineCategory = (subject: string, from: string, intro: string): AICategory => {
  const text = `${subject} ${from} ${intro}`.toLowerCase();
  if (/(code|verify|verification|otp|confirm|activation|pin\b|doğrulama|kod|şifre)/.test(text)) return 'Verification';
  if (/(security|alert|reset password|suspicious|login attempt|güvenlik|giriş)/.test(text)) return 'Security';
  if (/(newsletter|bülten|weekly|digest|fırsat|indirim)/.test(text)) return 'Newsletter';
  return 'Other';
};

export const fetchDomains = async (): Promise<{ domains: string[], apiBase: string }> => {
  try {
    const res = await fetch(`${API_BASE}/domains`);
    const data = await res.json();
    const domains = data['hydra:member'].map((d: any) => d.domain);
    return { domains: domains, apiBase: 'mail_tm' };
  } catch {
    return { domains: ["karenkey.com", "mymail.com"], apiBase: 'mail_tm' };
  }
};

export const generateMailbox = async (): Promise<Mailbox> => {
  try {
    const domainData = await fetchDomains();
    const domain = domainData.domains[0] || "karenkey.com";
    const username = Math.random().toString(36).substring(2, 12);
    const address = `${username}@${domain}`;
    const password = generatePassword();

    await fetch(`${API_BASE}/accounts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address, password })
    });

    const tokenRes = await fetch(`${API_BASE}/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address, password })
    });
    
    const tokenData = await tokenRes.json();
    if (!tokenData.token) throw new Error("Token alınamadı");

    return {
      id: tokenData.id || address,
      address: address,
      apiBase: 'mail_tm',
      token: tokenData.token,
      password: password
    };
  } catch (error) {
    console.error("Hesap oluşturma hatası:", error);
    return { id: 'error', address: 'error@connection.failed', apiBase: 'error', token: '', password: '' };
  }
};

export const createCustomMailbox = async (username: string, domain: string, apiBase: string): Promise<Mailbox> => {
  try {
    const address = `${username}@${domain}`;
    const password = generatePassword();

    const accRes = await fetch(`${API_BASE}/accounts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address, password })
    });

    if (accRes.status === 422) throw new Error("Bu kullanıcı adı zaten alınmış.");

    const tokenRes = await fetch(`${API_BASE}/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address, password })
    });
    const tokenData = await tokenRes.json();

    return {
      id: tokenData.id || address,
      address: address,
      apiBase: 'mail_tm',
      token: tokenData.token,
      password: password
    };
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const getMessages = async (mailbox: Mailbox): Promise<EmailSummary[] | null> => {
  if (!mailbox.token) return [];
  try {
    const res = await fetch(`${API_BASE}/messages?page=1`, {
      headers: { "Authorization": `Bearer ${mailbox.token}` }
    });
    if (!res.ok) return [];
    
    const data = await res.json();
    return data['hydra:member'].map((msg: any) => ({
      id: msg.id,
      from: { 
        address: msg.from.address, 
        name: msg.from.name || msg.from.address.split('@')[0] 
      },
      subject: msg.subject,
      intro: msg.intro || "No preview available",
      seen: msg.seen,
      createdAt: msg.createdAt,
      aiCategory: determineCategory(msg.subject, msg.from.address, msg.intro || "")
    }));
  } catch (error) {
    console.error("Mesaj getirme hatası", error);
    return [];
  }
};

export const getMessageDetail = async (mailbox: Mailbox, messageId: string): Promise<EmailDetail | null> => {
  if (!mailbox.token) return null;
  try {
    const res = await fetch(`${API_BASE}/messages/${messageId}`, {
      headers: { "Authorization": `Bearer ${mailbox.token}` }
    });
    if (!res.ok) return null;
    
    const msg = await res.json();
    return {
      id: msg.id,
      from: { address: msg.from.address, name: msg.from.name || msg.from.address },
      subject: msg.subject,
      intro: msg.intro,
      seen: true,
      createdAt: msg.createdAt,
      aiCategory: determineCategory(msg.subject, msg.from.address, msg.intro),
      text: msg.text,
      html: msg.html ? [msg.html] : [],
      hasAttachments: msg.hasAttachments,
      attachments: msg.attachments || []
    };
  } catch (error) {
    return null;
  }
};

export const deleteMessage = async (mailbox: Mailbox, messageId: string): Promise<boolean> => {
  if (!mailbox.token) return false;
  try {
    await fetch(`${API_BASE}/messages/${messageId}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${mailbox.token}` }
    });
    return true;
  } catch {
    return false;
  }
};
