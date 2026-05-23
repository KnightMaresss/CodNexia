import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || ''
const FROM_EMAIL = process.env.EMAIL_FROM || 'Codnexia <support@codnexia.com>'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://codnexia.com'
const emailTemplate = (content: string) => `
<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08);">
  <!-- Header -->
  <div style="background: #1a1a2e; padding: 12px 20px; text-align: center; border-bottom: 3px solid #2563eb;">
       <h1 style="margin: 0; font-size: 25px;"><span style="color: #38b6ff; font-family: 'Courier New', monospace;">COD</span><span style="color: #ffffff; font-family: 'Courier New', monospace;">NEX</span><span style="color: #ff3131; font-family: 'Courier New', monospace;">IA</span></h1>
    <p style="color: #94a3b8; margin: 4px 0 0; font-size: 9px; font-family: Arial, sans-serif;">Academic Help & Web Development</p>
  </div>
  
  <!-- Content -->
  <div style="padding: 30px;">
    ${content}
  </div>
  
  <!-- Footer -->
  <div style="background: #f8fafc; padding: 20px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
    <p style="color: #64748b; font-size: 12px; margin: 0;">
      © 2026 Codnexia. All rights reserved.
    </p>
    <p style="color: #94a3b8; font-size: 11px; margin: 4px 0 0;">
      Academic Help • Web Development • Mobile Apps
    </p>
  </div>
</div>
`

export async function sendOrderConfirmation(
  studentEmail: string,
  serviceName: string,
  price: number,
  orderId: string
) {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: studentEmail,
      subject: 'Order Confirmed - Codnexia',
      html: emailTemplate(`
        <h2 style="color: #1e293b; margin: 0 0 10px;">Order Confirmed! 🎉</h2>
        <p style="color: #64748b; font-size: 15px; margin: 0 0 25px;">Thank you for choosing Codnexia. Your order has been received.</p>
        
        <div style="background: #f1f5f9; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <p style="margin: 0 0 8px; font-size: 14px;"><strong style="color: #1e293b;">Order ID:</strong> <span style="color: #2563eb;">${orderId}</span></p>
          <p style="margin: 0 0 8px; font-size: 14px;"><strong style="color: #1e293b;">Service:</strong> ${serviceName}</p>
          <p style="margin: 0; font-size: 14px;"><strong style="color: #1e293b;">Amount:</strong> <span style="color: #16a34a; font-weight: bold;">$${price}</span></p>
        </div>
        
        <p style="color: #64748b; font-size: 14px; margin: 0 0 25px;">We will review your requirements and get back to you within 24 hours.</p>
        
        <a href="${SITE_URL}/track?id=${orderId}" 
           style="display: inline-block; background: #2563eb; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
          Track Your Order →
        </a>
      `),
    })

    // Send notification to admin
    await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: `New Order: ${serviceName} - $${price}`,
      html: emailTemplate(`
        <h2 style="color: #1e293b; margin: 0 0 10px;">New Order Received! 🔔</h2>
        
        <div style="background: #f1f5f9; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <p style="margin: 0 0 8px; font-size: 14px;"><strong style="color: #1e293b;">Order ID:</strong> ${orderId}</p>
          <p style="margin: 0 0 8px; font-size: 14px;"><strong style="color: #1e293b;">Student:</strong> ${studentEmail}</p>
          <p style="margin: 0 0 8px; font-size: 14px;"><strong style="color: #1e293b;">Service:</strong> ${serviceName}</p>
          <p style="margin: 0; font-size: 14px;"><strong style="color: #1e293b;">Amount:</strong> <span style="color: #16a34a; font-weight: bold;">$${price}</span></p>
        </div>
        
        <a href="${SITE_URL}/admin" 
           style="display: inline-block; background: #2563eb; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
          View in Dashboard →
        </a>
      `),
    })

    return true
  } catch (error) {
    console.error('Email sending failed:', error)
    return false
  }
}
export async function sendEmailVerificationEmail(
  recipientEmail: string,
  name: string,
  token: string
) {
  const verificationUrl = `${SITE_URL}/verify-email?token=${token}`

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: recipientEmail,
      subject: 'Verify your Codnexia account',
      html: emailTemplate(`
        <h2 style="color: #1e293b; margin: 0 0 10px;">Verify your email ✅</h2>

        <p style="color: #64748b; font-size: 15px; margin: 0 0 20px;">
          Hi ${name}, welcome to Codnexia. Please verify your email address to activate your account.
        </p>

        <div style="background: #f1f5f9; border-radius: 8px; padding: 18px; margin-bottom: 24px;">
          <p style="margin: 0; color: #475569; font-size: 14px;">
            This verification link expires in <strong>1 hour</strong>. After verification, you can place orders, chat with staff, upload files, and receive updates.
          </p>
        </div>

        <a href="${verificationUrl}"
           style="display: inline-block; background: #2563eb; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
          Verify Email →
        </a>

        <p style="color: #94a3b8; font-size: 12px; margin: 24px 0 0;">
          If you did not create a Codnexia account, you can safely ignore this email.
        </p>
      `),
    })

    return true
  } catch (error) {
    console.error('Verification email failed:', error)
    return false
  }
}