import { NavLink, Outlet } from 'react-router-dom'

const tabs = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/plans', label: 'Plans', end: false },
  { to: '/admin/users', label: 'Users', end: false },
  { to: '/admin/orders', label: 'Orders', end: false },
]

export default function AdminLayout() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-[--color-text-primary] mb-4">Admin Panel</h1>
      <div className="flex gap-1 mb-6 border-b border-[--color-border-default]">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              `px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors min-h-[44px] flex items-center focus-visible:ring-2 focus-visible:ring-[--color-primary] focus-visible:ring-offset-2 rounded-t-lg ${
                isActive
                  ? 'border-[--color-primary] text-[--color-primary]'
                  : 'border-transparent text-[--color-text-secondary] hover:text-[--color-text-primary]'
              }`
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </div>
      <Outlet />
    </div>
  )
}
