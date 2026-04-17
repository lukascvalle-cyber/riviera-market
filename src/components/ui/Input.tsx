import { type InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = '', id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-sm font-semibold text-[#1A1A2E] font-body">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={[
            'w-full rounded-[10px] border bg-white px-4 py-2.5 font-body text-[#1A1A2E] placeholder-[#6B7280] transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-[#2E86AB] focus:border-transparent',
            error ? 'border-[#E63946]' : 'border-[#E8E8E4]',
            className,
          ].join(' ')}
          {...props}
        />
        {error && <p className="text-xs text-[#E63946] font-body">{error}</p>}
        {hint && !error && <p className="text-xs text-[#6B7280] font-body">{hint}</p>}
      </div>
    )
  },
)

Input.displayName = 'Input'
