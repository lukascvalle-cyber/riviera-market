import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { VendorWithLocation } from '../types'

export function useVendorLocation() {
  const [vendors, setVendors] = useState<VendorWithLocation[]>([])
  const [loading, setLoading] = useState(true)

  const fetchActiveVendors = useCallback(async () => {
    const { data } = await supabase
      .from('vendors')
      .select(`
        *,
        vendor_locations (
          latitude, longitude, accuracy, heading, updated_at
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

    const channel = supabase
      .channel('vendor-locations')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'vendor_locations' },
        () => { fetchActiveVendors() },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'vendors' },
        () => { fetchActiveVendors() },
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchActiveVendors])

  return { vendors, loading, refresh: fetchActiveVendors }
}
