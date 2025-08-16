import { HTMLAttributes } from 'react'

export default function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  const cls = className ? `card ${className}` : 'card'
  return <div className={cls} {...rest} />
}


