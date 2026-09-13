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

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ success: false, message: 'Valid email is required' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if email belongs to an employee or super admin
    const employee = await prisma.employee.findFirst({
      where: {
        email: normalizedEmail,
        deletedAt: null,
      },
    });

    const configuredAdminEmail = (process.env.ADMIN_EMAIL || process.env.BREVO_SENDER_EMAIL || "admin@imperialit.com").trim().toLowerCase();
    const isAdmin = normalizedEmail === configuredAdminEmail || normalizedEmail === "admin";

    if (!employee && !isAdmin) {
      return NextResponse.json({
        success: false,
        message: 'No registered account found with this email address.',
      }, { status: 404 });
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    // Save OTP record in SiteSettings using an email-keyed ID
    await prisma.siteSettings.upsert({
      where: { id: `otp_${normalizedEmail}` },
      update: {
        otpCode: otp,
        otpExpiresAt: expiresAt,
        adminEmail: normalizedEmail,
      },
      create: {
        id: `otp_${normalizedEmail}`,
        password: "otp_record",
        otpCode: otp,
        otpExpiresAt: expiresAt,
        adminEmail: normalizedEmail,
      },
    });

    // Also update global record if admin
    if (isAdmin) {
      await prisma.siteSettings.upsert({
        where: { id: 'global' },
        update: {
          otpCode: otp,
          otpExpiresAt: expiresAt,
          adminEmail: normalizedEmail,
        },
        create: {
          id: 'global',
          password: process.env.SITE_PASSWORD || 'default123',
          otpCode: otp,
          otpExpiresAt: expiresAt,
          adminEmail: normalizedEmail,
        },
      });
    }

    // Send email via Brevo
    const result = await sendOTPEmail({ email: normalizedEmail, otp });
    if (!result.success) {
      return NextResponse.json({
        success: false,
        message: result.error || 'Failed to dispatch OTP email. Please check mail settings.',
      }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'OTP verification code sent to your email.' });
  } catch (error: any) {
    console.error('OTP error:', error);
    return NextResponse.json({ success: false, message: error?.message || 'Failed to send OTP' }, { status: 500 });
  }
}
