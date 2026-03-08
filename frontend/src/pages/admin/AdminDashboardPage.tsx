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
    return (
      <div className="flex justify-center py-16">
        <div className="animate-spin h-8 w-8 border-4 border-[--color-primary] border-t-transparent rounded-full" />
      </div>
    )
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-xl shadow-sm p-5"
          >
            <div className="text-xs font-medium text-[--color-text-secondary] uppercase tracking-wide">{stat.label}</div>
            <div className="text-2xl font-bold text-[--color-text-primary] mt-1">{stat.value}</div>
          </div>
        ))}
      </div>

      {orderStats?.ordersByPlan && Object.keys(orderStats.ordersByPlan).length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-base font-semibold text-[--color-text-primary] mb-4">Active Orders by Plan</h3>
          <div className="space-y-3">
            {Object.entries(orderStats.ordersByPlan).map(([plan, count]) => {
              const maxCount = Math.max(...Object.values(orderStats.ordersByPlan))
              const width = maxCount > 0 ? (count / maxCount) * 100 : 0
              return (
                <div key={plan}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-[--color-text-secondary]">{plan}</span>
                    <span className="font-semibold text-[--color-text-primary]">{count}</span>
                  </div>
                  <div className="h-2 bg-[--color-bg-secondary] rounded-full">
                    <div
                      className="h-2 bg-[--color-primary] rounded-full transition-all duration-500"
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
