import api from './api'
import type { CreateOrderRequest, ChangePlanRequest, OrderResponse } from '../types'

export const orderService = {
  createOrder: (data: CreateOrderRequest) =>
    api.post<OrderResponse>('/orders', data).then((r) => r.data),

  getOrders: () =>
    api.get<OrderResponse[]>('/orders').then((r) => r.data),

  getOrder: (orderId: string) =>
    api.get<OrderResponse>(`/orders/${orderId}`).then((r) => r.data),

  cancelOrder: (orderId: string) =>
    api.put<OrderResponse>(`/orders/${orderId}/cancel`).then((r) => r.data),

  changePlan: (data: ChangePlanRequest) =>
    api.post<OrderResponse>('/orders/change-plan', data).then((r) => r.data),
}
