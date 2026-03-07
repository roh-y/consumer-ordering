import api from './api'
import type { Plan, CreatePlanRequest, UpdatePlanRequest } from '../types'

export const planService = {
  getPlans: () =>
    api.get<Plan[]>('/plans').then((r) => r.data),

  getPlan: (planId: string) =>
    api.get<Plan>(`/plans/${planId}`).then((r) => r.data),

  createPlan: (data: CreatePlanRequest) =>
    api.post<Plan>('/plans', data).then((r) => r.data),

  updatePlan: (planId: string, data: UpdatePlanRequest) =>
    api.put<Plan>(`/plans/${planId}`, data).then((r) => r.data),

  deletePlan: (planId: string) =>
    api.delete(`/plans/${planId}`),
}
