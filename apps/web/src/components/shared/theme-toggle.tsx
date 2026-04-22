import { Moon, SunMedium } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className="rounded-2xl border-border/40 hover:border-primary/30 transition-all duration-500"
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      aria-label="Mavzuni almashtirish"
    >
      <div className="relative h-4 w-4 overflow-hidden">
        <div className={cn(
          "absolute inset-0 transition-all duration-500",
          resolvedTheme === 'dark' ? "translate-y-0 rotate-0 opacity-100" : "-translate-y-full -rotate-90 opacity-0"
        )}>
          <SunMedium className="h-4 w-4 text-amber-400" />
        </div>
        <div className={cn(
          "absolute inset-0 transition-all duration-500",
          resolvedTheme === 'dark' ? "translate-y-full rotate-90 opacity-0" : "translate-y-0 rotate-0 opacity-100"
        )}>
          <Moon className="h-4 w-4 text-primary" />
        </div>
      </div>
    </Button>
  )
}
