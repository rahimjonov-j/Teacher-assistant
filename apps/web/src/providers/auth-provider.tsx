import type { PropsWithChildren } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import type { TeacherProfile } from '@teacher-assistant/shared'
import { apiRequest } from '@/lib/api'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import { AuthContext, type AuthContextValue } from '@/providers/auth-context'

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<TeacherProfile | null>(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const profileRef = useRef<TeacherProfile | null>(null)

  const clearAuthState = useCallback(() => {
    setSession(null)
    setProfile(null)
  }, [])

  const loadProfile = useCallback(async () => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase sozlanmagan.')
    }

    const { profile } = await apiRequest<{ profile: TeacherProfile }>('/auth/me')
    setProfile(profile)
    return profile
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase sozlanmagan.')
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        throw new Error(error.message)
      }

      return await loadProfile()
    } catch (error) {
      clearAuthState()
      throw error
    }
  }, [clearAuthState, loadProfile])

  const register = useCallback(async (input: { email: string; password: string; fullName: string }) => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase sozlanmagan.')
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: input.email,
        password: input.password,
        options: {
          data: {
            full_name: input.fullName,
          },
        },
      })

      if (error) {
        throw new Error(error.message)
      }

      if (data.session) {
        setSession(data.session)
        const profile = await loadProfile()
        return { emailConfirmationRequired: false, profile }
      }

      return {
        emailConfirmationRequired: Boolean(data.user) && !data.session,
        profile: null,
      }
    } catch (error) {
      clearAuthState()
      throw error
    }
  }, [clearAuthState, loadProfile])

  const logout = useCallback(async () => {
    if (!isSupabaseConfigured) {
      clearAuthState()
      return
    }

    const { error } = await supabase.auth.signOut()
    if (error) {
      throw new Error(error.message)
    }

    clearAuthState()
  }, [clearAuthState])

  useEffect(() => {
    profileRef.current = profile
  }, [profile])

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return
    }

    const syncSession = async () => {
      try {
        const { data } = await supabase.auth.getSession()
        setSession(data.session)

        if (data.session) {
          await loadProfile()
        }
      } catch (error) {
        console.error('Unable to restore auth session', error)
        clearAuthState()
      } finally {
        setLoading(false)
      }
    }

    void syncSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession)

      if (nextSession) {
        // Keep auth refresh non-blocking to prevent full-screen loader flicker.
        if (event === 'TOKEN_REFRESHED' && profileRef.current) {
          return
        }

        void loadProfile().catch((error) => {
          console.error('Unable to sync auth profile', error)
          clearAuthState()
        })
      } else {
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [clearAuthState, loadProfile])

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      profile,
      loading,
      login,
      register,
      logout,
      refreshProfile: loadProfile,
    }),
    [loading, profile, session, login, register, logout, loadProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
