import { useCallback, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getFallbackBackPath } from '@/lib/back-navigation'

export function useBackNavigation() {
  const navigate = useNavigate()
  const location = useLocation()

  const fallbackPath = useMemo(() => getFallbackBackPath(location.pathname), [location.pathname])
  const canGoBack = location.key !== 'default' || Boolean(fallbackPath)

  const goBack = useCallback(() => {
    if (location.key !== 'default') {
      navigate(-1)
      return
    }

    if (fallbackPath) {
      navigate(fallbackPath)
    }
  }, [fallbackPath, location.key, navigate])

  return {
    canGoBack,
    fallbackPath,
    goBack,
  }
}
