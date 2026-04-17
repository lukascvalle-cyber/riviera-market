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
            'fill-color': '#2E86AB',
            'fill-opacity': 0.08,
          },
        })

        map.addLayer({
          id: 'modulo-8-line',
          type: 'line',
          source: 'modulo-8',
          paint: {
            'line-color': '#2E86AB',
            'line-width': 2,
          },
        })

        map.addLayer({
          id: 'modulo-8-label',
          type: 'symbol',
          source: 'modulo-8',
          layout: {
            'text-field': ['get', 'name'],
            'text-size': 13,
            'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
          },
          paint: {
            'text-color': '#2E86AB',
            'text-halo-color': '#ffffff',
            'text-halo-width': 2,
          },
        })

        // ── Módulo 7 ──
        map.addSource('modulo-7', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: { name: 'Módulo 7' },
            geometry: {
              type: 'Polygon',
              coordinates: [[
                [-46.00594331339332, -23.798203215930513],
                [-46.006615661970585, -23.798309689407304],
                [-46.00695830114961, -23.79841024761062],
                [-46.00867796193455, -23.79885388581387],
                [-46.01111522552756, -23.799415825363795],
                [-46.010643288545225, -23.800941922613063],
                [-46.00572997201755, -23.79964651563266],
                [-46.00594331339332, -23.798203215930513],
              ]],
            },
          },
        })

        map.addLayer({
          id: 'modulo-7-fill',
          type: 'fill',
          source: 'modulo-7',
          paint: {
            'fill-color': '#2E86AB',
            'fill-opacity': 0.08,
          },
        })

        map.addLayer({
          id: 'modulo-7-outline',
          type: 'line',
          source: 'modulo-7',
          paint: {
            'line-color': '#2E86AB',
            'line-width': 2,
          },
        })

        map.addLayer({
          id: 'modulo-7-label',
          type: 'symbol',
          source: 'modulo-7',
          layout: {
            'text-field': ['get', 'name'],
            'text-size': 13,
            'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
          },
          paint: {
            'text-color': '#2E86AB',
            'text-halo-color': '#ffffff',
            'text-halo-width': 2,
          },
        })

        // ── Módulo 6 ──
        map.addSource('modulo-6', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: { name: 'Módulo 6' },
            geometry: {
              type: 'Polygon',
              coordinates: [[
                [-46.011137873124454, -23.799415460850483],
                [-46.015973166403086, -23.8010707831354],
                [-46.01534847247248, -23.80266670168855],
                [-46.01063487281763, -23.800944593389417],
                [-46.011137873124454, -23.799415460850483],
              ]],
            },
          },
        })

        map.addLayer({
          id: 'modulo-6-fill',
          type: 'fill',
          source: 'modulo-6',
          paint: {
            'fill-color': '#2E86AB',
            'fill-opacity': 0.08,
          },
        })

        map.addLayer({
          id: 'modulo-6-outline',
          type: 'line',
          source: 'modulo-6',
          paint: {
            'line-color': '#2E86AB',
            'line-width': 2,
          },
        })

        map.addLayer({
          id: 'modulo-6-label',
          type: 'symbol',
          source: 'modulo-6',
          layout: {
            'text-field': ['get', 'name'],
            'text-size': 13,
            'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
          },
          paint: {
            'text-color': '#2E86AB',
            'text-halo-color': '#ffffff',
            'text-halo-width': 2,
          },
        })

        // ── Módulo 5 ──
        map.addSource('modulo-5', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: { name: 'Módulo 5' },
            geometry: {
              type: 'Polygon',
              coordinates: [[
                [-46.015981738600146, -23.80107432291568],
                [-46.020999261373106, -23.802683941244624],
                [-46.020366514202266, -23.804438799372065],
                [-46.01535004365036, -23.80266595533989],
                [-46.015981738600146, -23.80107432291568],
              ]],
            },
          },
        })

        map.addLayer({
          id: 'modulo-5-fill',
          type: 'fill',
          source: 'modulo-5',
          paint: {
            'fill-color': '#2E86AB',
            'fill-opacity': 0.08,
          },
        })

        map.addLayer({
          id: 'modulo-5-outline',
          type: 'line',
          source: 'modulo-5',
          paint: {
            'line-color': '#2E86AB',
            'line-width': 2,
          },
        })

        map.addLayer({
          id: 'modulo-5-label',
          type: 'symbol',
          source: 'modulo-5',
          layout: {
            'text-field': ['get', 'name'],
            'text-size': 13,
            'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
          },
          paint: {
            'text-color': '#2E86AB',
            'text-halo-color': '#ffffff',
            'text-halo-width': 2,
          },
        })

        // ── Módulo 4 ──
        map.addSource('modulo-4', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: { name: 'Módulo 4' },
            geometry: {
              type: 'Polygon',
              coordinates: [[
                [-46.02100150194667, -23.80268754121191],
                [-46.02580268042851, -23.804754721836957],
                [-46.02501318182769, -23.80650475244262],
                [-46.02036605185347, -23.804437599672767],
                [-46.02100150194667, -23.80268754121191],
              ]],
            },
          },
        })

        map.addLayer({
          id: 'modulo-4-fill',
          type: 'fill',
          source: 'modulo-4',
          paint: { 'fill-color': '#2E86AB', 'fill-opacity': 0.08 },
        })

        map.addLayer({
          id: 'modulo-4-outline',
          type: 'line',
          source: 'modulo-4',
          paint: { 'line-color': '#2E86AB', 'line-width': 2 },
        })

        map.addLayer({
          id: 'modulo-4-label',
          type: 'symbol',
          source: 'modulo-4',
          layout: {
            'text-field': ['get', 'name'],
            'text-size': 13,
            'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
          },
          paint: {
            'text-color': '#2E86AB',
            'text-halo-color': '#ffffff',
            'text-halo-width': 2,
          },
        })

        // ── Módulo 3 ──
        map.addSource('modulo-3', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: { name: 'Módulo 3' },
            geometry: {
              type: 'Polygon',
              coordinates: [[
                [-46.02580307172906, -23.80476076938602],
                [-46.02662466711027, -23.805212954650727],
                [-46.02770300666285, -23.80578846864333],
                [-46.0277992869801, -23.805882429869],
                [-46.03069411279279, -23.8074210377724],
                [-46.02946172473327, -23.809241501539404],
                [-46.025013573128916, -23.806504927365026],
                [-46.02580307172906, -23.80476076938602],
              ]],
            },
          },
        })

        map.addLayer({
          id: 'modulo-3-fill',
          type: 'fill',
          source: 'modulo-3',
          paint: { 'fill-color': '#2E86AB', 'fill-opacity': 0.08 },
        })

        map.addLayer({
          id: 'modulo-3-outline',
          type: 'line',
          source: 'modulo-3',
          paint: { 'line-color': '#2E86AB', 'line-width': 2 },
        })

        map.addLayer({
          id: 'modulo-3-label',
          type: 'symbol',
          source: 'modulo-3',
          layout: {
            'text-field': ['get', 'name'],
            'text-size': 13,
            'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
          },
          paint: {
            'text-color': '#2E86AB',
            'text-halo-color': '#ffffff',
            'text-halo-width': 2,
          },
        })

        // ── Módulo 2 ──
        map.addSource('modulo-2', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: { name: 'Módulo 2' },
            geometry: {
              type: 'Polygon',
              coordinates: [[
                [-46.030705161111854, -23.807425161614816],
                [-46.03100053932371, -23.8075284900481],
                [-46.0331376875651, -23.808537925028944],
                [-46.03530089858904, -23.809626834281502],
                [-46.033884820689536, -23.811542338616604],
                [-46.02944545991309, -23.809245319670623],
                [-46.030705161111854, -23.807425161614816],
              ]],
            },
          },
        })

        map.addLayer({
          id: 'modulo-2-fill',
          type: 'fill',
          source: 'modulo-2',
          paint: { 'fill-color': '#2E86AB', 'fill-opacity': 0.08 },
        })

        map.addLayer({
          id: 'modulo-2-outline',
          type: 'line',
          source: 'modulo-2',
          paint: { 'line-color': '#2E86AB', 'line-width': 2 },
        })

        map.addLayer({
          id: 'modulo-2-label',
          type: 'symbol',
          source: 'modulo-2',
          layout: {
            'text-field': ['get', 'name'],
            'text-size': 13,
            'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
          },
          paint: {
            'text-color': '#2E86AB',
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
