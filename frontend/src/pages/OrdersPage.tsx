import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { orderService } from '../services/orderService'
import type { OrderResponse } from '../types'

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  ACTIVE: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
}

export default function OrdersPage() {
  const navigate = useNavigate()
  const { data: orders, isLoading, error } = useQuery<OrderResponse[]>({
    queryKey: ['orders'],
    queryFn: orderService.getOrders,
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
        Failed to load orders. Please try again later.
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">My Orders</h1>
      <p className="text-gray-500 text-sm mb-6">View your plan subscriptions</p>

      {orders?.length === 0 ? (
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
        <div className="space-y-3">
          {orders?.map((order) => (
            <button
              key={order.orderId}
              onClick={() => navigate(`/orders/${order.orderId}`)}
              className="w-full bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow text-left"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900">{order.planName}</h3>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[order.status] || 'bg-gray-100 text-gray-800'}`}>
                  {order.status}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>${order.pricePerMonth}/mo</span>
                <span>{new Date(order.createdAt).toLocaleDateString()}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
