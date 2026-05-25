const USDT_TRC20_CONTRACT = 'TXLAQ63Xg1NAzckPwKHvzw7CSEmLMEqcdj'

export type TronVerificationResult = {
  status: 'verified' | 'failed' | 'not_found'
  reason: string
  checkedAt: Date
  receivedAmount?: number
  receiver?: string
  tokenSymbol?: string
}

export async function verifyTronUsdtPayment({
  txHash,
  expectedAmount,
  expectedReceiver,
}: {
  txHash: string
  expectedAmount: number
  expectedReceiver: string
}): Promise<TronVerificationResult> {
  try {
    const res = await fetch(
      `https://apilist.tronscanapi.com/api/transaction-info?hash=${txHash}`,
      { cache: 'no-store' }
    )

    if (!res.ok) {
      return {
        status: 'not_found',
        reason: 'Transaction was not found on TRON yet.',
        checkedAt: new Date(),
      }
    }

    const data = await res.json()

    if (!data?.confirmed || data?.contractRet !== 'SUCCESS') {
      return {
        status: 'not_found',
        reason: 'Transaction is not confirmed yet.',
        checkedAt: new Date(),
      }
    }

    const transfer = data.trc20TransferInfo?.find(
      (item: {
        contract_address?: string
        symbol?: string
        to_address?: string
        amount_str?: string
        decimals?: number
      }) =>
        item.contract_address === USDT_TRC20_CONTRACT ||
        item.symbol === 'USDT'
    )

    if (!transfer) {
      return {
        status: 'failed',
        reason: 'No USDT TRC20 transfer was found in this transaction.',
        checkedAt: new Date(),
      }
    }

    const receiver = transfer.to_address
    const rawAmount = transfer.amount_str
    const decimals = Number(transfer.decimals ?? 6)

    if (!receiver || !rawAmount) {
      return {
        status: 'failed',
        reason: 'Transaction transfer details are incomplete.',
        checkedAt: new Date(),
      }
    }

    const receivedAmount = Number(rawAmount) / Math.pow(10, decimals)

    if (receiver !== expectedReceiver) {
      return {
        status: 'failed',
        reason: 'Receiver wallet address does not match your payment wallet.',
        checkedAt: new Date(),
        receivedAmount,
        receiver,
        tokenSymbol: 'USDT',
      }
    }

    if (receivedAmount + 0.01 < expectedAmount) {
      return {
        status: 'failed',
        reason: `Amount mismatch. Expected ${expectedAmount} USDT but received ${receivedAmount} USDT.`,
        checkedAt: new Date(),
        receivedAmount,
        receiver,
        tokenSymbol: 'USDT',
      }
    }

    return {
      status: 'verified',
      reason: 'Payment verified on TRON blockchain.',
      checkedAt: new Date(),
      receivedAmount,
      receiver,
      tokenSymbol: 'USDT',
    }
  } catch {
    return {
      status: 'not_found',
      reason: 'Unable to verify transaction right now. Try again later.',
      checkedAt: new Date(),
    }
  }
}