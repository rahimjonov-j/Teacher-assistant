import { createCipheriv, createDecipheriv, createHash, createHmac, pbkdf2Sync, randomBytes, timingSafeEqual } from 'node:crypto'
import { env } from '../config/env.js'
import { ApiError } from './api-error.js'

const PASSWORD_ITERATIONS = 120000
const PASSWORD_KEY_LENGTH = 32
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 14

function tokenSecret() {
  return env.SUPABASE_SERVICE_ROLE_KEY ?? env.SUPABASE_ANON_KEY ?? 'teacher-assistant-local-secret'
}

function passwordSecret() {
  return env.STUDENT_PASSWORD_SECRET ?? tokenSecret()
}

function base64Url(input: Buffer | string) {
  return Buffer.from(input).toString('base64url')
}

function signPayload(value: string) {
  return createHmac('sha256', tokenSecret()).update(value).digest('base64url')
}

export function generatePassword() {
  return randomBytes(6).toString('base64url').replace(/[-_]/g, '').slice(0, 10)
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString('base64url')
  const hash = pbkdf2Sync(password, salt, PASSWORD_ITERATIONS, PASSWORD_KEY_LENGTH, 'sha256').toString('base64url')
  return { hash, salt }
}

function passwordKey() {
  return createHash('sha256').update(passwordSecret()).digest()
}

export function encryptPassword(password: string) {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', passwordKey(), iv)
  const encrypted = Buffer.concat([cipher.update(password, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  return [base64Url(iv), base64Url(authTag), base64Url(encrypted)].join('.')
}

export function decryptPassword(payload?: string | null) {
  if (!payload) {
    return null
  }

  const [ivPart, authTagPart, encryptedPart] = payload.split('.')
  if (!ivPart || !authTagPart || !encryptedPart) {
    return null
  }

  try {
    const decipher = createDecipheriv('aes-256-gcm', passwordKey(), Buffer.from(ivPart, 'base64url'))
    decipher.setAuthTag(Buffer.from(authTagPart, 'base64url'))
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encryptedPart, 'base64url')),
      decipher.final(),
    ])
    return decrypted.toString('utf8')
  } catch {
    return null
  }
}

export function verifyPassword(password: string, salt: string, expectedHash: string) {
  const hash = pbkdf2Sync(password, salt, PASSWORD_ITERATIONS, PASSWORD_KEY_LENGTH, 'sha256').toString('base64url')
  const left = Buffer.from(hash)
  const right = Buffer.from(expectedHash)
  return left.length === right.length && timingSafeEqual(left, right)
}

export function createStudentToken(studentId: string) {
  const expiresAt = Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS
  const payload = base64Url(JSON.stringify({ sub: studentId, role: 'student', exp: expiresAt }))
  const signature = signPayload(payload)
  return `${payload}.${signature}`
}

export function verifyStudentToken(token: string) {
  const [payload, signature] = token.split('.')

  if (!payload || !signature || signPayload(payload) !== signature) {
    throw new ApiError(401, 'Invalid student session.')
  }

  const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
    sub?: string
    role?: string
    exp?: number
  }

  if (!decoded.sub || decoded.role !== 'student' || !decoded.exp || decoded.exp < Math.floor(Date.now() / 1000)) {
    throw new ApiError(401, 'Student session expired.')
  }

  return decoded.sub
}
