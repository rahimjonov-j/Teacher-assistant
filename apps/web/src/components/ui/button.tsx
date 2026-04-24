import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 active:scale-[0.99]',
  {
    variants: {
      variant: {
        default: 'bg-foreground text-background hover:bg-foreground/90',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-accent',
        ghost: 'text-foreground hover:bg-secondary',
        outline: 'border border-border bg-card text-foreground hover:bg-secondary',
        destructive: 'bg-foreground text-background hover:bg-foreground/90',
        gradient: 'bg-foreground text-background hover:bg-foreground/90',
      },
      size: {
        default: 'h-12 px-6 py-3',
        sm: 'h-10 rounded-xl px-4 text-xs',
        lg: 'h-14 rounded-xl px-8 text-base',
        icon: 'h-11 w-11 rounded-xl',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  },
)

Button.displayName = 'Button'

export { Button }
