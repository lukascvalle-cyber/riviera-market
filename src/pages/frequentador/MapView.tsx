import { useRef, useState, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { BeachMap, type BeachMapHandle } from '../../components/map/BeachMap'
import { VendorPin } from '../../components/map/VendorPin'
import { CartDrawer } from '../../components/order/CartDrawer'
import { Spinner } from '../../components/ui/Spinner'
import { useVendorLocation } from '../../hooks/useVendorLocation'
import { useCart } from '../../contexts/CartContext'
import { supabase } from '../../lib/supabase'
import { CATEGORY_EMOJI, CATEGORY_COLORS } from '../../lib/constants'
import type { VendorWithLocation, Product } from '../../types'
import type { Map as MapboxMap } from 'mapbox-gl'

// Pixels visible in peek mode (shows ~2-3 vendor cards)
const PEEK_PX = 220

/* ── Product card ── */
function ProductCard({ product }: { product: Product }) {
  const { addItem, vendorId: cartVendorId } = useCart()
  const { t } = useTranslation()
  const canAdd = cartVendorId === null || cartVendorId === product.vendor_id

  return (
    <div className="bg-sand-50 rounded-2xl p-4 flex gap-3">
      {product.photo_url && (
        <img
          src={product.photo_url}
          alt={product.name}
          className="w-16 h-16 rounded-xl object-cover shrink-0"
        />
      )}
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <p className="font-body font-semibold text-gray-900">{product.name}</p>
          <p className="font-body font-bold text-coral shrink-0">
            R${' '}{product.price_brl.toFixed(2).replace('.', ',')}
          </p>
        </div>
        {product.description && (
          <p className="font-body text-xs text-gray-500 leading-relaxed">
            {product.description}
          </p>
        )}
        <button
          onClick={() => canAdd && addItem(product)}
          disabled={!canAdd}
          title={!canAdd ? t('cart.clearCartTooltip') : undefined}
          className={`mt-1.5 self-start px-4 py-1.5 rounded-xl text-xs font-semibold font-body transition-colors ${
            canAdd
              ? 'bg-coral text-white hover:bg-coral/90'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          {canAdd ? `+ ${t('vendor.add').replace('+ ', '')}` : '—'}
        </button>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════ */
export function MapView() {
  const mapRef = useRef<BeachMapHandle>(null)
  const [map, setMap] = useState<MapboxMap | null>(null)
  const { vendors: activeVendors, loading: mapLoading } = useVendorLocation()
  const { itemCount } = useCart()
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
        // Online vendors first, then offline
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
    // Two-tick delay so the element is in the DOM before we animate
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

  const activeWithLocation = activeVendors.filter(v => v.location)
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

      {/* ── Cart FAB ── */}
      <button
        onClick={() => setCartOpen(true)}
        className="absolute top-4 right-4 bg-coral text-white w-12 h-12 rounded-full shadow-lg flex items-center justify-center hover:bg-coral/90 transition-colors z-10"
        aria-label={t('map.viewCart')}
      >
        <span className="text-xl">🛒</span>
        {itemCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-ocean text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
            {itemCount}
          </span>
        )}
      </button>

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
        {/* Drag handle — tap to toggle */}
        <button
          type="button"
          className="flex justify-center items-center pt-3 pb-1 w-full shrink-0"
          onClick={() => setSheetState(s => s === 'peek' ? 'expanded' : 'peek')}
          aria-label="Expandir lista de vendedores"
        >
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </button>

        {/* Sheet header */}
        <div className="px-5 pt-2 pb-3 shrink-0 flex items-center justify-between">
          <p className="font-display font-bold text-gray-900 text-base">Vendedores</p>
          {onlineCount > 0 && (
            <span className="flex items-center gap-1.5 text-xs font-semibold font-body text-green-600">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              {onlineCount} online
            </span>
          )}
        </div>

        {/* Vendor list */}
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
                  {/* Category icon */}
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

                  {/* Info */}
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

                  {/* Online dot */}
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
          {/* Drawer handle bar */}
          <div className="flex justify-center pt-3 pb-1 shrink-0">
            <div className="w-10 h-1 rounded-full bg-gray-300" />
          </div>

          {/* Drawer header */}
          <div className="flex items-center gap-3 px-5 pb-4 pt-2 border-b border-gray-100 shrink-0">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0"
              style={{ background: CATEGORY_COLORS[selectedVendor.category] }}
            >
              {CATEGORY_EMOJI[selectedVendor.category]}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-display font-bold text-gray-900 text-lg leading-tight truncate">
                {selectedVendor.display_name}
              </h2>
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

          {/* Products */}
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
        </div>
      )}

      {/* ── Cart drawer ── */}
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  )
}
