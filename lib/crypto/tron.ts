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
  const apiKey = process.env.TRONGRID_API_KEY

  try {
    const res = await fetch(
      `https://api.trongrid.io/v1/transactions/${txHash}/events`,
      {
        headers: apiKey
          ? {
              'TRON-PRO-API-KEY': apiKey,
            }
          : {},
        cache: 'no-store',
      }
    )

    if (!res.ok) {
      return {
        status: 'not_found',
        reason: 'Transaction was not found on TRON yet.',
        checkedAt: new Date(),
      }
    }

    const data = await res.json()

    const transferEvent = data.data?.find(
      (event: {
        event_name?: string
        contract_address?: string
        result?: {
          to?: string
          value?: string
        }
      }) =>
        event.event_name === 'Transfer' &&
        event.contract_address === USDT_TRC20_CONTRACT
    )

    if (!transferEvent) {
      return {
        status: 'failed',
        reason: 'No USDT TRC20 transfer was found in this transaction.',
        checkedAt: new Date(),
      }
    }

    const receiver = transferEvent.result?.to
    const rawValue = transferEvent.result?.value

    if (!receiver || !rawValue) {
      return {
        status: 'failed',
        reason: 'Transaction transfer details are incomplete.',
        checkedAt: new Date(),
      }
    }

    const receivedAmount = Number(rawValue) / 1_000_000

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

    if (Math.abs(receivedAmount - expectedAmount) > 0.01) {
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