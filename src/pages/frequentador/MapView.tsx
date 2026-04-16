import { useRef, useState, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import mapboxgl from 'mapbox-gl'
import { BeachMap, type BeachMapHandle } from '../../components/map/BeachMap'
import { VendorPin } from '../../components/map/VendorPin'
import { CartDrawer } from '../../components/order/CartDrawer'
import { Spinner } from '../../components/ui/Spinner'
import { useVendorLocation } from '../../hooks/useVendorLocation'
import { useCart } from '../../contexts/CartContext'
import { supabase } from '../../lib/supabase'
import { CATEGORY_EMOJI, CATEGORY_COLORS } from '../../lib/constants'
import type { VendorWithLocation, Product } from '../../types'

// Pixels visible in peek mode (shows ~2-3 vendor cards)
const PEEK_PX = 220

// TODO: REMOVE SIMULATION - replace with real-time vendor location from DB
// Delete this entire constant once the vendor is broadcasting GPS via useVendorLocation
const SIMULATED_VENDOR_LOCATION: Record<string, [number, number]> = {
  '6f173103-9a63-4163-9b05-d3067a4a5e0d': [-46.013242134647186, -23.80107764839738],
  // SIMULATION: remove this entire constant when real-time location is active
}

// SIMULATION: remove when real buyer GPS is active
const SIMULATED_BUYER_LOCATION: [number, number] = [-46.00405736577133, -23.79828486994515]

/* ── Product card ── */
function ProductCard({ product }: { product: Product }) {
  const { addItem, updateQuantity, items, vendorId: cartVendorId } = useCart()
  const { t } = useTranslation()
  const canAdd = cartVendorId === null || cartVendorId === product.vendor_id
  const qty = items.find(i => i.product.id === product.id)?.quantity ?? 0

  return (
    <div className="bg-white rounded-2xl p-4 flex gap-3 border border-gray-100 shadow-sm">
      {product.photo_url && (
        <img
          src={product.photo_url}
          alt={product.name}
          className="w-20 h-20 rounded-xl object-cover shrink-0"
        />
      )}
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <p className="font-body font-semibold text-gray-900 text-[15px] leading-snug">
          {product.name}
        </p>
        {product.description && (
          <p className="font-body text-xs text-gray-400 leading-relaxed line-clamp-2">
            {product.description}
          </p>
        )}
        <div className="flex items-center justify-between mt-auto pt-2">
          <p className="font-body font-bold text-green-600 text-base">
            R${' '}{product.price_brl.toFixed(2).replace('.', ',')}
          </p>

          {qty === 0 ? (
            <button
              onClick={() => canAdd && addItem(product)}
              disabled={!canAdd}
              title={!canAdd ? t('cart.clearCartTooltip') : undefined}
              className={`w-9 h-9 rounded-full flex items-center justify-center text-xl font-bold transition-colors ${
                canAdd
                  ? 'bg-coral text-white hover:bg-coral/90'
                  : 'bg-gray-100 text-gray-300 cursor-not-allowed'
              }`}
            >
              +
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateQuantity(product.id, qty - 1)}
                className="w-8 h-8 rounded-full bg-coral/10 text-coral flex items-center justify-center font-bold text-lg hover:bg-coral/20 transition-colors"
              >
                −
              </button>
              <span className="w-5 text-center font-body font-bold text-gray-900 text-sm">
                {qty}
              </span>
              <button
                onClick={() => addItem(product)}
                className="w-8 h-8 rounded-full bg-coral text-white flex items-center justify-center font-bold text-lg hover:bg-coral/90 transition-colors"
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
  const { t } = useTranslation()

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

  // SIMULATION: add simulated buyer marker — remove when real buyer GPS is active
  useEffect(() => {
    if (!map) return

    const el = document.createElement('div')
    el.style.cssText = `
      width: 34px; height: 34px; border-radius: 50%;
      background: #3b82f6; border: 3px solid white;
      box-shadow: 0 2px 8px rgba(59,130,246,0.45);
      display: flex; align-items: center; justify-content: center;
      font-size: 15px;
    `
    el.textContent = '🧑'
    el.title = 'Você'

    const marker = new mapboxgl.Marker({ element: el })
      .setLngLat(SIMULATED_BUYER_LOCATION)
      .addTo(map)

    return () => { marker.remove() }
  }, [map])

  // Fetch all approved vendors for the bottom sheet list
  useEffect(() => {
    supabase
      .from('vendors')
      .select(`
        *,
        vendor_locations(vendor_id, latitude, longitude, accuracy, heading, updated_at)
      `)
      .eq('is_approved', true)
      .then(({ data }) => {
        if (!data) return
        const mapped: VendorWithLocation[] = data.map(v => ({
          ...v,
          location: Array.isArray(v.vendor_locations)
            ? v.vendor_locations[0]
            : v.vendor_locations ?? undefined,
        }))
        setAllVendors(
          [...mapped].sort((a, b) => (b.is_active ? 1 : 0) - (a.is_active ? 1 : 0)),
        )
      })
  }, [])

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

  // TODO: REMOVE SIMULATION - inject simulated coords for vendors missing a real location
  const activeWithLocation = activeVendors
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
    .filter(v => v.location)

  const onlineCount = allVendors.filter(v => v.is_active).length

  return (
    <div className="relative w-full h-full overflow-hidden">

      {/* ── Map ── */}
      <BeachMap ref={mapRef} className="w-full h-full" />

      {/* ── Vendor pins (active vendors with GPS location) ── */}
      {map && activeWithLocation.map(vendor => (
        <VendorPin
          key={vendor.id}
          map={map}
          vendor={vendor}
          onClick={openDrawer}
        />
      ))}

      {/* ── Loading pill ── */}
      {mapLoading && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 text-sm font-body text-gray-600 shadow-md z-10 pointer-events-none">
          {t('map.loading')}
        </div>
      )}

      {/* ── Offline toast ── */}
      <div
        className="absolute top-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none transition-all duration-300"
        style={{
          opacity: showOfflineMsg ? 1 : 0,
          transform: showOfflineMsg
            ? 'translateX(-50%) translateY(0)'
            : 'translateX(-50%) translateY(-8px)',
        }}
      >
        <div className="bg-gray-900/90 text-white rounded-full px-5 py-2.5 text-sm font-body shadow-lg whitespace-nowrap">
          Este vendedor está offline no momento
        </div>
      </div>

      {/* ── Floating cart bar (iFood-style) ── */}
      {itemCount > 0 && (
        <button
          onClick={() => setCartOpen(true)}
          className="absolute left-1/2 -translate-x-1/2 z-[22] bg-coral text-white rounded-full shadow-xl flex items-center gap-3 font-body font-semibold text-sm whitespace-nowrap transition-all duration-200"
          style={{ bottom: `${PEEK_PX + 12}px`, padding: '12px 20px' }}
          aria-label={t('map.viewCart')}
        >
          <span className="bg-white/25 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0">
            {itemCount}
          </span>
          <span>{t('cart.title')}</span>
          <span className="opacity-60 mx-0.5">·</span>
          <span>R${' '}{total.toFixed(2).replace('.', ',')}</span>
        </button>
      )}

      {/* ── Bottom sheet ── */}
      <div
        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl flex flex-col z-20"
        style={{
          height: '70vh',
          transform: sheetState === 'peek'
            ? `translateY(calc(100% - ${PEEK_PX}px))`
            : 'translateY(0)',
          transition: 'transform 0.3s ease-out',
        }}
      >
        <button
          type="button"
          className="flex justify-center items-center pt-3 pb-1 w-full shrink-0"
          onClick={() => setSheetState(s => s === 'peek' ? 'expanded' : 'peek')}
          aria-label="Expandir lista de vendedores"
        >
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </button>

        <div className="px-5 pt-2 pb-3 shrink-0 flex items-center justify-between">
          <p className="font-display font-bold text-gray-900 text-base">Vendedores</p>
          {onlineCount > 0 && (
            <span className="flex items-center gap-1.5 text-xs font-semibold font-body text-green-600">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              {onlineCount} online
            </span>
          )}
        </div>

        <div className="overflow-y-auto flex-1 px-4 pb-6">
          {allVendors.length === 0 ? (
            <p className="text-center text-gray-400 font-body text-sm py-8">
              {t('map.noActive')}
            </p>
          ) : (
            <div className="flex flex-col divide-y divide-gray-100">
              {allVendors.map(vendor => (
                <button
                  key={vendor.id}
                  type="button"
                  onClick={() => handleVendorListClick(vendor)}
                  className={`flex items-center gap-3 py-3.5 w-full text-left transition-opacity ${
                    !vendor.is_active ? 'opacity-40' : ''
                  }`}
                >
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0"
                    style={{
                      background: vendor.is_active
                        ? CATEGORY_COLORS[vendor.category]
                        : '#D1D5DB',
                    }}
                  >
                    {CATEGORY_EMOJI[vendor.category]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-body font-semibold truncate ${
                      vendor.is_active ? 'text-gray-900' : 'text-gray-500'
                    }`}>
                      {vendor.display_name}
                    </p>
                    <p className="text-xs text-gray-400 font-body">
                      {t(`categories.${vendor.category}`)}
                    </p>
                  </div>
                  {vendor.is_active && (
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500 shrink-0" />
                  )}
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
          style={{
            opacity: drawerVisible ? 1 : 0,
            transition: 'opacity 0.3s',
            backdropFilter: 'blur(1px)',
          }}
        />
      )}

      {/* ── Product drawer ── */}
      {drawerOpen && selectedVendor && (
        <div
          className="absolute bottom-0 left-0 right-0 z-30 bg-white rounded-t-3xl shadow-2xl flex flex-col"
          style={{
            maxHeight: '85%',
            transform: drawerVisible ? 'translateY(0)' : 'translateY(100%)',
            transition: 'transform 0.3s ease-out',
          }}
        >
          <div className="flex justify-center pt-3 pb-1 shrink-0">
            <div className="w-10 h-1 rounded-full bg-gray-300" />
          </div>

          <div className="flex items-center gap-3 px-5 pb-4 pt-2 border-b border-gray-100 shrink-0">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0"
              style={{ background: CATEGORY_COLORS[selectedVendor.category] }}
            >
              {CATEGORY_EMOJI[selectedVendor.category]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="font-display font-bold text-gray-900 text-lg leading-tight truncate">
                  {selectedVendor.display_name}
                </h2>
                <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
              </div>
              <p className="text-xs text-gray-400 font-body">
                {t(`categories.${selectedVendor.category}`)}
              </p>
            </div>
            <button
              onClick={closeDrawer}
              className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-body shrink-0 hover:bg-gray-200 transition-colors"
              aria-label={t('common.close')}
            >
              ✕
            </button>
          </div>

          <div className="overflow-y-auto flex-1 px-4 py-4 flex flex-col gap-3">
            {productsLoading ? (
              <div className="flex justify-center py-10">
                <Spinner size="md" />
              </div>
            ) : products.length === 0 ? (
              <p className="text-center text-gray-400 font-body text-sm py-10">
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
    </div>
  )
}
