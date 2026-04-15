import { useRef, useState, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { BeachMap, type BeachMapHandle } from '../../components/map/BeachMap'
import { VendorPin } from '../../components/map/VendorPin'
import { VendorPopup } from '../../components/map/VendorPopup'
import { MapLegend } from '../../components/map/MapLegend'
import { CartDrawer } from '../../components/order/CartDrawer'
import { useVendorLocation } from '../../hooks/useVendorLocation'
import { useCart } from '../../contexts/CartContext'
import type { VendorWithLocation } from '../../types'
import type { Map as MapboxMap } from 'mapbox-gl'

export function MapView() {
  const mapRef = useRef<BeachMapHandle>(null)
  const [map, setMap] = useState<MapboxMap | null>(null)
  const [selectedVendor, setSelectedVendor] = useState<VendorWithLocation | null>(null)
  const [cartOpen, setCartOpen] = useState(false)
  const { vendors, loading } = useVendorLocation()
  const { itemCount } = useCart()
  const { t } = useTranslation()

  // Once map mounts, get reference to the underlying mapboxgl.Map
  useEffect(() => {
    const timer = setInterval(() => {
      if (mapRef.current?.map) {
        setMap(mapRef.current.map)
        clearInterval(timer)
      }
    }, 200)
    return () => clearInterval(timer)
  }, [])

  const handleVendorClick = useCallback((vendor: VendorWithLocation) => {
    setSelectedVendor(vendor)
    if (vendor.location) {
      mapRef.current?.flyTo(vendor.location.longitude, vendor.location.latitude)
    }
  }, [])

  const activeVendors = vendors.filter(v => v.location)

  return (
    <div className="relative w-full h-full">
      <BeachMap ref={mapRef} className="w-full h-full" />

      {map && activeVendors.map(vendor => (
        <VendorPin key={vendor.id} map={map} vendor={vendor} onClick={handleVendorClick} />
      ))}

      {loading && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/90 rounded-full px-4 py-2 text-sm font-body text-gray-600 shadow-md">
          {t('map.loading')}
        </div>
      )}

      {!loading && activeVendors.length === 0 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/90 rounded-full px-4 py-2 text-sm font-body text-gray-600 shadow-md">
          {t('map.noActive')}
        </div>
      )}

      <MapLegend />

      {selectedVendor && (
        <VendorPopup vendor={selectedVendor} onClose={() => setSelectedVendor(null)} />
      )}

      {/* Cart FAB */}
      <button
        onClick={() => setCartOpen(true)}
        className="absolute top-4 right-4 bg-coral text-white w-12 h-12 rounded-full shadow-lg flex items-center justify-center hover:bg-coral-500 transition-colors"
        aria-label={t('map.viewCart')}
      >
        <span className="text-xl">🛒</span>
        {itemCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-ocean text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
            {itemCount}
          </span>
        )}
      </button>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  )
}
