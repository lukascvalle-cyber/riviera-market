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
          <label htmlFor={inputId} className="text-sm font-semibold text-gray-700 font-body">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={[
            'w-full rounded-xl border bg-white px-4 py-2.5 font-body text-gray-900 placeholder-gray-400 transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-coral focus:border-transparent',
            error ? 'border-red-400' : 'border-gray-200',
            className,
          ].join(' ')}
          {...props}
        />
        {error && <p className="text-xs text-red-600 font-body">{error}</p>}
        {hint && !error && <p className="text-xs text-gray-500 font-body">{hint}</p>}
      </div>
    )
  },
)

Input.displayName = 'Input'
