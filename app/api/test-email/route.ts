import { NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function GET() {
  const resend = new Resend(process.env.RESEND_API_KEY)
  
  try {
    const result = await resend.emails.send({
      from: 'Student Services <onboarding@resend.dev>',
      to: 'waleedalmaqtari10@gmail.com',
      subject: 'Test Email',
      html: '<p>This is a test email</p>',
    })
    
    return NextResponse.json({ success: true, result })
  } catch (error) {
    return NextResponse.json({ success: false, error: JSON.stringify(error) }, { status: 500 })
  }
}