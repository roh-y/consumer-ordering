import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import { orderService } from '../services/orderService'
import { planService } from '../services/planService'
import type { OrderResponse, Plan } from '../types'

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  ACTIVE: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
}

export default function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const {
    data: order,
    isLoading,
    error,
  } = useQuery<OrderResponse>({
    queryKey: ['order', orderId],
    queryFn: () => orderService.getOrder(orderId!),
    enabled: !!orderId,
  })

  const { data: plan } = useQuery<Plan>({
    queryKey: ['plan', order?.planId],
    queryFn: () => planService.getPlan(order!.planId),
    enabled: !!order?.planId,
  })

  const cancelMutation = useMutation({
    mutationFn: () => orderService.cancelOrder(orderId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', orderId] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="bg-red-50 text-red-700 p-4 rounded-lg text-sm">Order not found.</div>
    )
  }

  return (
    <div>
      <button
        onClick={() => navigate('/orders')}
        className="text-indigo-600 text-sm mb-4 hover:underline"
      >
        &larr; Back to Orders
      </button>

      {order.status === 'ACTIVE' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 text-sm text-green-800">
          Your plan is active. A confirmation email has been sent.
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-gray-900">Order Details</h1>
          <span
            className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[order.status] || 'bg-gray-100 text-gray-800'}`}
          >
            {order.status}
          </span>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Order ID</span>
            <span className="font-mono text-xs text-gray-700">{order.orderId.slice(0, 8)}...</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Plan</span>
            <span className="font-medium">{order.planName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Monthly price</span>
            <span className="font-medium text-indigo-600">${order.pricePerMonth}/mo</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Created</span>
            <span>{new Date(order.createdAt).toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Last updated</span>
            <span>{new Date(order.updatedAt).toLocaleString()}</span>
          </div>
        </div>

        {(order.status === 'PENDING' || order.status === 'ACTIVE') && (
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => navigate('/plans')}
              className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
            >
              Change Plan
            </button>
            <button
              onClick={() => cancelMutation.mutate()}
              disabled={cancelMutation.isPending}
              className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-50"
            >
              {cancelMutation.isPending ? 'Cancelling...' : 'Cancel Order'}
            </button>
          </div>
        )}
      </div>

      {plan && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Plan Details</h2>
          <p className="text-sm text-gray-600 mb-4">{plan.description}</p>

          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <div className="text-sm font-medium text-gray-700 mb-1">Data</div>
            <div className="text-lg font-semibold text-gray-900">
              {plan.dataGB === -1 ? 'Unlimited' : `${plan.dataGB} GB`}
            </div>
          </div>

          {plan.features.length > 0 && (
            <div>
              <div className="text-sm font-medium text-gray-700 mb-2">Features</div>
              <ul className="space-y-1.5">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                    <span className="text-green-500">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
