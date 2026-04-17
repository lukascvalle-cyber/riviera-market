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
      <div className="bg-[#F5E6D3] border border-[#E8E8E4] rounded-2xl p-4">
        <p className="font-semibold text-[#2E86AB] font-body">{t('vendor.status.awaitingTitle')}</p>
        <p className="text-sm text-[#6B7280] font-body mt-1">
          {t('vendor.status.awaitingMsg')}
        </p>
      </div>
    )
  }

  return (
    <div
      className="rounded-2xl p-4 border"
      style={{
        backgroundColor: isLive ? 'rgba(82,183,136,0.08)' : '#FAFAF8',
        borderColor: isLive ? '#52B788' : '#E8E8E4',
      }}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${isLive ? 'animate-pulse' : ''}`}
              style={{ backgroundColor: isLive ? '#52B788' : '#E8E8E4' }}
            />
            <p className="font-semibold font-body text-[#1A1A2E]">
              {isLive ? t('vendor.status.live') : t('vendor.status.offline')}
            </p>
          </div>
          <p className="text-sm text-[#6B7280] font-body mt-0.5">
            {isLive ? t('vendor.status.positionVisible') : t('vendor.status.activateToShow')}
          </p>
        </div>
        {isLive ? (
          <Button variant="ghost" size="sm" onClick={onGoOffline}>{t('vendor.status.goOffline')}</Button>
        ) : (
          <Button size="sm" onClick={onGoLive}>{t('vendor.status.goLive')}</Button>
        )}
      </div>
      {error && <p className="text-xs text-[#E63946] mt-2 font-body">{error}</p>}
    </div>
  )
}
