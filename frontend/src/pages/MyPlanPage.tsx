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
      <div className="flex justify-center py-16">
        <div className="animate-spin h-8 w-8 border-4 border-[--color-primary] border-t-transparent rounded-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 text-[--color-error] p-4 rounded-xl text-sm">
        Failed to load plan information. Please try again later.
      </div>
    )
  }

  if (!hasPlan || !currentPlan) {
    return (
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-[--color-text-primary] mb-6">My Plan</h1>
        <div className="text-center py-16 bg-white rounded-xl shadow-sm">
          <div className="text-5xl mb-4">📱</div>
          <h2 className="text-xl font-semibold text-[--color-text-primary] mb-2">No active plan</h2>
          <p className="text-[--color-text-secondary] mb-6">Browse our plans to find the perfect fit for you.</p>
          <button
            onClick={() => navigate('/plans')}
            className="bg-[--color-primary] hover:bg-[--color-primary-hover] text-white px-8 min-h-[48px] rounded-full font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-[--color-primary] focus-visible:ring-offset-2"
          >
            Browse Plans
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-[--color-text-primary] mb-6">My Plan</h1>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-[--color-text-primary]">{currentPlan.name}</h2>
            <p className="text-sm text-[--color-text-secondary] mt-1">{currentPlan.description}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs px-3 py-1 rounded-full font-semibold bg-green-50 text-[--color-success]">
              Active
            </span>
          </div>
        </div>

        {/* Data + Price hero */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-[--color-bg-secondary] rounded-xl p-4">
            <div className="text-xs font-medium text-[--color-text-secondary] mb-1">Data</div>
            <div className="text-2xl font-bold text-[--color-text-primary]">
              {currentPlan.dataGB === -1 ? 'Unlimited' : `${currentPlan.dataGB} GB`}
            </div>
          </div>
          <div className="bg-[--color-bg-secondary] rounded-xl p-4">
            <div className="text-xs font-medium text-[--color-text-secondary] mb-1">Monthly</div>
            <div className="text-2xl font-bold text-[--color-text-primary]">
              ${currentPlan.pricePerMonth}<span className="text-sm font-normal text-[--color-text-secondary]">/mo</span>
            </div>
          </div>
        </div>

        {currentPlan.features.length > 0 && (
          <div className="mb-6">
            <div className="text-sm font-medium text-[--color-text-primary] mb-2">Features</div>
            <ul className="space-y-2">
              {currentPlan.features.map((feature, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-[--color-text-secondary]">
                  <svg className="w-4 h-4 text-[--color-success] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => navigate('/plans')}
            className="flex-1 border border-[--color-gray-900] text-[--color-gray-900] min-h-[44px] rounded-full font-semibold text-sm hover:bg-[--color-bg-secondary] transition-colors focus-visible:ring-2 focus-visible:ring-[--color-primary] focus-visible:ring-offset-2"
          >
            Change Plan
          </button>
          {activeOrder && (
            <button
              onClick={() => setShowConfirm(true)}
              className="flex-1 text-[--color-error] text-sm font-medium min-h-[44px] rounded-full hover:bg-red-50 transition-colors focus-visible:ring-2 focus-visible:ring-[--color-primary] focus-visible:ring-offset-2"
            >
              Cancel Plan
            </button>
          )}
        </div>

        {showConfirm && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-sm text-red-800 mb-3">
              Are you sure you want to cancel your plan? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => cancelMutation.mutate()}
                disabled={cancelMutation.isPending}
                className="flex-1 bg-[--color-error] text-white min-h-[44px] rounded-full text-sm font-semibold disabled:opacity-50 transition-colors focus-visible:ring-2 focus-visible:ring-[--color-primary] focus-visible:ring-offset-2"
              >
                {cancelMutation.isPending ? 'Cancelling...' : 'Yes, Cancel Plan'}
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 border border-[--color-border-default] text-[--color-text-primary] min-h-[44px] rounded-full text-sm font-semibold hover:bg-[--color-bg-secondary] transition-colors focus-visible:ring-2 focus-visible:ring-[--color-primary] focus-visible:ring-offset-2"
              >
                Keep Plan
              </button>
            </div>
          </div>
        )}
      </div>

      <button
        onClick={() => navigate('/orders')}
        className="mt-4 text-[--color-text-secondary] hover:text-[--color-text-primary] text-sm min-h-[44px] focus-visible:ring-2 focus-visible:ring-[--color-primary] focus-visible:ring-offset-2 rounded-lg"
      >
        View order history →
      </button>
    </div>
  )
}
