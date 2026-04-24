import { useCallback, useEffect, useMemo, useState, type PropsWithChildren } from 'react'
import { getStoredLanguage, setCurrentLanguage, translate, type AppLanguage } from '@/lib/i18n'
import { I18nContext } from './i18n-context'

export function I18nProvider({ children }: PropsWithChildren) {
  const [language, setLanguageState] = useState<AppLanguage>(() => getStoredLanguage())

  useEffect(() => {
    setCurrentLanguage(language)
  }, [language])

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
