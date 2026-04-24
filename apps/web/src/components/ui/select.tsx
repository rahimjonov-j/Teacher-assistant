import type { SelectHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        className={cn(
          'flex h-12 w-full appearance-none rounded-2xl border border-input bg-background px-4 pr-10 text-sm ring-offset-background outline-none transition-all focus-visible:border-foreground focus-visible:ring-2 focus-visible:ring-foreground/10 disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60 transition-transform duration-300" />
    </div>
  )
}
