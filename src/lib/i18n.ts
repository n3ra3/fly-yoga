import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import ru from '@/i18n/locales/ru/translation.json'
import ro from '@/i18n/locales/ro/translation.json'
import en from '@/i18n/locales/en/translation.json'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ru: { translation: ru },
      ro: { translation: ro },
      en: { translation: en },
    },
    fallbackLng: 'ru',
    defaultNS: 'translation',
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'fly-yoga-lang',
    },
    interpolation: {
      escapeValue: false,
    },
  })

export default i18n
