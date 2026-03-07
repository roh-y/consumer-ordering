import { create } from 'zustand'
import type { Plan } from '../types'

interface CartState {
  selectedPlan: Plan | null
  selectPlan: (plan: Plan) => void
  clearSelection: () => void
}

export const useCartStore = create<CartState>()((set) => ({
  selectedPlan: null,

  selectPlan: (plan: Plan) =>
    set({ selectedPlan: plan }),

  clearSelection: () =>
    set({ selectedPlan: null }),
}))
