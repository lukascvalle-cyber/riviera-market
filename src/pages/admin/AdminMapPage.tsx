import { useRef, useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { BeachMap, type BeachMapHandle } from '../../components/map/BeachMap'
import { VendorPin } from '../../components/map/VendorPin'
import { MapLegend } from '../../components/map/MapLegend'
import { useVendorLocation } from '../../hooks/useVendorLocation'
import { supabase } from '../../lib/supabase'
import type { VendorWithLocation } from '../../types'
import type { Map as MapboxMap } from 'mapbox-gl'

export function AdminMapPage() {
  const mapRef = useRef<BeachMapHandle>(null)
  const [map, setMap] = useState<MapboxMap | null>(null)
  const [allVendors, setAllVendors] = useState<VendorWithLocation[]>([])
  const { vendors: activeVendors } = useVendorLocation()
  const { t } = useTranslation()

  useEffect(() => {
    const timer = setInterval(() => {
      if (mapRef.current?.map) { setMap(mapRef.current.map); clearInterval(timer) }
    }, 200)
    return () => clearInterval(timer)
  }, [])

  // Admin sees ALL vendors with locations, not just active+approved
  useEffect(() => {
    supabase
      .from('vendors')
      .select('*, vendor_locations(*)')
      .then(({ data }) => {
        if (data) {
          setAllVendors(data.map(v => ({
            ...v,
            location: Array.isArray(v.vendor_locations) ? v.vendor_locations[0] : v.vendor_locations ?? undefined,
          })))
        }
      })
  }, [activeVendors]) // re-fetch when live data changes

  return (
    <div className="h-full relative">
      <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-sm rounded-2xl shadow px-4 py-2">
        <p className="text-sm font-body font-semibold text-gray-700">
          🟢 {activeVendors.filter(v => v.location).length} {t('admin.liveCount')}
          <span className="text-gray-400 ml-2">· {allVendors.length} {t('admin.registeredCount')}</span>
        </p>
      </div>
      <BeachMap ref={mapRef} className="w-full h-full" />
      {map && allVendors.filter(v => v.location).map(v => (
        <VendorPin key={v.id} map={map} vendor={v} onClick={() => {}} />
      ))}
      <MapLegend />
    </div>
  )
}
