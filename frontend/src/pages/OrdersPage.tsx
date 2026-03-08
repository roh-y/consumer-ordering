import { useNavigate } from 'react-router-dom'
import { useOrdersWithPlans } from '../hooks/useOrdersWithPlans'
import type { EnrichedOrder } from '../types'

const statusStyles: Record<string, string> = {
  PENDING: 'bg-amber-50 text-warning',
  ACTIVE: 'bg-green-50 text-success',
  CANCELLED: 'bg-red-50 text-error',
}

function OrderCard({ order, muted }: { order: EnrichedOrder; muted?: boolean }) {
  const navigate = useNavigate()

  return (
    <button
      onClick={() => navigate(`/orders/${order.orderId}`)}
      className={`w-full rounded-xl shadow-sm p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 text-left focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 min-h-[44px] ${
        muted ? 'bg-bg-secondary opacity-70' : 'bg-white'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-text-primary">{order.planName}</h3>
        <span
          className={`text-xs px-3 py-1 rounded-full font-semibold ${statusStyles[order.status] || 'bg-gray-100 text-text-secondary'}`}
        >
          {order.status}
        </span>
      </div>
      <div className="flex items-center justify-between text-sm text-text-secondary">
        <div className="flex gap-3">
          <span className="font-medium text-text-primary">${order.pricePerMonth}/mo</span>
          {order.plan && (
            <>
              <span className="text-text-tertiary">·</span>
              <span>{order.plan.dataGB === -1 ? 'Unlimited data' : `${order.plan.dataGB} GB`}</span>
            </>
          )}
        </div>
        <span className="text-xs text-text-tertiary">
          {new Date(order.createdAt).toLocaleDateString()}
        </span>
      </div>
      {order.status === 'CANCELLED' && (
        <div className="text-xs text-text-tertiary mt-1">
          Cancelled {new Date(order.updatedAt).toLocaleDateString()}
        </div>
      )}
    </button>
  )
}

export default function OrdersPage() {
  const navigate = useNavigate()
  const { activeOrders, pendingOrders, cancelledOrders, isLoading, error } = useOrdersWithPlans()

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 text-error p-4 rounded-xl text-sm">
        Failed to load orders. Please try again later.
      </div>
    )
  }

  const hasActiveOrPending = activeOrders.length > 0 || pendingOrders.length > 0
  const hasAny = hasActiveOrPending || cancelledOrders.length > 0

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-text-primary mb-1">My Orders</h1>
      <p className="text-text-secondary text-sm mb-6">View your plan subscriptions</p>

      {!hasAny ? (
        <div className="text-center py-16 bg-white rounded-xl shadow-sm">
          <p className="text-text-secondary mb-4">No orders yet</p>
          <button
            onClick={() => navigate('/plans')}
            className="text-primary hover:text-primary-hover text-sm font-medium min-h-[44px] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-lg"
          >
            Browse plans
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {hasActiveOrPending && (
            <section>
              <h2 className="text-base font-semibold text-text-primary mb-3">Active & Pending</h2>
              <div className="space-y-3">
                {[...activeOrders, ...pendingOrders].map((order) => (
                  <OrderCard key={order.orderId} order={order} />
                ))}
              </div>
            </section>
          )}

          {cancelledOrders.length > 0 && (
            <section>
              <h2 className="text-base font-semibold text-text-tertiary mb-3">Past Plans</h2>
              <div className="space-y-3">
                {cancelledOrders.map((order) => (
                  <OrderCard key={order.orderId} order={order} muted />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
