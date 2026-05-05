import { cva, type VariantProps } from 'class-variance-authority'
import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

const badgeVariants = cva('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2', {
  variants: {
    variant: {
      default: 'border border-primary/15 bg-primary/10 text-primary',
      accent: 'border border-accent/20 bg-accent/10 text-accent',
      outline: 'border border-border bg-background/80 text-foreground',
      success: 'border border-success/20 bg-success/10 text-success',
      gradient: 'border border-transparent bg-gradient-to-r from-primary to-violet-600 text-white',
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
