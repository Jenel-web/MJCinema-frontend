import { jsonOnly, request } from './client'
import { STORAGE_KEYS } from './config'
import type { LoginResponse, RegisterRequest } from './types'

/** POST /user/login, body { username, password }, no auth header. */
export function loginRequest(username: string, password: string) {
  return request<LoginResponse>('/user/login', {
    method: 'POST',
    headers: jsonOnly(),
    body: { username, password },
  })
}

/** POST /user/register, body { username, password, confirm }, no auth header. */
export function registerRequest(body: RegisterRequest) {
  return request<unknown>('/user/register', {
    method: 'POST',
    headers: jsonOnly(),
    body,
  })
}

export type AuthResult =
  | { success: true; data: LoginResponse }
  | { success: false; message: string }

const OFFLINE = 'Server is offline. Try again later.'

/** Login + persist userId/username/token (the legacy Auth.handleLogin, minus the DOM). */
export async function login(username: string, password: string): Promise<AuthResult> {
  try {
    const res = await loginRequest(username, password)
    if (!res.ok) return { success: false, message: res.message || 'An error occurred' }
    localStorage.setItem(STORAGE_KEYS.userId, String(res.data.userId))
    localStorage.setItem(STORAGE_KEYS.username, res.data.username)
    localStorage.setItem(STORAGE_KEYS.token, res.data.jwtToken)
    return { success: true, data: res.data }
  } catch {
    return { success: false, message: OFFLINE }
  }
}

/** Client-side register validation from the legacy flow; returns an error message or null. */
export function validateRegister(password: string, confirm: string): string | null {
  if (password !== confirm) return 'Passwords do not match.'
  if (password.length < 8) return 'Password length should be more than 8 characters.'
  return null
}

export async function register(
  username: string,
  password: string,
  confirm: string,
): Promise<{ success: true } | { success: false; message: string }> {
  try {
    const res = await registerRequest({ username, password, confirm })
    if (!res.ok) return { success: false, message: res.message || 'An error occurred' }
    return { success: true }
  } catch {
    return { success: false, message: OFFLINE }
  }
}

/** Legacy post-login redirect: USER -> dashboard, anything else -> admin. */
export function postLoginPath(role: string): string {
  return role === 'USER' ? '/dashboard' : '/admin'
}

/** Legacy handleLogout: clear localStorage (the caller then navigates to "/"). */
export function logout(): void {
  localStorage.clear()
}

export const authErrors = { OFFLINE, INVALID: 'Invalid Username or Password.' }
