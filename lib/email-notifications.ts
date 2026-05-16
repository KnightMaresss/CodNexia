import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM_EMAIL = process.env.EMAIL_FROM || 'Codnexia <support@codnexia.com>'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://codnexia.com'
const emailTemplate = (content: string) => `
<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08);">
  <div style="background: #1a1a2e; padding: 12px 20px; text-align: center; border-bottom: 3px solid #2563eb;">
       <h1 style="margin: 0; font-size: 25px;"><span style="color: #38b6ff; font-family: 'Courier New', monospace;">COD</span><span style="color: #ffffff; font-family: 'Courier New', monospace;">NEX</span><span style="color: #ff3131; font-family: 'Courier New', monospace;">IA</span></h1>
    <p style="color: #94a3b8; margin: 4px 0 0; font-size: 9px; font-family: Arial, sans-serif;">Academic Help & Web Development</p>
  </div>
  <div style="padding: 30px;">
    ${content}
  </div>
  <div style="background: #f8fafc; padding: 20px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
    <p style="color: #64748b; font-size: 12px; margin: 0;">© 2026 Codnexia. All rights reserved.</p>
    <p style="color: #94a3b8; font-size: 11px; margin: 4px 0 0;">Academic Help • Web Development • Mobile Apps</p>
  </div>
</div>
`

export async function sendStatusUpdateEmail(
  studentEmail: string,
  serviceName: string,
  price: number,
  orderId: string,
  newStatus: string,
  oldStatus: string
 ) {
  const statusLabels: Record<string, string> = {
    'pending': 'Order Received',
    'in-progress': 'In Progress',
    'completed': 'Completed',
  }

  const statusColors: Record<string, string> = {
    'pending': '#eab308',
    'in-progress': '#2563eb',
    'completed': '#16a34a',
  }

  const statusEmojis: Record<string, string> = {
    'pending': '📋',
    'in-progress': '🔨',
    'completed': '✅',
  }

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: studentEmail,
      subject: `Order Status Updated - ${statusLabels[newStatus]}`,
      html: emailTemplate(`
        <h2 style="color: #1e293b; margin: 0 0 10px;">Status Update ${statusEmojis[newStatus]}</h2>
        
        <div style="background: #f1f5f9; border-radius: 8px; padding: 20px; margin-bottom: 20px; border-left: 4px solid ${statusColors[newStatus]};">
          <p style="font-size: 16px; margin: 0 0 10px;">
            Your order has been updated to: <strong style="color: ${statusColors[newStatus]};">${statusLabels[newStatus]}</strong>
          </p>
          <p style="margin: 5px 0; color: #64748b; font-size: 13px;">
            Previous status: ${statusLabels[oldStatus] || oldStatus}
          </p>
          <p style="margin: 5px 0; font-size: 14px;"><strong>Order ID:</strong> ${orderId}</p>
          <p style="margin: 5px 0; font-size: 14px;"><strong>Service:</strong> ${serviceName}</p>
          <p style="margin: 5px 0; font-size: 14px;"><strong>Amount:</strong> $${price}</p>
        </div>

        <div style="background: #eff6ff; border-radius: 8px; padding: 15px; margin-bottom: 25px;">
          <p style="margin: 0; font-size: 14px; color: #1e40af;">
            ${newStatus === 'in-progress' 
              ? 'We have started working on your project. We will keep you updated on the progress.' 
              : newStatus === 'completed' 
              ? 'Your project is complete! We hope you are satisfied with the results.' 
              : 'We have received your order and will review it shortly.'}
          </p>
        </div>

        <a href="${SITE_URL}/track?id=${orderId}&direct=true" 
           style="display: inline-block; background: #2563eb; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
          Track Your Order →
        </a>
      `),
    })

    return true
  } catch (error) {
    console.error('Status email failed:', JSON.stringify(error, null, 2))
    return false
  }
  
}
export async function sendPriceReadyEmail(
  studentEmail: string,
  serviceName: string,
  finalPrice: number,
  depositAmount: number,
  remainingAmount: number,
  orderId: string
) {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: studentEmail,
      subject: `Your Order Is Ready to Start - ${serviceName}`,
      html: emailTemplate(`
        <h2 style="color: #1e293b; margin: 0 0 10px;">Order Accepted ✅</h2>

        <p style="color: #64748b; font-size: 15px; margin: 0 0 25px;">
          Your order has been reviewed and accepted. The final price is now ready.
        </p>

        <div style="background: #f1f5f9; border-radius: 8px; padding: 20px; margin-bottom: 20px; border-left: 4px solid #2563eb;">
          <p style="margin: 0 0 8px; font-size: 14px;"><strong>Order ID:</strong> ${orderId}</p>
          <p style="margin: 0 0 8px; font-size: 14px;"><strong>Service:</strong> ${serviceName}</p>
          <p style="margin: 0 0 8px; font-size: 14px;"><strong>Total Price:</strong> $${finalPrice}</p>
          <p style="margin: 0 0 8px; font-size: 14px;"><strong>Deposit:</strong> $${depositAmount}</p>
          <p style="margin: 0; font-size: 14px;"><strong>Remaining:</strong> $${remainingAmount}</p>
        </div>

        <a href="${SITE_URL}/my-orders?chat=${orderId}"
           style="display: inline-block; background: #2563eb; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
          View Order →
        </a>
      `),
    })

    return true
  } catch (error) {
    console.error('Price ready email failed:', JSON.stringify(error, null, 2))
    return false
  }
}