import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { otp, newPassword } = await request.json();

    if (!otp || !newPassword) {
      return NextResponse.json({ success: false, message: 'OTP and new password are required' }, { status: 400 });
    }

    const settings = await prisma.siteSettings.findUnique({
      where: { id: 'global' }
    });

    if (!settings || !settings.otpCode || !settings.otpExpiresAt) {
      return NextResponse.json({ success: false, message: 'Invalid OTP request' }, { status: 400 });
    }

    // Check expiry
    if (new Date() > settings.otpExpiresAt) {
      return NextResponse.json({ success: false, message: 'OTP has expired' }, { status: 400 });
    }

    // Verify OTP
    if (settings.otpCode !== otp) {
      return NextResponse.json({ success: false, message: 'Invalid OTP' }, { status: 400 });
    }

    // Update password and clear OTP
    await prisma.siteSettings.update({
      where: { id: 'global' },
      data: {
        password: newPassword,
        otpCode: null,
        otpExpiresAt: null
      }
    });

    return NextResponse.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json({ success: false, message: 'Failed to change password' }, { status: 500 });
  }
}
