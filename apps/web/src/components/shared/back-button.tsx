import { ArrowLeft } from 'lucide-react'
import { useI18n } from '@/hooks/use-i18n'
import { useBackNavigation } from '@/hooks/use-back-navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export function BackButton({ className }: { className?: string }) {
  const { t } = useI18n()
  const { canGoBack, goBack } = useBackNavigation()

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={cn('w-fit rounded-full px-3 text-sm font-semibold', className)}
      onClick={goBack}
      disabled={!canGoBack}
    >
      <ArrowLeft className="h-4 w-4" />
      {t('common.back')}
    </Button>
  )
}
