import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../contexts/AuthContext'
import { useVendorPresence } from '../../hooks/useVendorPresence'
import { useOrders } from '../../hooks/useOrders'
import { useToast } from '../../components/ui/Toast'
import { supabase } from '../../lib/supabase'
import { VendorStatusBanner } from '../../components/vendor/VendorStatusBanner'
import { OrderCard } from '../../components/order/OrderCard'
import { OrderChat } from '../../components/chat/OrderChat'
import { NavigationSheet } from '../../components/map/NavigationSheet'
import { Spinner } from '../../components/ui/Spinner'
import { Button } from '../../components/ui/Button'
import type { Order, OrderMessage, OrderStatus } from '../../types'

export function VendedorDashboard() {
  const { vendor, user } = useAuth()
  const { isLive, error, goLive, goOffline } = useVendorPresence(vendor)
  const { orders, loading, updateStatus } = useOrders('vendedor', vendor?.id ?? null)
  const toast = useToast()
  const { t } = useTranslation()

  // Chat state
  const [chatOrderId, setChatOrderId] = useState<string | null>(null)
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({})
  const chatOrderIdRef = useRef<string | null>(null)
  chatOrderIdRef.current = chatOrderId

  // Navigation state
  const [navigatingOrder, setNavigatingOrder] = useState<Order | null>(null)

  // New order notification
  const [newOrderAlert, setNewOrderAlert] = useState<Order | null>(null)
  const [countdown, setCountdown] = useState(60)

  const activeOrders = orders.filter(o => !['delivered', 'cancelled'].includes(o.status))
  const pastOrders = orders.filter(o => ['delivered', 'cancelled'].includes(o.status)).slice(0, 10)

  // Ref for active order IDs — avoids `activeOrders` as an effect dependency (new ref every render)
  const activeOrderIdsRef = useRef<string[]>([])
  activeOrderIdsRef.current = activeOrders.map(o => o.id)

  const handleStatusUpdate = useCallback(
    async (orderId: string, status: OrderStatus) => {
      const ok = await updateStatus(orderId, status)
      if (!ok) toast(t('orders.updateError'), 'error')
    },
    [updateStatus, toast, t],
  )

  async function handleMarkDelivered() {
    if (!navigatingOrder) return
    await handleStatusUpdate(navigatingOrder.id, 'delivered')
    setNavigatingOrder(null)
  }

  function openChat(orderId: string) {
    setChatOrderId(orderId)
    setUnreadCounts(prev => ({ ...prev, [orderId]: 0 }))
  }

  // ── New order notification channel ──
  useEffect(() => {
    if (!vendor?.id) return
    let channel: ReturnType<typeof supabase.channel> | null = null
    try {
      channel = supabase
        .channel(`new-order-alert-${vendor.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'orders',
            filter: `vendor_id=eq.${vendor.id}`,
          },
          (payload) => {
            setNewOrderAlert(payload.new as Order)
            setCountdown(60)
          },
        )
        .subscribe()
    } catch (err) {
      console.error('[new-order-alert] Realtime subscription error:', err)
    }
    return () => { if (channel) supabase.removeChannel(channel) }
  }, [vendor?.id])

  // ── Countdown auto-dismiss ──
  useEffect(() => {
    if (!newOrderAlert) return
    setCountdown(60)
    const interval = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(interval)
          // Auto-reject: treat as declined
          handleStatusUpdate(newOrderAlert.id, 'cancelled')
          setNewOrderAlert(null)
          return 0
        }
        return c - 1
      })
    }, 1_000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newOrderAlert?.id])

  // ── Message subscription for unread badges + toasts ──
  // Uses activeOrderIdsRef so we don't re-subscribe every time the orders array changes.
  useEffect(() => {
    if (!user?.id) return

    let channel: ReturnType<typeof supabase.channel> | null = null
    try {
      channel = supabase
        .channel(`vendor-messages-${user.id}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'order_messages' },
          (payload) => {
            const msg = payload.new as OrderMessage
            if (!activeOrderIdsRef.current.includes(msg.order_id)) return
            if (msg.sender_id === user.id) return

            if (chatOrderIdRef.current === msg.order_id) return

            setUnreadCounts(prev => ({
              ...prev,
              [msg.order_id]: (prev[msg.order_id] ?? 0) + 1,
            }))
            toast(
              `💬 Cliente: ${msg.message.length > 40 ? msg.message.slice(0, 40) + '…' : msg.message}`,
              'info',
            )
          },
        )
        .subscribe()
    } catch (err) {
      console.error('[vendor-messages] Realtime subscription error:', err)
    }

    return () => { if (channel) supabase.removeChannel(channel) }
  }, [user?.id, toast])

  const chatOrder = orders.find(o => o.id === chatOrderId)

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
        <h2 className="font-display text-xl font-semibold text-[#1A1A2E] mb-3">
          {t('orders.active')}
          {activeOrders.length > 0 && (
            <span className="ml-2 text-white text-sm px-2 py-0.5 rounded-full font-body font-bold inline-flex items-center" style={{ backgroundColor: '#2E86AB' }}>
              {activeOrders.length}
            </span>
          )}
        </h2>
        {loading ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : activeOrders.length === 0 ? (
          <div className="text-center py-8 text-[#6B7280] font-body">
            <p className="text-3xl mb-2">📭</p>
            <p>{t('orders.noPending')}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {activeOrders.map(o => (
              <OrderCard
                key={o.id}
                order={o}
                role="vendedor"
                onUpdateStatus={handleStatusUpdate}
                onNavigate={setNavigatingOrder}
                onOpenChat={openChat}
                unreadCount={unreadCounts[o.id] ?? 0}
              />
            ))}
          </div>
        )}
      </section>

      {pastOrders.length > 0 && (
        <section>
          <h2 className="font-display text-lg font-semibold text-[#6B7280] mb-3">
            {t('orders.history')}
          </h2>
          <div className="flex flex-col gap-3">
            {pastOrders.map(o => (
              <OrderCard key={o.id} order={o} role="vendedor" />
            ))}
          </div>
        </section>
      )}

      {/* Navigation sheet */}
      {navigatingOrder && vendor && (
        <NavigationSheet
          order={navigatingOrder}
          vendorId={vendor.id}
          onClose={() => setNavigatingOrder(null)}
          onMarkDelivered={handleMarkDelivered}
        />
      )}

      {/* Chat sheet */}
      {chatOrder && user && (
        <OrderChat
          open={chatOrderId !== null}
          onClose={() => setChatOrderId(null)}
          orderId={chatOrder.id}
          currentUserId={user.id}
          orderStatus={chatOrder.status}
          partnerName="Cliente"
        />
      )}

      {/* ── New order notification modal ── */}
      {newOrderAlert && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-5">
            {/* Header */}
            <div className="text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: 'rgba(46,134,171,0.1)' }}>
                <span className="text-3xl">🔔</span>
              </div>
              <h3 className="font-display text-xl font-bold text-[#1A1A2E]">Novo pedido!</h3>
              <p className="text-sm text-[#6B7280] font-body mt-1">
                R${' '}{newOrderAlert.total_brl.toFixed(2).replace('.', ',')}
                {newOrderAlert.delivery_location && (
                  <> · {newOrderAlert.delivery_location}</>
                )}
              </p>
            </div>

            {/* Countdown bar */}
            <div className="flex flex-col gap-1">
              <div className="h-1.5 rounded-full bg-[#E8E8E4] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{ width: `${(countdown / 60) * 100}%`, backgroundColor: '#2E86AB' }}
                />
              </div>
              <p className="text-xs text-center text-[#6B7280] font-body">
                Auto-recusa em {countdown}s
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="danger"
                size="lg"
                fullWidth
                onClick={() => {
                  handleStatusUpdate(newOrderAlert.id, 'cancelled')
                  setNewOrderAlert(null)
                }}
              >
                Recusar
              </Button>
              <Button
                size="lg"
                fullWidth
                onClick={() => {
                  handleStatusUpdate(newOrderAlert.id, 'confirmed')
                  setNewOrderAlert(null)
                }}
              >
                Aceitar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
