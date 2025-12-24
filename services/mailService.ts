import { Mailbox, EmailSummary, EmailDetail, AICategory } from '../types';

// HEDEF: Mail.tm (Stabil ve hızlı API)
const API_BASE = "https://api.mail.tm";

// Yardımcı: Rastgele Şifre Oluşturucu
const generatePassword = () => {
  return Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
};

// Yardımcı: Kategori Belirleme (Yapay Zeka Taklidi)
const determineCategory = (subject: string, from: string, intro: string): AICategory => {
  const text = `${subject} ${from} ${intro}`.toLowerCase();
  if (/(code|verify|verification|otp|confirm|activation|pin\b|doğrulama|kod|şifre)/.test(text)) return 'Verification';
  if (/(security|alert|reset password|suspicious|login attempt|güvenlik|giriş)/.test(text)) return 'Security';
  if (/(newsletter|bülten|weekly|digest|fırsat|indirim)/.test(text)) return 'Newsletter';
  return 'Other';
};

// --- ANA FONKSİYONLAR ---

// 1. Hesap Oluştur (Rastgele - "mephisto" ön eki kaldırıldı)
export const generateMailbox = async (): Promise<Mailbox> => {
  try {
    // Önce domainleri çek
    const domainData = await fetchDomains();
    const domain = domainData.domains[0] || "karenkey.com";
    
    // DEĞİŞİKLİK BURADA YAPILDI: Artık başında isim yok, tamamen rastgele.
    // 2. indeksten 12. indekse kadar alarak yaklaşık 10 karakterli random isim üretir.
    const username = Math.random().toString(36).substring(2, 12);
    
    const address = `${username}@${domain}`;
    const password = generatePassword();

    // Hesabı Kaydet
    await fetch(`${API_BASE}/accounts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address, password })
    });

    // Token Al (Giriş Yap)
    const tokenRes = await fetch(`${API_BASE}/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address, password })
    });
    
    const tokenData = await tokenRes.json();

    if (!tokenData.token) throw new Error("Token alınamadı");

    const newMailbox: Mailbox = {
      id: tokenData.id || address,
      address: address,
      apiBase: 'mail_tm',
      token: tokenData.token,
      password: password
    };

    return newMailbox;
  } catch (error) {
    console.error("Hesap oluşturma hatası:", error);
    // Hata durumunda fake bir veri dönelim
    return { id: 'error', address: 'error@connection.failed', apiBase: 'error' };
  }
};

// 2. Özel Hesap Oluştur (Custom)
export const createCustomMailbox = async (username: string, domain: string, apiBase: string): Promise<Mailbox> => {
  try {
    const address = `${username}@${domain}`;
    const password = generatePassword();

    // Hesabı oluşturmayı dene
    const accRes = await fetch(`${API_BASE}/accounts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address, password })
    });

    if (accRes.status === 422) {
       throw new Error("Bu kullanıcı adı zaten alınmış.");
    }

    // Token Al
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

// 3. Mesajları Getir
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

// 4. Mesaj Detayı
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

// 5. Silme
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

// 6. Domain Listesi (Canlı Çekiyoruz)
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