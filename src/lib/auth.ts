export type JwtAccessPayload = {
  sub: string
  tokenType: 'access'
  companyId: string | null
  partyIds: string[]
  canPostDiscussions: boolean
  canManageSessions: boolean
  canManageUsers: boolean
  iat: number
  exp: number
}

let inMemoryAccessToken: string | null = null

export function setAccessToken(token: string | null): void {
  inMemoryAccessToken = token
}

export function getAccessToken(): string | null {
  return inMemoryAccessToken
}

export function clearAccessToken(): void {
  inMemoryAccessToken = null
}

export function parseJwt<T = unknown>(token: string): T | null {
  try {
    const base64Url = token.split('.')[1]
    if (!base64Url) return null
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    )
    return JSON.parse(jsonPayload) as T
  } catch {
    return null
  }
}

export function isJwtExpired(token: string): boolean {
  const payload = parseJwt<{ exp: number }>(token)
  if (!payload || !payload.exp) return true
  const nowSeconds = Math.floor(Date.now() / 1000)
  // consider token expired if within 10s of expiry to avoid race conditions
  return nowSeconds >= payload.exp - 10
}

export function getAccessPayload(): JwtAccessPayload | null {
  const token = getAccessToken()
  if (!token) return null
  return parseJwt<JwtAccessPayload>(token)
}


