import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff } from 'lucide-react'
import { supabase } from '../../lib/supabase'

function WaveIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M4 28C4 28 8 24 14 24C20 24 22 28 28 28C34 28 36 24 42 24C48 24 48 28 48 28" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M4 36C4 36 8 32 14 32C20 32 22 36 28 36C34 36 36 32 42 32C48 32 48 36 48 36" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
      <circle cx="24" cy="14" r="6" fill="currentColor" opacity="0.3" />
    </svg>
  )
}

type FormValues = {
  full_name: string
  email: string
  password: string
  confirm_password: string
  ddd: string
  phone_number: string
}

const schema = z.object({
  full_name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  confirm_password: z.string().min(6, 'Confirme a senha'),
  ddd: z.string().length(2, 'DDD deve ter 2 dígitos').regex(/^\d{2}$/, 'DDD inválido'),
  phone_number: z.string().min(8, 'Número inválido').max(9, 'Número inválido').regex(/^\d{8,9}$/, 'Número inválido'),
}).refine(d => d.password === d.confirm_password, {
  message: 'As senhas não coincidem',
  path: ['confirm_password'],
})

export function FrequentadorRegisterPage() {
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  async function onSubmit({ email, password, full_name, ddd, phone_number }: FormValues) {
    setError(null)
    const phone = `+55${ddd}${phone_number}`
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name, phone } },
    })
    if (authError) { setError(authError.message); return }
    if (data.user) {
      await supabase.from('profiles').upsert({ id: data.user.id, phone }, { onConflict: 'id' })
    }
    setDone(true)
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12" style={{ backgroundColor: '#FAFAF8' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <WaveIcon className="w-12 h-12 mx-auto mb-4 text-[#2E86AB]" />
          <h1 className="text-2xl font-semibold tracking-tight" style={{ color: '#2E86AB' }}>
            Riviera Market
          </h1>
          <p className="text-sm mt-1.5" style={{ color: '#6B7280' }}>
            Crie a sua conta de cliente
          </p>
        </div>

        {done ? (
          <div className="bg-white rounded-2xl border border-[#E8E8E4] p-8 flex flex-col items-center text-center gap-5" style={{ boxShadow: '0 2px 24px rgba(0,0,0,0.08)' }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(46,134,171,0.1)' }}>
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="#2E86AB" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h2 className="font-semibold text-xl text-[#1A1A2E] mb-2">Verifique o seu email</h2>
              <p className="text-sm text-[#6B7280] leading-relaxed">
                Verifique o seu email para confirmar o cadastro e aceder à plataforma.
              </p>
            </div>
            <Link
              to="/login"
              className="w-full h-[52px] flex items-center justify-center text-white font-semibold rounded-xl transition-colors hover:opacity-90"
              style={{ backgroundColor: '#2E86AB' }}
            >
              Ir para o login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Full name */}
            <div>
              <input
                type="text"
                placeholder="Nome completo"
                autoComplete="name"
                {...register('full_name')}
                className="w-full h-12 px-4 rounded-[10px] bg-white placeholder:text-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#2E86AB] focus:border-transparent transition-all"
                style={{ border: '1px solid #E8E8E4', color: '#1A1A2E' }}
              />
              {errors.full_name && <p className="text-xs mt-1" style={{ color: '#E63946' }}>{errors.full_name.message}</p>}
            </div>

            {/* Email */}
            <div>
              <input
                type="email"
                placeholder="Email"
                autoComplete="email"
                {...register('email')}
                className="w-full h-12 px-4 rounded-[10px] bg-white placeholder:text-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#2E86AB] focus:border-transparent transition-all"
                style={{ border: '1px solid #E8E8E4', color: '#1A1A2E' }}
              />
              {errors.email && <p className="text-xs mt-1" style={{ color: '#E63946' }}>{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Senha"
                  autoComplete="new-password"
                  {...register('password')}
                  className="w-full h-12 px-4 pr-12 rounded-[10px] bg-white placeholder:text-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#2E86AB] focus:border-transparent transition-all"
                  style={{ border: '1px solid #E8E8E4', color: '#1A1A2E' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: '#6B7280' }}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="text-xs mt-1" style={{ color: '#E63946' }}>{errors.password.message}</p>}
            </div>

            {/* Confirm password */}
            <div>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Confirmar senha"
                  autoComplete="new-password"
                  {...register('confirm_password')}
                  className="w-full h-12 px-4 pr-12 rounded-[10px] bg-white placeholder:text-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#2E86AB] focus:border-transparent transition-all"
                  style={{ border: '1px solid #E8E8E4', color: '#1A1A2E' }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: '#6B7280' }}
                  aria-label={showConfirm ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.confirm_password && <p className="text-xs mt-1" style={{ color: '#E63946' }}>{errors.confirm_password.message}</p>}
            </div>

            {/* Phone */}
            <div>
              <div className="flex gap-2">
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={2}
                  placeholder="DDD"
                  {...register('ddd')}
                  className="h-12 rounded-[10px] bg-white placeholder:text-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#2E86AB] focus:border-transparent transition-all text-center"
                  style={{ width: 72, border: '1px solid #E8E8E4', color: '#1A1A2E' }}
                />
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={9}
                  placeholder="Telefone"
                  {...register('phone_number')}
                  className="flex-1 h-12 px-4 rounded-[10px] bg-white placeholder:text-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#2E86AB] focus:border-transparent transition-all"
                  style={{ border: '1px solid #E8E8E4', color: '#1A1A2E' }}
                />
              </div>
              {(errors.ddd || errors.phone_number) && (
                <p className="text-xs mt-1" style={{ color: '#E63946' }}>
                  {errors.ddd?.message ?? errors.phone_number?.message}
                </p>
              )}
            </div>

            {error && (
              <p className="text-sm rounded-xl p-3" style={{ backgroundColor: 'rgba(230,57,70,0.08)', color: '#E63946' }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-[52px] text-white font-semibold rounded-xl transition-colors mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#2E86AB' }}
            >
              {isSubmitting ? '...' : 'Criar conta'}
            </button>

            <p className="text-center text-sm mt-2" style={{ color: '#6B7280' }}>
              Já tenho conta{' '}
              <Link to="/login" className="font-semibold hover:underline" style={{ color: '#2E86AB' }}>
                Entrar
              </Link>
            </p>
          </form>
        )}
      </div>
    </main>
  )
}
