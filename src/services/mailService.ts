import { Mailbox, EmailSummary, EmailDetail, AICategory } from '../types';

const HYDRA_PROVIDERS: Record<string, string> = { mail_tm: 'https://api.mail.tm' };
const WORKER_API = 'https://quiet-poetry-1d74.msoqmibt.workers.dev';
const GUERRILLA_API = 'https://api.guerrillamail.com/ajax.php';

// Credentials are kept only in memory and are removed when a mailbox is deleted.
const credentialStore = new Map<string, { address: string; password: string }>();
export const storeCredentials = (mailboxId: string, address: string, password: string) => {
  if (!mailboxId || !address || !password) return;
  credentialStore.set(mailboxId, { address, password });
};
export const clearCredentials = (mailboxId: string) => { if (mailboxId) credentialStore.delete(mailboxId); };

type TokenRefreshCallback = (mailboxId: string, newToken: string) => void;
const tokenRefreshListeners = new Set<TokenRefreshCallback>();
export const onTokenRefresh = (cb: TokenRefreshCallback) => { tokenRefreshListeners.add(cb); return () => { tokenRefreshListeners.delete(cb); }; };
export const subscribeToMailboxEvents = (_mailbox: Mailbox, callback: () => void) => {
  if (typeof window === 'undefined') return () => {};
  const handler = () => { if (document.visibilityState !== 'hidden') callback(); };
  window.addEventListener('focus', handler);
  window.addEventListener('online', handler);
  return () => {
    window.removeEventListener('focus', handler);
    window.removeEventListener('online', handler);
  };
};
const emitTokenRefresh = (mailboxId: string, token: string) => { for (const cb of tokenRefreshListeners) { try { cb(mailboxId, token); } catch (err) { console.warn('Token refresh listener failed', err); } } };

const refreshHydraToken = async (provider: string, address: string, password: string): Promise<string | null> => {
  try {
    const apiBase = getApiBase(provider);
    const res = await fetch(`${apiBase}/token`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ address, password }) });
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data?.token === 'string' && data.token ? data.token : null;
  } catch { return null; }
};

const rateLimitState: Record<string, { hit: boolean; resetTime: number }> = {};
export const isRateLimited = (provider = 'mail_tm'): boolean => {
  const state = rateLimitState[provider];
  if (!state?.hit) return false;
  if (Date.now() >= state.resetTime) { state.hit = false; return false; }
  return true;
};
export const getRateLimitRemainingMs = (provider = 'mail_tm'): number => Math.max(0, (rateLimitState[provider]?.resetTime || 0) - Date.now());
const getApiBase = (provider: string): string => HYDRA_PROVIDERS[provider] || HYDRA_PROVIDERS.mail_tm;

const safeFetch = async (url: string, options?: RequestInit, provider = 'mail_tm', mailboxId?: string, retried = false): Promise<Response> => {
  if (isRateLimited(provider)) throw new Error(`Rate limited. Retry after ${Math.ceil(getRateLimitRemainingMs(provider) / 1000)}s`);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);
  let res: Response;
  try { res = await fetch(url, { ...options, signal: controller.signal }); } finally { clearTimeout(timeoutId); }

  if (res.status === 401 && !retried && mailboxId && !isGuerrilla(provider)) {
    const creds = credentialStore.get(mailboxId);
    if (creds) {
      const newToken = await refreshHydraToken(provider, creds.address, creds.password);
      if (newToken) {
        emitTokenRefresh(mailboxId, newToken);
        return safeFetch(url, { ...options, headers: { ...(options?.headers || {}), Authorization: `Bearer ${newToken}` } }, provider, mailboxId, true);
      }
    }
  }
  if (res.status === 429) {
    if (!rateLimitState[provider]) rateLimitState[provider] = { hit: false, resetTime: 0 };
    const retryAfter = Number.parseInt(res.headers.get('Retry-After') || '', 10);
    const waitMs = Number.isFinite(retryAfter) && retryAfter >= 0 ? Math.min(retryAfter * 1000, 300000) : 60000;
    rateLimitState[provider] = { hit: true, resetTime: Date.now() + waitMs };
    throw new Error(`Rate limit exceeded. Please wait ${Math.ceil(waitMs / 1000)} seconds.`);
  }
  return res;
};

const randomInt = (max: number): number => {
  if (!Number.isInteger(max) || max <= 0) return 0;
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const maxUint = 0x100000000;
    const limit = Math.floor(maxUint / max) * max;
    const buf = new Uint32Array(1);
    do { crypto.getRandomValues(buf); } while (buf[0] >= limit);
    return buf[0] % max;
  }
  return Date.now() % max;
};

const generatePassword = (): string => {
  if (typeof crypto === 'undefined' || typeof crypto.getRandomValues !== 'function') throw new Error('Secure random generator unavailable');
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*_-';
  const bytes = new Uint8Array(24); crypto.getRandomValues(bytes); let out = '';
  for (const b of bytes) out += alphabet[b % alphabet.length];
  return out;
};

const determineCategory = (subject: string, from: string, intro: string): AICategory => { const text = `${subject} ${from} ${intro}`.toLowerCase(); if (/(code|verify|verification|otp|confirm|activation|pin\b|doğrulama|kod|şifre)/.test(text)) return 'Verification'; if (/(security|alert|reset password|suspicious|login attempt|güvenlik|giriş|uyarı)/.test(text)) return 'Security'; if (/(newsletter|bülten|weekly|digest|fırsat|indirim|offer|sale)/.test(text)) return 'Newsletter'; return 'Other'; };
const formatSenderName = (fromAddress: string): string => { if (!fromAddress || fromAddress === 'unknown') return 'Bilinmeyen Gönderen'; const lower = fromAddress.toLowerCase(); const brands: Record<string,string> = { instagram:'Instagram',cloudflare:'Cloudflare',google:'Google',netflix:'Netflix',facebook:'Facebook',twitter:'X (Twitter)','x.com':'X (Twitter)',github:'GitHub',spotify:'Spotify',discord:'Discord',telegram:'Telegram',steam:'Steam',epicgames:'Epic Games',microsoft:'Microsoft',apple:'Apple' }; for (const [key,value] of Object.entries(brands)) if(lower.includes(key)) return value; const [userPart='',domainPart='']=fromAddress.split('@'); if(/^(no-reply|noreply|info|support|admin|service|notifications?|mailer-daemon)$/i.test(userPart)&&domainPart){const clean=domainPart.split('.')[0];return clean.charAt(0).toUpperCase()+clean.slice(1);} return userPart.charAt(0).toUpperCase()+userPart.slice(1); };
const formatSmartSubject = (subject: string, excerpt: string, fromAddress: string): string => { const clean=(subject||'').trim(); if(clean&&clean!=='(Konu Yok)'&&clean!=='Konu Yok') return clean; const combined=`${excerpt||''} ${fromAddress||''}`.toLowerCase(); if(combined.includes('instagram')) return 'Instagram Doğrulama Kodu'; if(combined.includes('cloudflare')) return 'Cloudflare E-posta Yönlendirme Onayı'; if(/code|kod|verify|confirm/.test(combined)) return 'E-posta Doğrulama Kodu'; if(/security|güvenlik/.test(combined)) return 'Güvenlik Bildirimi'; return excerpt?.trim()?excerpt.trim().slice(0,45)+(excerpt.length>45?'...':''):'Gelen Mesaj'; };
const isGuerrilla=(provider:string):boolean=>provider==='guerrilla';
export const GUERRILLA_DOMAINS=['guerrillamail.com','grr.la','sharklasers.com','guerrillamail.info','guerrillamailblock.com','guerrillamail.net','guerrillamail.biz','guerrillamail.de','pokemail.net','spam4.me'];
export const getGuerrillaDomains=async():Promise<string[]>=>{const domains=new Set<string>();try{const controller=new AbortController();const timeoutId=setTimeout(()=>controller.abort(),3500);const res=await fetch(`${GUERRILLA_API}?f=get_email_address&lang=en`,{signal:controller.signal}).catch(()=>null);clearTimeout(timeoutId);if(res?.ok){const data=await res.json().catch(()=>null);const domain=String(data?.email_addr||'').split('@')[1];if(domain)domains.add(domain);}}catch{}GUERRILLA_DOMAINS.forEach(d=>domains.add(d));return[...domains];};
const createGuerrillaMailbox=async(emailUser?:string,domainName?:string):Promise<Mailbox>=>{const res=await safeFetch(`${GUERRILLA_API}?f=get_email_address&lang=en`,undefined,'guerrilla');if(!res.ok)throw new Error(`Guerrilla Mail hesabı oluşturulamadı (HTTP ${res.status})`);const data=await res.json();const sid=typeof data?.sid_token==='string'?data.sid_token:'';if(!sid||typeof data?.email_addr!=='string')throw new Error('Geçersiz Guerrilla Mail oturumu');let user=data.email_addr.split('@')[0];const dom=domainName||data.email_addr.split('@')[1]||GUERRILLA_DOMAINS[0];const targetUser=emailUser||user;const setRes=await safeFetch(`${GUERRILLA_API}?f=set_email_user&email_user=${encodeURIComponent(targetUser)}&lang=en&sid_token=${encodeURIComponent(sid)}`,undefined,'guerrilla');if(setRes.ok){const setData=await setRes.json().catch(()=>null);if(typeof setData?.email_user==='string')user=setData.email_user;}return{id:sid,address:`${user}@${dom}`,apiBase:'guerrilla',token:sid,password:'',createdAt:Date.now()};};
const parseGuerrillaDate=(msg:any):string=>{const ts=Number(msg?.mail_timestamp);if(ts>0){const d=new Date(ts*1000);if(!isNaN(d.getTime()))return d.toISOString();}const d=new Date(msg?.mail_date||'');return!isNaN(d.getTime())?d.toISOString():new Date().toISOString();};
const decodeHTMLEntities=(text:string):string=>{if(!text)return'';if(typeof DOMParser!=='undefined'){try{return new DOMParser().parseFromString(text,'text/html').documentElement.textContent||text}catch{}}return text.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'\"').replace(/&#039;/g,"'");};

const getGuerrillaMessages=async(mailbox:Mailbox):Promise<EmailSummary[]>=>{let sid=mailbox.token;const username=mailbox.address?.split('@')[0]||'';if(!username)return[];try{if(!sid){const r=await safeFetch(`${GUERRILLA_API}?f=get_email_address&lang=en`,undefined,'guerrilla');if(!r.ok)return[];const d=await r.json();sid=d?.sid_token;if(!sid)return[];mailbox.token=sid;emitTokenRefresh(mailbox.id,sid);await safeFetch(`${GUERRILLA_API}?f=set_email_user&email_user=${encodeURIComponent(username)}&lang=en&sid_token=${encodeURIComponent(sid)}`,undefined,'guerrilla');}let res=await safeFetch(`${GUERRILLA_API}?f=get_email_list&offset=0&sid_token=${encodeURIComponent(sid)}`,undefined,'guerrilla');let data:any=res.ok?await res.json().catch(()=>null):null;if(!res.ok||!data||data.error_codes||!Array.isArray(data.list)){const renew=await safeFetch(`${GUERRILLA_API}?f=get_email_address&lang=en`,undefined,'guerrilla');if(renew.ok){const rd=await renew.json().catch(()=>null);if(rd?.sid_token){sid=rd.sid_token;mailbox.token=sid;emitTokenRefresh(mailbox.id,sid);await safeFetch(`${GUERRILLA_API}?f=set_email_user&email_user=${encodeURIComponent(username)}&lang=en&sid_token=${encodeURIComponent(sid)}`,undefined,'guerrilla');res=await safeFetch(`${GUERRILLA_API}?f=get_email_list&offset=0&sid_token=${encodeURIComponent(sid)}`,undefined,'guerrilla');data=res.ok?await res.json().catch(()=>null):null;}}}const seen=new Set<string>();const list=(Array.isArray(data?.list)?data.list:[]).filter((msg:any)=>{const id=String(msg?.mail_id||'');if(!id||seen.has(id))return false;seen.add(id);return!(String(msg?.mail_from||'').toLowerCase().includes('guerrillamail')&&String(msg?.mail_subject||'').toLowerCase().includes('welcome'));});return list.map((msg:any)=>{const fromAddr=String(msg.mail_from||'unknown');const subject=formatSmartSubject(decodeHTMLEntities(String(msg.mail_subject||'')),decodeHTMLEntities(String(msg.mail_excerpt||'')),fromAddr);const intro=decodeHTMLEntities(String(msg.mail_excerpt||''));return{id:String(msg.mail_id),from:{address:fromAddr,name:formatSenderName(fromAddr)},subject,intro:intro||'Görüntülenecek önizleme yok',seen:msg.mail_read===1,createdAt:parseGuerrillaDate(msg),aiCategory:determineCategory(subject,fromAddr,intro)};});}catch{return[];}};
const getGuerrillaMessageDetail=async(mailbox:Mailbox,messageId:string):Promise<EmailDetail|null>=>{const sid=mailbox.token;if(!sid||!messageId)return null;try{const res=await safeFetch(`${GUERRILLA_API}?f=fetch_email&email_id=${encodeURIComponent(messageId)}&sid_token=${encodeURIComponent(sid)}`,undefined,'guerrilla');if(!res.ok)return null;const msg=await res.json();if(!msg?.mail_id)return null;const subject=decodeHTMLEntities(String(msg.mail_subject||''));const intro=decodeHTMLEntities(String(msg.mail_excerpt||''));const fromAddr=typeof msg.mail_from==='string'?msg.mail_from:'unknown';return{id:String(msg.mail_id),from:{address:fromAddr,name:fromAddr.split('@')[0]||'unknown'},subject,intro,seen:true,createdAt:parseGuerrillaDate(msg),aiCategory:determineCategory(subject,fromAddr,intro),html:msg.mail_body?[String(msg.mail_body)]:[],hasAttachments:false,attachments:[]};}catch{return null;}};
const deleteGuerrillaMessage=async(mailbox:Mailbox,messageId:string):Promise<boolean>=>{const sid=mailbox.token;if(!sid||!messageId)return false;try{const res=await safeFetch(`${GUERRILLA_API}?f=del_email&email_ids[]=${encodeURIComponent(messageId)}&sid_token=${encodeURIComponent(sid)}`,undefined,'guerrilla');return res.ok;}catch{return false;}};

let cachedDomains:{domains:string[];domainProviderMap:Record<string,string>;apiBase:string}|null=null;let isFetchingDomains=false;
export const fetchDomains=async()=>{if(cachedDomains?.domains.length)return cachedDomains;if(isFetchingDomains){return new Promise<any>(resolve=>{const started=Date.now();const i=setInterval(()=>{if(cachedDomains||Date.now()-started>5000){clearInterval(i);resolve(cachedDomains||{domains:GUERRILLA_DOMAINS,domainProviderMap:Object.fromEntries(GUERRILLA_DOMAINS.map(d=>[d,'guerrilla'])),apiBase:'guerrilla'});}},100);});}isFetchingDomains=true;try{const domains=await getGuerrillaDomains();const map:Record<string,string>={};domains.forEach(d=>{map[d]='guerrilla';});cachedDomains={domains,domainProviderMap:map,apiBase:'guerrilla'};return cachedDomains;}finally{isFetchingDomains=false;}};
export const generateMailbox=async():Promise<Mailbox>=>{const{domains,domainProviderMap}=await fetchDomains();const list=domains.filter(d=>d!=='mephistomail.site');const domainList=list.length?list:GUERRILLA_DOMAINS;const domain=domainList[randomInt(domainList.length)];const provider=domainProviderMap[domain]||'guerrilla';const prefixes=['matrix','vector','nexus','shadow','cyber','phantom','ninja','alpha','delta','vortex','hyper','pulse','signal','crypto'];const prefix=prefixes[randomInt(prefixes.length)];const suffix=randomInt(900)+100;const randomUser=`${prefix}.${Date.now().toString(36).slice(-5)}${suffix}`;if(isGuerrilla(provider))return createGuerrillaMailbox(randomUser,domain);const cleanUser=randomUser.toLowerCase().trim().replace(/[^a-z0-9._-]/g,'');const address=`${cleanUser}@${domain}`;const password=generatePassword();const apiBase=getApiBase(provider);const accRes=await safeFetch(`${apiBase}/accounts`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({address,password})},provider);if(!accRes.ok)throw new Error(`Hesap oluşturulamadı (HTTP ${accRes.status})`);const tokenRes=await safeFetch(`${apiBase}/token`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({address,password})},provider);if(!tokenRes.ok)throw new Error(`Token alınamadı (HTTP ${tokenRes.status})`);const tokenData=await tokenRes.json();return{id:tokenData.id||address,address,apiBase:provider,token:tokenData.token,password,createdAt:Date.now()};};

export const createCustomMailbox=async(username:string,domain:string,provider:string):Promise<Mailbox>=>{if(!/^[a-zA-Z0-9._-]{1,64}$/.test(username)||!/^[a-zA-Z0-9.-]{1,253}$/.test(domain)||domain.startsWith('.')||domain.endsWith('.'))throw new Error('Geçersiz e-posta adresi');if(isGuerrilla(provider))return createGuerrillaMailbox(username,domain);const apiBase=getApiBase(provider);const cleanUser=username.toLowerCase().trim().replace(/[^a-z0-9._-]/g,'');const address=`${cleanUser}@${domain.toLowerCase()}`;const password=generatePassword();const accRes=await safeFetch(`${apiBase}/accounts`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({address,password})},provider);if(accRes.status===422)throw new Error('Bu kullanıcı adı zaten alınmış.');if(!accRes.ok)throw new Error(`Hesap oluşturulamadı (HTTP ${accRes.status})`);const tokenRes=await safeFetch(`${apiBase}/token`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({address,password})},provider);if(!tokenRes.ok)throw new Error(`Token alınamadı (HTTP ${tokenRes.status})`);const tokenData=await tokenRes.json();return{id:tokenData.id||address,address,apiBase:provider,token:tokenData.token,password};};
export const getMessages=async(mailbox:Mailbox):Promise<EmailSummary[]>=>mailbox.token&&isGuerrilla(mailbox.apiBase)?getGuerrillaMessages(mailbox):[];
export const getMessageDetail=async(mailbox:Mailbox,messageId:string):Promise<EmailDetail|null>=>{if(!mailbox.token||!messageId)return null;if(isGuerrilla(mailbox.apiBase))return getGuerrillaMessageDetail(mailbox,messageId);const apiBase=getApiBase(mailbox.apiBase);const res=await safeFetch(`${apiBase}/messages/${encodeURIComponent(messageId)}`,{headers:{Authorization:`Bearer ${mailbox.token}`}},mailbox.apiBase,mailbox.id);if(!res.ok)return null;const msg=await res.json();const headerFields:Record<string,string>={From:msg.from?.address||'unknown',Subject:msg.subject||'',Date:msg.createdAt||''};if(msg.to?.length)headerFields.To=msg.to.map((t:any)=>t.address).join(', ');if(msg.cc?.length)headerFields.Cc=msg.cc.map((c:any)=>c.address).join(', ');if(msg.msgid)headerFields['Message-ID']=msg.msgid;if(msg.size)headerFields.Size=`${msg.size} bytes`;return{id:msg.id,from:{address:msg.from?.address||'unknown',name:msg.from?.name||msg.from?.address||'unknown'},subject:msg.subject||'',intro:msg.intro||'',seen:true,createdAt:msg.createdAt,aiCategory:determineCategory(msg.subject||'',msg.from?.address||'',msg.intro||''),html:msg.html?[msg.html]:[],text:msg.text,hasAttachments:Array.isArray(msg.attachments)&&msg.attachments.length>0,attachments:Array.isArray(msg.attachments)?msg.attachments.map((a:any)=>({id:a.id,filename:a.filename||a.name||'attachment',size:a.size||0,contentType:a.contentType||'application/octet-stream'})):[],headerFields};};
export const deleteMessage=async(mailbox:Mailbox,messageId:string):Promise<boolean>=>{if(!mailbox.token||!messageId)return false;if(isGuerrilla(mailbox.apiBase))return deleteGuerrillaMessage(mailbox,messageId);const apiBase=getApiBase(mailbox.apiBase);try{const res=await safeFetch(`${apiBase}/messages/${encodeURIComponent(messageId)}`,{method:'DELETE',headers:{Authorization:`Bearer ${mailbox.token}`}},mailbox.apiBase,mailbox.id);return res.ok;}catch{return false;}};
export const deleteAllMessages=async(mailbox:Mailbox):Promise<boolean>=>{const messages=await getMessages(mailbox);const results=await Promise.allSettled(messages.map(m=>deleteMessage(mailbox,m.id)));return results.every(r=>r.status==='fulfilled'&&r.value===true);};
export const sendEmail=async(_mailbox:Mailbox,_data?:any):Promise<boolean>=>false;
export const markMessageRead=async(mailbox:Mailbox,messageId:string):Promise<boolean>=>{if(!mailbox.token||!messageId)return false;if(isGuerrilla(mailbox.apiBase))return true;const apiBase=getApiBase(mailbox.apiBase);try{const res=await safeFetch(`${apiBase}/messages/${encodeURIComponent(messageId)}`,{method:'PATCH',headers:{Authorization:`Bearer ${mailbox.token}`,'Content-Type':'application/json'},body:JSON.stringify({isRead:true})},mailbox.apiBase,mailbox.id);return res.ok}catch{return false;}};
export const getAttachment=async(_mailbox:Mailbox,_messageId:string,_attachmentId:string):Promise<Blob|null>=>null;
export const analyzeEmailAI=async(subject:string,from:string,intro:string):Promise<AICategory>=>determineCategory(subject,from,intro);
export const getProviderInfo=(_provider:string)=>({name:'Guerrilla Mail',icon:'⚡',color:'#f59e0b',apiBase:GUERRILLA_API});
export const getWorkerStats=async()=>{try{const r=await fetch(`${WORKER_API}/api/stats`);return r.ok?await r.json():null}catch{return null;}};
