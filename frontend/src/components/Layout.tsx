import { Link, Outlet, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function Layout() {
  const { isAuthenticated, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation bar */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="text-lg font-bold text-indigo-600">
            Wireless Plans
          </Link>
          <div className="flex gap-3 text-sm">
            {isAuthenticated ? (
              <>
                <Link to="/plans" className="text-gray-600 hover:text-indigo-600">
                  Plans
                </Link>
                <Link to="/orders" className="text-gray-600 hover:text-indigo-600">
                  Orders
                </Link>
                <Link to="/profile" className="text-gray-600 hover:text-indigo-600">
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-gray-600 hover:text-red-600"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-600 hover:text-indigo-600">
                  Login
                </Link>
                <Link to="/register" className="text-gray-600 hover:text-indigo-600">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Page content */}
      <main className="max-w-md mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
