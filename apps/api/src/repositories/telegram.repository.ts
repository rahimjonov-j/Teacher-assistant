import { randomUUID } from 'node:crypto'
import { getSupabaseAdminClient } from '../config/supabase.js'
import { ApiError } from '../utils/api-error.js'

export const telegramRepository = {
  async createLinkCode(userId: string) {
    const supabase = getSupabaseAdminClient()
    const linkCode = randomUUID().split('-')[0].toUpperCase()
    const expiresAt = new Date(Date.now() + 1000 * 60 * 20).toISOString()

    const { error } = await supabase.from('telegram_links').upsert(
      {
        user_id: userId,
        link_code: linkCode,
        expires_at: expiresAt,
        linked_at: null,
      },
      { onConflict: 'user_id' },
    )

    if (error) {
      throw new ApiError(500, 'Unable to create Telegram linking code.')
    }

    return { linkCode, expiresAt }
  },

  async consumeLinkCode(linkCode: string, telegramUser: { id: number; username?: string | null }) {
    const supabase = getSupabaseAdminClient()
    const { data, error } = await supabase
      .from('telegram_links')
      .select('*')
      .eq('link_code', linkCode.toUpperCase())
      .single()

    if (error || !data) {
      throw new ApiError(404, 'Link code not found.')
    }

    if (data.expires_at && new Date(data.expires_at as string).getTime() < Date.now()) {
      throw new ApiError(400, 'Link code has expired.')
    }

    const { error: updateError } = await supabase
      .from('telegram_links')
      .update({
        telegram_user_id: String(telegramUser.id),
        telegram_username: telegramUser.username ?? null,
        linked_at: new Date().toISOString(),
      })
      .eq('id', data.id as string)

    if (updateError) {
      throw new ApiError(500, 'Unable to link Telegram account.')
    }

    return {
      userId: data.user_id as string,
      telegramUsername: telegramUser.username ?? null,
    }
  },

  async findByTelegramUserId(telegramUserId: number) {
    const supabase = getSupabaseAdminClient()
    const { data, error } = await supabase
      .from('telegram_links')
      .select('user_id, telegram_username, linked_at')
      .eq('telegram_user_id', String(telegramUserId))
      .maybeSingle()

    if (error) {
      throw new ApiError(500, 'Unable to load Telegram link.')
    }

    if (!data) {
      return null
    }

    return {
      userId: data.user_id as string,
      telegramUsername: (data.telegram_username as string | null) ?? null,
      linkedAt: data.linked_at as string | null,
    }
  },
}
