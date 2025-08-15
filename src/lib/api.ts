import { clearAccessToken, getAccessToken, isJwtExpired, setAccessToken } from './auth'

export async function refreshAccessToken(): Promise<boolean> {
  try {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    if (!response.ok) return false
    const data = (await response.json()) as { accessToken: string }
    if (data?.accessToken) {
      setAccessToken(data.accessToken)
      return true
    }
    return false
  } catch {
    return false
  }
}

export type ApiRequestInit = RequestInit & { skipAuth?: boolean }

export async function apiFetch(input: RequestInfo | URL, init: ApiRequestInit = {}): Promise<Response> {
  const { skipAuth = false, headers, ...rest } = init
  const combinedHeaders: HeadersInit = { 'Content-Type': 'application/json', ...(headers || {}) }
  const inputUrl = typeof input === 'string' || input instanceof URL ? input.toString() : ''
  const isAuthEndpoint = inputUrl.includes('/api/auth/')

  if (!skipAuth) {
    let accessToken = getAccessToken()
    if (!accessToken || isJwtExpired(accessToken)) {
      const refreshed = await refreshAccessToken()
      if (!refreshed) {
        clearAccessToken()
        accessToken = null
      } else {
        accessToken = getAccessToken()
      }
    }
    if (accessToken) {
      ;(combinedHeaders as Record<string, string>)['Authorization'] = `Bearer ${accessToken}`
    }
  }

  const response = await fetch(input, { ...rest, headers: combinedHeaders, credentials: isAuthEndpoint ? 'include' : rest.credentials })

  if (response.status === 401 && !skipAuth) {
    // try once to refresh and retry
    const refreshed = await refreshAccessToken()
    if (refreshed) {
      const retryHeaders: HeadersInit = { ...combinedHeaders }
      const newAccessToken = getAccessToken()
      if (newAccessToken) {
        ;(retryHeaders as Record<string, string>)['Authorization'] = `Bearer ${newAccessToken}`
      }
      return fetch(input, { ...rest, headers: retryHeaders, credentials: isAuthEndpoint ? 'include' : rest.credentials })
    }
  }

  return response
}


