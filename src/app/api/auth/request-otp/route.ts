import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { sendOTPEmail } from '@/lib/mailer';

const prisma = new PrismaClient();

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ success: false, message: 'Email is required' }, { status: 400 });
    }

    // Verify if it's the admin email (can be set in .env)
    const adminEmail = process.env.ADMIN_EMAIL || process.env.BREVO_SENDER_EMAIL;
    if (adminEmail && email.trim().toLowerCase() !== adminEmail.trim().toLowerCase()) {
      return NextResponse.json({ success: false, message: 'Unauthorized email' }, { status: 403 });
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    // Upsert the SiteSettings (since there's only one global setting)
    await prisma.siteSettings.upsert({
      where: { id: 'global' },
      update: {
        otpCode: otp,
        otpExpiresAt: expiresAt,
        adminEmail: email
      },
      create: {
        id: 'global',
        password: process.env.SITE_PASSWORD || 'default123',
        otpCode: otp,
        otpExpiresAt: expiresAt,
        adminEmail: email
      }
    });

    // Send email via Brevo / unified mailer
    const result = await sendOTPEmail({ email, otp });
    if (!result.success) {
      console.warn('sendOTPEmail reported an issue:', result.error);
    }

    return NextResponse.json({ success: true, message: 'OTP sent successfully' });
  } catch (error) {
    console.error('OTP error:', error);
    return NextResponse.json({ success: false, message: 'Failed to send OTP' }, { status: 500 });
  }
}
