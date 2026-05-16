import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM_EMAIL = process.env.EMAIL_FROM || 'Codnexia <support@codnexia.com>'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://codnexia.com'
const emailTemplate = (content: string) => `
<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08);">
  <div style="background: #1a1a2e; padding: 12px 20px; text-align: center; border-bottom: 3px solid #2563eb;">
    <h1 style="margin: 0; font-size: 18px;"><span style="color: #38b6ff; font-family: 'Courier New', monospace;">COD</span><span style="color: #ffffff; font-family: 'Courier New', monospace;">NEX</span><span style="color: #ff3131; font-family: 'Courier New', monospace;">IA</span></h1>
    <p style="color: #94a3b8; margin: 4px 0 0; font-size: 9px; font-family: Arial, sans-serif;">Academic Help & Web Development</p>
  </div>
  <div style="padding: 30px;">
    ${content}
  </div>
  <div style="background: #f8fafc; padding: 20px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
    <p style="color: #64748b; font-size: 12px; margin: 0;">© 2026 Codnexia. All rights reserved.</p>
  </div>
</div>
`

export async function sendNewMessageEmail(
  recipientEmail: string,
  senderName: string,
  message: string,
  orderId: string,
  serviceName: string
) {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: recipientEmail,
      subject: `New Message on Order - ${serviceName}`,
      html: emailTemplate(`
        <h2 style="color: #1e293b; margin: 0 0 10px;">New Message 💬</h2>
        <p style="color: #64748b; font-size: 15px; margin: 0 0 25px;">
          You have a new message from <strong>${senderName}</strong> regarding your order.
        </p>
        
        <div style="background: #f1f5f9; border-radius: 8px; padding: 20px; margin-bottom: 20px; border-left: 4px solid #2563eb;">
          <p style="margin: 0 0 8px; font-size: 14px;"><strong>Order:</strong> ${serviceName}</p>
          <p style="margin: 0 0 8px; font-size: 14px;"><strong>From:</strong> ${senderName}</p>
          <p style="margin: 0; font-size: 14px; color: #475569; font-style: italic;">"${message}"</p>
        </div>

          <a href="${SITE_URL}/${senderName === 'Admin' ? 'my-orders' : 'admin'}?chat=${orderId}"
           style="display: inline-block; background: #2563eb; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
          View & Reply →
        </a>
      `),
    })

    return true
  } catch (error) {
    console.error('Message notification email failed:', error)
    return false
  }
}