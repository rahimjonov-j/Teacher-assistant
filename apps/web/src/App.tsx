import { BrowserRouter } from 'react-router-dom'
import { AppProviders } from '@/providers/app-providers'
import { AppRoutes } from '@/routes/app-routes'

export default function App() {
  return (
    <AppProviders>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppProviders>
  )
}
