import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { useToast } from '../../components/ui/Toast'
import { CATEGORY_LABELS } from '../../lib/constants'
import type { VendorCategory } from '../../types'

const CATEGORIES: VendorCategory[] = ['bebidas', 'comidas', 'sorvete', 'artesanato', 'equipamentos', 'outros']

const schema = z.object({
  display_name: z.string().min(2, 'Nome muito curto'),
  description: z.string().optional(),
  category: z.enum(['bebidas', 'comidas', 'sorvete', 'artesanato', 'equipamentos', 'outros'] as const),
})
type FormValues = z.infer<typeof schema>

export function VendedorProfilePage() {
  const { vendor, refreshProfile } = useAuth()
  const toast = useToast()
  const [uploading, setUploading] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      display_name: vendor?.display_name ?? '',
      description: vendor?.description ?? '',
      category: vendor?.category ?? 'outros',
    },
  })

  async function onSubmit(values: FormValues) {
    if (!vendor) return
    const { error } = await supabase.from('vendors').update(values).eq('id', vendor.id)
    if (error) { toast(error.message, 'error'); return }
    await refreshProfile()
    toast('Perfil atualizado!', 'success')
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !vendor) return
    setUploading(true)
    const path = `${vendor.id}/logo`
    const { error } = await supabase.storage.from('vendor-logos').upload(path, file, { upsert: true })
    if (error) { toast('Erro ao carregar logo', 'error'); setUploading(false); return }
    const { data: { publicUrl } } = supabase.storage.from('vendor-logos').getPublicUrl(path)
    await supabase.from('vendors').update({ logo_url: publicUrl }).eq('id', vendor.id)
    await refreshProfile()
    setUploading(false)
    toast('Logo atualizado!', 'success')
  }

  if (!vendor) return null

  return (
    <div className="max-w-xl mx-auto px-4 py-5">
      <h2 className="font-display text-xl font-semibold text-gray-900 mb-5">Meu perfil</h2>

      <div className="bg-white rounded-2xl border border-sand-200 p-5 mb-4 flex items-center gap-4">
        {vendor.logo_url ? (
          <img src={vendor.logo_url} alt={vendor.display_name} className="w-20 h-20 rounded-xl object-cover shrink-0" />
        ) : (
          <div className="w-20 h-20 rounded-xl bg-sand-100 flex items-center justify-center text-3xl shrink-0">🛍️</div>
        )}
        <div>
          <p className="font-semibold text-gray-900 font-body">{vendor.display_name}</p>
          <label className="mt-2 cursor-pointer text-sm text-coral font-semibold font-body hover:underline">
            {uploading ? 'A carregar...' : 'Alterar logo'}
            <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploading} />
          </label>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-2xl border border-sand-200 p-5 flex flex-col gap-4">
        <Input label="Nome do negócio" {...register('display_name')} error={errors.display_name?.message} />
        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-gray-700 font-body">Descrição</label>
          <textarea
            rows={3}
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 font-body text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-coral resize-none"
            placeholder="Conte um pouco sobre o seu negócio..."
            {...register('description')}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-gray-700 font-body">Categoria</label>
          <select
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 font-body text-gray-900 focus:outline-none focus:ring-2 focus:ring-coral bg-white"
            {...register('category')}
          >
            {CATEGORIES.map(c => (
              <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
            ))}
          </select>
        </div>
        <Button type="submit" loading={isSubmitting} fullWidth>Guardar alterações</Button>
      </form>

      {!vendor.is_approved && (
        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
          <p className="text-sm text-yellow-800 font-body">
            ⏳ A sua conta está a aguardar aprovação pelo administrador da praia antes de poder aparecer no mapa.
          </p>
        </div>
      )}
    </div>
  )
}
