import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { orderService } from '../services/orderService'
import { usePlanCatalog } from './usePlanCatalog'
import type { EnrichedOrder, OrderResponse } from '../types'

export function useOrdersWithPlans() {
  const { planMap, isLoading: plansLoading } = usePlanCatalog()

  const {
    data: orders,
    isLoading: ordersLoading,
    error,
  } = useQuery<OrderResponse[]>({
    queryKey: ['orders'],
    queryFn: orderService.getOrders,
  })

  const enrichedOrders = useMemo<EnrichedOrder[]>(() => {
    if (!orders) return []
    return orders
      .map((o) => ({ ...o, plan: planMap.get(o.planId) }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [orders, planMap])

  const activeOrders = useMemo(
    () => enrichedOrders.filter((o) => o.status === 'ACTIVE'),
    [enrichedOrders],
  )

  const pendingOrders = useMemo(
    () => enrichedOrders.filter((o) => o.status === 'PENDING'),
    [enrichedOrders],
  )

  const cancelledOrders = useMemo(
    () => enrichedOrders.filter((o) => o.status === 'CANCELLED'),
    [enrichedOrders],
  )

  return {
    orders: enrichedOrders,
    activeOrders,
    pendingOrders,
    cancelledOrders,
    isLoading: ordersLoading || plansLoading,
    error,
  }
}
