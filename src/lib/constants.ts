import type { VendorCategory } from '../types'

// Praia de Riviera de São Lourenço — Bertioga, SP
export const BEACH_CENTER: [number, number] = [-46.022057, -23.804102]
export const BEACH_BOUNDS: [[number, number], [number, number]] = [
  [-46.040, -23.818], // SW
  [-46.004, -23.790], // NE
]
export const BEACH_ZOOM = 15
export const BEACH_MAX_ZOOM = 18
export const BEACH_MIN_ZOOM = 13

export const MAPBOX_STYLE = 'mapbox://styles/mapbox/satellite-streets-v12'

export const CATEGORY_LABELS: Record<VendorCategory, string> = {
  bebidas: 'Bebidas',
  comidas: 'Comidas',
  sorvete: 'Sorvete',
  artesanato: 'Artesanato',
  equipamentos: 'Equipamentos',
  outros: 'Outros',
}

export const CATEGORY_COLORS: Record<VendorCategory, string> = {
  bebidas: '#1B6CA8',
  comidas: '#D4622A',
  sorvete: '#9C27B0',
  artesanato: '#2E7D32',
  equipamentos: '#F57C00',
  outros: '#607D8B',
}

export const CATEGORY_EMOJI: Record<VendorCategory, string> = {
  bebidas: '🥤',
  comidas: '🍽️',
  sorvete: '🍦',
  artesanato: '🎨',
  equipamentos: '🏄',
  outros: '🛍️',
}

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'Aguardando',
  confirmed: 'Confirmado',
  delivering: 'A caminho',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
}

export const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  delivering: 'bg-ocean-100 text-ocean-500',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}

export const GPS_INTERVAL_MS = 10_000
