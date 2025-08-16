import { apiFetch } from './api'
import { parseApiErrorResponse } from './errors'

export async function swrJsonFetcher<T = unknown>(url: string): Promise<T> {
  const res = await apiFetch(url)
  if (!res.ok) {
    throw new Error(await parseApiErrorResponse(res))
  }
  return (await res.json()) as T
}


