import { createContext } from 'react'
import type { Session } from '@supabase/supabase-js'
import type { TeacherProfile } from '@teacher-assistant/shared'

export interface AuthContextValue {
  session: Session | null
  profile: TeacherProfile | null
  loading: boolean
  login: (email: string, password: string) => Promise<TeacherProfile>
  register: (input: {
    email: string
    password: string
    fullName: string
  }) => Promise<{ emailConfirmationRequired: boolean; profile: TeacherProfile | null }>
  logout: () => Promise<void>
  refreshProfile: () => Promise<TeacherProfile>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
