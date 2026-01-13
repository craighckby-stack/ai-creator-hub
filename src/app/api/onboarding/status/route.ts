import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const config = await db.evolutionConfig.findFirst();

    const onboardingCompleted = !!config && !!config.geminiApiKey;

    return NextResponse.json({ onboardingCompleted });
  } catch (error) {
    console.error('Onboarding status error:', error);
    return NextResponse.json({ onboardingCompleted: false }, { status: 500 });
  }
}
