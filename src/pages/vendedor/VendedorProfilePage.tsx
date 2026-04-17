import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { useToast } from '../../components/ui/Toast'
import { StarRating } from '../../components/ui/StarRating'
import { useVendorReviews } from '../../hooks/useVendorReviews'
import type { VendorCategory } from '../../types'

const CATEGORIES: VendorCategory[] = ['bebidas', 'comidas', 'sorvete', 'artesanato', 'equipamentos', 'outros']

type FormValues = {
  display_name: string
  description?: string
  category: VendorCategory
}

export function VendedorProfilePage() {
  const { vendor, refreshProfile } = useAuth()
  const toast = useToast()
  const { t } = useTranslation()
  const [uploading, setUploading] = useState(false)
  const { avgRating, reviewCount } = useVendorReviews(vendor?.id ?? null)

  const schema = z.object({
    display_name: z.string().min(2, t('auth.validation.nameTooShort')),
    description: z.string().optional(),
    category: z.enum(['bebidas', 'comidas', 'sorvete', 'artesanato', 'equipamentos', 'outros'] as const),
  })

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
    toast(t('vendor.profileUpdated'), 'success')
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !vendor) return
    setUploading(true)

    const { data: existingFiles } = await supabase.storage.from('vendor-logos').list(vendor.id)
    if (existingFiles && existingFiles.length > 0) {
      await supabase.storage.from('vendor-logos').remove(existingFiles.map(f => `${vendor.id}/${f.name}`))
    }

    const ext = file.name.split('.').pop()
    const fileName = `${vendor.id}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('vendor-logos').upload(fileName, file, { cacheControl: '3600', upsert: true })
    if (error) {
      console.error('Upload error:', error)
      toast(`${t('vendor.logoError')}: ${error.message}`, 'error')
      setUploading(false)
      return
    }
    const { data: urlData } = supabase.storage.from('vendor-logos').getPublicUrl(fileName)
    const publicUrl = urlData.publicUrl + '?t=' + Date.now()
    await supabase.from('vendors').update({ logo_url: publicUrl }).eq('id', vendor.id)
    await refreshProfile()
    setUploading(false)
    toast(t('vendor.logoSuccess'), 'success')
  }

  if (!vendor) return null

  return (
    <div className="max-w-xl mx-auto px-4 py-5">
      <h2 className="font-display text-xl font-semibold text-[#1A1A2E] mb-5">{t('vendor.myProfile')}</h2>

      <div className="bg-white rounded-2xl border border-[#E8E8E4] p-5 mb-4 flex items-center gap-4" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        {vendor.logo_url ? (
          <img src={vendor.logo_url} alt={vendor.display_name} className="w-20 h-20 rounded-xl object-cover shrink-0" />
        ) : (
          <div className="w-20 h-20 rounded-xl flex items-center justify-center text-3xl shrink-0" style={{ backgroundColor: '#F5E6D3' }}>🛍️</div>
        )}
        <div>
          <p className="font-semibold text-[#1A1A2E] font-body">{vendor.display_name}</p>
          {avgRating !== null ? (
            <div className="flex items-center gap-1.5 mt-1">
              <StarRating rating={avgRating} size="sm" />
              <span className="text-xs font-body font-semibold" style={{ color: '#2E86AB' }}>{avgRating.toFixed(1)}</span>
              <span className="text-xs text-[#6B7280] font-body">({reviewCount} {reviewCount === 1 ? 'avaliação' : 'avaliações'})</span>
            </div>
          ) : (
            <p className="text-xs text-[#6B7280] font-body mt-1">Sem avaliações ainda</p>
          )}
          <label className="mt-2 cursor-pointer text-sm font-semibold font-body hover:underline" style={{ color: '#2E86AB' }}>
            {uploading ? t('vendor.uploadingLogo') : t('vendor.changeLogo')}
            <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploading} />
          </label>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-2xl border border-[#E8E8E4] p-5 flex flex-col gap-4" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <Input label={t('vendor.businessName')} {...register('display_name')} error={errors.display_name?.message} />
        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-[#1A1A2E] font-body">{t('vendor.description')}</label>
          <textarea
            rows={3}
            className="w-full rounded-[10px] border border-[#E8E8E4] px-4 py-2.5 font-body text-[#1A1A2E] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#2E86AB] resize-none"
            placeholder={t('vendor.descriptionPlaceholder')}
            {...register('description')}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-[#1A1A2E] font-body">{t('vendor.category')}</label>
          <select
            className="w-full rounded-[10px] border border-[#E8E8E4] px-4 py-2.5 font-body text-[#1A1A2E] focus:outline-none focus:ring-2 focus:ring-[#2E86AB] bg-white"
            {...register('category')}
          >
            {CATEGORIES.map(c => (
              <option key={c} value={c}>{t(`categories.${c}`)}</option>
            ))}
          </select>
        </div>
        <Button type="submit" loading={isSubmitting} fullWidth>{t('vendor.saveProfile')}</Button>
      </form>

      {!vendor.is_approved && (
        <div className="mt-4 rounded-2xl p-4" style={{ backgroundColor: '#F5E6D3', border: '1px solid #E8E8E4' }}>
          <p className="text-sm font-body" style={{ color: '#2E86AB' }}>
            {t('vendor.pendingApproval')}
          </p>
        </div>
      )}
    </div>
  )
}
