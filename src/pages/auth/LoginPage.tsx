import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { Eye, EyeOff } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { LanguageSelector } from '../../components/ui/LanguageSelector'

function WaveIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4 28C4 28 8 24 14 24C20 24 22 28 28 28C34 28 36 24 42 24C48 24 48 28 48 28"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M4 36C4 36 8 32 14 32C20 32 22 36 28 36C34 36 36 32 42 32C48 32 48 36 48 36"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.6"
      />
      <circle cx="24" cy="14" r="6" fill="currentColor" opacity="0.3" />
    </svg>
  )
}

type FormValues = { email: string; password: string }

export function LoginPage() {
  const navigate = useNavigate()
  const { profile, refreshProfile } = useAuth()
  const { t } = useTranslation()
  const [error, setError] = useState<string | null>(null)
  const [loginAttempted, setLoginAttempted] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const schema = z.object({
    email: z.string().email(t('auth.validation.invalidEmail')),
    password: z.string().min(6, t('auth.validation.passwordTooShort')),
  })

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  async function onSubmit({ email, password }: FormValues) {
    setError(null)
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) { setError(t('auth.login.invalidCredentials')); return }

    // Read role from the profiles table (source of truth) not from JWT metadata,
    // because admin accounts are often created directly in Supabase without metadata.
    await refreshProfile()
    setLoginAttempted(true)
  }

  // Navigate once profile is loaded after a login attempt.
  // Using the DB role ensures admins created without metadata are redirected correctly.
  useEffect(() => {
    if (!loginAttempted || !profile) return
    if (profile.role === 'administrador') navigate('/admin', { replace: true })
    else if (profile.role === 'vendedor') navigate('/vendedor', { replace: true })
    else navigate('/app', { replace: true })
  }, [loginAttempted, profile, navigate])

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12" style={{ backgroundColor: '#FAFAF8' }}>
      <div className="w-full max-w-sm">
        {/* Logo & Branding */}
        <div className="text-center mb-10">
          <WaveIcon className="w-12 h-12 mx-auto mb-4 text-[#2E86AB]" />
          <h1 className="text-2xl font-semibold tracking-tight" style={{ color: '#2E86AB' }}>
            Riviera Market
          </h1>
          <p className="text-muted-foreground text-sm mt-1.5">
            {t('auth.subtitle')}
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <input
              type="email"
              placeholder={t('auth.login.email')}
              autoComplete="email"
              {...register('email')}
              className="w-full h-12 px-4 rounded-[10px] bg-white text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#2E86AB] focus:border-transparent transition-all"
              style={{ border: '1px solid #E8E8E4' }}
            />
            {errors.email && (
              <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder={t('auth.login.password')}
                autoComplete="current-password"
                {...register('password')}
                className="w-full h-12 px-4 pr-12 rounded-[10px] bg-white text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#2E86AB] focus:border-transparent transition-all"
                style={{ border: '1px solid #E8E8E4' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>
            )}
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-xl p-3">{error}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-[52px] text-white font-semibold rounded-xl transition-colors mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#2E86AB' }}
          >
            {isSubmitting ? '...' : t('auth.login.submit')}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-border" />
          <span className="text-muted-foreground text-sm">ou</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Buyer registration */}
        <div className="text-center">
          <Link
            to="/cadastro"
            className="block text-center text-sm hover:underline mt-2"
            style={{ color: '#2E86AB' }}
          >
            Registrar
          </Link>
        </div>

        {/* Vendor registration link */}
        <div className="text-center mt-4">
          <Link
            to="/cadastro-vendedor"
            className="text-sm font-medium hover:underline underline-offset-2 transition-all"
            style={{ color: '#2E86AB' }}
          >
            {t('auth.login.vendorRegisterLink')}
          </Link>
        </div>

        {/* Language Selector */}
        <div className="flex items-center justify-center mt-10">
          <LanguageSelector />
        </div>
      </div>
    </main>
  )
}
