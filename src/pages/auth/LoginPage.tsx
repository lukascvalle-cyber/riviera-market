import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { useAuth } from '../../contexts/AuthContext'
import { LanguageSelector } from '../../components/ui/LanguageSelector'

type FormValues = { email: string; password: string }

export function LoginPage() {
  const navigate = useNavigate()
  const { profile, refreshProfile } = useAuth()
  const { t } = useTranslation()
  const [error, setError] = useState<string | null>(null)
  const [loginAttempted, setLoginAttempted] = useState(false)

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
    <div className="min-h-screen bg-sand flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-end mb-2">
          <LanguageSelector />
        </div>
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl font-bold text-coral">Riviera</h1>
          <p className="font-display text-xl text-ocean mt-1">Market</p>
          <p className="text-gray-500 font-body text-sm mt-3">{t('auth.subtitle')}</p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-sand-200 p-6">
          <h2 className="font-display text-2xl font-semibold text-gray-900 mb-5">{t('auth.login.title')}</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input label={t('auth.login.email')} type="email" autoComplete="email" {...register('email')} error={errors.email?.message} />
            <Input label={t('auth.login.password')} type="password" autoComplete="current-password" {...register('password')} error={errors.password?.message} />
            {error && <p className="text-sm text-red-600 font-body bg-red-50 rounded-xl p-3">{error}</p>}
            <Button type="submit" fullWidth size="lg" loading={isSubmitting} className="mt-2">
              {t('auth.login.submit')}
            </Button>
          </form>
          <p className="text-center text-sm text-gray-500 font-body mt-5">
            {t('auth.login.noAccount')}{' '}
            <Link to="/register" className="text-coral font-semibold hover:underline">{t('auth.login.createAccount')}</Link>
          </p>
        </div>

        {/* Discreet vendor registration link */}
        <p className="text-center text-xs text-gray-400 font-body mt-5">
          <Link to="/cadastro-vendedor" className="hover:text-gray-600 transition-colors">
            {t('auth.login.vendorRegisterLink')}
          </Link>
        </p>
      </div>
    </div>
  )
}
