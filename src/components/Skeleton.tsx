import { HTMLAttributes } from 'react'

export function Skeleton({ className, style, ...rest }: HTMLAttributes<HTMLDivElement>) {
  const cls = className ? `skeleton ${className}` : 'skeleton'
  return <div className={cls} style={{ background: '#f3f4f6', borderRadius: 8, ...style }} {...rest} />
}

export function SkeletonText({ lines = 2 }: { lines?: number }) {
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} style={{ height: 12, background: '#f3f4f6', borderRadius: 6 }} />
      ))}
    </div>
  )
}


