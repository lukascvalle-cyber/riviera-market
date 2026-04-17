import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import { MenuItemCard } from '../../components/vendor/MenuItemCard'
import { CartDrawer } from '../../components/order/CartDrawer'
import { Spinner } from '../../components/ui/Spinner'
import { StarRating } from '../../components/ui/StarRating'
import { useVendorReviews } from '../../hooks/useVendorReviews'
import { CATEGORY_EMOJI } from '../../lib/constants'
import { useCart } from '../../contexts/CartContext'
import type { Vendor, Product } from '../../types'
import type { VendorCategory } from '../../types'

export function VendorProfilePage() {
  const { vendorId } = useParams<{ vendorId: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [cartOpen, setCartOpen] = useState(false)
  const { itemCount } = useCart()
  const { avgRating, reviewCount } = useVendorReviews(vendorId ?? null)

  useEffect(() => {
    if (!vendorId) return
    Promise.all([
      supabase.from('vendors').select('*').eq('id', vendorId).single(),
      supabase.from('products').select('*').eq('vendor_id', vendorId).eq('is_available', true).order('sort_order'),
    ]).then(([{ data: v }, { data: p }]) => {
      setVendor(v)
      setProducts(p ?? [])
      setLoading(false)
    })
  }, [vendorId])

  if (loading) return <div className="flex items-center justify-center h-full"><Spinner size="lg" /></div>
  if (!vendor) return <div className="p-8 text-center text-[#6B7280] font-body">{t('vendor.notFound')}</div>

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: '#FAFAF8' }}>
      {/* Header */}
      <div className="bg-white border-b border-[#E8E8E4] sticky top-0 z-10">
        <div className="max-w-xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-[#6B7280] hover:text-[#1A1A2E] transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          {vendor.logo_url ? (
            <img src={vendor.logo_url} alt={vendor.display_name} className="w-12 h-12 rounded-xl object-cover" />
          ) : (
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ backgroundColor: '#F5E6D3' }}>
              {CATEGORY_EMOJI[vendor.category]}
            </div>
          )}
          <div>
            <h1 className="font-display font-bold text-[#1A1A2E] text-lg leading-tight">{vendor.display_name}</h1>
            <p className="text-sm text-[#6B7280] font-body">{t(`categories.${vendor.category as VendorCategory}`)}</p>
            {avgRating !== null && (
              <div className="flex items-center gap-1.5 mt-0.5">
                <StarRating rating={avgRating} size="sm" />
                <span className="text-xs font-body font-semibold" style={{ color: '#2E86AB' }}>{avgRating.toFixed(1)}</span>
                <span className="text-xs text-[#6B7280] font-body">({reviewCount})</span>
              </div>
            )}
          </div>
          <div className="ml-auto relative">
            <button
              onClick={() => setCartOpen(true)}
              className="text-white w-10 h-10 rounded-full flex items-center justify-center hover:opacity-90 transition-colors"
              style={{ backgroundColor: '#2E86AB' }}
            >
              🛒
            </button>
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: '#2E86AB' }}>
                {itemCount}
              </span>
            )}
          </div>
        </div>
      </div>

      {vendor.description && (
        <div className="max-w-xl mx-auto px-4 py-4">
          <p className="text-[#6B7280] font-body text-sm">{vendor.description}</p>
        </div>
      )}

      <div className="max-w-xl mx-auto px-4 py-4 flex flex-col gap-3">
        <h2 className="font-display text-xl font-semibold text-[#1A1A2E]">{t('vendor.menu')}</h2>
        {products.length === 0 ? (
          <p className="text-[#6B7280] font-body text-center py-8">{t('vendor.noProducts')}</p>
        ) : (
          <div className="bg-white rounded-2xl border border-[#E8E8E4] overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            {products.map(p => <MenuItemCard key={p.id} product={p} />)}
          </div>
        )}
      </div>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  )
}
