import { lazy, Suspense } from 'react'

const ReactMarkdown = lazy(() => import('react-markdown'))

export function MarkdownRenderer({ children }: { children: string }) {
  const { body, stamp } = extractTeacherStamp(children)

  return (
    <Suspense fallback={<div className="whitespace-pre-wrap">{children}</div>}>
      <ReactMarkdown>{body}</ReactMarkdown>
      {stamp ? (
        <div className="mt-8 text-right text-sm font-black text-muted-foreground">{stamp}</div>
      ) : null}
    </Suspense>
  )
}

function extractTeacherStamp(value: string) {
  const lines = value.trimEnd().split('\n')
  const lastLine = lines.at(-1)?.trim() ?? ''

  if (!lastLine.startsWith('Tayyorladi:')) {
    return { body: value, stamp: null }
  }

  return {
    body: lines.slice(0, -1).join('\n').trimEnd(),
    stamp: lastLine,
  }
}
