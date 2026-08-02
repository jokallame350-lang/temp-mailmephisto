import { en } from './locales/en';
import { tr } from './locales/tr';
import { es } from './locales/es';
import { de } from './locales/de';
import { fr } from './locales/fr';
import { it } from './locales/it';
import { pt } from './locales/pt';
import { ru } from './locales/ru';
import { ar } from './locales/ar';

export type Language = 
  | 'en' | 'tr' | 'es' | 'de' | 'fr' | 'it' | 'pt' | 'ru' | 'ar'
  | 'ja' | 'ko' | 'zh' | 'hi' | 'nl' | 'pl' | 'sv' | 'no' | 'da'
  | 'fi' | 'el' | 'cs' | 'hu' | 'ro' | 'uk' | 'vi' | 'th' | 'id'
  | 'ms' | 'he';

export interface LanguageMeta {
  code: Language;
  name: string;
  nativeName: string;
  flag: string;
  dir?: 'ltr' | 'rtl';
}

export const LANGUAGES: LanguageMeta[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', dir: 'rtl' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', flag: '🇵🇱' },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska', flag: '🇸🇪' },
  { code: 'no', name: 'Norwegian', nativeName: 'Norsk', flag: '🇳🇴' },
  { code: 'da', name: 'Danish', nativeName: 'Dansk', flag: '🇩🇰' },
  { code: 'fi', name: 'Finnish', nativeName: 'Suomi', flag: '🇫🇮' },
  { code: 'el', name: 'Greek', nativeName: 'Ελληνικά', flag: '🇬🇷' },
  { code: 'cs', name: 'Czech', nativeName: 'Čeština', flag: '🇨🇿' },
  { code: 'hu', name: 'Hungarian', nativeName: 'Magyar', flag: '🇭🇺' },
  { code: 'ro', name: 'Romanian', nativeName: 'Română', flag: '🇷🇴' },
  { code: 'uk', name: 'Ukrainian', nativeName: 'Українська', flag: '🇺🇦' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย', flag: '🇹🇭' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu', flag: '🇲🇾' },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית', flag: '🇮🇱', dir: 'rtl' },
];

export const translations = {
  en,
  tr,
  es: { ...en, ...es },
  de: { ...en, ...de },
  fr: { ...en, ...fr },
  it: { ...en, ...it },
  pt: { ...en, ...pt },
  ru: { ...en, ...ru },
  ar: { ...en, ...ar },
  ja: { ...en, copy: 'コピー', refresh: '更新', change: '変更', delete: '削除', heroTitle: '使い捨てメールアドレス', heroSubtitle: 'ワンクリックで完全匿名', inbox: '受信トレイ', awaitingSignal: 'メールを待機中...' },
  ko: { ...en, copy: '복사', refresh: '새로고침', change: '변경', delete: '삭제', heroTitle: '일회용 임시 이메일', heroSubtitle: '원클릭 익명 보장', inbox: '수신함', awaitingSignal: '이메일 대기 중...' },
  zh: { ...en, copy: '复制', refresh: '刷新', change: '更改', delete: '删除', heroTitle: '一次性临时邮箱', heroSubtitle: '一键完全匿名', inbox: '收件箱', awaitingSignal: '等待邮件中...' },
  hi: { ...en, copy: 'कॉपी करें', refresh: 'रिफ्रेश', change: 'बदलें', delete: 'हटाएं', heroTitle: 'अस्थायी डिस्पोजेबल ईमेल', heroSubtitle: 'एक क्लिक में गुमनाम', inbox: 'इनबॉक्स', awaitingSignal: 'ईमेल की प्रतीक्षा जारी...' },
  nl: { ...en, copy: 'Kopiëren', refresh: 'Vernieuwen', change: 'Wijzigen', delete: 'Verwijderen', heroTitle: 'Tijdelijk E-mailadres', heroSubtitle: 'Anoniem met 1 Klik', inbox: 'Postvak IN', awaitingSignal: 'Wachten op berichten...' },
  pl: { ...en, copy: 'Kopiuj', refresh: 'Odśwież', change: 'Zmień', delete: 'Usuń', heroTitle: 'Tymczasowy Adres E-mail', heroSubtitle: 'Anonimowy za 1 Kliknięciem', inbox: 'Skrzynka odbiorcza', awaitingSignal: 'Oczekiwanie na wiadomości...' },
  sv: { ...en, copy: 'Kopiera', refresh: 'Uppdatera', change: 'Ändra', delete: 'Radera', heroTitle: 'Tillfällig E-postadress', heroSubtitle: 'Anonym med 1 Klick', inbox: 'Inbox', awaitingSignal: 'Väntar på meddelanden...' },
  no: { ...en, copy: 'Kopier', refresh: 'Oppdater', change: 'Endre', delete: 'Slett', heroTitle: 'Midlertidig E-postadresse', heroSubtitle: 'Anonym med 1 Klikk', inbox: 'Innboks', awaitingSignal: 'Venter på e-post...' },
  da: { ...en, copy: 'Kopier', refresh: 'Opdater', change: 'Skift', delete: 'Slet', heroTitle: 'Midlertidig E-mailadresse', heroSubtitle: 'Anonym med 1 Klik', inbox: 'Indbakke', awaitingSignal: 'Venter på e-mail...' },
  fi: { ...en, copy: 'Kopioi', refresh: 'Päivitä', change: 'Vaihda', delete: 'Poista', heroTitle: 'Väliaikainen Sähköposti', heroSubtitle: 'Nimetön Yhdellä Klikkauksella', inbox: 'Saapuneet', awaitingSignal: 'Odotetaan viestejä...' },
  el: { ...en, copy: 'Αντιγραφή', refresh: 'Ανανέωση', change: 'Αλλαγή', delete: 'Διαγραφή', heroTitle: 'Προσωρινό Email', heroSubtitle: 'Ανώνυμο με 1 Κλικ', inbox: 'Εισερχόμενα', awaitingSignal: 'Αναμονή για emails...' },
  cs: { ...en, copy: 'Kopírovat', refresh: 'Obnovit', change: 'Změnit', delete: 'Smazat', heroTitle: 'Dočasný E-mail', heroSubtitle: 'Anonymní na 1 Kliknutí', inbox: 'Doručená pošta', awaitingSignal: 'Čekání na zprávy...' },
  hu: { ...en, copy: 'Másolás', refresh: 'Frissítés', change: 'Módosítás', delete: 'Törlés', heroTitle: 'Ideiglenes E-mail Cím', heroSubtitle: 'Névtelen 1 Kattintással', inbox: 'Bejövő fiók', awaitingSignal: 'Üzenetekre várva...' },
  ro: { ...en, copy: 'Copiază', refresh: 'Reîmprospătează', change: 'Schimbă', delete: 'Șterge', heroTitle: 'E-mail Temporar', heroSubtitle: 'Anonim cu 1 Click', inbox: 'Mesaje primite', awaitingSignal: 'Se așteaptă mesaje...' },
  uk: { ...en, copy: 'Копіювати', refresh: 'Оновити', change: 'Змінити', delete: 'Видалити', heroTitle: 'Тимчасова Електронна Пошта', heroSubtitle: 'Анонімно в 1 Клік', inbox: 'Вхідні', awaitingSignal: 'Очікування листів...' },
  vi: { ...en, copy: 'Sao chép', refresh: 'Làm mới', change: 'Thay đổi', delete: 'Xóa', heroTitle: 'Email Tạm Thời Tức Thì', heroSubtitle: 'Ẩn Danh Chỉ 1 Cú Nhấp', inbox: 'Hộp thư đến', awaitingSignal: 'Đang chờ thư đến...' },
  th: { ...en, copy: 'คัดลอก', refresh: 'รีเฟรช', change: 'เปลี่ยน', delete: 'ลบ', heroTitle: 'อีเมลชั่วคราว', heroSubtitle: 'นิรนามด้วย 1 คลิก', inbox: 'กล่องขาเข้า', awaitingSignal: 'กำลังรออีเมล...' },
  id: { ...en, copy: 'Salin', refresh: 'Muat Ulang', change: 'Ubah', delete: 'Hapus', heroTitle: 'Email Sementara Gratis', heroSubtitle: 'Anonim dalam 1 Klik', inbox: 'Kotak Masuk', awaitingSignal: 'Menunggu pesan...' },
  ms: { ...en, copy: 'Salin', refresh: 'Muat Semula', change: 'Tukar', delete: 'Padam', heroTitle: 'E-mel Sementara', heroSubtitle: 'Anonim dalam 1 Klik', inbox: 'Peti Masuk', awaitingSignal: 'Menunggu mesej...' },
  he: { ...en, copy: 'העתק', refresh: 'רענן', change: 'שנה', delete: 'מחק', heroTitle: 'דוא"ל זמני אנונימי', heroSubtitle: 'אנונימי בלחיצה אחת', inbox: 'דואר נכנס', awaitingSignal: 'ממתין להודעות...' },
};