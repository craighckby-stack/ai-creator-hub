import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const placeholders = await db.placeholder.findMany({
      orderBy: { createdAt: 'asc' }
    });
    return NextResponse.json(placeholders);
  } catch (error) {
    console.error('Error fetching placeholders:', error);
    return NextResponse.json({ error: 'Failed to fetch placeholders' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { externalId, name, description, dependencies } = body;

    const placeholder = await db.placeholder.create({
      data: {
        externalId,
        name,
        description,
        dependencies: JSON.stringify(dependencies || []),
        completed: false
      }
    });

    return NextResponse.json(placeholder);
  } catch (error) {
    console.error('Error creating placeholder:', error);
    return NextResponse.json({ error: 'Failed to create placeholder' }, { status: 500 });
  }
}
