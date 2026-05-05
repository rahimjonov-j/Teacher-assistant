import { useEffect, useState } from 'react'
import { Download, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

export function PwaInstallPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState(() => localStorage.getItem('teacher-assistant-pwa-dismissed') === 'true')

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      if (!dismissed) {
        setInstallEvent(event as BeforeInstallPromptEvent)
      }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  }, [dismissed])

  if (!installEvent || dismissed) {
    return null
  }

  return (
    <div className="fixed inset-x-4 bottom-20 z-50 mx-auto max-w-md rounded-3xl border border-white/70 bg-white/90 p-3 shadow-[0_24px_70px_-36px_rgba(30,41,88,0.45)] backdrop-blur-xl md:bottom-6 dark:border-white/10 dark:bg-slate-950/90">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Smartphone className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-black">Install Teacher Assistant</div>
          <div className="text-xs text-muted-foreground">Open it like a real mobile app.</div>
        </div>
        <Button
          size="sm"
          onClick={async () => {
            await installEvent.prompt()
            await installEvent.userChoice
            setInstallEvent(null)
          }}
        >
          <Download className="h-4 w-4" />
          Install
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            localStorage.setItem('teacher-assistant-pwa-dismissed', 'true')
            setDismissed(true)
          }}
        >
          Later
        </Button>
      </div>
    </div>
  )
}
