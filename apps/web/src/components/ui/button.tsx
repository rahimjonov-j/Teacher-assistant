import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-2xl text-sm font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 active:scale-95',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow-lg shadow-primary/15 hover:shadow-xl hover:shadow-primary/20 hover:opacity-95',
        secondary: 'bg-secondary/90 text-secondary-foreground hover:bg-secondary',
        ghost: 'text-foreground hover:bg-secondary/80',
        outline: 'border border-border/70 bg-card/70 backdrop-blur-sm hover:bg-secondary/90 hover:border-primary/20',
        destructive: 'bg-destructive text-destructive-foreground shadow-lg shadow-destructive/20 hover:opacity-95',
        gradient: 'bg-gradient-to-tr from-primary to-sky-500 text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/25',
      },
      size: {
        default: 'h-12 px-6 py-3',
        sm: 'h-10 rounded-xl px-4 text-xs',
        lg: 'h-14 rounded-[20px] px-8 text-base',
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
