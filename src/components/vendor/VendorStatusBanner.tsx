import { Button } from '../ui/Button'

interface VendorStatusBannerProps {
  isLive: boolean
  isApproved: boolean
  onGoLive: () => void
  onGoOffline: () => void
  error?: string | null
}

export function VendorStatusBanner({ isLive, isApproved, onGoLive, onGoOffline, error }: VendorStatusBannerProps) {
  if (!isApproved) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
        <p className="font-semibold text-yellow-800 font-body">Aguardando aprovação</p>
        <p className="text-sm text-yellow-700 font-body mt-1">
          A sua conta está a ser verificada pelo administrador da praia. Em breve poderá ativar a sua presença no mapa.
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
              {isLive ? 'Você está ao vivo' : 'Você está offline'}
            </p>
          </div>
          <p className="text-sm text-gray-500 font-body mt-0.5">
            {isLive ? 'A sua posição está visível no mapa.' : 'Ative para aparecer no mapa.'}
          </p>
        </div>
        {isLive ? (
          <Button variant="ghost" size="sm" onClick={onGoOffline}>Ir offline</Button>
        ) : (
          <Button size="sm" onClick={onGoLive}>Ir ao vivo</Button>
        )}
      </div>
      {error && <p className="text-xs text-red-600 mt-2 font-body">{error}</p>}
    </div>
  )
}
