import { useEffect, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../contexts/AuthContext'
import { LanguageSelector } from '../../components/ui/LanguageSelector'
import { supabase } from '../../lib/supabase'

export function AdminApp() {
  const { signOut } = useAuth()
  const { t } = useTranslation()
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    supabase
      .from('vendor_applications')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending')
      .then(({ count }) => { if (count !== null) setPendingCount(count) })
  }, [])

  const NAV = [
    { to: '/admin', label: t('nav.dashboard'), icon: '📊', end: true, badge: 0 },
    { to: '/admin/mapa', label: t('nav.liveMap'), icon: '🗺️', end: false, badge: 0 },
    { to: '/admin/cadastros', label: t('nav.applications'), icon: '📝', end: false, badge: pendingCount },
    { to: '/admin/vendedores', label: t('nav.vendors'), icon: '🛍️', end: false, badge: 0 },
    { to: '/admin/pedidos', label: t('nav.orders'), icon: '📦', end: false, badge: 0 },
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
              <span className="flex-1">{item.label}</span>
              {item.badge > 0 && (
                <span className="bg-coral text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shrink-0">
                  {item.badge}
                </span>
              )}
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
              <span className="relative text-lg">
                {item.icon}
                {item.badge > 0 && (
                  <span className="absolute -top-1 -right-1.5 bg-coral text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </span>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}
