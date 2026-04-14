import type { HTMLAttributes, ReactNode } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

export function Card({ children, className = '', ...props }: CardProps) {
  return (
    <div
      className={`bg-white rounded-2xl shadow-sm border border-sand-200 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
