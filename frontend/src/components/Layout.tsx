import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import ChatWidget from './ChatWidget'

export default function Layout() {
  const { isAuthenticated, isAdmin, userEmail, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const initial = userEmail?.charAt(0).toUpperCase() || '?'

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `relative px-3 py-2 text-sm font-medium min-h-[44px] flex items-center transition-colors focus-visible:ring-2 focus-visible:ring-[--color-primary] focus-visible:ring-offset-2 ${
      isActive
        ? 'text-[--color-primary] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[--color-primary]'
        : 'text-[--color-text-secondary] hover:text-[--color-text-primary]'
    }`

  return (
    <div className="min-h-screen bg-[--color-bg-secondary]">
      {/* Navigation bar */}
      <nav className="bg-white border-b border-[--color-border-subtle] sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-0 flex items-center justify-between h-16">
          <NavLink to="/" className="text-xl font-extrabold text-[--color-primary] tracking-tight focus-visible:ring-2 focus-visible:ring-[--color-primary] focus-visible:ring-offset-2 rounded-lg px-1">
            Wireless
          </NavLink>
          <div className="flex items-center gap-1">
            {isAuthenticated ? (
              <>
                <NavLink to="/plans" className={navLinkClass}>Plans</NavLink>
                <NavLink to="/my-plan" className={navLinkClass}>My Plan</NavLink>
                <NavLink to="/orders" className={navLinkClass}>Orders</NavLink>
                <NavLink to="/profile" className={navLinkClass}>Profile</NavLink>
                {isAdmin && (
                  <NavLink to="/admin" className={navLinkClass}>Admin</NavLink>
                )}
                <button
                  onClick={handleLogout}
                  className="ml-2 px-3 py-2 text-sm font-medium text-[--color-text-secondary] hover:text-[--color-error] min-h-[44px] flex items-center focus-visible:ring-2 focus-visible:ring-[--color-primary] focus-visible:ring-offset-2 rounded-lg"
                >
                  Logout
                </button>
                <div className="ml-2 w-9 h-9 rounded-full bg-[--color-primary] text-white flex items-center justify-center text-sm font-semibold">
                  {initial}
                </div>
              </>
            ) : (
              <>
                <NavLink to="/login" className={navLinkClass}>Login</NavLink>
                <NavLink to="/register" className={navLinkClass}>Register</NavLink>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Page content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <Outlet />
      </main>
      <ChatWidget />
    </div>
  )
}
