import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

const EDGE_THRESHOLD_PX = 44
const MIN_SWIPE_DISTANCE_PX = 72
const MAX_VERTICAL_DRIFT_PX = 72

function isInteractiveTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  if (target.closest('[data-no-swipe-back]')) {
    return true
  }

  return Boolean(target.closest('input, textarea, select, button, a, [role="button"]'))
}

function getFallbackPath(pathname: string) {
  if (pathname.startsWith('/app/history/')) {
    return '/app/messenger'
  }

  if (pathname === '/app/generator' || pathname === '/app/billing' || pathname === '/app/settings') {
    return '/app/dashboard'
  }

  if (pathname.startsWith('/admin/') && pathname !== '/admin/dashboard') {
    return '/admin/dashboard'
  }

  if (pathname === '/register' || pathname === '/reset-password') {
    return '/login'
  }

  if (pathname === '/login') {
    return '/'
  }

  return null
}

export function useSwipeBack() {
  const navigate = useNavigate()
  const location = useLocation()
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)
  const eligible = useRef(false)
  const targetBlocked = useRef(false)

  useEffect(() => {
    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) {
        eligible.current = false
        return
      }

      const touch = event.touches[0]
      touchStartX.current = touch.clientX
      touchStartY.current = touch.clientY
      eligible.current = touch.clientX <= EDGE_THRESHOLD_PX
      targetBlocked.current = isInteractiveTarget(event.target)
    }

    const onTouchEnd = (event: TouchEvent) => {
      if (
        !eligible.current ||
        targetBlocked.current ||
        touchStartX.current === null ||
        touchStartY.current === null
      ) {
        resetGesture()
        return
      }

      const touch = event.changedTouches[0]
      const deltaX = touch.clientX - touchStartX.current
      const deltaY = Math.abs(touch.clientY - touchStartY.current)

      if (deltaX >= MIN_SWIPE_DISTANCE_PX && deltaY <= MAX_VERTICAL_DRIFT_PX) {
        const fallbackPath = getFallbackPath(location.pathname)

        if (location.key === 'default' && fallbackPath) {
          navigate(fallbackPath)
        } else if (location.key !== 'default') {
          navigate(-1)
        }
      }

      resetGesture()
    }

    const onTouchCancel = () => {
      resetGesture()
    }

    const resetGesture = () => {
      touchStartX.current = null
      touchStartY.current = null
      eligible.current = false
      targetBlocked.current = false
    }

    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchend', onTouchEnd, { passive: true })
    window.addEventListener('touchcancel', onTouchCancel, { passive: true })

    return () => {
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchend', onTouchEnd)
      window.removeEventListener('touchcancel', onTouchCancel)
    }
  }, [location.key, location.pathname, navigate])
}
