import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { planService } from '../../services/planService'
import type { Plan, CreatePlanRequest } from '../../types'

const emptyForm: CreatePlanRequest = {
  name: '',
  description: '',
  pricePerMonth: 0,
  dataGB: 0,
  features: [],
  badge: '',
  sortOrder: 0,
  shortTagline: '',
}

export default function AdminPlansPage() {
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
  const [form, setForm] = useState<CreatePlanRequest>(emptyForm)
  const [featuresText, setFeaturesText] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const { data: plans, isLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: planService.getPlans,
  })

  const createMutation = useMutation({
    mutationFn: planService.createPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] })
      closeModal()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ planId, data }: { planId: string; data: CreatePlanRequest }) =>
      planService.updatePlan(planId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] })
      closeModal()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: planService.deletePlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] })
      setDeleteConfirm(null)
    },
  })

  const openCreate = () => {
    setEditingPlan(null)
    setForm(emptyForm)
    setFeaturesText('')
    setShowModal(true)
  }

  const openEdit = (plan: Plan) => {
    setEditingPlan(plan)
    setForm({
      name: plan.name,
      description: plan.description,
      pricePerMonth: plan.pricePerMonth,
      dataGB: plan.dataGB,
      features: plan.features,
      badge: plan.badge || '',
      sortOrder: plan.sortOrder || 0,
      shortTagline: plan.shortTagline || '',
    })
    setFeaturesText(plan.features.join('\n'))
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingPlan(null)
    setForm(emptyForm)
    setFeaturesText('')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const data = {
      ...form,
      features: featuresText.split('\n').filter((f) => f.trim()),
      badge: form.badge || undefined,
      shortTagline: form.shortTagline || undefined,
    }
    if (editingPlan) {
      updateMutation.mutate({ planId: editingPlan.planId, data })
    } else {
      createMutation.mutate(data)
    }
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
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-text-primary">Plans</h2>
        <button
          onClick={openCreate}
          className="bg-primary hover:bg-primary-hover text-white px-5 min-h-[44px] rounded-full text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          + Create Plan
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-bg-secondary border-b border-border-default">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-text-secondary">Name</th>
              <th className="text-left px-4 py-3 font-medium text-text-secondary">Price</th>
              <th className="text-left px-4 py-3 font-medium text-text-secondary">Data</th>
              <th className="text-left px-4 py-3 font-medium text-text-secondary">Badge</th>
              <th className="text-left px-4 py-3 font-medium text-text-secondary">Order</th>
              <th className="text-right px-4 py-3 font-medium text-text-secondary">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {plans?.map((plan) => (
              <tr key={plan.planId} className="min-h-[44px]">
                <td className="px-4 py-3 font-medium text-text-primary">{plan.name}</td>
                <td className="px-4 py-3 text-text-secondary">${plan.pricePerMonth}/mo</td>
                <td className="px-4 py-3 text-text-secondary">
                  {plan.dataGB === -1 ? 'Unlimited' : `${plan.dataGB} GB`}
                </td>
                <td className="px-4 py-3">
                  {plan.badge ? (
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-primary text-white">
                      {plan.badge}
                    </span>
                  ) : (
                    <span className="text-xs text-text-tertiary">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-text-secondary">{plan.sortOrder ?? '—'}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => openEdit(plan)}
                    className="text-primary hover:text-primary-hover text-xs font-medium mr-3 min-h-[44px] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded"
                  >
                    Edit
                  </button>
                  {deleteConfirm === plan.planId ? (
                    <>
                      <button
                        onClick={() => deleteMutation.mutate(plan.planId)}
                        className="text-error hover:underline text-xs font-medium mr-2 min-h-[44px] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="text-text-secondary hover:underline text-xs min-h-[44px] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(plan.planId)}
                      className="text-error hover:underline text-xs font-medium min-h-[44px] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded"
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl">
            <h3 className="text-lg font-semibold text-text-primary mb-4">
              {editingPlan ? 'Edit Plan' : 'Create Plan'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-2">Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-2">Description</label>
                <input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className={inputClass}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-2">
                    Price/Month ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.pricePerMonth}
                    onChange={(e) => setForm({ ...form, pricePerMonth: parseFloat(e.target.value) })}
                    className={inputClass}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-2">
                    Data (GB, -1=unlimited)
                  </label>
                  <input
                    type="number"
                    value={form.dataGB}
                    onChange={(e) => setForm({ ...form, dataGB: parseInt(e.target.value) })}
                    className={inputClass}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-2">
                    Badge (optional)
                  </label>
                  <input
                    value={form.badge || ''}
                    onChange={(e) => setForm({ ...form, badge: e.target.value })}
                    className={inputClass}
                    placeholder="e.g. Most Popular"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-2">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    value={form.sortOrder || 0}
                    onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) })}
                    className={inputClass}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-2">
                  Short Tagline (optional)
                </label>
                <input
                  value={form.shortTagline || ''}
                  onChange={(e) => setForm({ ...form, shortTagline: e.target.value })}
                  className={inputClass}
                  placeholder="e.g. Perfect for light users"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-2">
                  Features (one per line)
                </label>
                <textarea
                  value={featuresText}
                  onChange={(e) => setFeaturesText(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-border-default rounded-lg text-sm focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 bg-primary hover:bg-primary-hover text-white min-h-[44px] rounded-full font-semibold text-sm disabled:opacity-50 transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  {editingPlan ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 border border-border-default text-text-primary min-h-[44px] rounded-full font-semibold text-sm hover:bg-bg-secondary transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
