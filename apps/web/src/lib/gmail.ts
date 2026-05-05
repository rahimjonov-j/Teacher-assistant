export const GMAIL_DOMAIN = '@gmail.com'

export function normalizeGmailUsername(value: string) {
  return value
    .trim()
    .replace(/\s+/g, '')
    .replace(/^@+/, '')
    .replace(/@gmail\.com$/i, '')
    .toLowerCase()
}

export function toGmailAddress(username: string) {
  return `${normalizeGmailUsername(username)}${GMAIL_DOMAIN}`
}
