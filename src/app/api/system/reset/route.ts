import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // Delete all project-related data (keep user and config)
    await db.placeholder.deleteMany({});
    await db.systemLog.deleteMany({});
    await db.implementationResult.deleteMany({});
    await db.resource.deleteMany({});
    await db.projectSpecification.deleteMany({});
    await db.uploadedFile.deleteMany({});
    await db.relevantRepo.deleteMany({});
    await db.buildInstructions.deleteMany({});

    // Reset user onboarding status
    await db.user.updateMany({
      data: {
        onboardingCompleted: false
      }
    });

    // Reset evolution cycle
    const config = await db.systemConfig.findFirst();
    if (config) {
      await db.systemConfig.update({
        where: { id: config.id },
        data: {
          evolutionCycle: 1
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'System reset successfully. You can now start a new project.'
    });

  } catch (error: any) {
    console.error('System reset error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to reset system' },
      { status: 500 }
    );
  }
}
