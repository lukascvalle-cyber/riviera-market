import { useTranslation } from 'react-i18next'
import { useAuth } from '../../contexts/AuthContext'
import { useVendorPresence } from '../../hooks/useVendorPresence'
import { useOrders } from '../../hooks/useOrders'
import { VendorStatusBanner } from '../../components/vendor/VendorStatusBanner'
import { OrderCard } from '../../components/order/OrderCard'
import { Spinner } from '../../components/ui/Spinner'
import type { OrderStatus } from '../../types'
import { useToast } from '../../components/ui/Toast'

export function VendedorDashboard() {
  const { vendor } = useAuth()
  const { isLive, error, goLive, goOffline } = useVendorPresence(vendor)
  const { orders, loading, updateStatus } = useOrders('vendedor', vendor?.id ?? null)
  const toast = useToast()
  const { t } = useTranslation()

  const activeOrders = orders.filter(o => !['delivered', 'cancelled'].includes(o.status))
  const pastOrders = orders.filter(o => ['delivered', 'cancelled'].includes(o.status)).slice(0, 10)

  async function handleStatusUpdate(orderId: string, status: OrderStatus) {
    const ok = await updateStatus(orderId, status)
    if (!ok) toast(t('orders.updateError'), 'error')
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-5 flex flex-col gap-5">
      <VendorStatusBanner
        isLive={isLive}
        isApproved={vendor?.is_approved ?? false}
        onGoLive={goLive}
        onGoOffline={goOffline}
        error={error}
      />

      <section>
        <h2 className="font-display text-xl font-semibold text-gray-900 mb-3">
          {t('orders.active')}
          {activeOrders.length > 0 && (
            <span className="ml-2 bg-coral text-white text-sm px-2 py-0.5 rounded-full font-body font-bold">
              {activeOrders.length}
            </span>
          )}
        </h2>
        {loading ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : activeOrders.length === 0 ? (
          <div className="text-center py-8 text-gray-400 font-body">
            <p className="text-3xl mb-2">📭</p>
            <p>{t('orders.noPending')}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {activeOrders.map(o => (
              <OrderCard key={o.id} order={o} role="vendedor" onUpdateStatus={handleStatusUpdate} />
            ))}
          </div>
        )}
      </section>

      {pastOrders.length > 0 && (
        <section>
          <h2 className="font-display text-lg font-semibold text-gray-700 mb-3">{t('orders.history')}</h2>
          <div className="flex flex-col gap-3">
            {pastOrders.map(o => (
              <OrderCard key={o.id} order={o} role="vendedor" />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
