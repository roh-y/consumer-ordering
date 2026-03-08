import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import { orderService } from '../services/orderService'
import { planService } from '../services/planService'
import type { OrderResponse, Plan } from '../types'

const statusStyles: Record<string, string> = {
  PENDING: 'bg-amber-50 text-warning',
  ACTIVE: 'bg-green-50 text-success',
  CANCELLED: 'bg-red-50 text-error',
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
      <div className="flex justify-center py-16">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="bg-red-50 text-error p-4 rounded-xl text-sm">Order not found.</div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <button
        onClick={() => navigate('/orders')}
        className="text-text-secondary hover:text-text-primary text-sm mb-6 inline-flex items-center gap-1 min-h-[44px] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-lg"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Orders
      </button>

      {order.status === 'ACTIVE' && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4 text-sm text-green-800">
          Your plan is active. A confirmation email has been sent.
        </div>
      )}

      {/* Order info card */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-text-primary">Order Details</h1>
          <span
            className={`text-xs px-3 py-1 rounded-full font-semibold ${statusStyles[order.status] || 'bg-gray-100 text-text-secondary'}`}
          >
            {order.status}
          </span>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b border-border-subtle">
            <span className="text-text-secondary">Order ID</span>
            <span className="font-mono text-xs text-text-secondary">{order.orderId.slice(0, 8)}...</span>
          </div>
          <div className="flex justify-between py-2 border-b border-border-subtle">
            <span className="text-text-secondary">Plan</span>
            <span className="font-medium text-text-primary">{order.planName}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-border-subtle">
            <span className="text-text-secondary">Monthly price</span>
            <span className="font-semibold text-text-primary">${order.pricePerMonth}/mo</span>
          </div>
          <div className="flex justify-between py-2 border-b border-border-subtle">
            <span className="text-text-secondary">Created</span>
            <span className="text-text-secondary">{new Date(order.createdAt).toLocaleString()}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-text-secondary">Last updated</span>
            <span className="text-text-secondary">{new Date(order.updatedAt).toLocaleString()}</span>
          </div>
        </div>

        {(order.status === 'PENDING' || order.status === 'ACTIVE') && (
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => navigate('/plans')}
              className="flex-1 border border-gray-900 text-gray-900 min-h-[44px] rounded-full font-semibold text-sm hover:bg-bg-secondary transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              Change Plan
            </button>
            <button
              onClick={() => cancelMutation.mutate()}
              disabled={cancelMutation.isPending}
              className="flex-1 text-error min-h-[44px] rounded-full font-semibold text-sm hover:bg-red-50 disabled:opacity-50 transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              {cancelMutation.isPending ? 'Cancelling...' : 'Cancel Order'}
            </button>
          </div>
        )}
      </div>

      {/* Plan details card */}
      {plan && (
        <div className="bg-white rounded-xl shadow-sm p-6 mt-4">
          <h2 className="text-lg font-semibold text-text-primary mb-3">Plan Details</h2>
          <p className="text-sm text-text-secondary mb-4">{plan.description}</p>

          <div className="bg-bg-secondary rounded-xl p-4 mb-4">
            <div className="text-xs font-medium text-text-secondary mb-1">Data</div>
            <div className="text-xl font-bold text-text-primary">
              {plan.dataGB === -1 ? 'Unlimited' : `${plan.dataGB} GB`}
            </div>
          </div>

          {plan.features.length > 0 && (
            <div>
              <div className="text-sm font-medium text-text-primary mb-2">Features</div>
              <ul className="space-y-2">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-text-secondary">
                    <svg className="w-4 h-4 text-success shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
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
