import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { planService } from '../services/planService'
import type { Plan } from '../types'

export default function PlansPage() {
  const navigate = useNavigate()
  const { data: plans, isLoading, error } = useQuery<Plan[]>({
    queryKey: ['plans'],
    queryFn: planService.getPlans,
  })

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-700 p-4 rounded-lg text-sm">
        Failed to load plans. Please try again later.
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Choose Your Plan</h1>
      <p className="text-gray-500 text-sm mb-6">Select the perfect wireless plan for your needs</p>

      <div className="space-y-4">
        {plans?.map((plan) => (
          <div
            key={plan.planId}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-900">{plan.name}</h2>
              <div className="text-right">
                <span className="text-2xl font-bold text-indigo-600">${plan.pricePerMonth}</span>
                <span className="text-gray-500 text-sm">/mo</span>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-3">{plan.description}</p>

            <div className="text-xs text-indigo-600 font-medium mb-2">
              {plan.dataGB === -1 ? 'Unlimited data' : `${plan.dataGB} GB high-speed data`}
            </div>

            <ul className="space-y-1 mb-4">
              {plan.features.map((feature) => (
                <li key={feature} className="text-sm text-gray-600 flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">&#10003;</span>
                  {feature}
                </li>
              ))}
            </ul>

            <button
              onClick={() => navigate(`/plans/${plan.planId}`)}
              className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
            >
              Select Plan
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
