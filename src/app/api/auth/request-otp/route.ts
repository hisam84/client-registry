import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';

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

    // Verify if it's the admin email (you can also hardcode it in .env)
    const adminEmail = process.env.GMAIL_USER;
    if (email !== adminEmail) {
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

    // Send email via Nodemailer
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"Client Manager" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: 'Your Password Reset OTP',
      html: `
        <div style="font-family: sans-serif; padding: 20px; text-align: center;">
          <h2>Password Reset Request</h2>
          <p>Your OTP to change the site password is:</p>
          <h1 style="color: #2563eb; letter-spacing: 5px;">${otp}</h1>
          <p>This code will expire in 10 minutes.</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true, message: 'OTP sent successfully' });
  } catch (error) {
    console.error('OTP error:', error);
    return NextResponse.json({ success: false, message: 'Failed to send OTP' }, { status: 500 });
  }
}
