import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const logs = await db.systemLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: 100,
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error('Logs fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { message, type = 'info' } = await req.json();

    const log = await db.systemLog.create({
      data: {
        message,
        type,
      },
    });

    return NextResponse.json(log);
  } catch (error) {
    console.error('Log creation error:', error);
    return NextResponse.json({ error: 'Failed to create log' }, { status: 500 });
  }
}
