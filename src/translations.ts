import { en } from './locales/en';
import { tr } from './locales/tr';
import { es } from './locales/es';
import { de } from './locales/de';
import { fr } from './locales/fr';
import { it } from './locales/it';
import { pt } from './locales/pt';
import { ru } from './locales/ru';
import { ar } from './locales/ar';

export type Language = 'en' | 'tr' | 'es' | 'de' | 'fr' | 'it' | 'pt' | 'ru' | 'ar';
export type TranslationSchema = typeof en;
export const fallbackTranslations = en;

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
};