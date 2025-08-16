import { useEffect, useState } from 'react'
import { startGlobalLoading, stopGlobalLoading, subscribeLoading } from '../lib/loading'

export default function TopLoader() {
  const [loading, setLoading] = useState(false)
  useEffect(() => subscribeLoading(setLoading), [])
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        height: 3,
        width: loading ? '100%' : 0,
        background: '#111',
        transition: 'width 200ms ease',
        zIndex: 100,
      }}
    />
  )
}

// helpers for pages to wrap async ops
export async function withGlobalLoading<T>(fn: () => Promise<T>): Promise<T> {
  try {
    startGlobalLoading()
    return await fn()
  } finally {
    stopGlobalLoading()
  }
}


