import { Mailbox, EmailSummary, EmailDetail, AICategory } from '../types';

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

// 1. Domain Listesini Getir (Dışarı aktarıldı, hata vermez)
export const fetchDomains = async (): Promise<{ domains: string[], apiBase: string }> => {
  try {
    const res = await fetch(`${API_BASE}/domains`);
    const data = await res.json();
    const domains = data['hydra:member'].map((d: any) => d.domain);
    return { domains: domains, apiBase: 'mail_tm' };
  } catch (error) {
    return { domains: ["karenkey.com"], apiBase: 'mail_tm' };
  }
};

// 2. Kullanıcı Girişi (Login)
export const loginUser = async (address: string, password: string): Promise<Mailbox> => {
  const res = await fetch(`${API_BASE}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address, password })
  });
  if (!res.ok) throw new Error("Giriş başarısız. Bilgileri kontrol edin.");
  const data = await res.json();
  return {
    id: data.id || address,
    address: address,
    apiBase: 'mail_tm',
    token: data.token,
    password: password
  };
};

// 3. Kullanıcı Kaydı (Register - Gerçek Email Mantığı)
export const registerUser = async (address: string, password: string): Promise<Mailbox> => {
  const accRes = await fetch(`${API_BASE}/accounts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address, password })
  });
  if (!accRes.ok) {
    const errData = await accRes.json();
    throw new Error(errData['hydra:description'] || "Bu kullanıcı adı zaten alınmış veya geçersiz.");
  }
  // Kayıt sonrası otomatik login
  return await loginUser(address, password);
};

// 4. Rastgele Hızlı Hesap (Demo için durabilir)
export const generateMailbox = async (): Promise<Mailbox> => {
  const domainData = await fetchDomains();
  const domain = domainData.domains[0] || "karenkey.com";
  const username = Math.random().toString(36).substring(2, 12);
  const address = `${username}@${domain}`;
  const password = generatePassword();
  return await registerUser(address, password);
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
      from: { address: msg.from.address, name: msg.from.name || msg.from.address.split('@')[0] },
      subject: msg.subject,
      intro: msg.intro || "Mesaj içeriği yok",
      seen: msg.seen,
      createdAt: msg.createdAt,
      aiCategory: determineCategory(msg.subject, msg.from.address, msg.intro || "")
    }));
  } catch { return []; }
};

export const getMessageDetail = async (mailbox: Mailbox, messageId: string): Promise<EmailDetail | null> => {
  if (!mailbox.token) return null;
  const res = await fetch(`${API_BASE}/messages/${messageId}`, {
    headers: { "Authorization": `Bearer ${mailbox.token}` }
  });
  if (!res.ok) return null;
  const msg = await res.json();
  return {
    ...msg,
    from: { address: msg.from.address, name: msg.from.name || msg.from.address },
    aiCategory: determineCategory(msg.subject, msg.from.address, msg.intro),
    html: msg.html ? [msg.html] : []
  };
};

export const deleteMessage = async (mailbox: Mailbox, messageId: string): Promise<boolean> => {
  if (!mailbox.token) return false;
  const res = await fetch(`${API_BASE}/messages/${messageId}`, {
    method: "DELETE",
    headers: { "Authorization": `Bearer ${mailbox.token}` }
  });
  return res.ok;
};