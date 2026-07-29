import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { password } = await request.json();

    // Check if we have a password in DB
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

    if (password === validPassword) {
      // Set a cookie that the middleware will look for
      cookies().set('site-auth', 'true', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/',
      });
      
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { success: false, message: 'Incorrect password' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: 'Something went wrong' },
      { status: 500 }
    );
  }
}
