import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { OrderStatusBadge } from '../../components/order/OrderStatusBadge'
import { Spinner } from '../../components/ui/Spinner'
import { ORDER_STATUS_LABELS } from '../../lib/constants'
import type { Order, OrderStatus } from '../../types'

const ALL_STATUSES: Array<OrderStatus | 'all'> = ['all', 'pending', 'confirmed', 'delivering', 'delivered', 'cancelled']

export function OrdersManagementPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all')

  useEffect(() => {
    let query = supabase
      .from('orders')
      .select('*, vendor:vendors(display_name, category), order_items(*)')
      .order('created_at', { ascending: false })
      .limit(100)
    if (filter !== 'all') query = query.eq('status', filter)
    query.then(({ data }) => { if (data) setOrders(data); setLoading(false) })
  }, [filter])

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="font-display text-3xl font-bold text-gray-900 mb-6">Pedidos</h1>

      <div className="flex gap-2 mb-5 flex-wrap">
        {ALL_STATUSES.map(s => (
          <button
            key={s}
            onClick={() => { setLoading(true); setFilter(s) }}
            className={`px-3 py-1.5 rounded-full text-sm font-semibold font-body border transition-all ${
              filter === s ? 'bg-coral text-white border-coral' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
            }`}
          >
            {s === 'all' ? 'Todos' : ORDER_STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : (
        <div className="bg-white rounded-2xl border border-sand-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-sand-50 border-b border-sand-200">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600 font-body">Vendedor</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600 font-body">Hora</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600 font-body">Itens</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600 font-body">Total</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600 font-body">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand-100">
              {orders.map(o => (
                <tr key={o.id} className="hover:bg-sand-50 transition-colors">
                  <td className="px-4 py-3 font-semibold font-body text-gray-900 text-sm">
                    {o.vendor?.display_name ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 font-body">
                    {new Date(o.created_at).toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 font-body">
                    {o.order_items?.length ?? 0} {(o.order_items?.length ?? 0) === 1 ? 'item' : 'itens'}
                  </td>
                  <td className="px-4 py-3 font-display font-bold text-coral text-sm">
                    R$ {o.total_brl.toFixed(2).replace('.', ',')}
                  </td>
                  <td className="px-4 py-3">
                    <OrderStatusBadge status={o.status} />
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-400 font-body">Sem pedidos</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
