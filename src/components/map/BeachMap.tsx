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

      map.on('load', () => {
        map.addSource('modulo-8', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: { name: 'Módulo 8' },
            geometry: {
              type: 'Polygon',
              coordinates: [[
                [-46.00593473994792, -23.798198064418628],
                [-46.00573344797124, -23.799630541149156],
                [-46.001916355661734, -23.800032996055634],
                [-46.001178285078595, -23.798464097005535],
                [-46.00149886119107, -23.798382240882788],
                [-46.00190890040383, -23.798279920655986],
                [-46.0022518422908, -23.798198064418628],
                [-46.00281844170783, -23.79812302951609],
                [-46.00312410730294, -23.798061637268347],
                [-46.00351923599831, -23.79805481590536],
                [-46.003772714784986, -23.798061637268347],
                [-46.0040038277956, -23.798075279993256],
                [-46.00418275399778, -23.798068458630993],
                [-46.00463006950241, -23.798088922715195],
                [-46.00515193759156, -23.79812302951609],
                [-46.00569617145595, -23.798184421736238],
                [-46.00593473994792, -23.798198064418628],
              ]],
            },
          },
        })

        map.addLayer({
          id: 'modulo-8-fill',
          type: 'fill',
          source: 'modulo-8',
          paint: {
            'fill-color': '#0ea5e9',
            'fill-opacity': 0.15,
          },
        })

        map.addLayer({
          id: 'modulo-8-line',
          type: 'line',
          source: 'modulo-8',
          paint: {
            'line-color': '#0ea5e9',
            'line-width': 2,
          },
        })

        map.addLayer({
          id: 'modulo-8-label',
          type: 'symbol',
          source: 'modulo-8',
          layout: {
            'text-field': ['get', 'name'],
            'text-size': 14,
            'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
          },
          paint: {
            'text-color': '#0ea5e9',
            'text-halo-color': '#ffffff',
            'text-halo-width': 2,
          },
        })
      })

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
