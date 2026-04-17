import { useTranslation } from 'react-i18next'
import { MessageCircle } from 'lucide-react'
import { OrderStatusBadge } from './OrderStatusBadge'
import { Button } from '../ui/Button'
import { CATEGORY_EMOJI } from '../../lib/constants'
import type { Order, OrderStatus } from '../../types'

interface OrderCardProps {
  order: Order
  role: 'frequentador' | 'vendedor'
  onUpdateStatus?: (orderId: string, status: OrderStatus) => void
  onTrack?: (orderId: string) => void
  onNavigate?: (order: Order) => void
  onOpenChat?: (orderId: string) => void
  onReview?: (orderId: string, vendorId: string) => void
  unreadCount?: number
  isReviewed?: boolean
}

export function OrderCard({ order, role, onUpdateStatus, onTrack, onNavigate, onOpenChat, onReview, unreadCount, isReviewed }: OrderCardProps) {
  const { t } = useTranslation()
  const createdAt = new Date(order.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

  const isActive = !['delivered', 'cancelled'].includes(order.status)

  const VENDOR_ACTIONS: Partial<Record<OrderStatus, { label: string; next: OrderStatus }>> = {
    pending: { label: t('orders.confirm'), next: 'confirmed' },
    confirmed: { label: t('orders.onTheWay'), next: 'delivering' },
    delivering: { label: t('orders.markDelivered'), next: 'delivered' },
  }

  const action = role === 'vendedor' ? VENDOR_ACTIONS[order.status] : null

  return (
    <div
      className="bg-white rounded-2xl border border-[#E8E8E4] p-4 flex flex-col gap-3"
      style={{
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        borderLeft: isActive && role === 'vendedor' ? '4px solid #2E86AB' : undefined,
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            {order.vendor?.category && (
              <span className="text-lg">{CATEGORY_EMOJI[order.vendor.category]}</span>
            )}
            <p className="font-semibold font-body text-[#1A1A2E]">
              {order.vendor?.display_name ?? t('nav.orders')}
            </p>
          </div>
          <p className="text-xs text-[#6B7280] font-body mt-0.5">{createdAt}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      {order.order_items && order.order_items.length > 0 && (
        <ul className="flex flex-col gap-1">
          {order.order_items.map(item => (
            <li key={item.id} className="flex justify-between text-sm font-body text-[#6B7280]">
              <span>{item.quantity}× {item.product_name}</span>
              <span>R$ {(item.unit_price * item.quantity).toFixed(2).replace('.', ',')}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center justify-between border-t border-[#E8E8E4] pt-2">
        <div>
          <p className="font-display font-bold text-[#2E86AB]">
            R$ {order.total_brl.toFixed(2).replace('.', ',')}
          </p>
          {order.delivery_location && (
            <p className="text-xs text-[#6B7280] font-body mt-0.5">📍 {order.delivery_location}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Chat button — active orders only */}
          {['pending', 'confirmed', 'delivering'].includes(order.status) && onOpenChat && (
            <button
              onClick={() => onOpenChat(order.id)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium hover:bg-blue-50 transition-colors relative shrink-0"
              style={{ borderColor: '#2E86AB', color: '#2E86AB' }}
            >
              <MessageCircle className="w-4 h-4" />
              Mensagens
              {(unreadCount ?? 0) > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {(unreadCount ?? 0) > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          )}
          {/* Track button — only for frequentador on active orders */}
          {role === 'frequentador'
            && ['pending', 'confirmed', 'delivering'].includes(order.status)
            && onTrack && (
            <Button size="sm" variant="ghost" onClick={() => onTrack(order.id)}>
              📍 {t('tracking.trackButton')}
            </Button>
          )}
          {/* Review button — frequentador, delivered orders only */}
          {role === 'frequentador'
            && order.status === 'delivered'
            && onReview && (
            isReviewed ? (
              <span className="text-xs font-body font-semibold text-[#6B7280] flex items-center gap-1">
                ★ Avaliado
              </span>
            ) : (
              <Button size="sm" variant="ghost" onClick={() => onReview(order.id, order.vendor_id)}>
                ⭐ Avaliar
              </Button>
            )
          )}
          {/* Navigate button — shown when vendor is delivering or confirmed */}
          {role === 'vendedor'
            && ['confirmed', 'delivering'].includes(order.status)
            && onNavigate && (
            <Button size="sm" variant="ghost" onClick={() => onNavigate(order)}>
              🗺️ Navegar
            </Button>
          )}
          {action && onUpdateStatus && (
            <Button size="sm" onClick={() => onUpdateStatus(order.id, action.next)}>
              {action.label}
            </Button>
          )}
          {role === 'vendedor' && order.status === 'pending' && onUpdateStatus && (
            <Button size="sm" variant="danger" onClick={() => onUpdateStatus(order.id, 'cancelled')}>
              {t('orders.reject')}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
