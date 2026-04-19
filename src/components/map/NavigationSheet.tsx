import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import { supabase } from '../../lib/supabase'
import { haversineDistance } from '../../lib/utils'
import { Button } from '../ui/Button'
import type { Order } from '../../types'

// Fallback when vendor has no GPS row yet
const SIMULATED_VENDOR_LOCATION: [number, number] = [-46.013242134647186, -23.80107764839738]

// Marching-ants dash sequence for the route line
const DASH_SEQUENCE = [
  [0, 4, 3], [0.5, 4, 2.5], [1, 4, 2], [1.5, 4, 1.5],
  [2, 4, 1], [2.5, 4, 0.5], [3, 4, 0],
  [0, 0.5, 3, 3.5], [0, 1, 3, 3], [0, 1.5, 3, 2.5],
  [0, 2, 3, 2], [0, 2.5, 3, 1.5], [0, 3, 3, 1],
  [0, 3.5, 3, 0.5], [0, 4, 3, 0],
]


interface NavigationSheetProps {
  order: Order
  vendorId: string
  onClose: () => void
  onMarkDelivered: () => void
}

export function NavigationSheet({
  order,
  vendorId,
  onClose,
  onMarkDelivered,
}: NavigationSheetProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null)
  const animFrameRef = useRef<number | null>(null)
  const dashStepRef = useRef(0)

  const [visible, setVisible] = useState(false)
  // [lng, lat] — null while loading
  const [vendorCoords, setVendorCoords] = useState<[number, number] | null>(null)
  const [buyerCoords, setBuyerCoords] = useState<[number, number] | null>(null)

  // Slide-up animation
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10)
    return () => clearTimeout(t)
  }, [])

  // Fetch vendor's last known location from vendor_locations
  useEffect(() => {
    supabase
      .from('vendor_locations')
      .select('latitude, longitude')
      .eq('vendor_id', vendorId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setVendorCoords([data.longitude, data.latitude])
        } else {
          setVendorCoords(SIMULATED_VENDOR_LOCATION)
        }
      })
  }, [vendorId])

  // Fetch buyer's saved location from profiles using the order's buyer_id
  useEffect(() => {
    if (!order.buyer_id) return
    supabase
      .from('profiles')
      .select('latitude, longitude')
      .eq('id', order.buyer_id)
      .maybeSingle()
      .then(({ data }) => {
        const d = data as { latitude: number | null; longitude: number | null } | null
        if (d?.latitude != null && d?.longitude != null) {
          setBuyerCoords([d.longitude, d.latitude])
        }
      })
  }, [order.buyer_id])

  // Build map once both vendor and buyer coords are available
  useEffect(() => {
    if (!containerRef.current || !vendorCoords || !buyerCoords) return

    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [
        (vendorCoords[0] + buyerCoords[0]) / 2,
        (vendorCoords[1] + buyerCoords[1]) / 2,
      ],
      zoom: 15,
      attributionControl: false,
    })

    mapInstanceRef.current = map

    map.on('load', () => {
      // ── Route source ──
      map.addSource('nav-route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: [vendorCoords, buyerCoords],
          },
        },
      })

      // Solid background glow
      map.addLayer({
        id: 'nav-route-glow',
        type: 'line',
        source: 'nav-route',
        layout: { 'line-cap': 'round' as const },
        paint: {
          'line-color': '#2E86AB',
          'line-width': 7,
          'line-opacity': 0.2,
        },
      })

      // Animated dashed line on top
      map.addLayer({
        id: 'nav-route-dashed',
        type: 'line',
        source: 'nav-route',
        layout: { 'line-cap': 'butt' as const },
        paint: {
          'line-color': '#2E86AB',
          'line-width': 3,
          'line-dasharray': DASH_SEQUENCE[0] as number[],
        },
      })

      // Fit both markers in view
      const bounds = new mapboxgl.LngLatBounds()
      bounds.extend(vendorCoords)
      bounds.extend(buyerCoords)
      map.fitBounds(bounds, { padding: 80, duration: 900, maxZoom: 17 })

      // Marching-ants animation
      function animateDash(ts: number) {
        const step = Math.floor((ts / 50) % DASH_SEQUENCE.length)
        if (step !== dashStepRef.current) {
          dashStepRef.current = step
          map.setPaintProperty(
            'nav-route-dashed',
            'line-dasharray',
            DASH_SEQUENCE[step],
          )
        }
        animFrameRef.current = requestAnimationFrame(animateDash)
      }
      animFrameRef.current = requestAnimationFrame(animateDash)
    })

    // ── Vendor marker (ocean blue, scooter emoji) ──
    const vendorEl = document.createElement('div')
    vendorEl.style.cssText = `
      width: 40px; height: 40px; border-radius: 50%;
      background: #2E86AB; border: 3px solid white;
      box-shadow: 0 2px 8px rgba(46,134,171,0.45);
      display: flex; align-items: center; justify-content: center;
      font-size: 18px;
    `
    vendorEl.textContent = '🛵'
    vendorEl.title = 'Você (vendedor)'
    new mapboxgl.Marker({ element: vendorEl, anchor: 'center' })
      .setLngLat(vendorCoords)
      .addTo(map)

    // ── Buyer marker (white bg, green border, person emoji) ──
    const buyerEl = document.createElement('div')
    buyerEl.style.cssText = `
      width: 36px; height: 36px; border-radius: 50%;
      background: white; border: 2px solid #52B788;
      box-shadow: 0 2px 8px rgba(82,183,136,0.35);
      display: flex; align-items: center; justify-content: center;
      font-size: 15px;
    `
    buyerEl.textContent = '🧑'
    buyerEl.title = 'Cliente'
    new mapboxgl.Marker({ element: buyerEl, anchor: 'center' })
      .setLngLat(buyerCoords)
      .addTo(map)

    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current)
        animFrameRef.current = null
      }
      map.remove()
      mapInstanceRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendorCoords, buyerCoords])

  // ── ETA / distance ──
  const distanceM = vendorCoords && buyerCoords
    ? Math.round(haversineDistance(vendorCoords[1], vendorCoords[0], buyerCoords[1], buyerCoords[0]))
    : null
  // Walking speed: 4 km/h → 1 min per 66.67 m
  const etaMin = distanceM !== null ? Math.max(1, Math.round(distanceM / 66.67)) : null
  const distanceLabel = distanceM !== null
    ? distanceM < 1000 ? `${distanceM}m` : `${(distanceM / 1000).toFixed(1)}km`
    : null

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[1px] transition-opacity duration-300"
        style={{ opacity: visible ? 1 : 0 }}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className="relative w-full bg-white rounded-t-[20px] shadow-2xl flex flex-col overflow-hidden"
        style={{
          height: '82vh',
          transform: visible ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.3s ease-out',
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2 shrink-0">
          <div className="w-8 h-1 rounded-full bg-[#E8E8E4]" />
        </div>

        {/* Header row: ETA pill + destination + close */}
        <div className="shrink-0 px-4 pb-3 flex items-center gap-3">
          {etaMin !== null && distanceLabel !== null ? (
            <div className="flex items-center gap-2 rounded-2xl px-3 py-2 shrink-0" style={{ backgroundColor: 'rgba(46,134,171,0.1)' }}>
              <span className="text-lg">🚶</span>
              <span className="font-display font-bold text-base" style={{ color: '#2E86AB' }}>
                ~{etaMin} min
              </span>
              <span className="font-body text-sm text-[#6B7280]">·</span>
              <span className="font-body text-sm font-semibold text-[#6B7280]">
                {distanceLabel}
              </span>
            </div>
          ) : (
            <div className="rounded-2xl px-3 py-2 text-sm font-body text-[#6B7280]" style={{ backgroundColor: '#F5E6D3' }}>
              Calculando rota…
            </div>
          )}

          <div className="flex-1 min-w-0">
            <p className="text-xs text-[#6B7280] font-body">Entregando em</p>
            <p className="font-body font-semibold text-[#1A1A2E] text-sm truncate">
              {order.delivery_location ?? 'Localização do cliente'}
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-[#6B7280] hover:bg-[#F5E6D3] transition-colors shrink-0"
            style={{ backgroundColor: '#F5E6D3' }}
          >
            ✕
          </button>
        </div>

        {/* Map — fills remaining space */}
        <div ref={containerRef} className="flex-1 relative">
          {(!vendorCoords || !buyerCoords) && (
            <div className="absolute inset-0 flex items-center justify-center z-10" style={{ backgroundColor: '#FAFAF8' }}>
              <p className="text-[#6B7280] font-body text-sm">Obtendo localização…</p>
            </div>
          )}
        </div>

        {/* Footer: Cheguei button */}
        <div
          className="shrink-0 px-4 pt-3 pb-5 bg-white border-t border-[#E8E8E4]"
          style={{ paddingBottom: 'max(20px, env(safe-area-inset-bottom))' }}
        >
          <Button fullWidth size="lg" onClick={onMarkDelivered}>
            ✓ Cheguei — Marcar como entregue
          </Button>
        </div>
      </div>
    </div>
  )
}
