import { ButtonHTMLAttributes } from 'react'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' }

export default function Button({ variant = 'primary', className, ...rest }: Props) {
  const base = variant === 'primary' ? 'primary-button' : 'link'
  const cls = className ? `${base} ${className}` : base
  return <button className={cls} {...rest} />
}


