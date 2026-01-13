import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { completed } = await req.json();

    const placeholder = await db.placeholder.update({
      where: { id },
      data: { completed },
    });

    return NextResponse.json({
      ...placeholder,
      dependencies: JSON.parse(placeholder.dependencies),
    });
  } catch (error) {
    console.error('Placeholder update error:', error);
    return NextResponse.json({ error: 'Failed to update placeholder' }, { status: 500 });
  }
}
