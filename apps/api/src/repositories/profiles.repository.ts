import { superAdminEmails } from '../config/env.js'
import { getSupabaseAdminClient } from '../config/supabase.js'
import { ApiError } from '../utils/api-error.js'

interface UpsertProfileInput {
  id: string
  email: string
  fullName: string | null
}

export const profilesRepository = {
  async upsertFromAuthUser(input: UpsertProfileInput) {
    const supabase = getSupabaseAdminClient()
    const normalizedEmail = input.email.trim().toLowerCase()
    const isBootstrapAdmin = superAdminEmails.includes(normalizedEmail)
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', input.id)
      .maybeSingle()

    const { data: adminRole } = await supabase
      .from('admin_roles')
      .select('id')
      .eq('user_id', input.id)
      .maybeSingle()

    const payload = {
      id: input.id,
      email: normalizedEmail,
      full_name: input.fullName ?? ((existingProfile?.full_name as string | null) ?? null),
      role:
        adminRole || isBootstrapAdmin
          ? 'admin'
          : ((existingProfile?.role as 'teacher' | 'admin' | null) ?? 'teacher'),
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('profiles')
      .upsert(payload, { onConflict: 'id' })
      .select('*')
      .single()

    if (error || !data) {
      throw new ApiError(500, 'Unable to sync teacher profile.')
    }

    if (isBootstrapAdmin) {
      const { error: adminUpsertError } = await supabase
        .from('admin_roles')
        .upsert({ user_id: input.id }, { onConflict: 'user_id', ignoreDuplicates: false })

      if (adminUpsertError) {
        throw new ApiError(500, 'Unable to sync super admin role.')
      }
    }

    return {
      id: data.id as string,
      email: data.email as string,
      fullName: (data.full_name as string | null) ?? null,
      schoolName: (data.school_name as string | null) ?? null,
      gradeFocus: (data.grade_focus as string | null) ?? null,
      telegramHandle: (data.telegram_handle as string | null) ?? null,
      avatarUrl: (data.avatar_url as string | null) ?? null,
      role: ((data.role as 'teacher' | 'admin' | null) ?? 'teacher'),
      timezone: (data.timezone as string | null) ?? null,
    }
  },

  async getById(userId: string) {
    const supabase = getSupabaseAdminClient()
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()

    if (error || !data) {
      throw new ApiError(404, 'Teacher profile not found.')
    }

    return {
      id: data.id as string,
      email: data.email as string,
      fullName: (data.full_name as string | null) ?? null,
      schoolName: (data.school_name as string | null) ?? null,
      gradeFocus: (data.grade_focus as string | null) ?? null,
      telegramHandle: (data.telegram_handle as string | null) ?? null,
      avatarUrl: (data.avatar_url as string | null) ?? null,
      role: ((data.role as 'teacher' | 'admin' | null) ?? 'teacher'),
      timezone: (data.timezone as string | null) ?? null,
    }
  },

  async update(userId: string, input: Record<string, string | null>) {
    const supabase = getSupabaseAdminClient()
    const { data, error } = await supabase
      .from('profiles')
      .update({
        full_name: input.fullName,
        school_name: input.schoolName,
        grade_focus: input.gradeFocus,
        timezone: input.timezone,
        telegram_handle: input.telegramHandle,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select('*')
      .single()

    if (error || !data) {
      throw new ApiError(500, 'Unable to update teacher profile.')
    }

    return this.getById(userId)
  },

  async listTeachers() {
    const supabase = getSupabaseAdminClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, school_name, role, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      throw new ApiError(500, 'Unable to load teachers.')
    }

    return (data ?? []).map((profile: any) => ({
      id: profile.id as string,
      email: profile.email as string,
      fullName: (profile.full_name as string | null) ?? null,
      schoolName: (profile.school_name as string | null) ?? null,
      role: ((profile.role as 'teacher' | 'admin' | null) ?? 'teacher'),
      createdAt: profile.created_at as string,
    }))
  },
}
