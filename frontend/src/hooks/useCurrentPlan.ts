import { useQuery } from '@tanstack/react-query'
import { userService } from '../services/userService'
import { planService } from '../services/planService'

export function useCurrentPlan() {
  const {
    data: profile,
    isLoading: profileLoading,
    error: profileError,
  } = useQuery({
    queryKey: ['profile'],
    queryFn: userService.getProfile,
  })

  const {
    data: currentPlan,
    isLoading: planLoading,
    error: planError,
  } = useQuery({
    queryKey: ['plan', profile?.planId],
    queryFn: () => planService.getPlan(profile!.planId!),
    enabled: !!profile?.planId,
  })

  return {
    profile,
    currentPlan,
    hasPlan: !!profile?.planId,
    isLoading: profileLoading || (!!profile?.planId && planLoading),
    error: profileError || planError,
  }
}
