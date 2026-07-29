import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(request: Request) {
  try {
    const { password, otp } = await request.json();

    if (!password || !otp) {
      return NextResponse.json({ success: false, message: 'Password and OTP are required' }, { status: 400 });
    }

    const settings = await prisma.siteSettings.findUnique({
      where: { id: 'global' }
    });

    let validPassword = process.env.SITE_PASSWORD; // Fallback

    if (settings && settings.password) {
      validPassword = settings.password;
    }

    if (!validPassword) {
      return NextResponse.json(
        { success: false, message: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Verify Password
    if (password !== validPassword) {
      return NextResponse.json(
        { success: false, message: 'Incorrect password' },
        { status: 401 }
      );
    }

    // Verify OTP
    if (!settings || !settings.otpCode || !settings.otpExpiresAt) {
      return NextResponse.json({ success: false, message: 'Invalid OTP request' }, { status: 400 });
    }

    if (new Date() > settings.otpExpiresAt) {
      return NextResponse.json({ success: false, message: 'OTP has expired' }, { status: 400 });
    }

    if (settings.otpCode !== otp) {
      return NextResponse.json({ success: false, message: 'Invalid OTP' }, { status: 400 });
    }

    // Delete all institutions
    await prisma.institution.deleteMany({});

    // Clear OTP
    await prisma.siteSettings.update({
      where: { id: 'global' },
      data: {
        otpCode: null,
        otpExpiresAt: null
      }
    });

    return NextResponse.json({ success: true, message: 'All institutions deleted successfully' });
  } catch (error) {
    console.error('Delete all error:', error);
    return NextResponse.json({ success: false, message: 'Failed to delete institutions' }, { status: 500 });
  }
}
