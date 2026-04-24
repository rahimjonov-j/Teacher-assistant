import PDFDocument from 'pdfkit'
import { Buffer } from 'node:buffer'
import { env } from '../config/env.js'
import { getSupabaseAdminClient } from '../config/supabase.js'
import { contentRepository } from '../repositories/content.repository.js'
import { subscriptionsRepository } from '../repositories/subscriptions.repository.js'
import { usageRepository } from '../repositories/usage.repository.js'
import { ApiError } from '../utils/api-error.js'

let pdfBucketReady = false

export const pdfService = {
  async exportContent(userId: string, contentId: string) {
    const content = await contentRepository.getById(contentId, userId)
    const pdfBuffer = await renderPdfBuffer(content.title, content.outputMarkdown)

    const supabase = getSupabaseAdminClient()
    await ensurePdfBucket(supabase)

    const updatedSubscription = await subscriptionsRepository.consumeCredits(userId, 'pdf_export')
    const storagePath = `${userId}/${content.id}-${Date.now()}.pdf`

    const { error } = await supabase.storage
      .from(env.PDF_STORAGE_BUCKET)
      .upload(storagePath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      })

    if (error) {
      throw new ApiError(500, `Unable to upload exported PDF: ${error.message}`)
    }

    const { data } = supabase.storage.from(env.PDF_STORAGE_BUCKET).getPublicUrl(storagePath)
    await contentRepository.attachPdf(content.id, data.publicUrl, storagePath)

    await usageRepository.create({
      userId,
      featureKey: 'pdf_export',
      creditsConsumed: updatedSubscription.creditCost,
      modelName: 'pdfkit',
      source: 'web',
      generatedContentId: content.id,
      metadata: {
        pdfUrl: data.publicUrl,
      },
    })

    return {
      pdfUrl: data.publicUrl,
      subscription: {
        planKey: updatedSubscription.planKey,
        planName: updatedSubscription.planName,
        status: updatedSubscription.status,
        creditsTotal: updatedSubscription.creditsTotal,
        creditsRemaining: updatedSubscription.creditsRemaining,
        creditsUsed: updatedSubscription.creditsUsed,
        renewsAt: updatedSubscription.renewsAt,
      },
    }
  },
}

async function ensurePdfBucket(supabase: ReturnType<typeof getSupabaseAdminClient>) {
  if (pdfBucketReady) {
    return
  }

  const { data, error } = await supabase.storage.getBucket(env.PDF_STORAGE_BUCKET)

  if (error || !data) {
    const { error: createError } = await supabase.storage.createBucket(env.PDF_STORAGE_BUCKET, {
      public: true,
      fileSizeLimit: '10MB',
      allowedMimeTypes: ['application/pdf'],
    })

    if (createError) {
      throw new ApiError(500, `Unable to prepare PDF storage bucket: ${createError.message}`)
    }

    pdfBucketReady = true
    return
  }

  if (!data.public) {
    const { error: updateError } = await supabase.storage.updateBucket(env.PDF_STORAGE_BUCKET, {
      public: true,
      fileSizeLimit: data.file_size_limit ?? '10MB',
      allowedMimeTypes: data.allowed_mime_types ?? ['application/pdf'],
    })

    if (updateError) {
      throw new ApiError(500, `Unable to publish PDF storage bucket: ${updateError.message}`)
    }
  }

  pdfBucketReady = true
}

function renderPdfBuffer(title: string, markdown: string) {
  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({
      margin: 48,
      size: 'A4',
      info: {
        Title: title,
        Author: 'Teacher Assistant Platform',
      },
    })

    const chunks: Buffer[] = []
    doc.on('data', (chunk) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    doc.fontSize(20).font('Helvetica-Bold').fillColor('#111827').text(title)
    doc.moveDown()
    doc.fontSize(11).font('Helvetica').fillColor('#334155')

    markdown.split('\n').forEach((line) => {
      if (!line.trim()) {
        doc.moveDown(0.35)
        return
      }

      const normalized = line.replace(/^#+\s*/, '').replace(/^\-\s*/, '- ')
      doc.text(normalized, { lineGap: 4 })
    })

    doc.end()
  })
}
