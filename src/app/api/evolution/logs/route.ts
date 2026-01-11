import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const logs = await db.systemLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: 100
    });
    return NextResponse.json(logs.reverse());
  } catch (error) {
    console.error('Error fetching logs:', error);
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, type } = body;

    const log = await db.systemLog.create({
      data: {
        message,
        type: type || 'info',
        timestamp: new Date()
      }
    });

    return NextResponse.json(log);
  } catch (error) {
    console.error('Error creating log:', error);
    return NextResponse.json({ error: 'Failed to create log' }, { status: 500 });
  }
}
