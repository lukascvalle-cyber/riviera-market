import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { useToast } from '../ui/Toast'
import type { Product } from '../../types'
import { useState } from 'react'

type FormValues = {
  name: string
  description?: string
  price_brl: number
  is_available: boolean
}

interface MenuItemFormProps {
  vendorId: string
  product?: Product
  onSuccess: () => void
  onCancel: () => void
}

export function MenuItemForm({ vendorId, product, onSuccess, onCancel }: MenuItemFormProps) {
  const toast = useToast()
  const { t } = useTranslation()
  const [uploading, setUploading] = useState(false)
  const [photoUrl, setPhotoUrl] = useState<string | null>(product?.photo_url ?? null)

  const schema = z.object({
    name: z.string().min(2, t('product.nameTooShort')),
    description: z.string().optional(),
    price_brl: z.number({ invalid_type_error: t('product.invalidPrice') }).min(0.01, t('product.priceAboveZero')),
    is_available: z.boolean(),
  })

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: product?.name ?? '',
      description: product?.description ?? '',
      price_brl: product?.price_brl ?? 0,
      is_available: product?.is_available ?? true,
    },
  })

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const path = `${vendorId}/${Date.now()}_${file.name}`
    const { error } = await supabase.storage.from('product-photos').upload(path, file, { upsert: true })
    if (error) { toast(t('product.uploadError'), 'error'); setUploading(false); return }
    const { data: { publicUrl } } = supabase.storage.from('product-photos').getPublicUrl(path)
    setPhotoUrl(publicUrl)
    setUploading(false)
  }

  async function onSubmit(values: FormValues) {
    const payload = { ...values, photo_url: photoUrl }
    let error
    if (product) {
      const res = await supabase.from('products').update(payload).eq('id', product.id)
      error = res.error
    } else {
      const res = await supabase.from('products').insert({ ...payload, vendor_id: vendorId })
      error = res.error
    }
    if (error) { toast(error.message, 'error'); return }
    toast(product ? t('product.updateSuccess') : t('product.createSuccess'), 'success')
    onSuccess()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Input label={t('product.name')} {...register('name')} error={errors.name?.message} />
      <div className="flex flex-col gap-1">
        <label className="text-sm font-semibold text-gray-700 font-body">{t('product.description')}</label>
        <textarea
          className="w-full rounded-xl border border-gray-200 px-4 py-2.5 font-body text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-coral resize-none"
          rows={2}
          placeholder={t('product.descriptionPlaceholder')}
          {...register('description')}
        />
      </div>
      <Input
        label={t('product.price')}
        type="number"
        step="0.01"
        min="0"
        {...register('price_brl', { valueAsNumber: true })}
        error={errors.price_brl?.message}
      />
      <div className="flex flex-col gap-1">
        <label className="text-sm font-semibold text-gray-700 font-body">{t('product.photo')}</label>
        {photoUrl && <img src={photoUrl} alt="preview" className="w-24 h-24 rounded-xl object-cover" />}
        <input type="file" accept="image/*" onChange={handlePhotoUpload} className="text-sm font-body text-gray-600" />
        {uploading && <p className="text-xs text-gray-500 font-body">{t('product.uploadingPhoto')}</p>}
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" {...register('is_available')} className="w-4 h-4 accent-coral" />
        <span className="text-sm font-body text-gray-700">{t('product.availableNow')}</span>
      </label>
      <div className="flex gap-3">
        <Button type="button" variant="ghost" onClick={onCancel} fullWidth>{t('common.cancel')}</Button>
        <Button type="submit" loading={isSubmitting || uploading} fullWidth>
          {product ? t('product.save') : t('product.create')}
        </Button>
      </div>
    </form>
  )
}
