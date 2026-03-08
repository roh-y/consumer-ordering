import { useQuery } from '@tanstack/react-query'
import { adminService } from '../../services/adminService'

export default function AdminUsersPage() {
  const { data: users, isLoading } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: adminService.getUsers,
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
      <h2 className="text-lg font-semibold text-text-primary mb-4">Users ({users?.length ?? 0})</h2>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-bg-secondary border-b border-border-default">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-text-secondary">Name</th>
              <th className="text-left px-4 py-3 font-medium text-text-secondary">Email</th>
              <th className="text-left px-4 py-3 font-medium text-text-secondary">Plan</th>
              <th className="text-left px-4 py-3 font-medium text-text-secondary">Registered</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {users?.map((user) => (
              <tr key={user.userId} className="min-h-[44px]">
                <td className="px-4 py-3 font-medium text-text-primary">
                  {user.firstName} {user.lastName}
                </td>
                <td className="px-4 py-3 text-text-secondary">{user.email}</td>
                <td className="px-4 py-3">
                  {user.planId ? (
                    <span className="text-xs bg-green-50 text-success px-2.5 py-0.5 rounded-full font-medium">
                      {user.planId.slice(0, 8)}...
                    </span>
                  ) : (
                    <span className="text-xs text-text-tertiary">None</span>
                  )}
                </td>
                <td className="px-4 py-3 text-text-secondary">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
