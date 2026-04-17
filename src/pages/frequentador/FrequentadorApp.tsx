import { useEffect } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../components/ui/Toast'
import { supabase } from '../../lib/supabase'
import { LanguageSelector } from '../../components/ui/LanguageSelector'

export function FrequentadorApp() {
  const { signOut, user } = useAuth()
  const { t } = useTranslation()
  const toast = useToast()

  const NAV = [
    { to: '/app', label: t('nav.map'), icon: '🗺️', end: true },
    { to: '/app/pedidos', label: t('nav.orders'), icon: '📋', end: false },
  ]

  // Listen for order status changes and show toasts — active across all pages for this user
  useEffect(() => {
    if (!user?.id) return

    let channel: ReturnType<typeof supabase.channel> | null = null
    try {
      channel = supabase
        .channel(`order-status-buyer-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'orders',
            filter: `frequentador_id=eq.${user.id}`,
          },
          (payload) => {
            const { status } = payload.new as { status: string }
            if (status === 'confirmed') {
              toast('✅ Pedido aceite! O vendedor está a caminho.', 'success')
            } else if (status === 'delivering') {
              toast('🏃 O vendedor está a caminho!', 'info')
            } else if (status === 'cancelled') {
              toast('❌ Vendedor indisponível. Tente novamente.', 'error')
            } else if (status === 'delivered') {
              toast('🎉 Pedido entregue! Bom proveito.', 'success')
            }
          },
        )
        .subscribe()
    } catch (err) {
      console.error('[order-status-buyer] Realtime subscription error:', err)
    }

    return () => { if (channel) supabase.removeChannel(channel) }
  }, [user?.id, toast])

  return (
    <div className="flex flex-col h-screen" style={{ backgroundColor: '#FAFAF8' }}>
      {/* Top bar */}
      <header className="bg-white border-b border-[#E8E8E4] flex items-center justify-between px-4 py-3 shrink-0">
        <div>
          <span className="font-display font-bold text-[#2E86AB] text-lg">Riviera</span>
          <span className="font-display text-[#2E86AB] text-lg ml-1 opacity-70">Market</span>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSelector />
          <button onClick={signOut} className="text-sm text-[#6B7280] hover:text-[#1A1A2E] font-body transition-colors">
            {t('common.logout')}
          </button>
        </div>
      </header>

      {/* Map/content area */}
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>

      {/* Bottom nav */}
      <nav className="bg-white border-t border-[#E8E8E4] flex shrink-0 safe-area-pb">
        {NAV.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center py-3 gap-0.5 font-body text-xs font-semibold transition-colors ${
                isActive ? 'text-[#2E86AB]' : 'text-[#6B7280]'
              }`
            }
          >
            <span className="text-xl">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
