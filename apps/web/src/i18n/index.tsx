import React, { createContext, useContext, useState, useEffect } from 'react';
import enLang from './en/lang.json';
import faLang from './fa/lang.json';

export type Language = 'en' | 'fa';
export type Direction = 'ltr' | 'rtl';

const translations: Record<Language, any> = {
  en: enLang,
  fa: faLang,
};

interface I18nContextType {
  language: Language;
  direction: Direction;
  setLanguage: (lang: Language) => void;
  t: (keyPath: string) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('ledgerly_lang') as Language) || 'en';
  });

  const direction: Direction = language === 'fa' ? 'rtl' : 'ltr';

  useEffect(() => {
    localStorage.setItem('ledgerly_lang', language);
    document.documentElement.dir = direction;
    document.documentElement.lang = language;
  }, [language, direction]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (keyPath: string): string => {
    const keys = keyPath.split('.');
    let current = translations[language];
    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k];
      } else {
        return keyPath;
      }
    }
    return typeof current === 'string' ? current : keyPath;
  };

  return (
    <I18nContext.Provider value={{ language, direction, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = (): I18nContextType => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
};
