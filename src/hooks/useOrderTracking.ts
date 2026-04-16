import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Order, VendorLocation } from '../types'

export function useOrderTracking(orderId: string | null) {
  const [order, setOrder] = useState<Order | null>(null)
  const [vendorLocation, setVendorLocation] = useState<VendorLocation | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchOrder = useCallback(async () => {
    if (!orderId) { setLoading(false); return }
    const { data } = await supabase
      .from('orders')
      .select('*, order_items (*), vendor:vendors (display_name, category, logo_url)')
      .eq('id', orderId)
      .single()

    if (data) {
      setOrder(data as Order)
      // Fetch the vendor's current location
      const { data: loc } = await supabase
        .from('vendor_locations')
        .select('*')
        .eq('vendor_id', data.vendor_id)
        .single()
      if (loc) setVendorLocation(loc as VendorLocation)
    }
    setLoading(false)
  }, [orderId])

  useEffect(() => { fetchOrder() }, [fetchOrder])

  // Realtime: order status changes (e.g. vendor confirms, starts delivering, marks delivered)
  useEffect(() => {
    if (!orderId) return
    let ch: ReturnType<typeof supabase.channel> | null = null
    try {
      ch = supabase
        .channel(`order-track-status-${orderId}`)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
          (payload) => {
            setOrder(prev => prev ? { ...prev, ...(payload.new as Partial<Order>) } : null)
          },
        )
        .subscribe()
    } catch (err) {
      console.error('[useOrderTracking] status subscription error:', err)
    }
    return () => { if (ch) supabase.removeChannel(ch) }
  }, [orderId])

  // Realtime: vendor GPS position updates (starts after we know the vendor_id)
  useEffect(() => {
    if (!order?.vendor_id) return
    const vendorId = order.vendor_id

    let ch: ReturnType<typeof supabase.channel> | null = null
    try {
      ch = supabase
        .channel(`order-track-loc-${vendorId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'vendor_locations', filter: `vendor_id=eq.${vendorId}` },
          (payload) => {
            if (payload.new && Object.keys(payload.new).length > 0) {
              setVendorLocation(payload.new as VendorLocation)
            }
          },
        )
        .subscribe()
    } catch (err) {
      console.error('[useOrderTracking] location subscription error:', err)
    }

    return () => { if (ch) supabase.removeChannel(ch) }
  }, [order?.vendor_id])

  return { order, vendorLocation, loading }
}
