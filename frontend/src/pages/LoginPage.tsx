import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { userService } from '../services/userService'
import { useAuthStore } from '../store/authStore'

export default function LoginPage() {
  const navigate = useNavigate()
  const setTokens = useAuthStore((s) => s.setTokens)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const response = await userService.login({ email, password })
      setTokens(response)
      navigate('/plans')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <h1 className="text-2xl font-bold text-[--color-text-primary] text-center mb-1">Welcome back</h1>
          <p className="text-sm text-[--color-text-secondary] text-center mb-6">Sign in to manage your plan</p>

          {error && (
            <div className="bg-red-50 text-[--color-error] p-3 rounded-xl mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-[--color-text-secondary] mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 h-12 border border-[--color-border-default] rounded-lg text-sm focus:outline-none focus:border-[--color-gray-900] focus:ring-1 focus:ring-[--color-gray-900]"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-medium text-[--color-text-secondary] mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 h-12 border border-[--color-border-default] rounded-lg text-sm focus:outline-none focus:border-[--color-gray-900] focus:ring-1 focus:ring-[--color-gray-900]"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[--color-primary] hover:bg-[--color-primary-hover] active:bg-[--color-primary-pressed] active:scale-[0.98] text-white min-h-[48px] rounded-full font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 focus-visible:ring-2 focus-visible:ring-[--color-primary] focus-visible:ring-offset-2"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-[--color-text-secondary] mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-[--color-primary] hover:text-[--color-primary-hover] font-medium focus-visible:ring-2 focus-visible:ring-[--color-primary] focus-visible:ring-offset-2 rounded">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
