import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import App from '../App'

// Mock the plan service to return test data without hitting the API
vi.mock('../services/planService', () => ({
  planService: {
    getPlans: vi.fn().mockResolvedValue([
      { planId: '1', name: 'Basic', pricePerMonth: 30, description: 'Essential plan', dataGB: 5, features: ['5G Access'] },
      { planId: '2', name: 'Standard', pricePerMonth: 50, description: 'Popular plan', dataGB: 15, features: ['5G Access', 'HD Streaming'] },
      { planId: '3', name: 'Premium', pricePerMonth: 70, description: 'Best plan', dataGB: 50, features: ['5G Access', 'HD Streaming', 'Hotspot'] },
      { planId: '4', name: 'Unlimited Plus', pricePerMonth: 90, description: 'Top plan', dataGB: -1, features: ['5G Access', 'HD Streaming', 'Hotspot', 'International'] },
    ]),
    getPlan: vi.fn(),
    createPlan: vi.fn(),
    updatePlan: vi.fn(),
    deletePlan: vi.fn(),
  },
}))

vi.mock('../services/adminService', () => ({
  adminService: {
    getUsers: vi.fn().mockResolvedValue([]),
    getUserStats: vi.fn().mockResolvedValue({ totalUsers: 0, usersWithPlan: 0, planDistribution: {} }),
    getOrders: vi.fn().mockResolvedValue([]),
    getOrderStats: vi.fn().mockResolvedValue({ totalOrders: 0, activeOrders: 0, totalMonthlyRevenue: 0, ordersByPlan: {} }),
    getUser: vi.fn(),
  },
}))

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the navigation', () => {
    render(<App />)
    expect(screen.getByText('Wireless')).toBeInTheDocument()
  })

  it('shows the plans page by default', async () => {
    render(<App />)
    await waitFor(() => {
      expect(screen.getByText('Find the perfect plan')).toBeInTheDocument()
    })
  })

  it('displays all plan cards', async () => {
    render(<App />)
    await waitFor(() => {
      expect(screen.getByText('Basic')).toBeInTheDocument()
      expect(screen.getByText('Standard')).toBeInTheDocument()
      expect(screen.getByText('Premium')).toBeInTheDocument()
      expect(screen.getByText('Unlimited Plus')).toBeInTheDocument()
    })
  })

  it('does not show Admin link for non-admin users', () => {
    render(<App />)
    expect(screen.queryByText('Admin')).not.toBeInTheDocument()
  })
})
