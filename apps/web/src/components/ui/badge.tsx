import { cva, type VariantProps } from 'class-variance-authority'
import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

const badgeVariants = cva('inline-flex items-center rounded-xl px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2', {
  variants: {
    variant: {
      default: 'border border-primary/10 bg-primary/10 text-primary hover:bg-primary/15',
      accent: 'border-transparent bg-accent text-accent-foreground',
      outline: 'text-foreground border border-border/60 bg-background/70',
      success: 'border-transparent bg-success/10 text-success',
      gradient: 'border-transparent bg-gradient-to-tr from-primary to-sky-500 text-primary-foreground shadow-sm',
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
