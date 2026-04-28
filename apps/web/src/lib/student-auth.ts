export const STUDENT_TOKEN_KEY = 'teacher-assistant-student-token'

export function getStudentToken() {
  return window.localStorage.getItem(STUDENT_TOKEN_KEY)
}

export function setStudentToken(token: string) {
  window.localStorage.setItem(STUDENT_TOKEN_KEY, token)
}

export function clearStudentToken() {
  window.localStorage.removeItem(STUDENT_TOKEN_KEY)
}
