import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    let config = await db.evolutionConfig.findFirst();

    if (!config) {
      config = await db.evolutionConfig.create({
        data: {
          githubToken: '',
          geminiApiKey: '',
          githubRepo: '',
          evolutionCycle: 4,
        },
      });
    }

    return NextResponse.json({
      githubToken: config.githubToken,
      geminiApiKey: config.geminiApiKey,
      githubRepo: config.githubRepo,
      evolutionCycle: config.evolutionCycle,
    });
  } catch (error) {
    console.error('Config fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch config' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { githubToken, geminiApiKey, githubRepo } = await req.json();

    let config = await db.evolutionConfig.findFirst();

    if (config) {
      config = await db.evolutionConfig.update({
        where: { id: config.id },
        data: { githubToken, geminiApiKey, githubRepo },
      });
    } else {
      config = await db.evolutionConfig.create({
        data: { githubToken, geminiApiKey, githubRepo, evolutionCycle: 4 },
      });
    }

    return NextResponse.json({
      githubToken: config.githubToken,
      geminiApiKey: config.geminiApiKey,
      githubRepo: config.githubRepo,
      evolutionCycle: config.evolutionCycle,
    });
  } catch (error) {
    console.error('Config update error:', error);
    return NextResponse.json({ error: 'Failed to update config' }, { status: 500 });
  }
}
