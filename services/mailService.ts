import { Mailbox, EmailSummary, EmailDetail, AICategory } from '../types';

// HEDEF: Guerrilla Mail (Sharklasers)
const API_BASE = "https://api.guerrillamail.com/ajax.php";

// PROXY LİSTESİ (Sırayla dener - CORS engeli için)
const PROXIES = [
  "https://api.codetabs.com/v1/proxy?quest=",    
  "https://thingproxy.freeboard.io/fetch/",      
  "https://api.allorigins.win/raw?url="          
];

const STORAGE_KEY = "mephisto_final_fix";
const CACHE_KEY = (id: string) => `final_cache_v3:${id}`;

interface SharkSession {
  sid_token: string;
  email_addr: string;
  alias: string;
}

// --- YARDIMCI: HTML Entity Temizleyici (YENİ EKLENDİ) ---
// Örnek: "iPhone&rsquo;umdan" -> "iPhone'umdan" yapar.
const decodeHtmlEntities = (text: string) => {
  if (!text) return "";
  const textArea = document.createElement('textarea');
  textArea.innerHTML = text;
  return textArea.value;
};

// --- YARDIMCI: HTML İçerik Temizleyici ---
const cleanEmailHtml = (html: string): string => {
  if (!html) return "";
  // 1. Bozuk resim linklerini onar
  // 2. HTTP linkleri HTTPS yap (Mixed content hatası olmasın)
  return html
    .replace(
      /(src=["'])(.*?res\.php.*?q=)(.*?)(["'])/g, 
      (match, prefix, junk, encodedUrl, suffix) => {
        try {
          return prefix + decodeURIComponent(encodedUrl) + suffix;
        } catch {
          return match;
        }
      }
    )
    .replace(/http:\/\//g, 'https://'); 
};

// --- YARDIMCI: Akıllı İstek (TIMEOUT KORUMALI) ---
async function smartFetch(params: string): Promise<any> {
  const targetUrl = `${API_BASE}?${params}`;
  
  for (const proxy of PROXIES) {
    try {
      const finalUrl = `${proxy}${encodeURIComponent(targetUrl)}`;
      
      // 5 Saniye içinde yanıt gelmezse işlemi iptal et (Site donmasın)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const res = await fetch(finalUrl, { 
        signal: controller.signal 
      });
      
      clearTimeout(timeoutId); // İşlem başarılı, sayacı durdur

      if (!res.ok) continue;
      
      const data = await res.json();
      return data;
    } catch (error) {
      continue; // Hata alırsan diğer proxy'i dene
    }
  }
  return null;
}

const determineCategory = (subject: string, from: string, intro: string): AICategory => {
  const text = `${subject} ${from} ${intro}`.toLowerCase();
  if (/(code|verify|verification|otp|confirm|activation|pin\b|doğrulama|kod|şifre)/.test(text)) return 'Verification';
  if (/(security|alert|reset password|suspicious|login attempt|güvenlik|giriş)/.test(text)) return 'Security';
  if (/(newsletter|bülten|weekly|digest|fırsat|indirim)/.test(text)) return 'Newsletter';
  return 'Other';
};

// --- ANA FONKSİYONLAR ---

// 1. Hesap Oluştur
export const generateMailbox = async (): Promise<Mailbox> => {
  try {
    const data = await smartFetch("f=get_email_address");
    
    if (!data || !data.email_addr) {
        const fake = `loading_${Math.floor(Math.random() * 1000)}@sharklasers.com`;
        return { id: fake, address: fake, apiBase: 'shark_final' };
    }

    const session: SharkSession = {
      sid_token: data.sid_token,
      email_addr: data.email_addr,
      alias: data.alias
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));

    return {
      id: data.email_addr,
      address: data.email_addr,
      apiBase: 'shark_final'
    };
  } catch {
    const fake = `connection_err@sharklasers.com`;
    return { id: fake, address: fake, apiBase: 'shark_final' };
  }
};

// 2. Custom Hesap
export const createCustomMailbox = async (username: string, domain: string, apiBase: string): Promise<Mailbox> => {
  const initData = await smartFetch("f=get_email_address");
  
  if (initData && initData.sid_token) {
    await smartFetch(`f=set_email_user&email_user=${username}&lang=en&sid_token=${initData.sid_token}&site=${domain}`);
    
    const session = {
      sid_token: initData.sid_token,
      email_addr: `${username}@${domain}`,
      alias: username
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    localStorage.setItem(CACHE_KEY(session.email_addr), JSON.stringify([]));

    return {
      id: session.email_addr,
      address: session.email_addr,
      apiBase: 'shark_final'
    };
  }
  return generateMailbox();
};

// 3. Mesajları Getir (DÜZELTİLDİ: Türkçe Karakter Sorunu Giderildi)
export const getMessages = async (mailbox: Mailbox): Promise<EmailSummary[] | null> => {
  const rawSession = localStorage.getItem(STORAGE_KEY);
  if (!rawSession) return [];
  const session = JSON.parse(rawSession);

  if (session.email_addr !== mailbox.address) return [];

  const data = await smartFetch(`f=get_email_list&offset=0&sid_token=${session.sid_token}`);

  if (!data || !data.list) {
    const cached = localStorage.getItem(CACHE_KEY(session.email_addr));
    return cached ? JSON.parse(cached) : [];
  }

  const newEmails = data.list.map((msg: any) => ({
    id: String(msg.mail_id),
    from: { 
      address: msg.mail_from, 
      name: msg.mail_from.split('<')[0].replace(/"/g, '').trim() 
    },
    subject: msg.mail_subject,
    // BURASI DÜZELTİLDİ: decodeHtmlEntities kullanıldı
    intro: decodeHtmlEntities(msg.mail_excerpt),
    seen: msg.mail_read === "1",
    createdAt: new Date(parseInt(msg.mail_timestamp) * 1000).toISOString(),
    aiCategory: determineCategory(msg.mail_subject, msg.mail_from, msg.mail_excerpt)
  }));

  localStorage.setItem(CACHE_KEY(session.email_addr), JSON.stringify(newEmails));
  return newEmails;
};

// 4. Mesaj Detayı
export const getMessageDetail = async (mailbox: Mailbox, messageId: string): Promise<EmailDetail | null> => {
  const rawSession = localStorage.getItem(STORAGE_KEY);
  if (!rawSession) return null;
  const session = JSON.parse(rawSession);

  const msg = await smartFetch(`f=fetch_email&email_id=${messageId}&sid_token=${session.sid_token}`);

  if (!msg) return null;

  const cleanBody = cleanEmailHtml(msg.mail_body);

  return {
    id: String(msg.mail_id),
    from: { address: msg.mail_from, name: msg.mail_from },
    subject: msg.mail_subject,
    intro: decodeHtmlEntities(msg.mail_excerpt), // Detayda da düzgün görünsün
    seen: true,
    createdAt: new Date(parseInt(msg.mail_timestamp) * 1000).toISOString(),
    aiCategory: determineCategory(msg.mail_subject, msg.mail_from, ''),
    text: msg.mail_body,
    html: [cleanBody],
    hasAttachments: false,
    attachments: []
  };
};

// 5. Silme
export const deleteMessage = async (mailbox: Mailbox, messageId: string): Promise<boolean> => {
  const rawSession = localStorage.getItem(STORAGE_KEY);
  if (rawSession) {
    const session = JSON.parse(rawSession);
    await smartFetch(`f=del_email&email_ids[]=${messageId}&sid_token=${session.sid_token}`);
  }
  return true;
};

// 6. Domain Listesi
export const fetchDomains = async (): Promise<{ domains: string[], apiBase: string }> => {
  return { 
    domains: ["sharklasers.com", "guerrillamail.com", "guerrillamail.info", "grr.la"], 
    apiBase: 'shark_final' 
  };
};
