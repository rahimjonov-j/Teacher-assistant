import { useCallback, useEffect, useMemo, useState, type PropsWithChildren } from 'react'
import { DEFAULT_LANGUAGE, getStoredLanguage, setCurrentLanguage, translate, type AppLanguage } from '@/lib/i18n'
import { I18nContext } from './i18n-context'

export function I18nProvider({ children }: PropsWithChildren) {
  const [language, setLanguageState] = useState<AppLanguage>(DEFAULT_LANGUAGE)

  useEffect(() => {
    const stored = getStoredLanguage()
    setLanguageState(stored)
    setCurrentLanguage(stored)
  }, [])

  const setLanguage = useCallback((nextLanguage: AppLanguage) => {
    setLanguageState(nextLanguage)
    setCurrentLanguage(nextLanguage)
  }, [])

  const t = useCallback((key: string) => translate(language, key), [language])

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t,
    }),
    [language, setLanguage, t],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}
