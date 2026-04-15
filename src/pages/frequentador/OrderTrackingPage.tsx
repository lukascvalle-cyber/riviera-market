import { useRef, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import mapboxgl from 'mapbox-gl'
import { useOrderTracking } from '../../hooks/useOrderTracking'
import { BeachMap, type BeachMapHandle } from '../../components/map/BeachMap'
import { Spinner } from '../../components/ui/Spinner'
import { CATEGORY_EMOJI } from '../../lib/constants'
import type { VendorCategory } from '../../types'

// The three meaningful steps shown in the stepper
const STEPS = ['confirmed', 'delivering', 'delivered'] as const
type TrackingStep = (typeof STEPS)[number]

function stepIndex(status: string): number {
  const i = STEPS.indexOf(status as TrackingStep)
  return i // -1 when pending/cancelled
}

// Injects the pulse keyframe once and cleans it up on unmount
function usePulseStyle() {
  useEffect(() => {
    const el = document.createElement('style')
    el.dataset.rivieraTracking = '1'
    el.textContent = `
      @keyframes rivieraPulse {
        0%   { transform: scale(1);   opacity: 0.6; }
        100% { transform: scale(2.6); opacity: 0; }
      }
    `
    document.head.appendChild(el)
    return () => { el.remove() }
  }, [])
}

function buildTrackingMarker(emoji: string): HTMLElement {
  const wrap = document.createElement('div')
  wrap.style.cssText = 'position:relative;width:56px;height:56px'

  const ring = document.createElement('div')
  ring.style.cssText = `
    position:absolute;inset:0;border-radius:50%;
    background:rgba(212,98,42,0.25);
    animation:rivieraPulse 1.8s ease-out infinite;
  `

  const pin = document.createElement('div')
  pin.style.cssText = `
    position:absolute;inset:6px;border-radius:50%;
    background:#D4622A;border:3px solid white;
    box-shadow:0 3px 10px rgba(0,0,0,0.4);
    display:flex;align-items:center;justify-content:center;
    font-size:19px;
  `
  pin.textContent = emoji

  wrap.appendChild(ring)
  wrap.appendChild(pin)
  return wrap
}

export function OrderTrackingPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { order, vendorLocation, loading } = useOrderTracking(orderId ?? null)

  const mapRef = useRef<BeachMapHandle>(null)
  const [mapInstance, setMapInstance] = useState<mapboxgl.Map | null>(null)
  const markerRef = useRef<mapboxgl.Marker | null>(null)
  const hasCenteredRef = useRef(false)

  usePulseStyle()

  // Wait for BeachMap to expose the mapboxgl.Map instance
  useEffect(() => {
    const timer = setInterval(() => {
      if (mapRef.current?.map) {
        setMapInstance(mapRef.current.map)
        clearInterval(timer)
      }
    }, 150)
    return () => clearInterval(timer)
  }, [])

  // Create or update the pulsing tracking marker
  useEffect(() => {
    if (!mapInstance || !vendorLocation) return
    const { longitude, latitude } = vendorLocation
    const emoji = order?.vendor?.category
      ? CATEGORY_EMOJI[order.vendor.category as VendorCategory]
      : '📍'

    if (!markerRef.current) {
      const el = buildTrackingMarker(emoji)
      const m = new mapboxgl.Marker({ element: el })
        .setLngLat([longitude, latitude])
        .addTo(mapInstance)
      markerRef.current = m
    } else {
      markerRef.current.setLngLat([longitude, latitude])
    }

    // Fly to vendor on first location fix, then follow silently
    if (!hasCenteredRef.current) {
      hasCenteredRef.current = true
      mapRef.current?.flyTo(longitude, latitude, 16)
    } else {
      mapInstance.easeTo({ center: [longitude, latitude], duration: 800 })
    }
  }, [vendorLocation, mapInstance, order?.vendor?.category])

  // Clean up marker when component unmounts
  useEffect(() => {
    return () => { markerRef.current?.remove() }
  }, [])

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-sand">
        <Spinner size="lg" />
      </div>
    )
  }

  /* ── Order not found ── */
  if (!order) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 bg-sand p-6">
        <p className="font-body text-gray-500">Pedido não encontrado.</p>
        <button
          onClick={() => navigate('/app/pedidos')}
          className="font-body font-semibold text-coral hover:underline"
        >
          ← {t('tracking.backToOrders')}
        </button>
      </div>
    )
  }

  const idx = stepIndex(order.status)
  const isDelivered = order.status === 'delivered'
  const isCancelled = order.status === 'cancelled'
  const isPending = order.status === 'pending'

  /* ── Delivered success screen ── */
  if (isDelivered) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-6 bg-sand p-8">
        <div className="text-6xl">🎉</div>
        <div className="text-center">
          <h2 className="font-display text-2xl font-bold text-gray-900 mb-2">
            {t('tracking.delivered')}
          </h2>
          <p className="font-body text-gray-500">{t('tracking.deliveredMsg')}</p>
        </div>
        <button
          onClick={() => navigate('/app')}
          className="mt-2 inline-flex items-center justify-center rounded-2xl bg-coral px-8 py-3 font-body text-base font-semibold text-white transition-colors hover:bg-coral/90"
        >
          {t('tracking.backToMap')}
        </button>
      </div>
    )
  }

  /* ── Active tracking view ── */
  return (
    <div className="flex h-full flex-col">
      {/* Map fills remaining space */}
      <div className="relative min-h-0 flex-1">
        <BeachMap ref={mapRef} className="absolute inset-0 w-full h-full" />

        {/* Back button overlay */}
        <button
          onClick={() => navigate('/app/pedidos')}
          className="absolute left-4 top-4 z-10 flex items-center gap-1.5 rounded-full bg-white px-3 py-2 font-body text-sm font-semibold text-gray-700 shadow-md hover:bg-gray-50"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          {t('tracking.title')}
        </button>

        {/* "No location yet" banner */}
        {!vendorLocation && !isPending && (
          <div className="absolute left-1/2 top-16 z-10 -translate-x-1/2 rounded-full bg-white/90 px-4 py-2 font-body text-sm text-gray-600 shadow-md">
            {t('tracking.noLocation')}
          </div>
        )}
      </div>

      {/* Bottom info card */}
      <div className="shrink-0 rounded-t-3xl bg-white px-5 pt-5 pb-6 shadow-2xl flex flex-col gap-4">

        {/* Vendor row */}
        <div className="flex items-center gap-3">
          {order.vendor?.logo_url ? (
            <img
              src={order.vendor.logo_url}
              alt=""
              className="h-12 w-12 shrink-0 rounded-xl object-cover"
            />
          ) : (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sand-100 text-xl">
              {order.vendor?.category
                ? CATEGORY_EMOJI[order.vendor.category as VendorCategory]
                : '🛍️'}
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate font-display font-semibold text-gray-900">
              {order.vendor?.display_name}
            </p>
            <p className="font-body text-xs text-gray-400">
              R$ {order.total_brl.toFixed(2).replace('.', ',')}
              {' · '}
              {order.order_items?.length ?? 0}{' '}
              {(order.order_items?.length ?? 0) === 1 ? 'item' : 'itens'}
            </p>
          </div>
        </div>

        {/* Status area */}
        {isPending && (
          <div className="flex items-center gap-2.5 rounded-xl bg-yellow-50 p-3">
            <Spinner size="sm" />
            <p className="font-body text-sm text-yellow-700">
              {t('tracking.waitingConfirmation')}
            </p>
          </div>
        )}

        {isCancelled && (
          <div className="rounded-xl bg-red-50 p-3">
            <p className="font-body text-sm text-red-700">Pedido cancelado.</p>
          </div>
        )}

        {!isPending && !isCancelled && (
          <div className="flex items-start">
            {STEPS.map((step, i) => {
              const done = idx > i
              const active = idx === i
              return (
                <div key={step} className="flex flex-1 items-start last:flex-none last:w-auto">
                  <div className="flex flex-col items-center gap-1.5">
                    {/* Circle */}
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all ${
                        done
                          ? 'bg-coral text-white'
                          : active
                            ? 'bg-coral text-white ring-2 ring-coral ring-offset-2'
                            : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {done ? (
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        i + 1
                      )}
                    </div>
                    {/* Label */}
                    <span
                      className={`whitespace-nowrap font-body text-xs ${
                        active
                          ? 'font-semibold text-coral'
                          : done
                            ? 'text-gray-600'
                            : 'text-gray-400'
                      }`}
                    >
                      {t(`tracking.step.${step}`)}
                    </span>
                  </div>

                  {/* Connector line */}
                  {i < STEPS.length - 1 && (
                    <div
                      className={`mx-1 mb-8 h-0.5 flex-1 rounded-full transition-colors ${
                        done ? 'bg-coral' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Delivery location */}
        {order.delivery_location && (
          <p className="flex items-center gap-1 font-body text-xs text-gray-500">
            <span>📍</span>
            {order.delivery_location}
          </p>
        )}
      </div>
    </div>
  )
}
