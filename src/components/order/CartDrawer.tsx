import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import { useCart } from '../../contexts/CartContext'
import { useAuth } from '../../contexts/AuthContext'
import { useOrders } from '../../hooks/useOrders'
import { Button } from '../ui/Button'
import { useToast } from '../ui/Toast'
import type { Module, Building } from '../../types'

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

  const [modules, setModules] = useState<Module[]>([])
  const [buildings, setBuildings] = useState<Building[]>([])
  const [moduleId, setModuleId] = useState<number | null>(null)
  const [buildingId, setBuildingId] = useState<number | null>(null)
  const [spot, setSpot] = useState('')
  const [notes, setNotes] = useState('')
  const [placing, setPlacing] = useState(false)

  // Carrega módulos quando o drawer abre
  useEffect(() => {
    if (!open) return
    supabase
      .from('modules')
      .select('*')
      .order('number')
      .then(({ data }) => { if (data) setModules(data) })
  }, [open])

  // Carrega edifícios quando o módulo muda
  useEffect(() => {
    setBuildingId(null)
    if (!moduleId) { setBuildings([]); return }
    supabase
      .from('buildings')
      .select('*')
      .eq('module_id', moduleId)
      .order('name')
      .then(({ data }) => { if (data) setBuildings(data) })
  }, [moduleId])

  // Reseta o estado de localização ao fechar
  useEffect(() => {
    if (!open) {
      setModuleId(null)
      setBuildingId(null)
      setSpot('')
      setNotes('')
    }
  }, [open])

  async function handlePlaceOrder() {
    if (!vendorId) return
    if (!moduleId) { toast(t('cart.moduleRequired'), 'error'); return }

    const selectedModule   = modules.find(m => m.id === moduleId)
    const selectedBuilding = buildingId ? buildings.find(b => b.id === buildingId) : null
    const parts = [
      selectedModule?.name,
      selectedBuilding?.name ?? null,
      spot.trim() || null,
    ].filter(Boolean) as string[]
    const deliveryLocation = parts.join(' – ')

    setPlacing(true)
    const { data: orderId, error } = await createOrder(vendorId, items, deliveryLocation, notes || undefined)
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
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full max-w-lg rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col">

        {/* Header */}
        <div className="p-5 border-b border-sand-200 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold">
            {t('cart.title')} <span className="text-coral">({itemCount})</span>
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3">
          {items.length === 0 ? (
            <p className="text-center text-gray-400 font-body py-8">{t('cart.empty')}</p>
          ) : (
            <>
              {/* Lista de itens */}
              {items.map(item => (
                <div key={item.product.id} className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="font-semibold font-body text-gray-900">{item.product.name}</p>
                    <p className="text-sm text-gray-500 font-body">
                      R$ {item.product.price_brl.toFixed(2).replace('.', ',')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50"
                    >−</button>
                    <span className="w-6 text-center font-semibold font-body">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50"
                    >+</button>
                    <button
                      onClick={() => removeItem(item.product.id)}
                      className="ml-1 text-red-400 hover:text-red-600"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}

              {/* Total */}
              <div className="border-t border-sand-200 pt-3 mt-1">
                <div className="flex justify-between font-display font-bold text-lg">
                  <span>{t('cart.total')}</span>
                  <span className="text-coral">R$ {total.toFixed(2).replace('.', ',')}</span>
                </div>
              </div>

              {/* Seção de localização */}
              <div className="border-t border-sand-200 pt-3 mt-1 flex flex-col gap-3">
                <p className="text-sm font-semibold text-gray-700 font-body flex items-center gap-1.5">
                  📍 {t('cart.whereAreYou')}
                </p>

                {/* Módulo — obrigatório */}
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-700 font-body">
                    {t('cart.moduleLabel')} <span className="text-coral text-xs">*</span>
                  </label>
                  <select
                    value={moduleId ?? ''}
                    onChange={e => setModuleId(e.target.value ? Number(e.target.value) : null)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 font-body text-gray-900 focus:outline-none focus:ring-2 focus:ring-coral bg-white text-sm"
                  >
                    <option value="">{t('cart.modulePlaceholder')}</option>
                    {modules.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>

                {/* Edifício — opcional */}
                <div className="flex flex-col gap-1">
                  <label className={`text-sm font-semibold font-body ${moduleId ? 'text-gray-700' : 'text-gray-400'}`}>
                    {t('cart.buildingLabel')}
                  </label>
                  <select
                    value={buildingId ?? ''}
                    onChange={e => setBuildingId(e.target.value ? Number(e.target.value) : null)}
                    disabled={!moduleId}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 font-body text-gray-900 focus:outline-none focus:ring-2 focus:ring-coral bg-white text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {moduleId ? t('cart.buildingPlaceholder') : t('cart.buildingDisabled')}
                    </option>
                    {buildings.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                {/* Localização específica — opcional */}
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-700 font-body">
                    {t('cart.spotLabel')}
                  </label>
                  <input
                    type="text"
                    placeholder={t('cart.spotPlaceholder')}
                    value={spot}
                    onChange={e => setSpot(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 font-body text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-coral"
                  />
                </div>
              </div>

              {/* Observações */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-gray-700 font-body">{t('cart.notesLabel')}</label>
                <textarea
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 font-body text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-coral resize-none"
                  rows={2}
                  placeholder={t('cart.notesPlaceholder')}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>
            </>
          )}
        </div>

        {items.length > 0 && (
          <div className="p-5 border-t border-sand-200">
            <Button fullWidth size="lg" loading={placing} onClick={handlePlaceOrder}>
              {t('cart.placeOrder')} {total.toFixed(2).replace('.', ',')}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
