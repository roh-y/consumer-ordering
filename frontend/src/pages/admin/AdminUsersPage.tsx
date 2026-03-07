import { useQuery } from '@tanstack/react-query'
import { adminService } from '../../services/adminService'

export default function AdminUsersPage() {
  const { data: users, isLoading } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: adminService.getUsers,
  })

  if (isLoading) {
    return <div className="text-center text-gray-500 py-8">Loading users...</div>
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Users ({users?.length ?? 0})</h2>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-2 font-medium text-gray-600">Name</th>
              <th className="text-left px-4 py-2 font-medium text-gray-600">Email</th>
              <th className="text-left px-4 py-2 font-medium text-gray-600">Plan</th>
              <th className="text-left px-4 py-2 font-medium text-gray-600">Registered</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users?.map((user) => (
              <tr key={user.userId}>
                <td className="px-4 py-3 font-medium">
                  {user.firstName} {user.lastName}
                </td>
                <td className="px-4 py-3 text-gray-600">{user.email}</td>
                <td className="px-4 py-3">
                  {user.planId ? (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                      {user.planId.slice(0, 8)}...
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">None</span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-600">
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
