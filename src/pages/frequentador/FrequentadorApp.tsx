import { NavLink, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../contexts/AuthContext'
import { LanguageSelector } from '../../components/ui/LanguageSelector'

export function FrequentadorApp() {
  const { signOut } = useAuth()
  const { t } = useTranslation()

  const NAV = [
    { to: '/app', label: t('nav.map'), icon: '🗺️', end: true },
    { to: '/app/pedidos', label: t('nav.orders'), icon: '📋', end: false },
  ]

  return (
    <div className="flex flex-col h-screen">
      {/* Top bar */}
      <header className="bg-white border-b border-sand-200 flex items-center justify-between px-4 py-3 shrink-0">
        <div>
          <span className="font-display font-bold text-coral text-lg">Riviera</span>
          <span className="font-display text-ocean text-lg ml-1">Market</span>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSelector />
          <button onClick={signOut} className="text-sm text-gray-400 hover:text-gray-600 font-body">
            {t('common.logout')}
          </button>
        </div>
      </header>

      {/* Map/content area */}
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>

      {/* Bottom nav */}
      <nav className="bg-white border-t border-sand-200 flex shrink-0 safe-area-pb">
        {NAV.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center py-3 gap-0.5 font-body text-xs font-semibold transition-colors ${
                isActive ? 'text-coral' : 'text-gray-400'
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
