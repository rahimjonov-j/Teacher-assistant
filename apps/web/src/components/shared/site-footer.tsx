import { cn } from '@/lib/utils'

interface SiteFooterProps {
  variant?: 'public' | 'teacher' | 'admin'
  className?: string
}

const footerStyles = {
  public: {
    wrap: 'mt-auto',
    shell: 'container py-4',
    text: 'text-muted-foreground/75',
  },
  teacher: {
    wrap: 'mt-10',
    shell: 'px-6 py-4 sm:px-8',
    text: 'text-muted-foreground/75',
  },
  admin: {
    wrap: 'mt-10',
    shell: 'px-6 py-4 sm:px-8',
    text: 'text-slate-600 dark:text-slate-400',
  },
} as const

export function SiteFooter({ variant = 'public', className }: SiteFooterProps) {
  const style = footerStyles[variant]
  const currentYear = new Date().getFullYear()

  return (
    <footer className={cn(style.wrap, className)}>
      <div className={cn('flex items-center justify-center', style.shell)}>
        <div className={cn('text-center text-sm font-medium leading-relaxed', style.text)}>
          Copyright {currentYear} Teacher Assistant. Barcha huquqlar himoyalangan.
        </div>
      </div>
    </footer>
  )
}
