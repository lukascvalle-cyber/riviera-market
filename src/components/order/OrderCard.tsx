import { OrderStatusBadge } from './OrderStatusBadge'
import { Button } from '../ui/Button'
import { CATEGORY_EMOJI } from '../../lib/constants'
import type { Order, OrderStatus } from '../../types'

interface OrderCardProps {
  order: Order
  role: 'frequentador' | 'vendedor'
  onUpdateStatus?: (orderId: string, status: OrderStatus) => void
}

const VENDOR_ACTIONS: Partial<Record<OrderStatus, { label: string; next: OrderStatus }>> = {
  pending: { label: 'Confirmar pedido', next: 'confirmed' },
  confirmed: { label: 'A caminho', next: 'delivering' },
  delivering: { label: 'Marcar entregue', next: 'delivered' },
}

export function OrderCard({ order, role, onUpdateStatus }: OrderCardProps) {
  const action = role === 'vendedor' ? VENDOR_ACTIONS[order.status] : null
  const createdAt = new Date(order.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="bg-white rounded-2xl border border-sand-200 p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            {order.vendor?.category && (
              <span className="text-lg">{CATEGORY_EMOJI[order.vendor.category]}</span>
            )}
            <p className="font-semibold font-body text-gray-900">
              {order.vendor?.display_name ?? 'Pedido'}
            </p>
          </div>
          <p className="text-xs text-gray-400 font-body mt-0.5">{createdAt}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      {order.order_items && order.order_items.length > 0 && (
        <ul className="flex flex-col gap-1">
          {order.order_items.map(item => (
            <li key={item.id} className="flex justify-between text-sm font-body text-gray-700">
              <span>{item.quantity}× {item.product_name}</span>
              <span className="text-gray-500">R$ {(item.unit_price * item.quantity).toFixed(2).replace('.', ',')}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center justify-between border-t border-sand-100 pt-2">
        <div>
          <p className="font-display font-bold text-coral">
            R$ {order.total_brl.toFixed(2).replace('.', ',')}
          </p>
          {order.delivery_location && (
            <p className="text-xs text-gray-500 font-body mt-0.5">📍 {order.delivery_location}</p>
          )}
        </div>
        {action && onUpdateStatus && (
          <Button size="sm" onClick={() => onUpdateStatus(order.id, action.next)}>
            {action.label}
          </Button>
        )}
        {role === 'vendedor' && order.status === 'pending' && onUpdateStatus && (
          <Button size="sm" variant="danger" className="ml-2" onClick={() => onUpdateStatus(order.id, 'cancelled')}>
            Recusar
          </Button>
        )}
      </div>
    </div>
  )
}
