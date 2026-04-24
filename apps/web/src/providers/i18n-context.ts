import { createContext } from 'react'
import type { AppLanguage } from '@/lib/i18n'

export interface I18nContextValue {
  language: AppLanguage
  setLanguage: (language: AppLanguage) => void
  t: (key: string) => string
}

export const I18nContext = createContext<I18nContextValue | null>(null)
