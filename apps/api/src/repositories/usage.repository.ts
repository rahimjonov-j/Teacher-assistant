import type { FeatureKey, UsageLogRecord } from '@teacher-assistant/shared'
import { getSupabaseAdminClient } from '../config/supabase.js'
import { ApiError } from '../utils/api-error.js'

interface UsageMetadata {
  inputTokens: number
  outputTokens: number
  totalTokens: number
  [key: string]: unknown
}

interface NormalizedUsageRow extends UsageLogRecord {
  userId: string
  teacherName: string | null
  metadata: UsageMetadata
  inputTokens: number
  outputTokens: number
  totalTokens: number
}

export const usageRepository = {
  async create(input: {
    userId: string
    featureKey: FeatureKey
    creditsConsumed: number
    modelName: string
    source: 'web' | 'telegram' | 'admin'
    generatedContentId?: string
    metadata?: Record<string, unknown>
  }) {
    const supabase = getSupabaseAdminClient()
    const { error } = await supabase.from('usage_logs').insert({
      user_id: input.userId,
      feature_key: input.featureKey,
      credits_consumed: input.creditsConsumed,
      model_name: input.modelName,
      source: input.source,
      generated_content_id: input.generatedContentId,
      metadata: input.metadata ?? {},
    })

    if (error) {
      throw new ApiError(500, 'Unable to save usage log.')
    }
  },

  async listRecent(limit = 20): Promise<NormalizedUsageRow[]> {
    const supabase = getSupabaseAdminClient()
    const { data, error } = await supabase
      .from('usage_logs')
      .select(
        'id, user_id, feature_key, credits_consumed, model_name, source, created_at, metadata, profiles(full_name)',
      )
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      throw new ApiError(500, 'Unable to load recent activity.')
    }

    return (data ?? []).map(mapUsageRow)
  },

  async listAll(): Promise<NormalizedUsageRow[]> {
    const supabase = getSupabaseAdminClient()
    const { data, error } = await supabase
      .from('usage_logs')
      .select(
        'id, user_id, feature_key, credits_consumed, model_name, source, created_at, metadata, profiles(full_name)',
      )
      .order('created_at', { ascending: false })

    if (error) {
      throw new ApiError(500, 'Unable to load usage data.')
    }

    return (data ?? []).map(mapUsageRow)
  },
}

function mapUsageRow(row: any): NormalizedUsageRow {
  const metadata = normalizeMetadata(row.metadata)

  return {
    id: row.id as string,
    userId: row.user_id as string,
    teacherName: (row.profiles as { full_name?: string | null } | null)?.full_name ?? null,
    featureKey: row.feature_key as FeatureKey,
    creditsConsumed: Number(row.credits_consumed ?? 0),
    modelName: row.model_name as string,
    source: row.source as 'web' | 'telegram' | 'admin',
    createdAt: row.created_at as string,
    metadata,
    inputTokens: metadata.inputTokens,
    outputTokens: metadata.outputTokens,
    totalTokens: metadata.totalTokens,
  }
}

function normalizeMetadata(metadata: unknown): UsageMetadata {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return {
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
    }
  }

  const record = metadata as Record<string, unknown>
  return {
    ...record,
    inputTokens: Number(record.inputTokens ?? 0),
    outputTokens: Number(record.outputTokens ?? 0),
    totalTokens: Number(record.totalTokens ?? 0),
  }
}
