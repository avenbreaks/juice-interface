import { t, Trans } from '@lingui/macro'
import { Form } from 'antd'
import InputAccessoryButton from 'components/buttons/InputAccessoryButton'
import { Callout } from 'components/Callout/Callout'
import FormattedNumberInput from 'components/inputs/FormattedNumberInput'
import TransactionModal from 'components/modals/TransactionModal'
import { FEES_EXPLANATION } from 'components/strings'
import { V2V3ProjectContext } from 'contexts/v2v3/Project/V2V3ProjectContext'
import { BigNumber } from 'ethers'
import { useCurrencyConverter } from 'hooks/useCurrencyConverter'
import { useDistributePayoutsTx } from 'hooks/v2v3/transactor/useDistributePayouts'
import { V2V3CurrencyOption } from 'models/v2v3/currencyOption'
import { useContext, useEffect, useState } from 'react'
import { fromWad, parseWad } from 'utils/format/formatNumber'
import { V2V3_CURRENCY_USD, V2V3CurrencyName } from 'utils/v2v3/currency'
import PayoutsTable from '../../V2V3ProjectSettings/pages/EditCyclePage/PayoutsSection/PayoutsTable'

export default function DistributePayoutsModal({
  open,
  onCancel,
  onConfirmed,
}: {
  open?: boolean
  onCancel?: VoidFunction
  onConfirmed?: VoidFunction
}) {
  const {
    balanceInDistributionLimitCurrency,
    distributionLimit,
    usedDistributionLimit,
    distributionLimitCurrency,
    payoutSplits,
  } = useContext(V2V3ProjectContext)

  const [transactionPending, setTransactionPending] = useState<boolean>()
  const [loading, setLoading] = useState<boolean>()
  const [distributionAmount, setDistributionAmount] = useState<string>()

  const distributePayoutsTx = useDistributePayoutsTx()
  const converter = useCurrencyConverter()

  useEffect(() => {
    if (!distributionLimit) return

    const unusedFunds = distributionLimit?.sub(usedDistributionLimit ?? 0) ?? 0
    const distributable = balanceInDistributionLimitCurrency?.gt(unusedFunds)
      ? unusedFunds
      : balanceInDistributionLimitCurrency

    setDistributionAmount(fromWad(distributable))
  }, [
    balanceInDistributionLimitCurrency,
    distributionLimit,
    usedDistributionLimit,
  ])

  async function executeDistributePayoutsTx() {
    if (!distributionLimitCurrency || !distributionAmount) return

    const minAmount = (
      distributionLimitCurrency.eq(V2V3_CURRENCY_USD)
        ? converter.usdToWei(distributionAmount)
        : parseWad(distributionAmount)
    )?.sub(1e12) // Arbitrary value subtracted
    if (!minAmount) return

    setLoading(true)

    const txSuccessful = await distributePayoutsTx(
      {
        amount: parseWad(distributionAmount),
        currency: distributionLimitCurrency.toNumber() as V2V3CurrencyOption,
      },
      {
        onDone: () => {
          setTransactionPending(true)
        },
        onConfirmed: () => {
          setLoading(false)
          setTransactionPending(false)
          onConfirmed?.()
        },
      },
    )

    if (!txSuccessful) {
      setLoading(false)
      setTransactionPending(false)
    }
  }

  const unusedFunds =
    distributionLimit?.sub(usedDistributionLimit ?? 0) ?? BigNumber.from(0)

  const distributable = balanceInDistributionLimitCurrency?.gt(unusedFunds)
    ? unusedFunds
    : balanceInDistributionLimitCurrency

  const currencyName =
    V2V3CurrencyName(
      distributionLimitCurrency?.toNumber() as V2V3CurrencyOption,
    ) ?? 'ETH'

  return (
    <TransactionModal
      title={<Trans>Send payouts</Trans>}
      open={open}
      onOk={executeDistributePayoutsTx}
      onCancel={() => {
        setDistributionAmount(undefined)
        onCancel?.()
      }}
      okButtonProps={{
        disabled: !distributionAmount || distributionAmount === '0',
      }}
      confirmLoading={loading}
      transactionPending={transactionPending}
      okText={t`Send payouts`}
      connectWalletText={t`Connect wallet to send payouts`}
      width={640}
      className="top-[40px]"
    >
      <div className="flex flex-col gap-6">
        <Form layout="vertical">
          <Form.Item className="mb-0" label={<Trans>Amount to pay out</Trans>}>
            <FormattedNumberInput
              placeholder="0"
              value={distributionAmount}
              onChange={value => setDistributionAmount(value)}
              min={0}
              accessory={
                <div className="flex items-center">
                  <span className="mr-2 text-black dark:text-slate-100">
                    {currencyName}
                  </span>
                  <InputAccessoryButton
                    content={<Trans>MAX</Trans>}
                    onClick={() =>
                      setDistributionAmount(fromWad(distributable))
                    }
                  />
                </div>
              }
            />
          </Form.Item>
        </Form>
        <div>
          <h4>
            <Trans>Payout recipients</Trans>
          </h4>

          {payoutSplits?.length === 0 ? (
            <Callout.Info className="mb-4">
              <Trans>
                The project owner is the only payout recipient. Any ETH paid out
                this cycle will go to them.
              </Trans>
            </Callout.Info>
          ) : null}

          <div className="max-h-[33vh] overflow-y-auto">
            <PayoutsTable
              payoutSplits={payoutSplits ?? []}
              currency={currencyName}
              distributionLimit={parseFloat(distributionAmount ?? '0')}
              hideHeader
              showAvatars
            />
          </div>
        </div>
        <Callout.Info>
          <>
            <p>
              <Trans>Recipients will receive payouts in ETH.</Trans>
            </p>
            {FEES_EXPLANATION}
          </>
        </Callout.Info>
      </div>
    </TransactionModal>
  )
}
