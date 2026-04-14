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

  useEffect(() => {
    if (!vendor.location) return

    const el = document.createElement('div')
    el.className = 'vendor-pin'
    el.style.cssText = `
      width: 44px; height: 44px; border-radius: 50%;
      background: ${CATEGORY_COLORS[vendor.category]};
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.35);
      display: flex; align-items: center; justify-content: center;
      font-size: 20px; cursor: pointer;
      transition: transform 0.15s ease;
    `
    el.textContent = CATEGORY_EMOJI[vendor.category]
    el.title = vendor.display_name
    el.addEventListener('mouseenter', () => { el.style.transform = 'scale(1.15)' })
    el.addEventListener('mouseleave', () => { el.style.transform = 'scale(1)' })
    el.addEventListener('click', () => onClick(vendor))

    const marker = new mapboxgl.Marker({ element: el })
      .setLngLat([vendor.location.longitude, vendor.location.latitude])
      .addTo(map)

    markerRef.current = marker

    return () => {
      marker.remove()
      markerRef.current = null
    }
  }, [map, vendor, onClick])

  // Update position if location changes
  useEffect(() => {
    if (markerRef.current && vendor.location) {
      markerRef.current.setLngLat([vendor.location.longitude, vendor.location.latitude])
    }
  }, [vendor.location])

  return null
}
