import { useState } from 'react'
import { useCart } from '../../contexts/CartContext'
import { useAuth } from '../../contexts/AuthContext'
import { useOrders } from '../../hooks/useOrders'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { useToast } from '../ui/Toast'

interface CartDrawerProps {
  open: boolean
  onClose: () => void
}

export function CartDrawer({ open, onClose }: CartDrawerProps) {
  const { items, vendorId, removeItem, updateQuantity, clearCart, total, itemCount } = useCart()
  const { user } = useAuth()
  const toast = useToast()
  const { createOrder } = useOrders('frequentador', user?.id ?? null)
  const [deliveryLocation, setDeliveryLocation] = useState('')
  const [notes, setNotes] = useState('')
  const [placing, setPlacing] = useState(false)

  async function handlePlaceOrder() {
    if (!vendorId) return
    if (!deliveryLocation.trim()) { toast('Indique a sua localização na praia', 'error'); return }
    setPlacing(true)
    const { error } = await createOrder(vendorId, items, deliveryLocation, notes || undefined)
    setPlacing(false)
    if (error) { toast('Erro ao fazer pedido. Tente novamente.', 'error'); return }
    toast('Pedido feito com sucesso! O vendedor irá confirmar em breve.', 'success')
    clearCart()
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full max-w-lg rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col">
        <div className="p-5 border-b border-sand-200 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold">
            Carrinho <span className="text-coral">({itemCount})</span>
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3">
          {items.length === 0 ? (
            <p className="text-center text-gray-400 font-body py-8">O seu carrinho está vazio</p>
          ) : (
            <>
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

              <div className="border-t border-sand-200 pt-3 mt-2">
                <div className="flex justify-between font-display font-bold text-lg">
                  <span>Total</span>
                  <span className="text-coral">R$ {total.toFixed(2).replace('.', ',')}</span>
                </div>
              </div>

              <Input
                label="Onde você está na praia?"
                placeholder="Ex: guarda-sol 14, setor B, perto dos coqueiros..."
                value={deliveryLocation}
                onChange={e => setDeliveryLocation(e.target.value)}
              />
              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-gray-700 font-body">Observações (opcional)</label>
                <textarea
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 font-body text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-coral resize-none"
                  rows={2}
                  placeholder="Sem gelo, extra limão..."
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
              Fazer pedido · R$ {total.toFixed(2).replace('.', ',')}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
