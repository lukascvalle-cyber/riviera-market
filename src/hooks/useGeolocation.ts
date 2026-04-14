import { useState, useEffect } from 'react'

interface GeoState {
  latitude: number | null
  longitude: number | null
  accuracy: number | null
  error: string | null
  loading: boolean
}

export function useGeolocation(watch = false) {
  const [state, setState] = useState<GeoState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    error: null,
    loading: true,
  })

  useEffect(() => {
    if (!navigator.geolocation) {
      setState(s => ({ ...s, error: 'Geolocalização não suportada neste dispositivo.', loading: false }))
      return
    }

    const onSuccess = (pos: GeolocationPosition) => {
      setState({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        error: null,
        loading: false,
      })
    }

    const onError = (err: GeolocationPositionError) => {
      setState(s => ({ ...s, error: err.message, loading: false }))
    }

    const options: PositionOptions = { enableHighAccuracy: true, timeout: 10000 }

    if (watch) {
      const id = navigator.geolocation.watchPosition(onSuccess, onError, options)
      return () => navigator.geolocation.clearWatch(id)
    } else {
      navigator.geolocation.getCurrentPosition(onSuccess, onError, options)
    }
  }, [watch])

  return state
}
