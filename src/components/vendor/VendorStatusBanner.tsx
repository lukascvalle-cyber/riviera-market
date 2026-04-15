import { useTranslation } from 'react-i18next'
import { Button } from '../ui/Button'

interface VendorStatusBannerProps {
  isLive: boolean
  isApproved: boolean
  onGoLive: () => void
  onGoOffline: () => void
  error?: string | null
}

export function VendorStatusBanner({ isLive, isApproved, onGoLive, onGoOffline, error }: VendorStatusBannerProps) {
  const { t } = useTranslation()

  if (!isApproved) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
        <p className="font-semibold text-yellow-800 font-body">{t('vendor.status.awaitingTitle')}</p>
        <p className="text-sm text-yellow-700 font-body mt-1">
          {t('vendor.status.awaitingMsg')}
        </p>
      </div>
    )
  }

  return (
    <div className={`rounded-2xl p-4 border ${isLive ? 'bg-green-50 border-green-200' : 'bg-sand-50 border-sand-200'}`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
            <p className="font-semibold font-body text-gray-900">
              {isLive ? t('vendor.status.live') : t('vendor.status.offline')}
            </p>
          </div>
          <p className="text-sm text-gray-500 font-body mt-0.5">
            {isLive ? t('vendor.status.positionVisible') : t('vendor.status.activateToShow')}
          </p>
        </div>
        {isLive ? (
          <Button variant="ghost" size="sm" onClick={onGoOffline}>{t('vendor.status.goOffline')}</Button>
        ) : (
          <Button size="sm" onClick={onGoLive}>{t('vendor.status.goLive')}</Button>
        )}
      </div>
      {error && <p className="text-xs text-red-600 mt-2 font-body">{error}</p>}
    </div>
  )
}
