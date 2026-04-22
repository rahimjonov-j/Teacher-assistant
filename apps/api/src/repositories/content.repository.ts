import type { FeatureKey, GeneratedContentRecord } from '@teacher-assistant/shared'
import { getSupabaseAdminClient } from '../config/supabase.js'
import { ApiError } from '../utils/api-error.js'

export const contentRepository = {
  async create(input: {
    userId: string
    title: string
    featureKey: FeatureKey
    prompt: string
    outputMarkdown: string
    level: string | null
    additionalInstructions: string | null
    modelName: string
    creditsConsumed: number
    source: 'web' | 'telegram'
  }): Promise<GeneratedContentRecord> {
    const supabase = getSupabaseAdminClient()
    const { data, error } = await supabase
      .from('generated_contents')
      .insert({
        user_id: input.userId,
        title: input.title,
        feature_key: input.featureKey,
        prompt: input.prompt,
        output_markdown: input.outputMarkdown,
        level: input.level,
        additional_instructions: input.additionalInstructions,
        model_name: input.modelName,
        credits_consumed: input.creditsConsumed,
        source: input.source,
      })
      .select('*')
      .single()

    if (error || !data) {
      throw new ApiError(500, 'Unable to save generated content.')
    }

    return mapContent(data)
  },

  async listByUserId(userId: string, query?: { search?: string; featureKey?: string }) {
    const supabase = getSupabaseAdminClient()
    let request = supabase
      .from('generated_contents')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (query?.featureKey) {
      request = request.eq('feature_key', query.featureKey)
    }

    if (query?.search) {
      request = request.or(`title.ilike.%${query.search}%,prompt.ilike.%${query.search}%`)
    }

    const { data, error } = await request

    if (error) {
      throw new ApiError(500, 'Unable to load content history.')
    }

    return (data ?? []).map(mapContent)
  },

  async getById(id: string, userId?: string) {
    const supabase = getSupabaseAdminClient()
    let request = supabase.from('generated_contents').select('*').eq('id', id)

    if (userId) {
      request = request.eq('user_id', userId)
    }

    const { data, error } = await request.single()

    if (error || !data) {
      throw new ApiError(404, 'Generated content not found.')
    }

    return mapContent(data)
  },

  async attachPdf(contentId: string, pdfUrl: string, storagePath: string) {
    const supabase = getSupabaseAdminClient()
    const { error } = await supabase
      .from('generated_contents')
      .update({
        pdf_url: pdfUrl,
        pdf_storage_path: storagePath,
        updated_at: new Date().toISOString(),
      })
      .eq('id', contentId)

    if (error) {
      throw new ApiError(500, 'Unable to attach exported PDF.')
    }
  },
}

function mapContent(row: Record<string, unknown>): GeneratedContentRecord {
  return {
    id: row.id as string,
    title: row.title as string,
    featureKey: row.feature_key as FeatureKey,
    prompt: row.prompt as string,
    outputMarkdown: row.output_markdown as string,
    level: (row.level as string | null) ?? null,
    additionalInstructions: (row.additional_instructions as string | null) ?? null,
    createdAt: row.created_at as string,
    modelName: row.model_name as string,
    creditsConsumed: Number(row.credits_consumed ?? 0),
    pdfUrl: (row.pdf_url as string | null) ?? null,
  }
}
