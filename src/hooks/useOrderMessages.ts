import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { OrderMessage } from '../types'

export function useOrderMessages(orderId: string | null, currentUserId: string | null) {
  const [messages, setMessages] = useState<OrderMessage[]>([])
  const [loading, setLoading] = useState(true)

  // Initial fetch
  useEffect(() => {
    if (!orderId) { setLoading(false); return }
    setLoading(true)
    supabase
      .from('order_messages')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        setMessages((data as OrderMessage[]) ?? [])
        setLoading(false)
      })
  }, [orderId])

  // Realtime — only subscribes when orderId is set
  useEffect(() => {
    if (!orderId) return

    let channel: ReturnType<typeof supabase.channel> | null = null
    try {
      channel = supabase
        .channel(`chat-${orderId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'order_messages',
            filter: `order_id=eq.${orderId}`,
          },
          (payload) => {
            setMessages(prev => {
              const msg = payload.new as OrderMessage
              // Deduplicate in case the insert is reflected back to the sender
              if (prev.some(m => m.id === msg.id)) return prev
              return [...prev, msg]
            })
          },
        )
        .subscribe()
    } catch (err) {
      console.error('[useOrderMessages] Realtime subscription error:', err)
    }

    return () => { if (channel) supabase.removeChannel(channel) }
  }, [orderId])

  const sendMessage = useCallback(
    async (text: string) => {
      if (!orderId || !currentUserId || !text.trim()) return
      await supabase.from('order_messages').insert({
        order_id: orderId,
        sender_id: currentUserId,
        message: text.trim(),
      })
    },
    [orderId, currentUserId],
  )

  return { messages, loading, sendMessage }
}
