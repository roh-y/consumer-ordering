import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { userService } from '../services/userService'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
  })
  const [confirmationCode, setConfirmationCode] = useState('')
  const [step, setStep] = useState<'register' | 'confirm'>('register')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await userService.register(form)
      setStep('confirm')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await userService.confirm({ email: form.email, confirmationCode })
      navigate('/login')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Confirmation failed.')
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'w-full px-4 h-12 border border-border-default rounded-lg text-sm focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900'

  if (step === 'confirm') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-2xl shadow-sm p-8">
            <h1 className="text-2xl font-bold text-text-primary text-center mb-1">Verify Email</h1>
            <p className="text-sm text-text-secondary text-center mb-6">
              We sent a verification code to <strong>{form.email}</strong>
            </p>

            {error && (
              <div className="bg-red-50 text-error p-3 rounded-xl mb-4 text-sm">{error}</div>
            )}

            <form onSubmit={handleConfirm} className="space-y-4">
              <div>
                <label htmlFor="code" className="block text-xs font-medium text-text-secondary mb-2">
                  Confirmation Code
                </label>
                <input
                  id="code"
                  type="text"
                  required
                  value={confirmationCode}
                  onChange={(e) => setConfirmationCode(e.target.value)}
                  className={`${inputClass} text-center tracking-widest text-lg`}
                  placeholder="123456"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary-hover active:bg-primary-pressed active:scale-[0.98] text-white min-h-[48px] rounded-full font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                {loading ? 'Verifying...' : 'Verify'}
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <h1 className="text-2xl font-bold text-text-primary text-center mb-1">Create your account</h1>
          <p className="text-sm text-text-secondary text-center mb-6">Join to browse and subscribe to plans</p>

          {error && (
            <div className="bg-red-50 text-error p-3 rounded-xl mb-4 text-sm">{error}</div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="firstName" className="block text-xs font-medium text-text-secondary mb-2">
                  First Name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  required
                  value={form.firstName}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-xs font-medium text-text-secondary mb-2">
                  Last Name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  required
                  value={form.lastName}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-medium text-text-secondary mb-2">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={form.email}
                onChange={handleChange}
                className={inputClass}
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-xs font-medium text-text-secondary mb-2">
                Phone (optional)
              </label>
              <input
                id="phone"
                name="phoneNumber"
                type="tel"
                value={form.phoneNumber}
                onChange={handleChange}
                className={inputClass}
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-medium text-text-secondary mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                value={form.password}
                onChange={handleChange}
                className={inputClass}
                placeholder="Minimum 8 characters"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-hover active:bg-primary-pressed active:scale-[0.98] text-white min-h-[48px] rounded-full font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-text-secondary mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:text-primary-hover font-medium focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
