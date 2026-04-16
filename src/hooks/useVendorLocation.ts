import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { VendorLocation, VendorWithLocation } from '../types'

export function useVendorLocation() {
  const [vendors, setVendors] = useState<VendorWithLocation[]>([])
  const [loading, setLoading] = useState(true)

  const fetchActiveVendors = useCallback(async () => {
    const { data } = await supabase
      .from('vendors')
      .select(`
        *,
        vendor_locations (
          vendor_id, latitude, longitude, accuracy, heading, updated_at
        )
      `)
      .eq('is_active', true)
      .eq('is_approved', true)

    if (data) {
      setVendors(
        data.map(v => ({
          ...v,
          location: Array.isArray(v.vendor_locations)
            ? v.vendor_locations[0]
            : v.vendor_locations ?? undefined,
        })),
      )
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchActiveVendors()

    let channel: ReturnType<typeof supabase.channel> | null = null
    try {
      channel = supabase
        .channel('vendor-locations')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'vendor_locations' },
          (payload) => {
            // New vendor came online — full refetch to add them to the list
            fetchActiveVendors()
            void payload
          },
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'vendor_locations' },
          (payload) => {
            // Vendor moved — update only that vendor's location in-place (no refetch)
            const loc = payload.new as VendorLocation
            setVendors(prev =>
              prev.map(v => v.id === loc.vendor_id ? { ...v, location: loc } : v),
            )
          },
        )
        .on(
          'postgres_changes',
          { event: 'DELETE', schema: 'public', table: 'vendor_locations' },
          () => { fetchActiveVendors() },
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'vendors' },
          () => { fetchActiveVendors() },
        )
        .subscribe()
    } catch (err) {
      console.error('[useVendorLocation] Realtime subscription error:', err)
    }

    return () => { if (channel) supabase.removeChannel(channel) }
  }, [fetchActiveVendors])

  return { vendors, loading, refresh: fetchActiveVendors }
}
