import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { LanguageSelector } from '../../components/ui/LanguageSelector'

type FormValues = {
  full_name: string
  email: string
  password: string
  ddd: string
  phone_number: string
}

const phoneSchema = z.object({
  full_name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  ddd: z
    .string()
    .length(2, 'DDD deve ter 2 dígitos')
    .regex(/^\d{2}$/, 'DDD inválido'),
  phone_number: z
    .string()
    .min(8, 'Número deve ter 8 ou 9 dígitos')
    .max(9, 'Número deve ter 8 ou 9 dígitos')
    .regex(/^\d{8,9}$/, 'Número inválido'),
})

export function RegisterPage() {
  const { t } = useTranslation()
  const [error, setError] = useState<string | null>(null)
  const [confirmed, setConfirmed] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(phoneSchema),
  })

  async function onSubmit({ email, password, full_name, ddd, phone_number }: FormValues) {
    setError(null)
    const phone = `+55${ddd}${phone_number}`
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name, role: 'frequentador', phone } },
    })
    if (authError) { setError(authError.message); return }

    // Update phone on profile (trigger creates the row; upsert is safe even if it races)
    if (authData.user) {
      await supabase
        .from('profiles')
        .upsert({ id: authData.user.id, phone }, { onConflict: 'id' })
    }

    setConfirmed(true)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ backgroundColor: '#FAFAF8' }}>
      <div className="w-full max-w-sm">
        <div className="flex justify-end mb-2">
          <LanguageSelector />
        </div>
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl font-bold" style={{ color: '#2E86AB' }}>Riviera</h1>
          <p className="font-display text-xl mt-1" style={{ color: '#2E86AB' }}>Market</p>
        </div>

        {confirmed ? (
          <div className="bg-white rounded-3xl border border-[#E8E8E4] p-8 flex flex-col items-center text-center gap-5" style={{ boxShadow: '0 2px 24px rgba(0,0,0,0.08)' }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(46,134,171,0.1)' }}>
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="#2E86AB" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="flex flex-col gap-2">
              <h2 className="font-display text-2xl font-semibold text-[#1A1A2E]">
                {t('auth.register.confirmedTitle')}
              </h2>
              <p className="font-body text-sm text-[#6B7280] leading-relaxed">
                {t('auth.register.confirmedBody')}
              </p>
            </div>
            <Link
              to="/login"
              className="w-full mt-1 inline-flex items-center justify-center rounded-2xl text-white font-semibold font-body text-base py-3 px-6 transition-colors hover:opacity-90"
              style={{ backgroundColor: '#2E86AB' }}
            >
              {t('auth.register.backToLogin')}
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-[#E8E8E4] p-6" style={{ boxShadow: '0 2px 24px rgba(0,0,0,0.08)' }}>
            <h2 className="font-display text-2xl font-semibold text-[#1A1A2E] mb-5">{t('auth.register.title')}</h2>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <Input
                label={t('auth.register.fullName')}
                autoComplete="name"
                {...register('full_name')}
                error={errors.full_name?.message}
              />
              <Input
                label={t('auth.register.email')}
                type="email"
                autoComplete="email"
                {...register('email')}
                error={errors.email?.message}
              />
              <Input
                label={t('auth.register.password')}
                type="password"
                autoComplete="new-password"
                {...register('password')}
                error={errors.password?.message}
              />

              {/* ── Phone number ── */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-[#1A1A2E] font-body">Telefone</label>
                <div className="flex gap-2">
                  <div className="shrink-0" style={{ width: 80 }}>
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={2}
                      placeholder="11"
                      {...register('ddd')}
                      className="w-full rounded-[10px] border border-[#E8E8E4] px-3 py-2.5 font-body text-[#1A1A2E] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#2E86AB] text-sm text-center"
                    />
                  </div>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={9}
                    placeholder="99999-9999"
                    {...register('phone_number')}
                    className="flex-1 rounded-[10px] border border-[#E8E8E4] px-4 py-2.5 font-body text-[#1A1A2E] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#2E86AB] text-sm"
                  />
                </div>
                {(errors.ddd || errors.phone_number) && (
                  <p className="text-xs font-body" style={{ color: '#E63946' }}>
                    {errors.ddd?.message ?? errors.phone_number?.message}
                  </p>
                )}
              </div>

              {error && (
                <p className="text-sm font-body rounded-xl p-3" style={{ backgroundColor: 'rgba(230,57,70,0.08)', color: '#E63946' }}>
                  {error}
                </p>
              )}
              <Button type="submit" fullWidth size="lg" loading={isSubmitting} className="mt-2">
                {t('auth.register.submit')}
              </Button>
            </form>
            <p className="text-center text-sm text-[#6B7280] font-body mt-5">
              {t('auth.register.hasAccount')}{' '}
              <Link to="/login" className="font-semibold hover:underline" style={{ color: '#2E86AB' }}>
                {t('auth.register.loginLink')}
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
