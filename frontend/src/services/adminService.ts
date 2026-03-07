import api from './api'
import type { User, UserStatsResponse, OrderResponse, OrderStatsResponse } from '../types'

export const adminService = {
  getUsers: () =>
    api.get<User[]>('/admin/users').then((r) => r.data),

  getUserStats: () =>
    api.get<UserStatsResponse>('/admin/users/stats').then((r) => r.data),

  getUser: (userId: string) =>
    api.get<User>(`/admin/users/${userId}`).then((r) => r.data),

  getOrders: () =>
    api.get<OrderResponse[]>('/admin/orders').then((r) => r.data),

  getOrderStats: () =>
    api.get<OrderStatsResponse>('/admin/orders/stats').then((r) => r.data),
}
