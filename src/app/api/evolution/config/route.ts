import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    let config = await db.systemConfig.findFirst();
    if (!config) {
      config = await db.systemConfig.create({
        data: {
          evolutionCycle: 4
        }
      });
    }
    return NextResponse.json({
      githubToken: config.githubToken,
      geminiApiKey: config.geminiApiKey,
      githubRepo: config.githubRepo,
      evolutionCycle: config.evolutionCycle
    });
  } catch (error) {
    console.error('Error fetching config:', error);
    return NextResponse.json({ error: 'Failed to fetch config' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { githubToken, geminiApiKey, githubRepo } = body;

    let config = await db.systemConfig.findFirst();
    if (!config) {
      config = await db.systemConfig.create({
        data: {
          githubToken,
          geminiApiKey,
          githubRepo,
          evolutionCycle: 4
        }
      });
    } else {
      config = await db.systemConfig.update({
        where: { id: config.id },
        data: {
          githubToken: githubToken || config.githubToken,
          geminiApiKey: geminiApiKey || config.geminiApiKey,
          githubRepo: githubRepo || config.githubRepo
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving config:', error);
    return NextResponse.json({ error: 'Failed to save config' }, { status: 500 });
  }
}
