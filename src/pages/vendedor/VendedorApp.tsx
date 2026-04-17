import { NavLink, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../contexts/AuthContext'
import { LanguageSelector } from '../../components/ui/LanguageSelector'

export function VendedorApp() {
  const { signOut, vendor } = useAuth()
  const { t } = useTranslation()

  const NAV = [
    { to: '/vendedor', label: t('nav.orders'), icon: '📋', end: true },
    { to: '/vendedor/cardapio', label: t('nav.menu'), icon: '🍽️', end: false },
    { to: '/vendedor/perfil', label: t('nav.profile'), icon: '👤', end: false },
  ]

  return (
    <div className="flex flex-col h-screen" style={{ backgroundColor: '#FAFAF8' }}>
      <header className="bg-white border-b border-[#E8E8E4] flex items-center justify-between px-4 py-3 shrink-0">
        <div>
          <span className="font-display font-bold text-[#2E86AB] text-lg">Riviera</span>
          <span className="font-display text-[#2E86AB] text-lg ml-1 opacity-70">Market</span>
          {vendor?.display_name && (
            <span className="ml-2 text-sm text-[#6B7280] font-body">· {vendor.display_name}</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <LanguageSelector />
          <button onClick={signOut} className="text-sm text-[#6B7280] hover:text-[#1A1A2E] font-body transition-colors">
            {t('common.logout')}
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>

      <nav className="bg-white border-t border-[#E8E8E4] flex shrink-0">
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
