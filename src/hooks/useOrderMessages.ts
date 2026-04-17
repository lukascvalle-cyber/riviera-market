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
        .subscribe((status, err) => {
          if (err) console.error('[useOrderMessages] Realtime error:', err)
          else if (status === 'CHANNEL_ERROR') console.error('[useOrderMessages] Channel error for order:', orderId)
          else console.log('[useOrderMessages] Realtime status:', status, 'order:', orderId)
        })
    } catch (err) {
      console.error('[useOrderMessages] Realtime subscription error:', err)
    }

    return () => { if (channel) supabase.removeChannel(channel) }
  }, [orderId])

  const sendMessage = useCallback(
    async (text: string) => {
      if (!orderId || !currentUserId || !text.trim()) {
        console.error('[sendMessage] guard failed — orderId:', orderId, 'currentUserId:', currentUserId)
        return { error: new Error('Missing orderId or currentUserId') }
      }
      const payload = { order_id: orderId, sender_id: currentUserId, message: text.trim() }
      console.log('[sendMessage] inserting:', payload)
      const { data, error } = await supabase.from('order_messages').insert(payload).select()
      console.log('[sendMessage] result — data:', data, 'error:', error)
      return { error }
    },
    [orderId, currentUserId],
  )

  return { messages, loading, sendMessage }
}
