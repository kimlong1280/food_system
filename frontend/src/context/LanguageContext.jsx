import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { translations } from '../i18n/translations'

const LanguageContext = createContext(null)

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem('app_language') || localStorage.getItem('customer_language') || 'en'
  })

  const setLanguage = useCallback((lang) => {
    const validLang = lang === 'km' ? 'km' : 'en'
    setLanguageState(validLang)
    localStorage.setItem('app_language', validLang)
    localStorage.setItem('customer_language', validLang)
    document.documentElement.lang = validLang
  }, [])

  const toggleLanguage = useCallback(() => {
    setLanguage(language === 'en' ? 'km' : 'en')
  }, [language, setLanguage])

  useEffect(() => {
    document.documentElement.lang = language
  }, [language])

  // Translation helper function
  const t = useCallback(
    (key, params = {}) => {
      const langDict = translations[language] || translations.en
      let text = langDict[key] ?? translations.en[key] ?? key

      if (typeof text === 'string' && Object.keys(params).length > 0) {
        Object.entries(params).forEach(([paramKey, paramValue]) => {
          text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), paramValue)
        })
      }

      return text
    },
    [language]
  )

  // Category translation helper
  const translateCategory = useCallback(
    (categoryName) => {
      if (!categoryName) return ''
      const langDict = translations[language] || translations.en
      return langDict.categoryNames?.[categoryName] || categoryName
    },
    [language]
  )

  // Type filter translation helper
  const translateType = useCallback(
    (typeKey) => {
      if (!typeKey) return ''
      const langDict = translations[language] || translations.en
      return langDict.types?.[typeKey] || typeKey
    },
    [language]
  )

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        t,
        translateCategory,
        translateType,
        isKhmer: language === 'km',
      }}
    >
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

export default LanguageContext
