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
      { count: activeVendors },
      { count: ordersToday },
      { count: pendingOrders },
      { count: totalVendors },
      { count: totalUsers },
      { data: todayOrdersData },
    ] = await Promise.all([
      supabase.from('vendors').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('orders').select('*', { count: 'exact', head: true }).gte('created_at', todayStart.toISOString()),
      supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('vendors').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'frequentador'),
      supabase.from('orders').select('total_brl').gte('created_at', todayStart.toISOString()).neq('status', 'cancelled'),
    ])

    const revenueToday = (todayOrdersData ?? []).reduce((sum, o) => sum + (o.total_brl ?? 0), 0)

    setMetrics({
      activeVendors: activeVendors ?? 0,
      ordersToday: ordersToday ?? 0,
      pendingOrders: pendingOrders ?? 0,
      totalVendors: totalVendors ?? 0,
      totalUsers: totalUsers ?? 0,
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
