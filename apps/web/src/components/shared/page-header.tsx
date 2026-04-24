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
    <div className="mb-6 flex flex-col gap-4 animate-in">
      <div className="space-y-2">
        {eyebrow ? (
          <div className="inline-flex rounded-full bg-secondary px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            {eyebrow}
          </div>
        ) : null}
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            {title}
          </h1>
          {description ? (
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
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
