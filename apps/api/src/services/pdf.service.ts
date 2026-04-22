import PDFDocument from 'pdfkit'
import { Buffer } from 'node:buffer'
import { env } from '../config/env.js'
import { getSupabaseAdminClient } from '../config/supabase.js'
import { contentRepository } from '../repositories/content.repository.js'
import { subscriptionsRepository } from '../repositories/subscriptions.repository.js'
import { usageRepository } from '../repositories/usage.repository.js'
import { ApiError } from '../utils/api-error.js'

export const pdfService = {
  async exportContent(userId: string, contentId: string) {
    const content = await contentRepository.getById(contentId, userId)
    const updatedSubscription = await subscriptionsRepository.consumeCredits(userId, 'pdf_export')
    const pdfBuffer = await renderPdfBuffer(content.title, content.outputMarkdown)

    const supabase = getSupabaseAdminClient()
    const storagePath = `${userId}/${content.id}-${Date.now()}.pdf`

    const { error } = await supabase.storage
      .from(env.PDF_STORAGE_BUCKET)
      .upload(storagePath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      })

    if (error) {
      throw new ApiError(500, 'Unable to upload exported PDF.')
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
        status: updatedSubscription.status,
        creditsRemaining: updatedSubscription.creditsRemaining,
        creditsUsed: updatedSubscription.creditsUsed,
        renewsAt: updatedSubscription.renewsAt,
      },
    }
  },
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

      const normalized = line.replace(/^#+\s*/, '').replace(/^\-\s*/, '• ')
      doc.text(normalized, { lineGap: 4 })
    })

    doc.end()
  })
}
