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
      <div className="flex justify-center py-16">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 text-error p-4 rounded-xl text-sm">
        Failed to load plans. Please try again later.
      </div>
    )
  }

  const sorted = [...(plans || [])].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))

  return (
    <div>
      {/* Hero */}
      <div className="text-center mb-10">
        <h1 className="text-[32px] font-extrabold text-text-primary mb-2">
          Find the perfect plan
        </h1>
        <p className="text-text-secondary text-base">
          Simple pricing, no hidden fees. Switch or cancel anytime.
        </p>
      </div>

      {/* Plan cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {sorted.map((plan) => (
          <div
            key={plan.planId}
            className="relative bg-white rounded-xl shadow-sm p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer group"
            onClick={() => navigate(`/plans/${plan.planId}`)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && navigate(`/plans/${plan.planId}`)}
          >
            {/* Badge */}
            {plan.badge && (
              <span className="absolute top-4 right-4 bg-primary text-white text-xs font-semibold px-3 py-1 rounded-full">
                {plan.badge}
              </span>
            )}

            {/* Data hero */}
            <div className="text-4xl font-extrabold text-text-primary mb-1">
              {plan.dataGB === -1 ? 'Unlimited' : `${plan.dataGB} GB`}
            </div>

            {/* Plan name + tagline */}
            <h2 className="text-lg font-semibold text-text-primary">{plan.name}</h2>
            {plan.shortTagline && (
              <p className="text-sm text-text-secondary mt-0.5">{plan.shortTagline}</p>
            )}

            {/* Features */}
            <ul className="mt-4 space-y-1.5 mb-5">
              {plan.features.slice(0, 4).map((feature) => (
                <li key={feature} className="text-sm text-text-secondary flex items-start gap-2">
                  <svg className="w-4 h-4 text-success mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>

            {/* Price + CTA */}
            <div className="flex items-end justify-between mt-auto">
              <div>
                <span className="text-3xl font-bold text-text-primary">${plan.pricePerMonth}</span>
                <span className="text-sm text-text-secondary">/mo</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  navigate(`/plans/${plan.planId}`)
                }}
                className="bg-primary hover:bg-primary-hover active:bg-primary-pressed active:scale-[0.98] text-white text-sm font-semibold px-6 min-h-[44px] rounded-full transition-all duration-150 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                Select Plan
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
