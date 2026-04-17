import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../contexts/AuthContext'
import { useOrders } from '../../hooks/useOrders'
import { useToast } from '../../components/ui/Toast'
import { supabase } from '../../lib/supabase'
import { OrderCard } from '../../components/order/OrderCard'
import { OrderChat } from '../../components/chat/OrderChat'
import { Spinner } from '../../components/ui/Spinner'
import type { OrderMessage } from '../../types'

export function MyOrdersPage() {
  const { user } = useAuth()
  const { orders, loading } = useOrders('frequentador', user?.id ?? null)
  const { t } = useTranslation()
  const navigate = useNavigate()
  const toast = useToast()

  const [chatOrderId, setChatOrderId] = useState<string | null>(null)
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({})

  // Keep chat order id in a ref so the subscription callback always sees the latest value
  const chatOrderIdRef = useRef<string | null>(null)
  chatOrderIdRef.current = chatOrderId

  // Ref for active order IDs — updated every render, avoids `orders` as an effect dependency
  const activeIdsRef = useRef<string[]>([])
  activeIdsRef.current = orders
    .filter(o => !['delivered', 'cancelled'].includes(o.status))
    .map(o => o.id)

  const handleTrack = useCallback((orderId: string) => {
    navigate(`/app/rastreamento/${orderId}`)
  }, [navigate])

  function openChat(orderId: string) {
    setChatOrderId(orderId)
    setUnreadCounts(prev => ({ ...prev, [orderId]: 0 }))
  }

  // Subscribe to new messages for all active orders — shows toasts and increments unread badges.
  // Uses activeIdsRef so we don't re-subscribe every time the orders array reference changes.
  useEffect(() => {
    if (!user?.id) return

    let channel: ReturnType<typeof supabase.channel> | null = null
    try {
      channel = supabase
        .channel(`buyer-messages-${user.id}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'order_messages' },
          (payload) => {
            const msg = payload.new as OrderMessage
            // Ignore messages not in our active orders, or sent by us
            if (!activeIdsRef.current.includes(msg.order_id)) return
            if (msg.sender_id === user.id) return

            if (chatOrderIdRef.current === msg.order_id) {
              // Chat is open — OrderChat handles display, no badge needed
              return
            }
            // Chat is closed — increment badge and show toast
            setUnreadCounts(prev => ({
              ...prev,
              [msg.order_id]: (prev[msg.order_id] ?? 0) + 1,
            }))
            toast(`💬 ${msg.message.length > 40 ? msg.message.slice(0, 40) + '…' : msg.message}`, 'info')
          },
        )
        .subscribe()
    } catch (err) {
      console.error('[buyer-messages] Realtime subscription error:', err)
    }

    return () => { if (channel) supabase.removeChannel(channel) }
  }, [user?.id, toast])

  const chatOrder = orders.find(o => o.id === chatOrderId)

  return (
    <div className="min-h-screen pb-6" style={{ backgroundColor: '#FAFAF8' }}>
      <div className="bg-white border-b border-[#E8E8E4]">
        <div className="max-w-xl mx-auto px-4 py-5">
          <h1 className="font-display text-2xl font-bold text-[#1A1A2E]">{t('orders.title')}</h1>
        </div>
      </div>
      <div className="max-w-xl mx-auto px-4 py-5 flex flex-col gap-3">
        {loading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">🌊</p>
            <p className="text-[#6B7280] font-body">{t('orders.empty')}</p>
          </div>
        ) : (
          orders.map(o => (
            <OrderCard
              key={o.id}
              order={o}
              role="frequentador"
              onTrack={handleTrack}
              onOpenChat={openChat}
              unreadCount={unreadCounts[o.id] ?? 0}
            />
          ))
        )}
      </div>

      {chatOrder && user && (
        <OrderChat
          open={chatOrderId !== null}
          onClose={() => setChatOrderId(null)}
          orderId={chatOrder.id}
          currentUserId={user.id}
          orderStatus={chatOrder.status}
          partnerName={chatOrder.vendor?.display_name ?? 'Vendedor'}
        />
      )}
    </div>
  )
}
