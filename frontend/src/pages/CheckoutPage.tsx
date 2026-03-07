import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { useCartStore } from '../store/cartStore'
import { orderService } from '../services/orderService'

export default function CheckoutPage() {
  const navigate = useNavigate()
  const { selectedPlan, clearSelection } = useCartStore()
  const [error, setError] = useState('')

  const createOrderMutation = useMutation({
    mutationFn: orderService.createOrder,
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
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">No plan selected</p>
        <button
          onClick={() => navigate('/plans')}
          className="text-indigo-600 hover:underline text-sm"
        >
          Browse plans
        </button>
      </div>
    )
  }

  const handleConfirm = () => {
    setError('')
    createOrderMutation.mutate({ planId: selectedPlan.planId })
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Confirm Your Order</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Order Summary</h2>

        <div className="border-t border-gray-100 pt-3 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Plan</span>
            <span className="font-medium">{selectedPlan.name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Data</span>
            <span className="font-medium">
              {selectedPlan.dataGB === -1 ? 'Unlimited' : `${selectedPlan.dataGB} GB`}
            </span>
          </div>
          <div className="flex justify-between text-sm border-t border-gray-100 pt-2 mt-2">
            <span className="text-gray-900 font-medium">Monthly total</span>
            <span className="text-indigo-600 font-bold text-lg">${selectedPlan.pricePerMonth}/mo</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm mb-4">
          {error}
        </div>
      )}

      <button
        onClick={handleConfirm}
        disabled={createOrderMutation.isPending}
        className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50"
      >
        {createOrderMutation.isPending ? 'Placing Order...' : 'Confirm & Subscribe'}
      </button>

      <button
        onClick={() => navigate('/plans')}
        className="w-full mt-3 text-gray-600 text-sm hover:text-gray-900"
      >
        Cancel
      </button>
    </div>
  )
}
