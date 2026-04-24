import { cva, type VariantProps } from 'class-variance-authority'
import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

const badgeVariants = cva('inline-flex items-center rounded-xl px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2', {
  variants: {
    variant: {
      default: 'border border-border bg-secondary text-foreground',
      accent: 'border border-border bg-accent text-accent-foreground',
      outline: 'border border-border bg-background text-foreground',
      success: 'border border-border bg-secondary text-foreground',
      gradient: 'border border-foreground bg-foreground text-background',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})

export function Badge({
  className,
  variant,
  ...props
}: HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}
