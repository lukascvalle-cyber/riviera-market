import type { HTMLAttributes, ReactNode } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

export function Card({ children, className = '', ...props }: CardProps) {
  return (
    <div
      className={`bg-white rounded-2xl border border-[#E8E8E4] shadow-[0_2px_12px_rgba(0,0,0,0.06)] ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
