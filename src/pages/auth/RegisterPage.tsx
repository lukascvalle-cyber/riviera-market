import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import { useToast } from '../../components/ui/Toast'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { LanguageSelector } from '../../components/ui/LanguageSelector'

type FormValues = { full_name: string; email: string; password: string }

export function RegisterPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const { t } = useTranslation()
  const [error, setError] = useState<string | null>(null)

  const schema = z.object({
    full_name: z.string().min(2, t('auth.validation.nameTooShort')),
    email: z.string().email(t('auth.validation.invalidEmail')),
    password: z.string().min(6, t('auth.validation.passwordTooShort')),
  })

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  async function onSubmit({ email, password, full_name }: FormValues) {
    setError(null)
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name, role: 'frequentador' } },
    })
    if (authError) { setError(authError.message); return }

    toast(t('auth.register.success'), 'success')
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-sand flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-end mb-2">
          <LanguageSelector />
        </div>
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl font-bold text-coral">Riviera</h1>
          <p className="font-display text-xl text-ocean mt-1">Market</p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-sand-200 p-6">
          <h2 className="font-display text-2xl font-semibold text-gray-900 mb-5">{t('auth.register.title')}</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input label={t('auth.register.fullName')} autoComplete="name" {...register('full_name')} error={errors.full_name?.message} />
            <Input label={t('auth.register.email')} type="email" autoComplete="email" {...register('email')} error={errors.email?.message} />
            <Input label={t('auth.register.password')} type="password" autoComplete="new-password" {...register('password')} error={errors.password?.message} />
            {error && <p className="text-sm text-red-600 font-body bg-red-50 rounded-xl p-3">{error}</p>}
            <Button type="submit" fullWidth size="lg" loading={isSubmitting} className="mt-2">
              {t('auth.register.submit')}
            </Button>
          </form>
          <p className="text-center text-sm text-gray-500 font-body mt-5">
            {t('auth.register.hasAccount')}{' '}
            <Link to="/login" className="text-coral font-semibold hover:underline">{t('auth.register.loginLink')}</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
