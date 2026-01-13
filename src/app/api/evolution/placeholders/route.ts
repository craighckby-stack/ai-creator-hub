import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { randomUUID } from 'crypto';

export async function GET() {
  try {
    const placeholders = await db.placeholder.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(
      placeholders.map(p => ({
        ...p,
        dependencies: JSON.parse(p.dependencies),
      }))
    );
  } catch (error) {
    console.error('Placeholders fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch placeholders' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { name, description, dependencies } = await req.json();

    const placeholder = await db.placeholder.create({
      data: {
        externalId: `FEAT-${randomUUID().slice(0, 8).toUpperCase()}`,
        name,
        description,
        completed: false,
        dependencies: JSON.stringify(dependencies || []),
      },
    });

    return NextResponse.json({
      ...placeholder,
      dependencies: JSON.parse(placeholder.dependencies),
    });
  } catch (error) {
    console.error('Placeholder creation error:', error);
    return NextResponse.json({ error: 'Failed to create placeholder' }, { status: 500 });
  }
}
