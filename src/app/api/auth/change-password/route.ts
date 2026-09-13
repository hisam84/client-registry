import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { email, otp, newPassword } = await request.json();

    if (!otp || !newPassword) {
      return NextResponse.json({ success: false, message: 'OTP and new password are required' }, { status: 400 });
    }

    const normalizedEmail = (email || '').trim().toLowerCase();

    // Look up OTP record
    let otpRecord: any = null;
    if (normalizedEmail) {
      otpRecord = await prisma.siteSettings.findUnique({
        where: { id: `otp_${normalizedEmail}` },
      });
    }
    if (!otpRecord) {
      otpRecord = await prisma.siteSettings.findUnique({
        where: { id: 'global' },
      });
    }

    if (!otpRecord || !otpRecord.otpCode || !otpRecord.otpExpiresAt) {
      return NextResponse.json({ success: false, message: 'Invalid or expired OTP session. Please request a new OTP code.' }, { status: 400 });
    }

    // Check expiry
    if (new Date() > otpRecord.otpExpiresAt) {
      return NextResponse.json({ success: false, message: 'OTP verification code has expired' }, { status: 400 });
    }

    // Verify OTP
    if (otpRecord.otpCode.trim() !== otp.trim()) {
      return NextResponse.json({ success: false, message: 'Invalid OTP code entered. Please try again.' }, { status: 400 });
    }

    // Update password for Employee or Admin
    const employee = normalizedEmail
      ? await prisma.employee.findFirst({
          where: { email: normalizedEmail, deletedAt: null },
        })
      : null;

    if (employee) {
      await prisma.employee.update({
        where: { id: employee.id },
        data: { password: newPassword },
      });
    } else {
      // Admin password update
      await prisma.siteSettings.update({
        where: { id: 'global' },
        data: {
          password: newPassword,
          otpCode: null,
          otpExpiresAt: null,
        },
      });
    }

    // Clean up OTP record
    if (normalizedEmail) {
      await prisma.siteSettings.delete({
        where: { id: `otp_${normalizedEmail}` },
      }).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully. You can now login with your new credentials.',
    });
  } catch (error: any) {
    console.error('Change password error:', error);
    return NextResponse.json({ success: false, message: error?.message || 'Failed to change password' }, { status: 500 });
  }
}
