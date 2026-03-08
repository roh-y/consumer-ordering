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
      <div className="flex justify-center py-16">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  if (error || !plan) {
    return (
      <div className="bg-red-50 text-error p-4 rounded-xl text-sm">
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
    <div className="max-w-2xl mx-auto">
      <button
        onClick={() => navigate('/plans')}
        className="text-text-secondary hover:text-text-primary text-sm mb-6 inline-flex items-center gap-1 min-h-[44px] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-lg"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Plans
      </button>

      <div className="bg-white rounded-xl shadow-sm p-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-text-primary">{plan.name}</h1>
              {plan.badge && (
                <span className="bg-primary text-white text-xs font-semibold px-3 py-1 rounded-full">
                  {plan.badge}
                </span>
              )}
            </div>
            {plan.shortTagline && (
              <p className="text-text-secondary text-sm">{plan.shortTagline}</p>
            )}
          </div>
        </div>

        {/* Data hero */}
        <div className="text-5xl font-extrabold text-text-primary my-6">
          {plan.dataGB === -1 ? 'Unlimited' : `${plan.dataGB} GB`}
          <span className="text-lg font-normal text-text-secondary ml-2">
            {plan.dataGB === -1 ? 'data' : 'high-speed data'}
          </span>
        </div>

        {/* Features */}
        <h3 className="text-sm font-semibold text-text-primary mb-3">What's included</h3>
        <ul className="space-y-2.5 mb-8">
          {plan.features.map((feature) => (
            <li key={feature} className="text-sm text-text-secondary flex items-start gap-2.5">
              <svg className="w-5 h-5 text-success mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              {feature}
            </li>
          ))}
        </ul>

        {/* Price */}
        <div className="border-t border-border-subtle pt-6 mb-6">
          <span className="text-4xl font-bold text-text-primary">${plan.pricePerMonth}</span>
          <span className="text-text-secondary text-base">/mo</span>
        </div>

        {/* CTA */}
        <button
          onClick={handleSubscribe}
          className="w-full bg-primary hover:bg-primary-hover active:bg-primary-pressed active:scale-[0.98] text-white min-h-[48px] rounded-full font-semibold text-base transition-all duration-150 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          Get This Plan
        </button>
      </div>

      {/* Sticky mobile CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border-default p-4 md:hidden z-30">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-xl font-bold">${plan.pricePerMonth}</span>
            <span className="text-text-secondary text-sm">/mo</span>
          </div>
          <span className="text-sm font-medium text-text-primary">{plan.name}</span>
        </div>
        <button
          onClick={handleSubscribe}
          className="w-full bg-primary hover:bg-primary-hover text-white min-h-[48px] rounded-full font-semibold text-base transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          Get This Plan
        </button>
      </div>
    </div>
  )
}
