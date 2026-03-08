import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useCartStore } from '../store/cartStore'
import { orderService } from '../services/orderService'
import { userService } from '../services/userService'

export default function CheckoutPage() {
  const navigate = useNavigate()
  const { selectedPlan, clearSelection } = useCartStore()
  const [error, setError] = useState('')

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: userService.getProfile,
  })

  const hasActivePlan = profile?.planId && selectedPlan && profile.planId !== selectedPlan.planId

  const createOrderMutation = useMutation({
    mutationFn: () => {
      if (hasActivePlan) {
        return orderService.changePlan({ newPlanId: selectedPlan!.planId })
      }
      return orderService.createOrder({ planId: selectedPlan!.planId })
    },
    onSuccess: (order) => {
      clearSelection()
      navigate(`/orders/${order.orderId}`)
    },
    onError: () => {
      setError('Failed to create order. Please try again.')
    },
  })

  if (!selectedPlan) {
    return (
      <div className="text-center py-16">
        <p className="text-text-secondary mb-4">No plan selected</p>
        <button
          onClick={() => navigate('/plans')}
          className="text-primary hover:text-primary-hover text-sm font-medium min-h-[44px] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-lg"
        >
          Browse plans
        </button>
      </div>
    )
  }

  const handleConfirm = () => {
    setError('')
    createOrderMutation.mutate()
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-text-primary mb-6">Confirm Your Order</h1>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 text-sm text-amber-800">
        <span className="font-semibold">UAT Mode</span> — Payment bypassed. Your order will be
        activated immediately.
      </div>

      {hasActivePlan && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 text-sm text-blue-800">
          You are changing your plan. Your current plan will be cancelled and replaced with the new one.
        </div>
      )}

      {/* Order summary card */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Order Summary</h2>

        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">Plan</span>
            <span className="font-medium text-text-primary">{selectedPlan.name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">Data</span>
            <span className="font-medium text-text-primary">
              {selectedPlan.dataGB === -1 ? 'Unlimited' : `${selectedPlan.dataGB} GB`}
            </span>
          </div>
          {selectedPlan.features.length > 0 && (
            <div className="border-t border-border-subtle pt-3">
              <div className="text-xs font-medium text-text-secondary mb-2">Includes</div>
              <ul className="space-y-1">
                {selectedPlan.features.slice(0, 3).map((f) => (
                  <li key={f} className="text-xs text-text-secondary flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-success shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="border-t border-border-default pt-3">
            <div className="flex justify-between items-baseline">
              <span className="text-sm font-medium text-text-primary">Monthly total</span>
              <div>
                <span className="text-2xl font-bold text-text-primary">${selectedPlan.pricePerMonth}</span>
                <span className="text-sm text-text-secondary">/mo</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-error p-4 rounded-xl text-sm mb-4">{error}</div>
      )}

      <button
        onClick={handleConfirm}
        disabled={createOrderMutation.isPending}
        className="w-full bg-primary hover:bg-primary-hover active:bg-primary-pressed active:scale-[0.98] text-white min-h-[48px] rounded-full font-semibold text-base disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        {createOrderMutation.isPending
          ? 'Activating...'
          : hasActivePlan
            ? 'Change Plan'
            : 'Confirm Order'}
      </button>

      <button
        onClick={() => navigate('/plans')}
        className="w-full mt-3 text-text-secondary hover:text-text-primary text-sm min-h-[44px] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-lg"
      >
        Cancel
      </button>
    </div>
  )
}
