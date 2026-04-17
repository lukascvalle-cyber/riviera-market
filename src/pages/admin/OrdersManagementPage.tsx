import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import { OrderStatusBadge } from '../../components/order/OrderStatusBadge'
import { Spinner } from '../../components/ui/Spinner'
import type { Order, OrderStatus } from '../../types'

const ALL_STATUSES: Array<OrderStatus | 'all'> = ['all', 'pending', 'confirmed', 'delivering', 'delivered', 'cancelled']

export function OrdersManagementPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all')
  const { t } = useTranslation()

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
      <h1 className="font-display text-3xl font-bold text-[#1A1A2E] mb-6">{t('admin.orders')}</h1>

      <div className="flex gap-2 mb-5 flex-wrap">
        {ALL_STATUSES.map(s => (
          <button
            key={s}
            onClick={() => { setLoading(true); setFilter(s) }}
            className={`px-3 py-1.5 rounded-full text-sm font-semibold font-body border transition-all`}
            style={
              filter === s
                ? { backgroundColor: '#2E86AB', color: 'white', borderColor: '#2E86AB' }
                : { backgroundColor: 'white', color: '#6B7280', borderColor: '#E8E8E4' }
            }
          >
            {s === 'all' ? t('admin.all') : t(`orderStatus.${s}`)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#E8E8E4] overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <table className="w-full">
            <thead className="border-b border-[#E8E8E4]" style={{ backgroundColor: '#FAFAF8' }}>
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] font-body uppercase tracking-wide">{t('admin.vendor')}</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] font-body uppercase tracking-wide">{t('admin.time')}</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] font-body uppercase tracking-wide">{t('admin.items')}</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] font-body uppercase tracking-wide">{t('admin.total')}</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] font-body uppercase tracking-wide">{t('admin.status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E8E4]">
              {orders.map((o, idx) => (
                <tr key={o.id} className="hover:bg-[#FAFAF8] transition-colors" style={{ backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#FAFAF8' }}>
                  <td className="px-4 py-3 font-semibold font-body text-[#1A1A2E] text-sm">
                    {o.vendor?.display_name ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-[#6B7280] font-body">
                    {new Date(o.created_at).toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                  </td>
                  <td className="px-4 py-3 text-sm text-[#6B7280] font-body">
                    {o.order_items?.length ?? 0} {t(`admin.items`).toLowerCase()}
                  </td>
                  <td className="px-4 py-3 font-display font-bold text-[#2E86AB] text-sm">
                    R$ {o.total_brl.toFixed(2).replace('.', ',')}
                  </td>
                  <td className="px-4 py-3">
                    <OrderStatusBadge status={o.status} />
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-[#6B7280] font-body">{t('admin.noOrders')}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
