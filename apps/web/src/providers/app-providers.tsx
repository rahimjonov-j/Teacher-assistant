import type { PropsWithChildren } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'
import { Toaster } from 'sonner'
import { AuthProvider } from './auth-provider'
import { I18nProvider } from './i18n-provider'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
})

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        <I18nProvider>
          <AuthProvider>
            {children}
            <Toaster richColors position="top-center" />
          </AuthProvider>
        </I18nProvider>
      </QueryClientProvider>
    </ThemeProvider>
  )
}
