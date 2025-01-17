import { t } from '@lingui/macro'
import { useFundingCycleCountdown } from 'components/v2v3/V2V3Project/ProjectDashboard/hooks/useFundingCycleCountdown'
import { useProjectContext } from 'components/v2v3/V2V3Project/ProjectDashboard/hooks/useProjectContext'
import { useProjectMetadata } from 'components/v2v3/V2V3Project/ProjectDashboard/hooks/useProjectMetadata'
import { timeSecondsToDateString } from 'components/v2v3/V2V3Project/ProjectDashboard/utils/timeSecondsToDateString'
import { useProjectUpcomingFundingCycle } from 'hooks/v2v3/contractReader/useProjectUpcomingFundingCycle'
import { useMemo } from 'react'

export const useCurrentUpcomingSubPanel = (type: 'current' | 'upcoming') => {
  const { projectId } = useProjectMetadata()
  const {
    fundingCycle,
    loading: { fundingCycleLoading },
  } = useProjectContext()
  const {
    data: upcomingFundingCycleData,
    loading: upcomingFundingCycleLoading,
  } = useProjectUpcomingFundingCycle({ projectId })
  const [upcomingFundingCycle] = upcomingFundingCycleData ?? []
  const { timeRemainingText } = useFundingCycleCountdown()

  const cycleNumber = useMemo(() => {
    if (type === 'current') {
      return fundingCycle?.number.toNumber()
    }
    return fundingCycle?.number ? fundingCycle.number.toNumber() + 1 : undefined
  }, [fundingCycle?.number, type])

  const cycleUnlocked = useMemo(() => {
    if (type === 'current') {
      return fundingCycle?.duration?.isZero() ?? true
    }
    return upcomingFundingCycle?.duration?.isZero() ?? true
  }, [fundingCycle?.duration, type, upcomingFundingCycle?.duration])

  /** Determines if the CURRENT cycle is unlocked.
   * This is used to check if the upcoming cycle can start at any time. */
  const currentCycleUnlocked = useMemo(() => {
    return fundingCycle?.duration?.isZero() ?? true
  }, [fundingCycle?.duration])

  const upcomingCycleLength = useMemo(() => {
    if (!upcomingFundingCycle) return
    if (cycleUnlocked) return '-'
    return timeSecondsToDateString(
      upcomingFundingCycle.duration.toNumber(),
      'short',
    )
  }, [cycleUnlocked, upcomingFundingCycle])

  const status = useMemo(() => {
    if (cycleUnlocked) return t`Unlocked`
    return t`Locked`
  }, [cycleUnlocked])

  const remainingTime = useMemo(() => {
    if (cycleUnlocked) return '-'
    return timeRemainingText
  }, [cycleUnlocked, timeRemainingText])

  // Short circuit current for faster loading
  if (type === 'current') {
    if (fundingCycleLoading) return { loading: true, type }
    return {
      loading: false,
      type,
      cycleNumber,
      status,
      remainingTime,
    }
  }

  if (fundingCycleLoading || upcomingFundingCycleLoading)
    return {
      loading: true,
      type,
    }

  return {
    loading: false,
    type,
    cycleNumber,
    status,
    cycleLength: upcomingCycleLength,
    cycleUnlocked,
    currentCycleUnlocked,
  }
}
