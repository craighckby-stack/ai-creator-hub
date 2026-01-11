import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { files } = body;

    const result = await db.implementationResult.create({
      data: {
        placeholderId: id,
        files: JSON.stringify(files || []),
        timestamp: new Date()
      }
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error creating implementation result:', error);
    return NextResponse.json({ error: 'Failed to create implementation result' }, { status: 500 });
  }
}
