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
      <h1 className="font-display text-3xl font-bold text-[#1A1A2E] mb-6">{t('admin.vendors')}</h1>
      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#E8E8E4] overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <table className="w-full">
            <thead className="border-b border-[#E8E8E4]" style={{ backgroundColor: '#FAFAF8' }}>
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] font-body uppercase tracking-wide">{t('admin.vendor')}</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] font-body uppercase tracking-wide">{t('admin.category')}</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] font-body uppercase tracking-wide">{t('admin.status')}</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] font-body uppercase tracking-wide">{t('admin.action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E8E4]">
              {vendors.map((v, idx) => (
                <tr key={v.id} className="hover:bg-[#FAFAF8] transition-colors" style={{ backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#FAFAF8' }}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {v.logo_url ? (
                        <img src={v.logo_url} alt={v.display_name} className="w-9 h-9 rounded-xl object-cover" />
                      ) : (
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{ backgroundColor: '#F5E6D3' }}>
                          {CATEGORY_EMOJI[v.category]}
                        </div>
                      )}
                      <span className="font-semibold font-body text-[#1A1A2E]">{v.display_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm font-body text-[#6B7280]">{t(`categories.${v.category as VendorCategory}`)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <Badge className={v.is_approved ? 'bg-[#52B788]/15 text-[#52B788]' : 'bg-[#F5E6D3] text-[#2E86AB]'}>
                        {v.is_approved ? t('admin.approved') : t('admin.pending')}
                      </Badge>
                      {v.is_active && <Badge className="bg-[#2E86AB]/10 text-[#2E86AB]">{t('admin.live')}</Badge>}
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
