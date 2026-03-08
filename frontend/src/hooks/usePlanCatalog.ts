import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { planService } from '../services/planService'
import type { Plan } from '../types'

export function usePlanCatalog() {
  const { data: plans, ...rest } = useQuery<Plan[]>({
    queryKey: ['plans'],
    queryFn: planService.getPlans,
  })

  const planMap = useMemo(() => {
    const map = new Map<string, Plan>()
    plans?.forEach((p) => map.set(p.planId, p))
    return map
  }, [plans])

  return { plans, planMap, ...rest }
}
