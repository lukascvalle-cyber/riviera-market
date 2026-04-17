import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useCart } from '../../contexts/CartContext'
import { useAuth } from '../../contexts/AuthContext'
import { useOrders } from '../../hooks/useOrders'
import { Button } from '../ui/Button'
import { useToast } from '../ui/Toast'
import rivieraBuildings from '../../data/riviera-buildings.json'

const MODULES = [2, 3, 4, 5, 6, 7, 8]
const buildings = rivieraBuildings as Record<string, string[]>

type PaymentMethod = 'dinheiro' | 'pix' | 'cartao' | 'aproximacao'

const PAYMENT_OPTIONS: { value: PaymentMethod; label: string; icon: string }[] = [
  { value: 'dinheiro', label: 'Dinheiro', icon: '💵' },
  { value: 'pix',      label: 'Pix',      icon: '📱' },
  { value: 'cartao',   label: 'Cartão',   icon: '💳' },
  { value: 'aproximacao', label: 'Aproximação', icon: '📲' },
]

interface CartDrawerProps {
  open: boolean
  onClose: () => void
}

export function CartDrawer({ open, onClose }: CartDrawerProps) {
  const { items, vendorId, removeItem, updateQuantity, clearCart, total, itemCount } = useCart()
  const { user } = useAuth()
  const toast = useToast()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { createOrder } = useOrders('frequentador', user?.id ?? null)

  // Animation state — mount first, then make visible for CSS transition
  const [visible, setVisible] = useState(false)

  const [moduleNumber, setModuleNumber] = useState<number | null>(null)
  const [buildingName, setBuildingName] = useState('')
  const [buildingCustom, setBuildingCustom] = useState('')
  const [apartmentNumber, setApartmentNumber] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null)
  const [notes, setNotes] = useState('')
  const [placing, setPlacing] = useState(false)

  // Drive the slide-up animation
  useEffect(() => {
    if (open) {
      setTimeout(() => setVisible(true), 10)
    } else {
      setVisible(false)
    }
  }, [open])

  // Reset location/payment fields when drawer closes
  useEffect(() => {
    if (!open) {
      setModuleNumber(null)
      setBuildingName('')
      setBuildingCustom('')
      setApartmentNumber('')
      setPaymentMethod(null)
      setNotes('')
    }
  }, [open])

  // Reset building when module changes
  useEffect(() => {
    setBuildingName('')
    setBuildingCustom('')
  }, [moduleNumber])

  const buildingOptions = moduleNumber ? (buildings[String(moduleNumber)] ?? []) : []
  const isOther = buildingName === 'Outro'
  const resolvedBuilding = isOther ? buildingCustom.trim() : buildingName

  async function handlePlaceOrder() {
    if (!vendorId) return
    if (!moduleNumber) { toast(t('cart.moduleRequired'), 'error'); return }
    if (!paymentMethod) { toast(t('cart.paymentRequired'), 'error'); return }

    setPlacing(true)
    const { data: orderId, error } = await createOrder(
      vendorId,
      items,
      moduleNumber,
      resolvedBuilding || null,
      apartmentNumber.trim() || null,
      paymentMethod,
      notes || undefined,
    )
    setPlacing(false)
    if (error) { toast(t('cart.orderError'), 'error'); return }
    clearCart()
    onClose()
    if (orderId) {
      navigate(`/app/rastreamento/${orderId}`)
    } else {
      toast(t('cart.orderSuccess'), 'success')
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px] transition-opacity duration-300"
        style={{ opacity: visible ? 1 : 0 }}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className="relative bg-white w-full max-w-lg rounded-t-[20px] shadow-2xl flex flex-col"
        style={{
          maxHeight: '90vh',
          transform: visible ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.3s ease-out',
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-8 h-1 rounded-full bg-[#E8E8E4]" />
        </div>

        {/* Header */}
        <div className="px-5 pb-4 pt-2 border-b border-[#E8E8E4] flex items-center justify-between shrink-0">
          <h2 className="font-display text-xl font-semibold text-[#1A1A2E]">
            {t('cart.title')}
            {itemCount > 0 && (
              <span className="ml-2 text-[#2E86AB] text-lg">({itemCount})</span>
            )}
          </h2>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#F5E6D3]/60 flex items-center justify-center text-[#6B7280] hover:bg-[#F5E6D3] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <p className="text-center text-[#6B7280] font-body py-12">{t('cart.empty')}</p>
          ) : (
            <div className="px-5 py-4 flex flex-col gap-5">

              {/* ── Item list ── */}
              <div className="flex flex-col divide-y divide-[#E8E8E4]">
                {items.map(item => (
                  <div key={item.product.id} className="flex items-center gap-3 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold font-body text-[#1A1A2E] text-[15px] leading-snug truncate">
                        {item.product.name}
                      </p>
                      <p className="text-sm text-[#6B7280] font-body mt-0.5">
                        R${' '}{item.product.price_brl.toFixed(2).replace('.', ',')}
                      </p>
                    </div>
                    {/* Quantity stepper */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        className="w-8 h-8 rounded-full border border-[#E8E8E4] flex items-center justify-center text-[#2E86AB] font-bold hover:bg-[#2E86AB]/10 transition-colors"
                      >
                        −
                      </button>
                      <span className="w-6 text-center font-bold font-body text-[#1A1A2E]">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        className="w-8 h-8 rounded-full border border-[#E8E8E4] flex items-center justify-center text-[#2E86AB] font-bold hover:bg-[#2E86AB]/10 transition-colors"
                      >
                        +
                      </button>
                      <button
                        onClick={() => removeItem(item.product.id)}
                        className="ml-1 w-7 h-7 flex items-center justify-center text-[#E63946]/40 hover:text-[#E63946] transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    {/* Subtotal */}
                    <p className="text-sm font-bold font-body text-[#1A1A2E] w-16 text-right shrink-0">
                      R${' '}{(item.product.price_brl * item.quantity).toFixed(2).replace('.', ',')}
                    </p>
                  </div>
                ))}
              </div>

              {/* ── Total ── */}
              <div className="flex justify-between items-center border-t border-[#E8E8E4] pt-4">
                <span className="font-display font-bold text-[#1A1A2E] text-lg">{t('cart.total')}</span>
                <span className="font-display font-bold text-[#1A1A2E] text-2xl">
                  R${' '}{total.toFixed(2).replace('.', ',')}
                </span>
              </div>

              {/* ── Location ── */}
              <div className="flex flex-col gap-3">
                <p className="text-sm font-semibold text-[#1A1A2E] font-body flex items-center gap-1.5">
                  📍 {t('cart.whereAreYou')}
                </p>

                {/* Módulo */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-[#1A1A2E] font-body">
                    {t('cart.moduleLabel')} <span className="text-[#2E86AB] text-xs">*</span>
                  </label>
                  <select
                    value={moduleNumber ?? ''}
                    onChange={e => setModuleNumber(e.target.value ? Number(e.target.value) : null)}
                    className="w-full rounded-[10px] border border-[#E8E8E4] px-4 py-3 font-body text-[#1A1A2E] focus:outline-none focus:ring-2 focus:ring-[#2E86AB] bg-white text-sm"
                  >
                    <option value="">{t('cart.modulePlaceholder')}</option>
                    {MODULES.map(m => (
                      <option key={m} value={m}>Módulo {m}</option>
                    ))}
                  </select>
                </div>

                {/* Edifício */}
                <div className="flex flex-col gap-1.5">
                  <label className={`text-sm font-semibold font-body ${moduleNumber ? 'text-[#1A1A2E]' : 'text-[#6B7280]'}`}>
                    {t('cart.buildingLabel')}
                  </label>
                  <select
                    value={buildingName}
                    onChange={e => setBuildingName(e.target.value)}
                    disabled={!moduleNumber}
                    className="w-full rounded-[10px] border border-[#E8E8E4] px-4 py-3 font-body text-[#1A1A2E] focus:outline-none focus:ring-2 focus:ring-[#2E86AB] bg-white text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">{t('cart.buildingPlaceholder')}</option>
                    {buildingOptions.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                  {isOther && (
                    <input
                      type="text"
                      placeholder={t('cart.buildingOtherPlaceholder')}
                      value={buildingCustom}
                      onChange={e => setBuildingCustom(e.target.value)}
                      className="mt-1 w-full rounded-[10px] border border-[#E8E8E4] px-4 py-3 font-body text-sm text-[#1A1A2E] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#2E86AB]"
                    />
                  )}
                </div>

                {/* Apartamento */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-[#1A1A2E] font-body">
                    {t('cart.apartmentLabel')}
                  </label>
                  <input
                    type="text"
                    placeholder={t('cart.apartmentPlaceholder')}
                    value={apartmentNumber}
                    onChange={e => setApartmentNumber(e.target.value)}
                    className="w-full rounded-[10px] border border-[#E8E8E4] px-4 py-3 font-body text-sm text-[#1A1A2E] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#2E86AB]"
                  />
                </div>
              </div>

              {/* ── Payment method ── */}
              <div className="flex flex-col gap-3">
                <p className="text-sm font-semibold text-[#1A1A2E] font-body">
                  {t('cart.paymentMethod')} <span className="text-[#2E86AB] text-xs">*</span>
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {PAYMENT_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setPaymentMethod(opt.value)}
                      className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 font-body text-sm font-semibold transition-colors ${
                        paymentMethod === opt.value
                          ? 'border-[#2E86AB] bg-[#2E86AB] text-white'
                          : 'border-[#E8E8E4] bg-white text-[#6B7280] hover:border-[#2E86AB]/40'
                      }`}
                    >
                      <span className="text-lg">{opt.icon}</span>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Notes ── */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[#1A1A2E] font-body">
                  {t('cart.notesLabel')}
                </label>
                <textarea
                  className="w-full rounded-[10px] border border-[#E8E8E4] px-4 py-3 font-body text-sm placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#2E86AB] resize-none"
                  rows={2}
                  placeholder={t('cart.notesPlaceholder')}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>

            </div>
          )}
        </div>

        {/* ── Confirm button ── */}
        {items.length > 0 && (
          <div
            className="shrink-0 px-5 pt-3 pb-5 border-t border-[#E8E8E4] bg-white"
            style={{ paddingBottom: 'max(20px, env(safe-area-inset-bottom))' }}
          >
            <button
              onClick={handlePlaceOrder}
              disabled={placing}
              className="w-full h-[52px] bg-[#2E86AB] text-white font-semibold rounded-xl hover:bg-[#2E86AB]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {placing && (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              )}
              {t('cart.placeOrder')} {total.toFixed(2).replace('.', ',')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
