import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import ChatWidget from './ChatWidget'

export default function Layout() {
  const { isAuthenticated, isAdmin, userEmail, logout } = useAuthStore()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    setMenuOpen(false)
    navigate('/login')
  }

  const initial = userEmail?.charAt(0).toUpperCase() || '?'

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `relative px-3 py-2 text-sm font-medium min-h-[44px] flex items-center transition-colors focus-visible:ring-2 focus-visible:ring-[--color-primary] focus-visible:ring-offset-2 rounded-lg ${
      isActive
        ? 'text-[--color-primary] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[--color-primary]'
        : 'text-[--color-text-primary] hover:text-[--color-primary]'
    }`

  const mobileNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    `block px-4 py-3 text-base font-medium min-h-[48px] flex items-center transition-colors rounded-xl ${
      isActive
        ? 'text-[--color-primary] bg-red-50'
        : 'text-[--color-text-primary] hover:bg-[--color-bg-secondary]'
    }`

  return (
    <div className="min-h-screen bg-[--color-bg-secondary]">
      {/* Navigation bar */}
      <nav className="bg-white border-b border-[--color-border-subtle] sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-16">
          <NavLink to="/" className="text-xl font-extrabold text-[--color-primary] tracking-tight focus-visible:ring-2 focus-visible:ring-[--color-primary] focus-visible:ring-offset-2 rounded-lg px-1">
            Wireless
          </NavLink>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
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
                  className="ml-2 px-3 py-2 text-sm font-medium text-[--color-text-primary] hover:text-[--color-error] min-h-[44px] flex items-center focus-visible:ring-2 focus-visible:ring-[--color-primary] focus-visible:ring-offset-2 rounded-lg"
                >
                  Logout
                </button>
                <div className="ml-2 w-9 h-9 rounded-full bg-[--color-primary] text-white flex items-center justify-center text-sm font-semibold shrink-0">
                  {initial}
                </div>
              </>
            ) : (
              <>
                <NavLink to="/login" className={navLinkClass}>Login</NavLink>
                <NavLink
                  to="/register"
                  className="ml-2 bg-[--color-primary] hover:bg-[--color-primary-hover] text-white text-sm font-semibold px-5 min-h-[40px] flex items-center rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-[--color-primary] focus-visible:ring-offset-2"
                >
                  Register
                </NavLink>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center text-[--color-text-primary] focus-visible:ring-2 focus-visible:ring-[--color-primary] focus-visible:ring-offset-2 rounded-lg"
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile menu dropdown */}
        {menuOpen && (
          <div className="md:hidden border-t border-[--color-border-subtle] bg-white px-4 py-3 space-y-1">
            {isAuthenticated ? (
              <>
                <NavLink to="/plans" className={mobileNavLinkClass} onClick={() => setMenuOpen(false)}>Plans</NavLink>
                <NavLink to="/my-plan" className={mobileNavLinkClass} onClick={() => setMenuOpen(false)}>My Plan</NavLink>
                <NavLink to="/orders" className={mobileNavLinkClass} onClick={() => setMenuOpen(false)}>Orders</NavLink>
                <NavLink to="/profile" className={mobileNavLinkClass} onClick={() => setMenuOpen(false)}>Profile</NavLink>
                {isAdmin && (
                  <NavLink to="/admin" className={mobileNavLinkClass} onClick={() => setMenuOpen(false)}>Admin</NavLink>
                )}
                <div className="border-t border-[--color-border-subtle] mt-2 pt-2">
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-3 text-base font-medium text-[--color-error] min-h-[48px] flex items-center rounded-xl hover:bg-red-50 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                <NavLink to="/login" className={mobileNavLinkClass} onClick={() => setMenuOpen(false)}>Login</NavLink>
                <NavLink to="/register" className={mobileNavLinkClass} onClick={() => setMenuOpen(false)}>Register</NavLink>
              </>
            )}
          </div>
        )}
      </nav>

      {/* Page content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <Outlet />
      </main>
      <ChatWidget />
    </div>
  )
}
