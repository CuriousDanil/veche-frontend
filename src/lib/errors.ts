export type BackendErrorShape = {
  errors?: Record<string, string>
  fields?: Record<string, Record<string, string>>
}

export async function parseApiErrorResponse(res: Response): Promise<string> {
  try {
    const contentType = res.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      const data = (await res.json()) as BackendErrorShape | unknown
      if (data && typeof data === 'object') {
        const be = data as BackendErrorShape
        if (be.errors) {
          const firstKey = Object.keys(be.errors)[0]
          if (firstKey) return be.errors[firstKey]
        }
        // fallback to stringify if custom shape
        return JSON.stringify(data)
      }
    }
    const text = await res.text()
    return text || `Request failed with ${res.status}`
  } catch {
    return `Request failed with ${res.status}`
  }
}

export function parseUnknownError(err: unknown): string {
  if (!err) return 'Unknown error'
  if (err instanceof Error) return err.message
  try {
    return JSON.stringify(err)
  } catch {
    return String(err)
  }
}


