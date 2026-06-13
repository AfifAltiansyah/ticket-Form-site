const TOKEN_KEY = 'auth_token'
const USER_KEY = 'auth_user'

export async function register(email, password, name) {
  const res = await fetch('/api/customer/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Registration failed')
  storeAuth(data.token, data.user)
  return data
}

export async function login(email, password) {
  const res = await fetch('/api/customer/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Login failed')
  storeAuth(data.token, data.user)
  return data
}

export async function getMe() {
  const token = getToken()
  if (!token) return null
  const res = await fetch('/api/customer/me', {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    logout()
    return null
  }
  const data = await res.json()
  return data.user
}

export function storeAuth(token, user) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function getUser() {
  const str = localStorage.getItem(USER_KEY)
  if (!str) return null
  try { return JSON.parse(str) } catch { return null }
}

export function isLoggedIn() {
  return !!localStorage.getItem(TOKEN_KEY)
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export function getAuthHeaders() {
  const token = getToken()
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  return headers
}
