import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, TranslationSchema, fallbackTranslations } from '../translations';

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: TranslationSchema;
  loading: boolean;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

const translationCache: Partial<Record<Language, TranslationSchema>> = {
  en: fallbackTranslations,
};

const SUPPORTED_LANGUAGES: Language[] = ['en', 'tr', 'es', 'de', 'fr', 'it', 'pt', 'ru', 'ar'];

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>(() => {
    // URL yolunu kontrol et (Örn: /tr/blog -> tr)
    const pathSegments = window.location.pathname.split('/');
    const firstSegment = pathSegments[1];
    if (SUPPORTED_LANGUAGES.includes(firstSegment as Language) && firstSegment !== 'en') {
      return firstSegment as Language;
    }

    const saved = localStorage.getItem('mephisto_lang');
    if (saved && SUPPORTED_LANGUAGES.includes(saved as Language)) return saved as Language;
    const bl = navigator.language.toLowerCase();
    for (const l of SUPPORTED_LANGUAGES) {
      if (l !== 'en' && bl.startsWith(l)) return l;
    }
    return 'en';
  });

  const [t, setT] = useState<TranslationSchema>(translationCache[lang] || fallbackTranslations);
  const [loading, setLoading] = useState(!translationCache[lang]);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem('mephisto_lang', newLang);
    
    // URL yolunu güncelle
    const pathname = window.location.pathname;
    const pathSegments = pathname.split('/');
    const firstSegment = pathSegments[1];
    const isLangSegment = SUPPORTED_LANGUAGES.includes(firstSegment as Language) && firstSegment !== 'en';
    
    let newPathname = pathname;
    if (newLang === 'en') {
      if (isLangSegment) {
        newPathname = '/' + pathSegments.slice(2).join('/');
      }
    } else {
      if (isLangSegment) {
        pathSegments[1] = newLang;
        newPathname = pathSegments.join('/');
      } else {
        newPathname = `/${newLang}${pathname === '/' ? '' : pathname}`;
      }
    }
    
    if (newPathname !== pathname) {
      window.history.pushState({}, '', newPathname + window.location.search + window.location.hash);
    }
    
    window.dispatchEvent(new Event('mephisto-lang-change'));
  };

  useEffect(() => {
    if (translationCache[lang]) {
      setT(translationCache[lang]!);
      setLoading(false);
      return;
    }

    setLoading(true);
    let active = true;

    const loadTranslation = async () => {
      switch (lang) {
        case 'tr':
          return { ...fallbackTranslations, ...(await import('../locales/tr')).tr };
        case 'es':
          return { ...fallbackTranslations, ...(await import('../locales/es')).es };
        case 'de':
          return { ...fallbackTranslations, ...(await import('../locales/de')).de };
        case 'fr':
          return { ...fallbackTranslations, ...(await import('../locales/fr')).fr };
        case 'it':
          return { ...fallbackTranslations, ...(await import('../locales/it')).it };
        case 'pt':
          return { ...fallbackTranslations, ...(await import('../locales/pt')).pt };
        case 'ru':
          return { ...fallbackTranslations, ...(await import('../locales/ru')).ru };
        case 'ar':
          return { ...fallbackTranslations, ...(await import('../locales/ar')).ar };
        default:
          return fallbackTranslations;
      }
    };

    loadTranslation()
      .then((data) => {
        translationCache[lang] = data;
        if (active) {
          setT(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error(`Failed to load translation for language: ${lang}`, err);
        if (active) {
          setT(fallbackTranslations);
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [lang]);

  useEffect(() => {
    const handlePopState = () => {
      const pathSegments = window.location.pathname.split('/');
      const firstSegment = pathSegments[1];
      const urlLang = (SUPPORTED_LANGUAGES.includes(firstSegment as Language) && firstSegment !== 'en') ? (firstSegment as Language) : 'en';
      if (urlLang !== lang) {
        setLangState(urlLang);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, loading }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};
