import { useQuery } from '@tanstack/react-query'
import { adminService } from '../../services/adminService'

export default function AdminDashboardPage() {
  const { data: userStats, isLoading: loadingUsers } = useQuery({
    queryKey: ['admin', 'userStats'],
    queryFn: adminService.getUserStats,
  })

  const { data: orderStats, isLoading: loadingOrders } = useQuery({
    queryKey: ['admin', 'orderStats'],
    queryFn: adminService.getOrderStats,
  })

  if (loadingUsers || loadingOrders) {
    return <div className="text-center text-gray-500 py-8">Loading dashboard...</div>
  }

  const stats = [
    { label: 'Total Users', value: userStats?.totalUsers ?? 0 },
    { label: 'Users with Plan', value: userStats?.usersWithPlan ?? 0 },
    { label: 'Active Orders', value: orderStats?.activeOrders ?? 0 },
    {
      label: 'Monthly Revenue',
      value: `$${(orderStats?.totalMonthlyRevenue ?? 0).toFixed(2)}`,
    },
  ]

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 mb-6">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-4"
          >
            <div className="text-xs text-gray-500 uppercase tracking-wide">{stat.label}</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</div>
          </div>
        ))}
      </div>

      {orderStats?.ordersByPlan && Object.keys(orderStats.ordersByPlan).length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Active Orders by Plan</h3>
          <div className="space-y-2">
            {Object.entries(orderStats.ordersByPlan).map(([plan, count]) => {
              const maxCount = Math.max(...Object.values(orderStats.ordersByPlan))
              const width = maxCount > 0 ? (count / maxCount) * 100 : 0
              return (
                <div key={plan}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{plan}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full">
                    <div
                      className="h-2 bg-indigo-500 rounded-full transition-all"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
