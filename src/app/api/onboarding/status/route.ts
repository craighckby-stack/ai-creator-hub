import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Check if any user exists with completed onboarding
    const user = await db.user.findFirst({
      where: { onboardingCompleted: true }
    });

    return NextResponse.json({
      onboardingCompleted: !!user,
      user: user ? {
        id: user.id,
        name: user.name,
        email: user.email,
        githubUsername: user.githubUsername,
        experienceLevel: user.experienceLevel
      } : null
    });
  } catch (error) {
    console.error('Error checking onboarding status:', error);
    return NextResponse.json({ onboardingCompleted: false, user: null });
  }
}
