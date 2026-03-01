import type { Plan } from '../types'

// Mock data — will be replaced by API call to Plan Catalog Service in Phase 2
const MOCK_PLANS: Plan[] = [
  {
    planId: 'basic',
    name: 'Basic',
    description: 'Perfect for light users who mostly use Wi-Fi',
    pricePerMonth: 35,
    dataGB: 5,
    features: ['Unlimited talk & text', '5G access', '5 GB high-speed data', 'Mexico & Canada included'],
  },
  {
    planId: 'standard',
    name: 'Standard',
    description: 'Great for everyday use with plenty of data',
    pricePerMonth: 55,
    dataGB: 15,
    features: ['Unlimited talk & text', '5G Ultra Wideband', '15 GB high-speed data', 'Disney+ Basic included', 'Mexico & Canada included'],
  },
  {
    planId: 'premium',
    name: 'Premium',
    description: 'Our best plan for power users and streamers',
    pricePerMonth: 75,
    dataGB: 50,
    features: ['Unlimited talk & text', '5G Ultra Wideband', '50 GB premium data', 'Disney+, Hulu, ESPN+ included', '25 GB mobile hotspot', 'International texting'],
  },
  {
    planId: 'unlimited',
    name: 'Unlimited Plus',
    description: 'Truly unlimited with no compromises',
    pricePerMonth: 90,
    dataGB: -1,
    features: ['Unlimited talk & text', '5G Ultra Wideband', 'Unlimited premium data', 'Disney+, Hulu, ESPN+, Apple Music', '50 GB mobile hotspot', 'International calling & texting', 'Smartwatch & tablet plan included'],
  },
]

export default function PlansPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Choose Your Plan</h1>
      <p className="text-gray-500 text-sm mb-6">Select the perfect wireless plan for your needs</p>

      <div className="space-y-4">
        {MOCK_PLANS.map((plan) => (
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

            <button className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium">
              Select Plan
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
