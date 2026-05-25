const NOWPAYMENTS_API_URL = 'https://api.nowpayments.io/v1'

export type NowPaymentsCreatePaymentInput = {
  priceAmount: number
  priceCurrency: string
  payCurrency?: string
  orderId: string
  orderDescription: string
  ipnCallbackUrl: string
  successUrl: string
  cancelUrl: string
}

export type NowPaymentsCreatePaymentResponse = {
  payment_id: string | number
  payment_status: string
  pay_address?: string
  price_amount: number
  price_currency: string
  pay_amount?: number
  pay_currency?: string
  order_id: string
  order_description?: string
  purchase_id?: string
  payment_url?: string
  invoice_url?: string
  id?: string | number
}

export async function createNowPaymentsPayment({
  priceAmount,
  priceCurrency,
  payCurrency,
  orderId,
  orderDescription,
  ipnCallbackUrl,
  successUrl,
  cancelUrl,
}: NowPaymentsCreatePaymentInput): Promise<NowPaymentsCreatePaymentResponse> {
  const apiKey = process.env.NOWPAYMENTS_API_KEY

  if (!apiKey) {
    throw new Error('NOWPAYMENTS_API_KEY is missing')
  }

  const res = await fetch(`${NOWPAYMENTS_API_URL}/invoice`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },

body: JSON.stringify({
  price_amount: priceAmount,
  price_currency: priceCurrency,
  ...(payCurrency ? { pay_currency: payCurrency } : {}),
  order_id: orderId,
  order_description: orderDescription,
  ipn_callback_url: ipnCallbackUrl,
  success_url: successUrl,
  cancel_url: cancelUrl,
}),
  })

  const data = await res.json()

if (!res.ok) {
  console.error('NOWPayments API response:', data)

  throw new Error(
    data.message ||
      data.error ||
      JSON.stringify(data) ||
      'Failed to create NOWPayments payment'
  )
}

  return data
}