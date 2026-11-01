'use client';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { LANGUAGE_STORAGE_KEY, translate, type Language } from '@/lib/i18n';

type LanguageContextType = { language: Language; setLanguage: (language: Language) => void; t: (text:string) => string };
const LanguageContext = createContext<LanguageContextType | null>(null);

/** Declarative localization: React components own their text, no MutationObserver or DOM edits. */
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('uz');
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (stored === 'ru' || stored === 'en' || stored === 'uz') setLanguageState(stored);
    } catch { /* browser storage may be disabled */ }
  }, []);
  useEffect(() => {
    const syncLanguage = (event: StorageEvent) => {
      if (event.key !== LANGUAGE_STORAGE_KEY) return;
      const next = event.newValue;
      if (next === 'uz' || next === 'ru' || next === 'en') setLanguageState(next);
    };
    window.addEventListener('storage', syncLanguage);
    return () => window.removeEventListener('storage', syncLanguage);
  }, []);
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = 'ltr';
  }, [language]);
  const setLanguage = (next: Language) => {
    setLanguageState(next);
    try { window.localStorage.setItem(LANGUAGE_STORAGE_KEY, next); } catch {}
  };
  const value = useMemo(() => ({ language, setLanguage, t: (s: string) => translate(s, language) }), [language]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used inside LanguageProvider');
  return context;
}
