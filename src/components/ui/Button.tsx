import { type ButtonHTMLAttributes, forwardRef } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  fullWidth?: boolean
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-[#2E86AB] text-white hover:bg-[#2E86AB]/90 active:bg-[#2E86AB]/80 disabled:bg-[#2E86AB]/40',
  secondary: 'bg-transparent text-[#2E86AB] border border-[#2E86AB] hover:bg-[#2E86AB]/10 active:bg-[#2E86AB]/20 disabled:opacity-40',
  ghost: 'bg-transparent text-[#2E86AB] border border-[#2E86AB] hover:bg-[#2E86AB]/10 disabled:opacity-40',
  danger: 'bg-[#E63946] text-white hover:bg-[#E63946]/90 active:bg-[#E63946]/80 disabled:bg-[#E63946]/40',
}

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, fullWidth, children, className = '', disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={[
          'inline-flex items-center justify-center gap-2 rounded-xl font-body font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2E86AB] focus-visible:ring-offset-2',
          variantClasses[variant],
          sizeClasses[size],
          fullWidth ? 'w-full' : '',
          className,
        ].join(' ')}
        {...props}
      >
        {loading && (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        )}
        {children}
      </button>
    )
  },
)

Button.displayName = 'Button'
