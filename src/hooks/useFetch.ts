import { useEffect, useState } from 'react'

export function useFetch<T>(input: RequestInfo | URL, init?: RequestInit) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    ;(async () => {
      try {
        setLoading(true)
        const res = await fetch(input, init)
        if (!res.ok) throw new Error(`Failed: ${res.status}`)
        const json = (await res.json()) as T
        if (isMounted) setData(json)
      } catch (e) {
        if (isMounted) setError((e as Error).message)
      } finally {
        if (isMounted) setLoading(false)
      }
    })()
    return () => {
      isMounted = false
    }
  }, [String(input)])

  return { data, error, loading }
}


