import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Order, OrderStatus, CartItem } from '../types'

export function useOrders(mode: 'frequentador' | 'vendedor', id: string | null) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  const fetchOrders = useCallback(async () => {
    if (!id) { setLoading(false); return }
    let query = supabase
      .from('orders')
      .select(`
        *,
        order_items (*),
        vendor:vendors (display_name, category, logo_url)
      `)
      .order('created_at', { ascending: false })

    if (mode === 'frequentador') {
      query = query.eq('frequentador_id', id)
    } else {
      query = query.eq('vendor_id', id)
    }

    const { data } = await query
    if (data) setOrders(data)
    setLoading(false)
  }, [id, mode])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  useEffect(() => {
    if (!id) return
    const filter = mode === 'vendedor'
      ? `vendor_id=eq.${id}`
      : `frequentador_id=eq.${id}`

    const channel = supabase
      .channel(`orders-${mode}-${id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter },
        () => { fetchOrders() },
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [id, mode, fetchOrders])

  async function createOrder(
    vendorId: string,
    items: CartItem[],
    moduleNumber: number,
    buildingName: string | null,
    apartmentNumber: string | null,
    paymentMethod: string,
    notes?: string,
  ) {
    const total = items.reduce((s, i) => s + i.product.price_brl * i.quantity, 0)

    // Build a human-readable delivery location string for legacy display
    const locationParts = [
      `Módulo ${moduleNumber}`,
      buildingName ?? null,
      apartmentNumber ?? null,
    ].filter(Boolean) as string[]
    const deliveryLocation = locationParts.join(' – ')

    // Insert order atomically via RPC
    const { data, error } = await supabase.rpc('create_order', {
      p_vendor_id: vendorId,
      p_delivery_location: deliveryLocation,
      p_total_brl: total,
      p_notes: notes ?? null,
      p_items: items.map(i => ({
        product_id: i.product.id,
        quantity: i.quantity,
        unit_price: i.product.price_brl,
        product_name: i.product.name,
      })),
    })

    if (error) return { data: null, error }

    // Persist structured location fields
    if (data) {
      await supabase
        .from('orders')
        .update({
          module_number: moduleNumber,
          building_name: buildingName,
          apartment_number: apartmentNumber,
          payment_method: paymentMethod,
        })
        .eq('id', data)
    }

    await fetchOrders()
    return { data, error: null }
  }

  async function updateStatus(orderId: string, status: OrderStatus) {
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId)
    if (!error) {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o))
    }
    return !error
  }

  return { orders, loading, createOrder, updateStatus, refresh: fetchOrders }
}
