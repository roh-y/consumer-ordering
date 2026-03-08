import { useNavigate } from 'react-router-dom'
import { useOrdersWithPlans } from '../hooks/useOrdersWithPlans'
import type { EnrichedOrder } from '../types'

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  ACTIVE: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
}

function OrderCard({ order, muted }: { order: EnrichedOrder; muted?: boolean }) {
  const navigate = useNavigate()

  return (
    <button
      onClick={() => navigate(`/orders/${order.orderId}`)}
      className={`w-full rounded-xl shadow-sm border p-4 hover:shadow-md transition-shadow text-left ${
        muted ? 'bg-gray-50 border-gray-200 opacity-75' : 'bg-white border-gray-200'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-gray-900">{order.planName}</h3>
        <span
          className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[order.status] || 'bg-gray-100 text-gray-800'}`}
        >
          {order.status}
        </span>
      </div>
      <div className="flex items-center justify-between text-sm text-gray-500">
        <div className="flex gap-3">
          <span>${order.pricePerMonth}/mo</span>
          {order.plan && (
            <>
              <span>·</span>
              <span>{order.plan.dataGB === -1 ? 'Unlimited data' : `${order.plan.dataGB} GB`}</span>
              <span>·</span>
              <span>{order.plan.features.length} features</span>
            </>
          )}
        </div>
        <span>{new Date(order.createdAt).toLocaleDateString()}</span>
      </div>
      {order.status === 'CANCELLED' && (
        <div className="text-xs text-gray-400 mt-1">
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
      <div className="flex justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-700 p-4 rounded-lg text-sm">
        Failed to load orders. Please try again later.
      </div>
    )
  }

  const hasActiveOrPending = activeOrders.length > 0 || pendingOrders.length > 0
  const hasAny = hasActiveOrPending || cancelledOrders.length > 0

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">My Orders</h1>
      <p className="text-gray-500 text-sm mb-6">View your plan subscriptions</p>

      {!hasAny ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No orders yet</p>
          <button
            onClick={() => navigate('/plans')}
            className="text-indigo-600 hover:underline text-sm"
          >
            Browse plans
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {hasActiveOrPending && (
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Active & Pending</h2>
              <div className="space-y-3">
                {[...activeOrders, ...pendingOrders].map((order) => (
                  <OrderCard key={order.orderId} order={order} />
                ))}
              </div>
            </section>
          )}

          {cancelledOrders.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-gray-500 mb-3">Past Plans</h2>
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
