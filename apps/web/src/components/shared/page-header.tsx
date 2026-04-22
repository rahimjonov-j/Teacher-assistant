import type { ReactNode } from 'react'

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string
  title: string
  description?: string
  actions?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between mb-8 animate-in">
      <div className="space-y-2">
        {eyebrow ? (
          <div className="inline-flex rounded-xl bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
            {eyebrow}
          </div>
        ) : null}
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
            {title}
          </h1>
          {description ? (
            <p className="mt-2 max-w-2xl text-base text-muted-foreground/80 leading-relaxed font-medium">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-3 shrink-0">
          {actions}
        </div>
      )}
    </div>
  )
}
