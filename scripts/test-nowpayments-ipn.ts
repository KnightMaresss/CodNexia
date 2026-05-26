// scripts/test-nowpayments-ipn.ts
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import crypto from 'crypto'
const secret = process.env.NOWPAYMENTS_IPN_SECRET!

const payload = {
  payment_id: '6086896329',
  payment_status: 'finished',
  order_id: '6a14eb60e2096b44fc7f3b01:deposit',
  purchase_id: 'TEST_PURCHASE_ID',
  actually_paid: 3,
  pay_amount: 3,
  pay_currency: 'usdtsol',
  price_amount: 3,
  price_currency: 'usd',
}

function sortObject(obj: any): any {
  if (obj === null || typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.map(sortObject)

  return Object.keys(obj)
    .sort()
    .reduce((result: any, key) => {
      result[key] = sortObject(obj[key])
      return result
    }, {})
}

const body = JSON.stringify(payload)

const signature = crypto
  .createHmac('sha512', secret)
  .update(JSON.stringify(sortObject(payload)))
  .digest('hex')

console.log('BODY:')
console.log(body)

console.log('\nSIGNATURE:')
console.log(signature)