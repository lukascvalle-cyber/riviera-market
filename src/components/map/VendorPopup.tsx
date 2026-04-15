import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CATEGORY_EMOJI } from '../../lib/constants'
import { Button } from '../ui/Button'
import type { VendorWithLocation, VendorCategory } from '../../types'

interface VendorPopupProps {
  vendor: VendorWithLocation
  onClose: () => void
}

export function VendorPopup({ vendor, onClose }: VendorPopupProps) {
  const navigate = useNavigate()
  const { t } = useTranslation()

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-sm px-4 z-20">
      <div className="bg-white rounded-2xl shadow-xl p-4 flex items-center gap-3">
        {vendor.logo_url ? (
          <img src={vendor.logo_url} alt={vendor.display_name} className="w-14 h-14 rounded-xl object-cover shrink-0" />
        ) : (
          <div className="w-14 h-14 rounded-xl bg-sand-100 flex items-center justify-center text-2xl shrink-0">
            {CATEGORY_EMOJI[vendor.category]}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-display font-semibold text-gray-900 truncate">{vendor.display_name}</p>
          <p className="text-sm text-gray-500 font-body">{t(`categories.${vendor.category as VendorCategory}`)}</p>
        </div>
        <div className="flex flex-col gap-1.5">
          <Button size="sm" onClick={() => { navigate(`/app/vendedor/${vendor.id}`); onClose() }}>
            {t('map.viewMenu')}
          </Button>
          <button onClick={onClose} className="text-xs text-gray-400 hover:text-gray-600 font-body text-center">
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  )
}
