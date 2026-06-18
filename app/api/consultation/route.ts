import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  try {
    const { name, email, service, message } = await request.json()

    // Validate required fields
    if (!email || !message) {
      return NextResponse.json(
        { error: 'Email and message are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://yourwebsite.com'
    const siteName = siteUrl.replace(/^https?:\/\//, '').replace(/^www\./, '')

    // Send email to admin
    await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to: process.env.ADMIN_EMAIL!,
      subject: `New Consultation Request from ${name || email}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #1e293b; }
            .container { max-width: 600px; margin: 0 auto; padding: 24px; }
            .header { background: linear-gradient(135deg, #2563eb, #0891b2); color: white; padding: 32px; border-radius: 16px 16px 0 0; }
            .content { background: #f8fafc; padding: 32px; border-radius: 0 0 16px 16px; border: 1px solid #e2e8f0; }
            .field { margin-bottom: 20px; }
            .label { font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b; font-weight: 600; margin-bottom: 4px; }
            .value { font-size: 16px; color: #1e293b; background: white; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; }
            .badge { display: inline-block; background: #dbeafe; color: #1e40af; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 28px;">🔔 New Consultation Request</h1>
              <p style="margin: 8px 0 0; opacity: 0.9;">Someone wants to discuss a project with you</p>
            </div>
            <div class="content">
              <div class="field">
                <div class="label">📧 From</div>
                <div class="value">${name || 'Anonymous'} (${email})</div>
              </div>
              
              ${service ? `
              <div class="field">
                <div class="label">🎯 Interested Service</div>
                <div class="value"><span class="badge">${service}</span></div>
              </div>
              ` : ''}
              
              <div class="field">
                <div class="label">💬 Message</div>
                <div class="value" style="white-space: pre-wrap;">${message}</div>
              </div>
              
              <div style="margin-top: 24px; padding: 16px; background: #eff6ff; border-radius: 12px; border: 1px solid #bfdbfe;">
                <p style="margin: 0; font-size: 14px; color: #1e40af;">
                  <strong>⏰ Time received:</strong> ${new Date().toLocaleString()}
                </p>
              </div>
              
              <a href="mailto:${email}" style="display: inline-block; margin-top: 24px; background: #2563eb; color: white; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: 600;">
                Reply to ${name || 'Client'}
              </a>
            </div>
          </div>
        </body>
        </html>
      `,
      replyTo: email,
    })

    // Send confirmation email to the user
    await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to: email,
      subject: `We received your message! 🎉`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #1e293b; }
            .container { max-width: 600px; margin: 0 auto; padding: 24px; }
            .header { background: linear-gradient(135deg, #2563eb, #0891b2); color: white; padding: 32px; border-radius: 16px 16px 0 0; text-align: center; }
            .content { background: #f8fafc; padding: 32px; border-radius: 0 0 16px 16px; border: 1px solid #e2e8f0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 28px;">✅ Message Received!</h1>
            </div>
            <div class="content">
              <p>Hi ${name || 'there'},</p>
              <p>Thank you for reaching out! We've received your message and will get back to you within 24 hours.</p>
              <div style="background: #eff6ff; padding: 16px; border-radius: 12px; margin-top: 24px;">
                <p style="margin: 0; font-size: 14px; color: #1e40af;">
                  <strong>Your message:</strong><br/>
                  "${message}"
                </p>
              </div>
              <p style="margin-top: 24px;">In the meantime, feel free to browse our services or check out our portfolio.</p>
              <p>Best regards,<br/>The ${siteName} Team</p>
            </div>
          </div>
        </body>
        </html>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Consultation email error:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}