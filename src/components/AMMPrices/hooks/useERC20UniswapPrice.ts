import { Token } from '@uniswap/sdk-core'
import IUniswapV3FactoryABI from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Factory.sol/IUniswapV3Factory.json'
import IUniswapV3PoolABI from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json'
import {
  FeeAmount,
  Pool,
  FACTORY_ADDRESS as UNISWAP_V3_FACTORY_ADDRESS,
} from '@uniswap/v3-sdk'
import { BigNumber, Contract } from 'ethers'
import { useQuery } from 'react-query'

import { WETH } from 'constants/contracts/tokens'
import { readNetwork } from 'constants/networks'
import { WAD_DECIMALS } from 'constants/numbers'
import { readProvider } from 'constants/readProvider'
import { isZeroAddress } from 'utils/address'

interface Immutables {
  factory: string
  token0: string
  token1: string
  fee: number
  tickSpacing: number
  maxLiquidityPerTick: BigNumber
}

interface State {
  liquidity: BigNumber
  sqrtPriceX96: BigNumber
  tick: number
  observationIndex: number
  observationCardinality: number
  observationCardinalityNext: number
  feeProtocol: number
  unlocked: boolean
}

type Props = {
  tokenSymbol: string | undefined
  tokenAddress: string | undefined
}

/**
 * Pools are created at a specific fee tier.
 * https://docs.uniswap.org/protocol/concepts/V3-overview/fees#pool-fees-tiers
 */
const UNISWAP_FEES_BPS = [
  FeeAmount.LOWEST,
  FeeAmount.LOW,
  FeeAmount.MEDIUM,
  FeeAmount.HIGH,
]
const networkId = readNetwork.chainId

/**
 * Hook to fetch the Uniswap price for a given token.
 * Uniswap-related code inspired by https://docs.uniswap.org/sdk/guides/fetching-prices.
 */
export function useUniswapPriceQuery({ tokenSymbol, tokenAddress }: Props) {
  const factoryContract = new Contract(
    UNISWAP_V3_FACTORY_ADDRESS,
    IUniswapV3FactoryABI.abi,
    readProvider,
  )

  /**
   * Recursively attempts to find liquidty pool at a given [fee].
   * Recurs through each fee tier until a pool is found.
   * If no pool is found, return undefined.
   * @returns contract address of liquidty pool
   */
  const getPoolAddress = async (
    fee: number | undefined = UNISWAP_FEES_BPS[0],
  ): Promise<string | undefined> => {
    const poolAddress = await factoryContract.getPool(tokenAddress, WETH, fee)

    if (poolAddress && !isZeroAddress(poolAddress)) {
      return poolAddress
    }

    // If we've got no more fees to search on, bail.
    const feeIdx = UNISWAP_FEES_BPS.findIndex(f => f === fee)
    if (feeIdx === UNISWAP_FEES_BPS.length - 1) {
      return undefined
    }

    return getPoolAddress(UNISWAP_FEES_BPS[feeIdx + 1])
  }

  async function getPoolImmutables(poolContract: Contract) {
    const [factory, token0, token1, fee, tickSpacing, maxLiquidityPerTick] =
      await Promise.all([
        poolContract.factory(),
        poolContract.token0(),
        poolContract.token1(),
        poolContract.fee(),
        poolContract.tickSpacing(),
        poolContract.maxLiquidityPerTick(),
      ])

    const immutables: Immutables = {
      factory,
      token0,
      token1,
      fee,
      tickSpacing,
      maxLiquidityPerTick,
    }

    return immutables
  }

  async function getPoolState(poolContract: Contract) {
    const [slot, liquidity] = await Promise.all([
      poolContract.slot0(),
      poolContract.liquidity(),
    ])
    const PoolState: State = {
      liquidity,
      sqrtPriceX96: slot[0],
      tick: slot[1],
      observationIndex: slot[2],
      observationCardinality: slot[3],
      observationCardinalityNext: slot[4],
      feeProtocol: slot[5],
      unlocked: slot[6],
    }

    return PoolState
  }

  return useQuery(
    [`${tokenSymbol}-uniswap-price`],
    async () => {
      if (!tokenAddress || !tokenSymbol) return null

      try {
        const poolAddress = await getPoolAddress()
        if (!poolAddress) {
          throw new Error('No liquidity pool found.')
        }

        const poolContract = new Contract(
          poolAddress,
          IUniswapV3PoolABI.abi,
          readProvider,
        )

        const [immutables, state] = await Promise.all([
          getPoolImmutables(poolContract),
          getPoolState(poolContract),
        ])

        const PROJECT_TOKEN = new Token(
          networkId,
          immutables.token0,
          WAD_DECIMALS,
          tokenSymbol,
        )
        const WETH = new Token(
          networkId,
          immutables.token1,
          WAD_DECIMALS,
          'WETH',
        )

        const projectTokenETHPool = new Pool(
          PROJECT_TOKEN,
          WETH,
          immutables.fee,
          state.sqrtPriceX96.toString(),
          state.liquidity.toString(),
          state.tick,
        )

        const projectTokenPrice = projectTokenETHPool.token0Price
        const WETHPrice = projectTokenETHPool.token1Price
        return {
          tokenSymbol,
          projectTokenPrice,
          WETHPrice,
          liquidity: projectTokenETHPool.liquidity.toString(),
        }
      } catch (e) {
        console.error('Error fetching AMM price', e)
      }
    },
    {
      refetchInterval: 30000, // refetch every 30 seconds
      enabled: Boolean(tokenAddress && tokenSymbol),
    },
  )
}
