import { Badge } from '../ui/Badge'
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '../../lib/constants'
import type { OrderStatus } from '../../types'

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge className={ORDER_STATUS_COLORS[status]}>
      {ORDER_STATUS_LABELS[status]}
    </Badge>
  )
}
