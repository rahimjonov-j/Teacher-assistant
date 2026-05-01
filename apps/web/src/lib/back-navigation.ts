export function getFallbackBackPath(pathname: string) {
  if (pathname.startsWith('/app/history/')) {
    return '/app/messenger'
  }

  if (
    pathname === '/app/generator' ||
    pathname === '/app/billing' ||
    pathname === '/app/settings' ||
    pathname === '/app/classes' ||
    pathname === '/app/calendar' ||
    pathname === '/app/database' ||
    pathname === '/app/attendance' ||
    pathname === '/app/telegram-link' ||
    pathname === '/app/messenger'
  ) {
    return '/app/dashboard'
  }

  if (pathname.startsWith('/admin/') && pathname !== '/admin/dashboard') {
    return '/admin/dashboard'
  }

  if (pathname.startsWith('/student/assignments/')) {
    return '/student/dashboard'
  }

  if (pathname === '/student/dashboard') {
    return '/student-login'
  }

  if (pathname === '/student-login') {
    return '/login'
  }

  if (pathname === '/register' || pathname === '/reset-password') {
    return '/login'
  }

  if (pathname === '/login' || pathname === '/pricing') {
    return '/'
  }

  return null
}
