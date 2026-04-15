import { useTranslation } from 'react-i18next'
import { useAdminMetrics } from '../../hooks/useAdminMetrics'
import { Card } from '../../components/ui/Card'
import { Spinner } from '../../components/ui/Spinner'

interface MetricCardProps {
  label: string
  value: number | string
  icon: string
  color: string
}

function MetricCard({ label, value, icon, color }: MetricCardProps) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-body">{label}</p>
          <p className={`text-3xl font-display font-bold mt-1 ${color}`}>{value}</p>
        </div>
        <span className="text-3xl">{icon}</span>
      </div>
    </Card>
  )
}

export function AdminDashboard() {
  const { metrics, loading } = useAdminMetrics()
  const { t } = useTranslation()

  if (loading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="font-display text-3xl font-bold text-gray-900 mb-6">{t('admin.dashboard')}</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard label={t('admin.activeVendors')} value={metrics.activeVendors} icon="🟢" color="text-green-600" />
        <MetricCard label={t('admin.ordersToday')} value={metrics.ordersToday} icon="📦" color="text-coral" />
        <MetricCard label={t('admin.pendingOrders')} value={metrics.pendingOrders} icon="⏳" color="text-yellow-600" />
        <MetricCard label={t('admin.totalVendors')} value={metrics.totalVendors} icon="🛍️" color="text-ocean" />
      </div>
      <p className="text-xs text-gray-400 font-body">{t('admin.autoUpdate')}</p>
    </div>
  )
}
