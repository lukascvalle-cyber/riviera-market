import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '../../lib/supabase'
import { useToast } from '../../components/ui/Toast'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { useAuth } from '../../contexts/AuthContext'

const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})
type FormValues = z.infer<typeof schema>

export function LoginPage() {
  const navigate = useNavigate()
  const { refreshProfile } = useAuth()
  const toast = useToast()
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  async function onSubmit({ email, password }: FormValues) {
    setError(null)
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) { setError('Email ou senha incorretos.'); return }

    await refreshProfile()
    const role = data.user?.user_metadata?.role
    if (role === 'vendedor') navigate('/vendedor')
    else if (role === 'administrador') navigate('/admin')
    else navigate('/app')
  }

  return (
    <div className="min-h-screen bg-sand flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl font-bold text-coral">Riviera</h1>
          <p className="font-display text-xl text-ocean mt-1">Market</p>
          <p className="text-gray-500 font-body text-sm mt-3">Marketplace da praia</p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-sand-200 p-6">
          <h2 className="font-display text-2xl font-semibold text-gray-900 mb-5">Entrar</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input label="Email" type="email" autoComplete="email" {...register('email')} error={errors.email?.message} />
            <Input label="Senha" type="password" autoComplete="current-password" {...register('password')} error={errors.password?.message} />
            {error && <p className="text-sm text-red-600 font-body bg-red-50 rounded-xl p-3">{error}</p>}
            <Button type="submit" fullWidth size="lg" loading={isSubmitting} className="mt-2">
              Entrar
            </Button>
          </form>
          <p className="text-center text-sm text-gray-500 font-body mt-5">
            Novo por aqui?{' '}
            <Link to="/register" className="text-coral font-semibold hover:underline">Criar conta</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
