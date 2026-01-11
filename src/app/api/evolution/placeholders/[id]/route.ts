import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { completed } = body;

    const placeholder = await db.placeholder.update({
      where: { id },
      data: { completed }
    });

    return NextResponse.json(placeholder);
  } catch (error) {
    console.error('Error updating placeholder:', error);
    return NextResponse.json({ error: 'Failed to update placeholder' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    await db.placeholder.delete({
      where: { id }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting placeholder:', error);
    return NextResponse.json({ error: 'Failed to delete placeholder' }, { status: 500 });
  }
}
