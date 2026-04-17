import { useTranslation } from 'react-i18next'
import { Button } from '../ui/Button'
import { useCart } from '../../contexts/CartContext'
import type { Product } from '../../types'

interface MenuItemCardProps {
  product: Product
  editable?: boolean
  onEdit?: (product: Product) => void
  onToggle?: (id: string, available: boolean) => void
}

export function MenuItemCard({ product, editable, onEdit, onToggle }: MenuItemCardProps) {
  const { addItem, items, vendorId } = useCart()
  const { t } = useTranslation()
  const cartQty = items.find(i => i.product.id === product.id)?.quantity ?? 0
  const wrongVendor = vendorId !== null && vendorId !== product.vendor_id

  function handleAdd() {
    if (wrongVendor) return
    addItem(product)
  }

  return (
    <div className={`flex gap-3 p-4 border-b border-[#E8E8E4] bg-white transition-opacity ${!product.is_available ? 'opacity-50' : ''}`}>
      {product.photo_url ? (
        <img src={product.photo_url} alt={product.name} className="w-20 h-20 rounded-xl object-cover shrink-0" />
      ) : (
        <div className="w-20 h-20 rounded-xl flex items-center justify-center text-3xl shrink-0" style={{ backgroundColor: '#F5E6D3' }}>🍽️</div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-[#1A1A2E] font-body">{product.name}</p>
        {product.description && (
          <p className="text-sm text-[#6B7280] font-body mt-0.5 line-clamp-2">{product.description}</p>
        )}
        <p className="font-display font-bold text-[#2E86AB] mt-1">
          R$ {product.price_brl.toFixed(2).replace('.', ',')}
        </p>
        {!product.is_available && (
          <span className="text-xs text-[#6B7280] font-body">{t('product.unavailable')}</span>
        )}
      </div>
      <div className="shrink-0 flex flex-col items-end justify-between">
        {editable ? (
          <div className="flex flex-col gap-1.5">
            <Button size="sm" variant="ghost" onClick={() => onEdit?.(product)}>{t('product.edit')}</Button>
            <button
              className={`text-xs font-body px-2 py-1 rounded-lg border transition-colors ${product.is_available ? 'border-[#52B788] text-[#52B788] hover:bg-[#52B788]/10' : 'border-[#E63946] text-[#E63946] hover:bg-[#E63946]/10'}`}
              onClick={() => onToggle?.(product.id, !product.is_available)}
            >
              {product.is_available ? t('product.available') : t('product.paused')}
            </button>
          </div>
        ) : (
          product.is_available && (
            <div className="flex items-center gap-2">
              {cartQty > 0 && (
                <span className="text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: '#2E86AB' }}>
                  {cartQty}
                </span>
              )}
              <Button
                size="sm"
                onClick={handleAdd}
                disabled={wrongVendor}
                title={wrongVendor ? t('cart.clearCartTooltip') : undefined}
              >
                +
              </Button>
            </div>
          )
        )}
      </div>
    </div>
  )
}
