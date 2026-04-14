import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import mapboxgl from 'mapbox-gl'
import { BEACH_CENTER, BEACH_BOUNDS, BEACH_ZOOM, BEACH_MAX_ZOOM, BEACH_MIN_ZOOM, MAPBOX_STYLE } from '../../lib/constants'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN

export interface BeachMapHandle {
  map: mapboxgl.Map | null
  flyTo: (lng: number, lat: number, zoom?: number) => void
}

interface BeachMapProps {
  className?: string
}

export const BeachMap = forwardRef<BeachMapHandle, BeachMapProps>(
  ({ className = '' }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const mapRef = useRef<mapboxgl.Map | null>(null)

    useImperativeHandle(ref, () => ({
      get map() { return mapRef.current },
      flyTo(lng: number, lat: number, zoom = 16) {
        mapRef.current?.flyTo({ center: [lng, lat], zoom, duration: 1200 })
      },
    }))

    useEffect(() => {
      if (!containerRef.current) return

      const map = new mapboxgl.Map({
        container: containerRef.current,
        style: MAPBOX_STYLE,
        center: BEACH_CENTER,
        zoom: BEACH_ZOOM,
        maxZoom: BEACH_MAX_ZOOM,
        minZoom: BEACH_MIN_ZOOM,
        maxBounds: [
          [BEACH_BOUNDS[0][0] - 0.02, BEACH_BOUNDS[0][1] - 0.02],
          [BEACH_BOUNDS[1][0] + 0.02, BEACH_BOUNDS[1][1] + 0.02],
        ],
        language: 'pt',
      })

      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right')
      map.addControl(new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
        showUserHeading: true,
      }), 'top-right')

      mapRef.current = map

      return () => {
        map.remove()
        mapRef.current = null
      }
    }, [])

    return <div ref={containerRef} className={`w-full h-full ${className}`} />
  },
)

BeachMap.displayName = 'BeachMap'
