import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { userService } from '../services/userService'
import { useCurrentPlan } from '../hooks/useCurrentPlan'
import type { UpdateProfileRequest } from '../types'

export default function ProfilePage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<UpdateProfileRequest>({})
  const [message, setMessage] = useState('')

  const { profile, currentPlan, isLoading } = useCurrentPlan()

  const mutation = useMutation({
    mutationFn: userService.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      setEditing(false)
      setMessage('Profile updated!')
      setTimeout(() => setMessage(''), 3000)
    },
  })

  const startEditing = () => {
    if (profile) {
      setForm({
        firstName: profile.firstName,
        lastName: profile.lastName,
        phoneNumber: profile.phoneNumber || '',
        address: profile.address || '',
      })
    }
    setEditing(true)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate(form)
  }

  const inputClass =
    'w-full px-4 h-12 border border-border-default rounded-lg text-sm focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900'

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-text-primary mb-6">Your Profile</h1>

      {message && (
        <div className="bg-green-50 text-success p-3 rounded-xl mb-4 text-sm">{message}</div>
      )}

      {/* Current plan card */}
      {currentPlan && (
        <button
          onClick={() => navigate('/my-plan')}
          className="w-full bg-white rounded-xl shadow-sm p-5 mb-6 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 text-left focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-primary mb-0.5">Current Plan</div>
              <div className="text-lg font-bold text-text-primary">{currentPlan.name}</div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-text-primary">
                ${currentPlan.pricePerMonth}<span className="text-sm font-normal text-text-secondary">/mo</span>
              </div>
              <span className="text-xs text-primary font-medium">View details →</span>
            </div>
          </div>
        </button>
      )}

      {editing ? (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Edit Profile</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-2">First Name</label>
                <input
                  name="firstName"
                  value={form.firstName || ''}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-2">Last Name</label>
                <input
                  name="lastName"
                  value={form.lastName || ''}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-2">Phone</label>
              <input
                name="phoneNumber"
                value={form.phoneNumber || ''}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-2">Address</label>
              <input
                name="address"
                value={form.address || ''}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={mutation.isPending}
                className="flex-1 bg-primary hover:bg-primary-hover text-white min-h-[44px] rounded-full font-semibold text-sm disabled:opacity-50 transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                {mutation.isPending ? 'Saving...' : 'Save'}
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="flex-1 border border-border-default text-text-primary min-h-[44px] rounded-full font-semibold text-sm hover:bg-bg-secondary transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-text-primary">Personal Info</h2>
            <button
              onClick={startEditing}
              className="text-primary hover:text-primary-hover text-sm font-medium min-h-[44px] px-3 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-lg"
            >
              Edit
            </button>
          </div>
          <div className="space-y-4">
            <div className="border-b border-border-subtle pb-3">
              <div className="text-xs text-text-secondary mb-0.5">Email</div>
              <div className="text-sm font-medium text-text-primary">{profile?.email}</div>
            </div>
            <div className="border-b border-border-subtle pb-3">
              <div className="text-xs text-text-secondary mb-0.5">Name</div>
              <div className="text-sm font-medium text-text-primary">
                {profile?.firstName} {profile?.lastName}
              </div>
            </div>
            <div className="border-b border-border-subtle pb-3">
              <div className="text-xs text-text-secondary mb-0.5">Phone</div>
              <div className="text-sm font-medium text-text-primary">{profile?.phoneNumber || 'Not set'}</div>
            </div>
            <div>
              <div className="text-xs text-text-secondary mb-0.5">Address</div>
              <div className="text-sm font-medium text-text-primary">{profile?.address || 'Not set'}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
