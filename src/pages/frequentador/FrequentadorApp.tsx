import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

const NAV = [
  { to: '/app', label: 'Mapa', icon: '🗺️', end: true },
  { to: '/app/pedidos', label: 'Pedidos', icon: '📋', end: false },
]

export function FrequentadorApp() {
  const { signOut } = useAuth()

  return (
    <div className="flex flex-col h-screen">
      {/* Top bar */}
      <header className="bg-white border-b border-sand-200 flex items-center justify-between px-4 py-3 shrink-0">
        <div>
          <span className="font-display font-bold text-coral text-lg">Riviera</span>
          <span className="font-display text-ocean text-lg ml-1">Market</span>
        </div>
        <button onClick={signOut} className="text-sm text-gray-400 hover:text-gray-600 font-body">
          Sair
        </button>
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
