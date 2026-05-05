import { BrowserRouter } from 'react-router-dom'
import { PwaInstallPrompt } from '@/components/shared/pwa-install-prompt'
import { useSwipeBack } from '@/hooks/use-swipe-back'
import { AppProviders } from '@/providers/app-providers'
import { AppRoutes } from '@/routes/app-routes'

function RouterShell() {
  useSwipeBack()

  return <AppRoutes />
}

export default function App() {
  return (
    <AppProviders>
      <BrowserRouter>
        <RouterShell />
        <PwaInstallPrompt />
      </BrowserRouter>
    </AppProviders>
  )
}
