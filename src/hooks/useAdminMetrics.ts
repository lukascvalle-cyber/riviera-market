import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export interface AdminMetrics {
  activeVendors: number
  ordersToday: number
  pendingOrders: number
  totalVendors: number
  totalUsers: number
  revenueToday: number
}

export function useAdminMetrics() {
  const [metrics, setMetrics] = useState<AdminMetrics>({
    activeVendors: 0,
    ordersToday: 0,
    pendingOrders: 0,
    totalVendors: 0,
    totalUsers: 0,
    revenueToday: 0,
  })
  const [loading, setLoading] = useState(true)

  const fetchMetrics = useCallback(async () => {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const [
      activeVendorsRes,
      ordersTodayRes,
      pendingOrdersRes,
      totalVendorsRes,
      totalUsersRes,
      todayOrdersRes,
    ] = await Promise.all([
      supabase.from('vendors').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('orders').select('*', { count: 'exact', head: true }).gte('created_at', todayStart.toISOString()),
      supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('vendors').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'frequentador'),
      supabase.from('orders').select('total_brl').gte('created_at', todayStart.toISOString()).neq('status', 'cancelled'),
    ])

    // Always log the frequentador count so RLS silently returning null is visible
    console.log('frequentador count:', totalUsersRes.count, 'error:', totalUsersRes.error)

    if (activeVendorsRes.error) console.error('[adminMetrics] vendors active:', activeVendorsRes.error.message)
    if (ordersTodayRes.error) console.error('[adminMetrics] orders today:', ordersTodayRes.error.message)
    if (pendingOrdersRes.error) console.error('[adminMetrics] orders pending:', pendingOrdersRes.error.message)
    if (totalVendorsRes.error) console.error('[adminMetrics] vendors total:', totalVendorsRes.error.message)
    if (totalUsersRes.error) console.error('[adminMetrics] profiles frequentador:', totalUsersRes.error.message)
    if (todayOrdersRes.error) console.error('[adminMetrics] revenue today:', todayOrdersRes.error.message)

    const revenueToday = (todayOrdersRes.data ?? []).reduce((sum, o) => sum + (o.total_brl ?? 0), 0)

    setMetrics({
      activeVendors: activeVendorsRes.count ?? 0,
      ordersToday: ordersTodayRes.count ?? 0,
      pendingOrders: pendingOrdersRes.count ?? 0,
      totalVendors: totalVendorsRes.count ?? 0,
      totalUsers: totalUsersRes.count ?? 0,
      revenueToday,
    })
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchMetrics()
    const timer = setInterval(fetchMetrics, 30_000)
    return () => clearInterval(timer)
  }, [fetchMetrics])

  return { metrics, loading, refresh: fetchMetrics }
}
