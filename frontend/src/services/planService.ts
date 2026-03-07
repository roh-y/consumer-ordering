import api from './api'
import type { Plan } from '../types'

export const planService = {
  getPlans: () =>
    api.get<Plan[]>('/plans').then((r) => r.data),

  getPlan: (planId: string) =>
    api.get<Plan>(`/plans/${planId}`).then((r) => r.data),
}
