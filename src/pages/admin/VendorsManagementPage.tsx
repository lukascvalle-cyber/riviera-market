import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Spinner } from '../../components/ui/Spinner'
import { useToast } from '../../components/ui/Toast'
import { CATEGORY_EMOJI } from '../../lib/constants'
import type { Vendor, VendorCategory } from '../../types'

export function VendorsManagementPage() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const toast = useToast()
  const { t } = useTranslation()

  async function fetchVendors() {
    const { data } = await supabase.from('vendors').select('*').order('created_at', { ascending: false })
    if (data) setVendors(data)
    setLoading(false)
  }

  useEffect(() => { fetchVendors() }, [])

  async function toggleApproval(vendor: Vendor) {
    const { error } = await supabase
      .from('vendors')
      .update({ is_approved: !vendor.is_approved })
      .eq('id', vendor.id)
    if (error) { toast(t('admin.vendorUpdateError'), 'error'); return }
    setVendors(prev => prev.map(v => v.id === vendor.id ? { ...v, is_approved: !v.is_approved } : v))
    toast(vendor.is_approved ? t('admin.vendorSuspended') : t('admin.vendorApproved'), 'success')
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="font-display text-3xl font-bold text-gray-900 mb-6">{t('admin.vendors')}</h1>
      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : (
        <div className="bg-white rounded-2xl border border-sand-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-sand-50 border-b border-sand-200">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600 font-body">{t('admin.vendor')}</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600 font-body">{t('admin.category')}</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600 font-body">{t('admin.status')}</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600 font-body">{t('admin.action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand-100">
              {vendors.map(v => (
                <tr key={v.id} className="hover:bg-sand-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {v.logo_url ? (
                        <img src={v.logo_url} alt={v.display_name} className="w-9 h-9 rounded-xl object-cover" />
                      ) : (
                        <div className="w-9 h-9 rounded-xl bg-sand-100 flex items-center justify-center text-lg">
                          {CATEGORY_EMOJI[v.category]}
                        </div>
                      )}
                      <span className="font-semibold font-body text-gray-900">{v.display_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm font-body text-gray-600">{t(`categories.${v.category as VendorCategory}`)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <Badge className={v.is_approved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                        {v.is_approved ? t('admin.approved') : t('admin.pending')}
                      </Badge>
                      {v.is_active && <Badge className="bg-blue-100 text-blue-800">{t('admin.live')}</Badge>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      size="sm"
                      variant={v.is_approved ? 'danger' : 'secondary'}
                      onClick={() => toggleApproval(v)}
                    >
                      {v.is_approved ? t('admin.suspend') : t('admin.approve')}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
