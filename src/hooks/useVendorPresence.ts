import { useEffect, useRef, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { GPS_INTERVAL_MS } from '../lib/constants'
import type { Vendor } from '../types'

export function useVendorPresence(vendor: Vendor | null) {
  const [isLive, setIsLive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const publishLocation = useCallback(async (vendorId: string) => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        await supabase.from('vendor_locations').upsert({
          vendor_id: vendorId,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          heading: pos.coords.heading,
          updated_at: new Date().toISOString(),
        })
      },
      (err) => setError(err.message),
      { enableHighAccuracy: true, timeout: 8000 },
    )
  }, [])

  const goLive = useCallback(async () => {
    if (!vendor) return
    setError(null)
    await supabase.from('vendors').update({ is_active: true }).eq('id', vendor.id)
    await publishLocation(vendor.id)
    intervalRef.current = setInterval(() => publishLocation(vendor.id), GPS_INTERVAL_MS)
    setIsLive(true)
  }, [vendor, publishLocation])

  const goOffline = useCallback(async () => {
    if (!vendor) return
    if (intervalRef.current) clearInterval(intervalRef.current)
    await supabase.from('vendors').update({ is_active: false }).eq('id', vendor.id)
    setIsLive(false)
  }, [vendor])

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  return { isLive, error, goLive, goOffline }
}
