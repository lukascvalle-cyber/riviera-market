import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../contexts/AuthContext'
import { useOrders } from '../../hooks/useOrders'
import { OrderCard } from '../../components/order/OrderCard'
import { Spinner } from '../../components/ui/Spinner'

export function MyOrdersPage() {
  const { user } = useAuth()
  const { orders, loading } = useOrders('frequentador', user?.id ?? null)
  const { t } = useTranslation()
  const navigate = useNavigate()

  const handleTrack = useCallback((orderId: string) => {
    navigate(`/app/rastreamento/${orderId}`)
  }, [navigate])

  return (
    <div className="min-h-screen bg-sand pb-6">
      <div className="bg-white border-b border-sand-200">
        <div className="max-w-xl mx-auto px-4 py-5">
          <h1 className="font-display text-2xl font-bold text-gray-900">{t('orders.title')}</h1>
        </div>
      </div>
      <div className="max-w-xl mx-auto px-4 py-5 flex flex-col gap-3">
        {loading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">🌊</p>
            <p className="text-gray-500 font-body">{t('orders.empty')}</p>
          </div>
        ) : (
          orders.map(o => (
            <OrderCard key={o.id} order={o} role="frequentador" onTrack={handleTrack} />
          ))
        )}
      </div>
    </div>
  )
}
