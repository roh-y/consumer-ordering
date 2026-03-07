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
    const data = { ...form, features: featuresText.split('\n').filter((f) => f.trim()) }
    if (editingPlan) {
      updateMutation.mutate({ planId: editingPlan.planId, data })
    } else {
      createMutation.mutate(data)
    }
  }

  if (isLoading) {
    return <div className="text-center text-gray-500 py-8">Loading plans...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Plans</h2>
        <button
          onClick={openCreate}
          className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-indigo-700"
        >
          + Create Plan
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-2 font-medium text-gray-600">Name</th>
              <th className="text-left px-4 py-2 font-medium text-gray-600">Price</th>
              <th className="text-left px-4 py-2 font-medium text-gray-600">Data</th>
              <th className="text-right px-4 py-2 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {plans?.map((plan) => (
              <tr key={plan.planId}>
                <td className="px-4 py-3 font-medium">{plan.name}</td>
                <td className="px-4 py-3">${plan.pricePerMonth}/mo</td>
                <td className="px-4 py-3">
                  {plan.dataGB === -1 ? 'Unlimited' : `${plan.dataGB} GB`}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => openEdit(plan)}
                    className="text-indigo-600 hover:underline text-xs mr-3"
                  >
                    Edit
                  </button>
                  {deleteConfirm === plan.planId ? (
                    <>
                      <button
                        onClick={() => deleteMutation.mutate(plan.planId)}
                        className="text-red-600 hover:underline text-xs mr-2"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="text-gray-500 hover:underline text-xs"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(plan.planId)}
                      className="text-red-600 hover:underline text-xs"
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

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {editingPlan ? 'Edit Plan' : 'Create Plan'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price/Month ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.pricePerMonth}
                    onChange={(e) => setForm({ ...form, pricePerMonth: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data (GB, -1=unlimited)
                  </label>
                  <input
                    type="number"
                    value={form.dataGB}
                    onChange={(e) => setForm({ ...form, dataGB: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Features (one per line)
                </label>
                <textarea
                  value={featuresText}
                  onChange={(e) => setFeaturesText(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {editingPlan ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
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
