import { NavLink, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../contexts/AuthContext'
import { LanguageSelector } from '../../components/ui/LanguageSelector'

export function AdminApp() {
  const { signOut } = useAuth()
  const { t } = useTranslation()

  const NAV = [
    { to: '/admin', label: t('nav.dashboard'), icon: '📊', end: true },
    { to: '/admin/mapa', label: t('nav.liveMap'), icon: '🗺️', end: false },
    { to: '/admin/vendedores', label: t('nav.vendors'), icon: '🛍️', end: false },
    { to: '/admin/pedidos', label: t('nav.orders'), icon: '📦', end: false },
  ]

  return (
    <div className="flex h-screen bg-sand">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-sand-200 flex flex-col shrink-0 hidden md:flex">
        <div className="p-5 border-b border-sand-200">
          <h1 className="font-display font-bold text-coral text-xl">Riviera</h1>
          <p className="font-display text-ocean text-sm">Market · Admin</p>
        </div>
        <nav className="flex-1 p-3 flex flex-col gap-1">
          {NAV.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-body font-semibold text-sm transition-colors ${
                  isActive ? 'bg-coral-50 text-coral' : 'text-gray-600 hover:bg-sand-50'
                }`
              }
            >
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-sand-200 flex items-center justify-between">
          <LanguageSelector />
          <button onClick={signOut} className="text-sm text-gray-400 hover:text-gray-600 font-body">
            {t('common.logout')}
          </button>
        </div>
      </aside>

      {/* Mobile top nav */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="bg-white border-b border-sand-200 flex items-center justify-between px-4 py-3 md:hidden shrink-0">
          <div>
            <span className="font-display font-bold text-coral">Riviera</span>
            <span className="font-display text-ocean ml-1">· Admin</span>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSelector />
            <button onClick={signOut} className="text-sm text-gray-400 font-body">
              {t('common.logout')}
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>

        <nav className="bg-white border-t border-sand-200 flex md:hidden shrink-0">
          {NAV.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center py-2.5 gap-0.5 font-body text-xs font-semibold transition-colors ${
                  isActive ? 'text-coral' : 'text-gray-400'
                }`
              }
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}
