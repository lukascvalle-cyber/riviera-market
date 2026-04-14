import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '../../lib/supabase'
import { useToast } from '../../components/ui/Toast'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'

const schema = z.object({
  full_name: z.string().min(2, 'Nome muito curto'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  role: z.enum(['frequentador', 'vendedor'] as const),
  vendor_name: z.string().optional(),
}).refine(d => d.role !== 'vendedor' || (d.vendor_name && d.vendor_name.length >= 2), {
  message: 'Nome do negócio é obrigatório',
  path: ['vendor_name'],
})

type FormValues = z.infer<typeof schema>

export function RegisterPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const [selectedRole, setSelectedRole] = useState<'frequentador' | 'vendedor'>('frequentador')
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'frequentador' },
  })

  function selectRole(role: 'frequentador' | 'vendedor') {
    setSelectedRole(role)
    setValue('role', role)
  }

  async function onSubmit({ email, password, full_name, role, vendor_name }: FormValues) {
    setError(null)
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name, role } },
    })
    if (authError) { setError(authError.message); return }

    if (role === 'vendedor' && data.user && vendor_name) {
      await supabase.from('vendors').insert({
        profile_id: data.user.id,
        display_name: vendor_name,
        category: 'outros',
      })
    }

    toast('Conta criada! Verifique o seu email para confirmar.', 'success')
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-sand flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl font-bold text-coral">Riviera</h1>
          <p className="font-display text-xl text-ocean mt-1">Market</p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-sand-200 p-6">
          <h2 className="font-display text-2xl font-semibold text-gray-900 mb-5">Criar conta</h2>

          <div className="grid grid-cols-2 gap-2 mb-5">
            {(['frequentador', 'vendedor'] as const).map(role => (
              <button
                key={role}
                type="button"
                onClick={() => selectRole(role)}
                className={`py-3 rounded-xl border-2 font-body font-semibold text-sm transition-all ${
                  selectedRole === role
                    ? 'border-coral bg-coral-50 text-coral'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                {role === 'frequentador' ? '🏖️ Frequentador' : '🛍️ Vendedor'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <input type="hidden" {...register('role')} />
            <Input label="Nome completo" autoComplete="name" {...register('full_name')} error={errors.full_name?.message} />
            {selectedRole === 'vendedor' && (
              <Input label="Nome do negócio" placeholder="Ex: Coco do Leandro" {...register('vendor_name')} error={errors.vendor_name?.message} />
            )}
            <Input label="Email" type="email" autoComplete="email" {...register('email')} error={errors.email?.message} />
            <Input label="Senha" type="password" autoComplete="new-password" {...register('password')} error={errors.password?.message} />
            {error && <p className="text-sm text-red-600 font-body bg-red-50 rounded-xl p-3">{error}</p>}
            <Button type="submit" fullWidth size="lg" loading={isSubmitting} className="mt-2">
              Criar conta
            </Button>
          </form>
          <p className="text-center text-sm text-gray-500 font-body mt-5">
            Já tem conta?{' '}
            <Link to="/login" className="text-coral font-semibold hover:underline">Entrar</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
