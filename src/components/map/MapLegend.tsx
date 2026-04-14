import { CATEGORY_COLORS, CATEGORY_EMOJI, CATEGORY_LABELS } from '../../lib/constants'
import type { VendorCategory } from '../../types'

const CATEGORIES: VendorCategory[] = ['bebidas', 'comidas', 'sorvete', 'artesanato', 'equipamentos', 'outros']

export function MapLegend() {
  return (
    <div className="absolute bottom-6 left-4 bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-3 flex flex-col gap-1.5 z-10">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide font-body mb-0.5">Categorias</p>
      {CATEGORIES.map(cat => (
        <div key={cat} className="flex items-center gap-2">
          <span
            className="w-6 h-6 rounded-full flex items-center justify-center text-sm border-2 border-white shadow-sm"
            style={{ background: CATEGORY_COLORS[cat] }}
          >
            {CATEGORY_EMOJI[cat]}
          </span>
          <span className="text-xs text-gray-700 font-body">{CATEGORY_LABELS[cat]}</span>
        </div>
      ))}
    </div>
  )
}
