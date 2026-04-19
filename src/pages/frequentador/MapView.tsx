import { useRef, useState, useCallback, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import mapboxgl from 'mapbox-gl'
import { BeachMap, type BeachMapHandle } from '../../components/map/BeachMap'
import { VendorPin } from '../../components/map/VendorPin'
import { CartDrawer } from '../../components/order/CartDrawer'
import { LocationPermissionSheet } from '../../components/map/LocationPermissionSheet'
import { Spinner } from '../../components/ui/Spinner'
import { useVendorLocation } from '../../hooks/useVendorLocation'
import { useOrders } from '../../hooks/useOrders'
import { useCart } from '../../contexts/CartContext'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { haversineDistance } from '../../lib/utils'
import { CATEGORY_EMOJI, CATEGORY_COLORS } from '../../lib/constants'
import type { VendorWithLocation, Product } from '../../types'

// Pixels visible in peek mode (shows ~2-3 vendor cards)
const PEEK_PX = 220

// TODO: REMOVE SIMULATION - replace with real-time vendor location from DB
const SIMULATED_VENDOR_LOCATION: Record<string, [number, number]> = {
  '6f173103-9a63-4163-9b05-d3067a4a5e0d': [-46.013242134647186, -23.80107764839738],
  // SIMULATION: remove this entire constant when real-time location is active
}


/* ── Product card ── */
function ProductCard({ product }: { product: Product }) {
  const { addItem, updateQuantity, items, vendorId: cartVendorId } = useCart()
  const { t } = useTranslation()
  const canAdd = cartVendorId === null || cartVendorId === product.vendor_id
  const qty = items.find(i => i.product.id === product.id)?.quantity ?? 0

  return (
    <div className="bg-white p-4 flex gap-3 border-b border-[#E8E8E4]">
      {product.photo_url && (
        <img
          src={product.photo_url}
          alt={product.name}
          className="w-20 h-20 rounded-xl object-cover shrink-0"
        />
      )}
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <p className="font-body font-semibold text-[#1A1A2E] text-[15px] leading-snug">
          {product.name}
        </p>
        {product.description && (
          <p className="font-body text-sm text-[#6B7280] leading-relaxed line-clamp-2">
            {product.description}
          </p>
        )}
        <div className="flex items-center justify-between mt-auto pt-2">
          <p className="font-body font-bold text-[#2E86AB] text-base">
            R${' '}{product.price_brl.toFixed(2).replace('.', ',')}
          </p>
          {qty === 0 ? (
            <button
              onClick={() => canAdd && addItem(product)}
              disabled={!canAdd}
              title={!canAdd ? t('cart.clearCartTooltip') : undefined}
              className={`w-9 h-9 rounded-full flex items-center justify-center text-xl font-bold transition-colors ${
                canAdd
                  ? 'text-white hover:opacity-90'
                  : 'bg-[#E8E8E4] text-[#6B7280] cursor-not-allowed'
              }`}
              style={canAdd ? { backgroundColor: '#2E86AB' } : undefined}
            >
              +
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateQuantity(product.id, qty - 1)}
                className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg transition-colors"
                style={{ backgroundColor: 'rgba(46,134,171,0.1)', color: '#2E86AB' }}
              >
                −
              </button>
              <span className="w-5 text-center font-body font-bold text-[#1A1A2E] text-sm">
                {qty}
              </span>
              <button
                onClick={() => addItem(product)}
                className="w-8 h-8 rounded-full text-white flex items-center justify-center font-bold text-lg transition-colors hover:opacity-90"
                style={{ backgroundColor: '#2E86AB' }}
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════ */
export function MapView() {
  const mapRef = useRef<BeachMapHandle>(null)
  const [map, setMap] = useState<mapboxgl.Map | null>(null)
  const { vendors: activeVendors, loading: mapLoading } = useVendorLocation()
  const { itemCount, total } = useCart()
  const { user } = useAuth()
  const { t } = useTranslation()

  // Orders — used for proximity alert
  const { orders } = useOrders('frequentador', user?.id ?? null)

  // All approved vendors for the bottom sheet
  const [allVendors, setAllVendors] = useState<VendorWithLocation[]>([])

  // Bottom sheet
  const [sheetState, setSheetState] = useState<'peek' | 'expanded'>('peek')

  // Product drawer
  const [selectedVendor, setSelectedVendor] = useState<VendorWithLocation | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [productsLoading, setProductsLoading] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerVisible, setDrawerVisible] = useState(false)

  // Offline toast
  const [showOfflineMsg, setShowOfflineMsg] = useState(false)

  // Cart drawer
  const [cartOpen, setCartOpen] = useState(false)

  // Proximity alert
  const [proximityAlert, setProximityAlert] = useState(false)
  const alertedOrdersRef = useRef<Set<string>>(new Set())

  // Buyer location — populated from GPS once permission is granted
  const [buyerCoords, setBuyerCoords] = useState<[number, number] | null>(null)

  // Location permission state: 'checking' | 'prompt' | 'granted' | 'denied' | 'dismissed'
  const [locationPermission, setLocationPermission] = useState<'checking' | 'prompt' | 'granted' | 'denied' | 'dismissed'>('checking')

  // Check geolocation permission on mount (only when map view is active)
  useEffect(() => {
    if (!navigator.permissions) {
      // Browser doesn't support permissions API — show the sheet to prompt
      setLocationPermission('prompt')
      return
    }
    navigator.permissions.query({ name: 'geolocation' as PermissionName }).then(result => {
      setLocationPermission(result.state as 'prompt' | 'granted' | 'denied')
      // Auto-get coords if already granted
      if (result.state === 'granted') {
        navigator.geolocation.getCurrentPosition(
          pos => handleLocationGranted(pos.coords),
          () => {},
          { enableHighAccuracy: true, timeout: 8_000 },
        )
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleLocationGranted(coords: GeolocationCoordinates) {
    const lngLat: [number, number] = [coords.longitude, coords.latitude]
    setBuyerCoords(lngLat)
    setLocationPermission('granted')
    // Save to profile
    if (user?.id) {
      supabase.from('profiles').update({
        latitude: coords.latitude,
        longitude: coords.longitude,
      } as Record<string, unknown>).eq('id', user.id).then(() => {})
    }
  }

  // Acquire map instance after mount
  useEffect(() => {
    const timer = setInterval(() => {
      if (mapRef.current?.map) {
        setMap(mapRef.current.map)
        clearInterval(timer)
      }
    }, 200)
    return () => clearInterval(timer)
  }, [])

  // Fetch buyer location from profiles and center map
  useEffect(() => {
    if (!user?.id) return
    supabase
      .from('profiles')
      .select('latitude, longitude')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        const d = data as { latitude: number | null; longitude: number | null } | null
        if (d?.latitude != null && d?.longitude != null) {
          setBuyerCoords([d.longitude, d.latitude])
        }
      })
  }, [user?.id])

  // Fly to buyer coords once map is ready (or when coords update)
  useEffect(() => {
    if (!map || !buyerCoords) return
    mapRef.current?.flyTo(buyerCoords[0], buyerCoords[1], 16)
  }, [map, buyerCoords])

  // Buyer marker — updates position when real coords arrive
  useEffect(() => {
    if (!map || !buyerCoords) return
    const el = document.createElement('div')
    el.style.cssText = `
      width: 36px; height: 36px; border-radius: 50%;
      background: white; border: 2px solid #52B788;
      box-shadow: 0 2px 8px rgba(82,183,136,0.35);
      display: flex; align-items: center; justify-content: center;
      font-size: 15px;
    `
    el.textContent = '🧑'
    el.title = 'Você'
    const marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
      .setLngLat(buyerCoords)
      .addTo(map)
    return () => { marker.remove() }
  }, [map, buyerCoords])

  // Fetch all approved vendors for the bottom sheet list
  useEffect(() => {
    supabase
      .from('vendors')
      .select(`*, vendor_locations(vendor_id, latitude, longitude, accuracy, heading, updated_at)`)
      .eq('is_approved', true)
      .then(({ data }) => {
        if (!data) return
        const mapped: VendorWithLocation[] = data.map(v => ({
          ...v,
          location: Array.isArray(v.vendor_locations)
            ? v.vendor_locations[0]
            : v.vendor_locations ?? undefined,
        }))
        setAllVendors(mapped)
      })
  }, [])

  // TODO: REMOVE SIMULATION
  const activeWithLocation = useMemo(() =>
    activeVendors
      .map(v => {
        if (v.location) return v
        const sim = SIMULATED_VENDOR_LOCATION[v.profile_id]
        if (!sim) return v
        return {
          ...v,
          location: {
            vendor_id: v.id,
            latitude: sim[1],
            longitude: sim[0],
            accuracy: null as null,
            heading: null as null,
            updated_at: new Date().toISOString(),
          },
        }
      })
      .filter(v => v.location),
  [activeVendors])

  // ── Proximity alert: check on every vendor location update ──
  useEffect(() => {
    if (!buyerCoords) return
    const activeDeliveries = orders.filter(o =>
      ['confirmed', 'delivering'].includes(o.status),
    )
    for (const order of activeDeliveries) {
      if (alertedOrdersRef.current.has(order.id)) continue
      const vendor = activeWithLocation.find(v => v.id === order.vendor_id)
      if (!vendor?.location) continue

      const dist = haversineDistance(
        vendor.location.latitude,
        vendor.location.longitude,
        buyerCoords[1],
        buyerCoords[0],
      )

      if (dist <= 50) {
        alertedOrdersRef.current.add(order.id)
        setProximityAlert(true)
        // Vibrate if supported (200ms)
        navigator.vibrate?.(200)
      }
    }
  }, [activeWithLocation, orders, buyerCoords])

  const openDrawer = useCallback(async (vendor: VendorWithLocation) => {
    setSelectedVendor(vendor)
    setSheetState('peek')
    setProducts([])
    setDrawerOpen(true)
    setTimeout(() => setDrawerVisible(true), 10)
    setProductsLoading(true)
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('vendor_id', vendor.id)
      .eq('is_available', true)
      .order('sort_order')
    setProducts(data ?? [])
    setProductsLoading(false)
  }, [])

  const closeDrawer = useCallback(() => {
    setDrawerVisible(false)
    setTimeout(() => {
      setDrawerOpen(false)
      setSelectedVendor(null)
      setProducts([])
    }, 300)
  }, [])

  const handleVendorListClick = useCallback((vendor: VendorWithLocation) => {
    if (!vendor.is_active) {
      setShowOfflineMsg(true)
      setTimeout(() => setShowOfflineMsg(false), 2500)
      return
    }
    if (vendor.location) {
      mapRef.current?.flyTo(vendor.location.longitude, vendor.location.latitude)
    }
    openDrawer(vendor)
  }, [openDrawer])

  const onlineCount = allVendors.filter(v => v.is_active).length

  // Sort vendors: online first, then by distance from buyer
  const sortedVendors = useMemo(() => {
    return [...allVendors]
      .map(vendor => {
        const dist = vendor.location && buyerCoords
          ? haversineDistance(vendor.location.latitude, vendor.location.longitude, buyerCoords[1], buyerCoords[0])
          : null
        return { vendor, dist }
      })
      .sort((a, b) => {
        if (b.vendor.is_active !== a.vendor.is_active) return b.vendor.is_active ? 1 : -1
        if (a.dist === null && b.dist === null) return 0
        if (a.dist === null) return 1
        if (b.dist === null) return -1
        return a.dist - b.dist
      })
  }, [allVendors, buyerCoords])

  function formatDist(m: number | null): string | null {
    if (m === null) return null
    return m < 1000 ? `~${Math.round(m)}m` : `~${(m / 1000).toFixed(1)}km`
  }

  // Drag gesture state
  const dragStartYRef = useRef<number | null>(null)
  const [dragOffset, setDragOffset] = useState(0)

  function handleDragStart(e: React.TouchEvent) {
    dragStartYRef.current = e.touches[0].clientY
  }

  function handleDragMove(e: React.TouchEvent) {
    if (dragStartYRef.current === null) return
    const delta = e.touches[0].clientY - dragStartYRef.current
    setDragOffset(delta)
  }

  function handleDragEnd() {
    if (dragStartYRef.current === null) return
    if (dragOffset < -50) setSheetState('expanded')
    else if (dragOffset > 50) setSheetState('peek')
    setDragOffset(0)
    dragStartYRef.current = null
  }

  return (
    <div className="relative w-full h-full overflow-hidden">

      {/* ── Map ── */}
      <BeachMap ref={mapRef} className="w-full h-full" />

      {/* ── Vendor pins ── */}
      {map && activeWithLocation.map(vendor => (
        <VendorPin key={vendor.id} map={map} vendor={vendor} onClick={openDrawer} />
      ))}

      {/* ── Loading pill ── */}
      {mapLoading && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 text-sm font-body text-[#6B7280] shadow-md z-10 pointer-events-none">
          {t('map.loading')}
        </div>
      )}

      {/* ── Offline toast ── */}
      <div
        className="absolute top-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none transition-all duration-300"
        style={{
          opacity: showOfflineMsg ? 1 : 0,
          transform: showOfflineMsg ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(-8px)',
        }}
      >
        <div className="bg-[#1A1A2E]/90 text-white rounded-full px-5 py-2.5 text-sm font-body shadow-lg whitespace-nowrap">
          Este vendedor está offline no momento
        </div>
      </div>

      {/* ── Proximity alert modal ── */}
      {proximityAlert && (
        <div className="absolute inset-0 z-[35] flex items-center justify-center p-6 bg-black/40">
          <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-xs text-center flex flex-col gap-4">
            <div className="text-5xl">🚶</div>
            <div>
              <h3 className="font-display text-xl font-bold text-[#1A1A2E]">
                O seu pedido está a chegar!
              </h3>
              <p className="font-body text-sm text-[#6B7280] mt-1">
                O vendedor está a menos de 50 metros.
              </p>
            </div>
            <button
              onClick={() => setProximityAlert(false)}
              className="w-full text-white rounded-2xl py-3 font-body font-semibold transition-colors hover:opacity-90"
              style={{ backgroundColor: '#2E86AB' }}
            >
              OK, estou a ver!
            </button>
          </div>
        </div>
      )}

      {/* ── Floating cart bar ── */}
      {itemCount > 0 && (
        <button
          onClick={() => setCartOpen(true)}
          className="absolute left-1/2 -translate-x-1/2 z-[22] text-white font-body font-semibold text-sm whitespace-nowrap transition-all duration-200 flex items-center gap-3"
          style={{
            bottom: `${PEEK_PX + 12}px`,
            padding: '14px 24px',
            borderRadius: 9999,
            backgroundColor: '#2E86AB',
            boxShadow: '0 4px 16px rgba(46,134,171,0.3)',
          }}
          aria-label={t('map.viewCart')}
        >
          <span className="bg-white/25 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0">
            {itemCount}
          </span>
          <span>Ver carrinho</span>
          <span className="opacity-60 mx-0.5">·</span>
          <span>R${' '}{total.toFixed(2).replace('.', ',')}</span>
        </button>
      )}

      {/* ── Bottom sheet ── */}
      <div
        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[20px] shadow-2xl flex flex-col z-20"
        style={{
          height: '85vh',
          transform: sheetState === 'peek'
            ? `translateY(calc(100% - ${PEEK_PX}px + ${dragOffset}px))`
            : `translateY(${Math.max(0, dragOffset)}px)`,
          transition: dragOffset !== 0 ? 'none' : 'transform 0.3s ease-out',
        }}
      >
        {/* Handle — tap to toggle, drag to resize */}
        <button
          type="button"
          className="flex justify-center items-center pt-3 pb-1 w-full shrink-0 touch-none"
          onClick={() => setSheetState(s => s === 'peek' ? 'expanded' : 'peek')}
          onTouchStart={handleDragStart}
          onTouchMove={handleDragMove}
          onTouchEnd={handleDragEnd}
          aria-label="Expandir lista de vendedores"
        >
          <div className="w-8 h-1 rounded-full bg-[#E8E8E4]" />
        </button>

        {/* Sheet header */}
        <div className="px-5 pt-2 pb-3 shrink-0 flex items-center justify-between">
          <p className="font-display font-bold text-[#1A1A2E] text-base">Vendedores</p>
          {onlineCount > 0 && (
            <span className="flex items-center gap-1.5 text-xs font-semibold font-body" style={{ color: '#52B788' }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#52B788' }} />
              {onlineCount} online
            </span>
          )}
        </div>

        {/* Vendor list */}
        <div className="overflow-y-auto flex-1 px-4 pb-6" style={{ WebkitOverflowScrolling: 'touch' }}>
          {sortedVendors.length === 0 ? (
            <p className="text-center text-[#6B7280] font-body text-sm py-8">
              {t('map.noActive')}
            </p>
          ) : (
            <div className="flex flex-col divide-y divide-[#E8E8E4]">
              {sortedVendors.map(({ vendor, dist }) => (
                <button
                  key={vendor.id}
                  type="button"
                  onClick={() => handleVendorListClick(vendor)}
                  className={`flex items-center gap-3 py-3.5 w-full text-left transition-opacity ${
                    !vendor.is_active ? 'opacity-[0.45]' : ''
                  }`}
                >
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0"
                    style={{ background: vendor.is_active ? CATEGORY_COLORS[vendor.category] : '#E8E8E4' }}
                  >
                    {CATEGORY_EMOJI[vendor.category]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-body font-semibold truncate ${vendor.is_active ? 'text-[#1A1A2E]' : 'text-[#6B7280]'}`}>
                      {vendor.display_name}
                    </p>
                    <p className="text-xs text-[#6B7280] font-body">
                      {t(`categories.${vendor.category}`)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {formatDist(dist) && (
                      <span className="text-xs font-body text-[#6B7280]">{formatDist(dist)}</span>
                    )}
                    {vendor.is_active && (
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#52B788' }} />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Product drawer backdrop ── */}
      {drawerOpen && (
        <div
          className="absolute inset-0 z-[25] bg-black/30"
          onClick={closeDrawer}
          style={{ opacity: drawerVisible ? 1 : 0, transition: 'opacity 0.3s', backdropFilter: 'blur(1px)' }}
        />
      )}

      {/* ── Product drawer ── */}
      {drawerOpen && selectedVendor && (
        <div
          className="absolute bottom-0 left-0 right-0 z-30 bg-white rounded-t-[20px] shadow-2xl flex flex-col"
          style={{
            maxHeight: '85%',
            transform: drawerVisible ? 'translateY(0)' : 'translateY(100%)',
            transition: 'transform 0.3s ease-out',
          }}
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1 shrink-0">
            <div className="w-8 h-1 rounded-full bg-[#E8E8E4]" />
          </div>

          {/* Vendor header */}
          <div className="flex items-center gap-3 px-5 pb-4 pt-2 border-b border-[#E8E8E4] shrink-0">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0"
              style={{ background: CATEGORY_COLORS[selectedVendor.category] }}
            >
              {CATEGORY_EMOJI[selectedVendor.category]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="font-display font-bold text-[#1A1A2E] text-lg leading-tight truncate">
                  {selectedVendor.display_name}
                </h2>
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: '#52B788' }} />
              </div>
              <p className="text-xs text-[#6B7280] font-body">
                {t(`categories.${selectedVendor.category}`)}
              </p>
            </div>
            <button
              onClick={closeDrawer}
              className="w-9 h-9 rounded-full flex items-center justify-center text-[#6B7280] font-body shrink-0 transition-colors"
              style={{ backgroundColor: '#F5E6D3' }}
              aria-label={t('common.close')}
            >
              ✕
            </button>
          </div>

          {/* Products */}
          <div className="overflow-y-auto flex-1 flex flex-col">
            {productsLoading ? (
              <div className="flex justify-center py-10"><Spinner size="md" /></div>
            ) : products.length === 0 ? (
              <p className="text-center text-[#6B7280] font-body text-sm py-10">
                {t('vendor.noProducts')}
              </p>
            ) : (
              products.map(product => (
                <ProductCard key={product.id} product={product} />
              ))
            )}
          </div>
          <div className="shrink-0" style={{ height: 'env(safe-area-inset-bottom, 0px)' }} />
        </div>
      )}

      {/* ── Cart drawer ── */}
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />

      {/* ── Location permission sheet ── */}
      {(locationPermission === 'prompt' || locationPermission === 'denied') && (
        <LocationPermissionSheet
          onGranted={coords => {
            handleLocationGranted(coords)
          }}
          onDismissed={() => setLocationPermission('dismissed')}
        />
      )}
    </div>
  )
}
