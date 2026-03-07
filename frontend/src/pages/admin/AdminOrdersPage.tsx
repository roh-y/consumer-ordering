import { useQuery } from '@tanstack/react-query'
import { adminService } from '../../services/adminService'

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  ACTIVE: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
}

export default function AdminOrdersPage() {
  const { data: orders, isLoading } = useQuery({
    queryKey: ['admin', 'orders'],
    queryFn: adminService.getOrders,
  })

  if (isLoading) {
    return <div className="text-center text-gray-500 py-8">Loading orders...</div>
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Orders ({orders?.length ?? 0})</h2>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-2 font-medium text-gray-600">Order ID</th>
              <th className="text-left px-4 py-2 font-medium text-gray-600">Plan</th>
              <th className="text-left px-4 py-2 font-medium text-gray-600">Price</th>
              <th className="text-left px-4 py-2 font-medium text-gray-600">Status</th>
              <th className="text-left px-4 py-2 font-medium text-gray-600">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orders?.map((order) => (
              <tr key={order.orderId}>
                <td className="px-4 py-3 font-mono text-xs">{order.orderId.slice(0, 8)}...</td>
                <td className="px-4 py-3 font-medium">{order.planName}</td>
                <td className="px-4 py-3">${order.pricePerMonth}/mo</td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[order.status] || 'bg-gray-100 text-gray-800'}`}
                  >
                    {order.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {new Date(order.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
