import { useQuery } from '@tanstack/react-query'
import { adminService } from '../../services/adminService'

const statusStyles: Record<string, string> = {
  PENDING: 'bg-amber-50 text-warning',
  ACTIVE: 'bg-green-50 text-success',
  CANCELLED: 'bg-red-50 text-error',
}

export default function AdminOrdersPage() {
  const { data: orders, isLoading } = useQuery({
    queryKey: ['admin', 'orders'],
    queryFn: adminService.getOrders,
  })

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-text-primary mb-4">Orders ({orders?.length ?? 0})</h2>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-bg-secondary border-b border-border-default">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-text-secondary">Order ID</th>
              <th className="text-left px-4 py-3 font-medium text-text-secondary">Plan</th>
              <th className="text-left px-4 py-3 font-medium text-text-secondary">Price</th>
              <th className="text-left px-4 py-3 font-medium text-text-secondary">Status</th>
              <th className="text-left px-4 py-3 font-medium text-text-secondary">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {orders?.map((order) => (
              <tr key={order.orderId} className="min-h-[44px]">
                <td className="px-4 py-3 font-mono text-xs text-text-secondary">{order.orderId.slice(0, 8)}...</td>
                <td className="px-4 py-3 font-medium text-text-primary">{order.planName}</td>
                <td className="px-4 py-3 text-text-secondary">${order.pricePerMonth}/mo</td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${statusStyles[order.status] || 'bg-gray-100 text-text-secondary'}`}
                  >
                    {order.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-text-secondary">
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
