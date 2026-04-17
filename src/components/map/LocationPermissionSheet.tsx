import { useState, useEffect } from 'react'

interface LocationPermissionSheetProps {
  onGranted: (coords: GeolocationCoordinates) => void
  onDismissed: () => void
}

export function LocationPermissionSheet({ onGranted, onDismissed }: LocationPermissionSheetProps) {
  const [visible, setVisible] = useState(false)
  const [requesting, setRequesting] = useState(false)
  const [denied, setDenied] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80)
    return () => clearTimeout(t)
  }, [])

  async function handleAllow() {
    setRequesting(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setRequesting(false)
        onGranted(pos.coords)
      },
      (err) => {
        setRequesting(false)
        if (err.code === err.PERMISSION_DENIED) setDenied(true)
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    )
  }

  return (
    <div className="absolute inset-0 z-[40] flex items-end" style={{ pointerEvents: 'all' }}>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[1px] transition-opacity duration-300"
        style={{ opacity: visible ? 1 : 0 }}
        onClick={onDismissed}
      />

      {/* Sheet */}
      <div
        className="relative w-full bg-white rounded-t-[24px] shadow-2xl px-6 pt-5 pb-8 flex flex-col items-center gap-5"
        style={{
          transform: visible ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.3s ease-out',
          paddingBottom: 'max(32px, env(safe-area-inset-bottom))',
        }}
      >
        {/* Handle */}
        <div className="w-8 h-1 rounded-full bg-[#E8E8E4] mb-1" />

        {/* Icon */}
        <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(46,134,171,0.1)' }}>
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="#2E86AB" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
            <circle cx="12" cy="9" r="2.5" />
          </svg>
        </div>

        {denied ? (
          <>
            <div className="text-center flex flex-col gap-2">
              <h2 className="font-display text-xl font-bold text-[#1A1A2E]">Localização bloqueada</h2>
              <p className="font-body text-sm text-[#6B7280] leading-relaxed">
                Para ativar, vá nas configurações do seu navegador e permita o acesso à localização para este site.
              </p>
            </div>
            <button
              onClick={onDismissed}
              className="w-full h-12 rounded-xl font-body font-semibold transition-colors border border-[#E8E8E4] text-[#6B7280]"
            >
              Continuar sem localização
            </button>
          </>
        ) : (
          <>
            <div className="text-center flex flex-col gap-2">
              <h2 className="font-display text-xl font-bold text-[#1A1A2E]">Ative sua localização</h2>
              <p className="font-body text-sm text-[#6B7280] leading-relaxed">
                Para encontrar os vendedores mais próximos de você na praia, precisamos saber onde você está.
              </p>
            </div>

            <div className="w-full flex flex-col gap-3">
              <button
                onClick={handleAllow}
                disabled={requesting}
                className="w-full h-12 text-white font-semibold font-body rounded-xl transition-colors disabled:opacity-50"
                style={{ backgroundColor: '#2E86AB' }}
              >
                {requesting ? 'Aguardando permissão…' : 'Permitir localização'}
              </button>
              <button
                onClick={onDismissed}
                className="w-full text-sm font-body font-semibold py-2 transition-colors"
                style={{ color: '#6B7280' }}
              >
                Agora não
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
