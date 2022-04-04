import { BigNumber } from '@ethersproject/bignumber'
import { ProjectMetadataV4 } from 'models/project-metadata'
import { V2FundingCycle, V2FundingCycleMetadata } from 'models/v2/fundingCycle'
import { Split } from 'models/v2/splits'
import { createContext } from 'react'

export type V2ProjectContextType = {
  projectId: BigNumber | undefined
  projectMetadata: ProjectMetadataV4 | undefined
  tokenAddress: string | undefined
  tokenSymbol: string | undefined
  terminals: string[] | undefined // array of terminal addresses, 0xABC...
  ETHBalance: BigNumber | undefined
  projectOwnerAddress: string | undefined
  balanceInDistributionLimitCurrency: BigNumber | undefined
  usedDistributionLimit: BigNumber | undefined

  fundingCycleMetadata: V2FundingCycleMetadata | undefined
  fundingCycle: V2FundingCycle | undefined
  queuedFundingCycle: V2FundingCycle | undefined

  distributionLimit: BigNumber | undefined
  distributionLimitCurrency: BigNumber | undefined
  queuedDistributionLimit: BigNumber | undefined
  queuedDistributionLimitCurrency: BigNumber | undefined

  payoutSplits: Split[] | undefined
  queuedPayoutSplits: Split[] | undefined

  reservedTokensSplits: Split[] | undefined
  queuedReservedTokensSplits: Split[] | undefined
}

export const V2ProjectContext = createContext<V2ProjectContextType>({
  projectId: undefined,
  projectMetadata: undefined,
  tokenAddress: undefined,
  tokenSymbol: undefined,
  terminals: undefined,
  ETHBalance: undefined,
  projectOwnerAddress: undefined,
  balanceInDistributionLimitCurrency: undefined,
  usedDistributionLimit: undefined,

  fundingCycleMetadata: undefined,
  fundingCycle: undefined,
  queuedFundingCycle: undefined,

  distributionLimit: undefined,
  distributionLimitCurrency: undefined,
  queuedDistributionLimit: undefined,
  queuedDistributionLimitCurrency: undefined,

  payoutSplits: undefined,
  queuedPayoutSplits: undefined,

  reservedTokensSplits: undefined,
  queuedReservedTokensSplits: undefined,
})