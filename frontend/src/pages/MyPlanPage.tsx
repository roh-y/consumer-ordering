import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useCurrentPlan } from '../hooks/useCurrentPlan'
import { useOrdersWithPlans } from '../hooks/useOrdersWithPlans'
import { orderService } from '../services/orderService'

export default function MyPlanPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { currentPlan, hasPlan, isLoading, error } = useCurrentPlan()
  const { activeOrders } = useOrdersWithPlans()
  const [showConfirm, setShowConfirm] = useState(false)

  const activeOrder = activeOrders.find((o) => o.planId === currentPlan?.planId)

  const cancelMutation = useMutation({
    mutationFn: () => orderService.cancelOrder(activeOrder!.orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      queryClient.invalidateQueries({ queryKey: ['plan'] })
      setShowConfirm(false)
    },
  })

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-700 p-4 rounded-lg text-sm">
        Failed to load plan information. Please try again later.
      </div>
    )
  }

  if (!hasPlan || !currentPlan) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-2">My Plan</h1>
        <div className="text-center py-16">
          <div className="text-5xl mb-4">📱</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No active plan</h2>
          <p className="text-gray-500 mb-6">Browse our plans to find the perfect fit for you.</p>
          <button
            onClick={() => navigate('/plans')}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            Browse Plans
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">My Plan</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{currentPlan.name}</h2>
            <p className="text-sm text-gray-500 mt-1">{currentPlan.description}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs px-2 py-1 rounded-full font-medium bg-green-100 text-green-800">
              ACTIVE
            </span>
            <span className="text-2xl font-bold text-indigo-600">
              ${currentPlan.pricePerMonth}/mo
            </span>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="text-sm font-medium text-gray-700 mb-1">Data</div>
          <div className="text-lg font-semibold text-gray-900">
            {currentPlan.dataGB === -1 ? 'Unlimited' : `${currentPlan.dataGB} GB`}
          </div>
        </div>

        {currentPlan.features.length > 0 && (
          <div className="mb-6">
            <div className="text-sm font-medium text-gray-700 mb-2">Features</div>
            <ul className="space-y-1.5">
              {currentPlan.features.map((feature, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="text-green-500">✓</span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => navigate('/plans')}
            className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
          >
            Change Plan
          </button>
          {activeOrder && (
            <button
              onClick={() => setShowConfirm(true)}
              className="flex-1 bg-white text-red-600 border border-red-300 py-2 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
            >
              Cancel Plan
            </button>
          )}
        </div>

        {showConfirm && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800 mb-3">
              Are you sure you want to cancel your plan? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => cancelMutation.mutate()}
                disabled={cancelMutation.isPending}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 text-sm font-medium disabled:opacity-50"
              >
                {cancelMutation.isPending ? 'Cancelling...' : 'Yes, Cancel Plan'}
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 bg-white text-gray-700 border border-gray-300 py-2 rounded-lg hover:bg-gray-50 text-sm font-medium"
              >
                Keep Plan
              </button>
            </div>
          </div>
        )}
      </div>

      <button
        onClick={() => navigate('/orders')}
        className="mt-4 text-indigo-600 text-sm hover:underline"
      >
        View order history →
      </button>
    </div>
  )
}
