import { useQuery } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import { planService } from '../services/planService'
import { useCartStore } from '../store/cartStore'
import { useAuthStore } from '../store/authStore'
import type { Plan } from '../types'

export default function PlanDetailPage() {
  const { planId } = useParams<{ planId: string }>()
  const navigate = useNavigate()
  const { selectPlan } = useCartStore()
  const { isAuthenticated } = useAuthStore()

  const { data: plan, isLoading, error } = useQuery<Plan>({
    queryKey: ['plan', planId],
    queryFn: () => planService.getPlan(planId!),
    enabled: !!planId,
  })

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (error || !plan) {
    return (
      <div className="bg-red-50 text-red-700 p-4 rounded-lg text-sm">
        Plan not found.
      </div>
    )
  }

  const handleSubscribe = () => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    selectPlan(plan)
    navigate('/checkout')
  }

  return (
    <div>
      <button
        onClick={() => navigate('/plans')}
        className="text-indigo-600 text-sm mb-4 hover:underline"
      >
        &larr; Back to Plans
      </button>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">{plan.name}</h1>
          <div className="text-right">
            <span className="text-3xl font-bold text-indigo-600">${plan.pricePerMonth}</span>
            <span className="text-gray-500">/mo</span>
          </div>
        </div>

        <p className="text-gray-600 mb-4">{plan.description}</p>

        <div className="text-sm text-indigo-600 font-medium mb-4">
          {plan.dataGB === -1 ? 'Unlimited data' : `${plan.dataGB} GB high-speed data`}
        </div>

        <h3 className="text-sm font-semibold text-gray-900 mb-2">What's included:</h3>
        <ul className="space-y-2 mb-6">
          {plan.features.map((feature) => (
            <li key={feature} className="text-sm text-gray-600 flex items-start gap-2">
              <span className="text-green-500 mt-0.5">&#10003;</span>
              {feature}
            </li>
          ))}
        </ul>

        <button
          onClick={handleSubscribe}
          className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
        >
          Subscribe to {plan.name}
        </button>
      </div>
    </div>
  )
}
