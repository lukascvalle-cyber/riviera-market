import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import { CATEGORY_COLORS, CATEGORY_EMOJI } from '../../lib/constants'
import type { VendorWithLocation } from '../../types'

interface VendorPinProps {
  map: mapboxgl.Map
  vendor: VendorWithLocation
  onClick: (vendor: VendorWithLocation) => void
}

export function VendorPin({ map, vendor, onClick }: VendorPinProps) {
  const markerRef = useRef<mapboxgl.Marker | null>(null)
  // Keep latest vendor + callback in refs so the marker click always has fresh data
  // without needing to recreate the marker on every change.
  const vendorRef = useRef(vendor)
  const onClickRef = useRef(onClick)
  useEffect(() => { vendorRef.current = vendor }, [vendor])
  useEffect(() => { onClickRef.current = onClick }, [onClick])

  // Create the marker once per (map, vendor.id, vendor.category).
  // vendor.category is included because it determines the colour/emoji of the pin.
  useEffect(() => {
    if (!vendor.location) return

    const el = document.createElement('div')
    el.className = 'vendor-pin'
    el.style.cssText = `
      width: 38px; height: 38px; border-radius: 50%;
      background: ${CATEGORY_COLORS[vendor.category]};
      border: 2px solid white;
      box-shadow: 0 2px 6px rgba(0,0,0,0.30);
      display: flex; align-items: center; justify-content: center;
      font-size: 18px; cursor: pointer;
      position: relative;
      transition: transform 0.15s ease;
    `
    el.textContent = CATEGORY_EMOJI[vendor.category]
    el.title = vendor.display_name

    // Online status dot
    const dot = document.createElement('span')
    dot.style.cssText = `
      position: absolute; bottom: 0; right: 0;
      width: 9px; height: 9px; border-radius: 50%;
      background: #22c55e; border: 1.5px solid white;
    `
    el.appendChild(dot)

    el.addEventListener('mouseenter', () => { el.style.transform = 'scale(1.15)' })
    el.addEventListener('mouseleave', () => { el.style.transform = 'scale(1)' })
    // Use refs so click always passes the latest vendor object
    el.addEventListener('click', () => onClickRef.current(vendorRef.current))

    const marker = new mapboxgl.Marker({ element: el })
      .setLngLat([vendor.location.longitude, vendor.location.latitude])
      .addTo(map)

    markerRef.current = marker

    return () => {
      marker.remove()
      markerRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, vendor.id, vendor.category])

  // Smooth real-time position update — no marker recreation needed
  useEffect(() => {
    if (markerRef.current && vendor.location) {
      markerRef.current.setLngLat([vendor.location.longitude, vendor.location.latitude])
    }
  }, [vendor.location])

  return null
}
