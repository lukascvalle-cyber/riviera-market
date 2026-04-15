import { useTranslation } from 'react-i18next'
import { Badge } from '../ui/Badge'
import { ORDER_STATUS_COLORS } from '../../lib/constants'
import type { OrderStatus } from '../../types'

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const { t } = useTranslation()
  return (
    <Badge className={ORDER_STATUS_COLORS[status]}>
      {t(`orderStatus.${status}`)}
    </Badge>
  )
}
