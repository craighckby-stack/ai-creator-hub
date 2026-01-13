import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { randomUUID } from 'crypto';

export async function POST(req: Request) {
  try {
    const { currentCycle } = await req.json();

    const featureNames = [
      'Real-time Chat System',
      'Dashboard Analytics',
      'User Profile Management',
      'Notification System',
      'Search Functionality',
      'File Upload System',
      'API Rate Limiting',
      'Email Integration',
      'OAuth Authentication',
      'Dark Mode Theme',
    ];

    const descriptions = [
      'Implement WebSocket-based real-time chat with user presence and typing indicators.',
      'Create comprehensive dashboard with charts, metrics, and data visualization.',
      'Build user profile system with avatar upload, bio, and preferences.',
      'Implement notification system with in-app alerts and push notifications.',
      'Add advanced search with filters, sorting, and full-text search capabilities.',
      'Create secure file upload system with drag-and-drop and progress tracking.',
      'Add API rate limiting to prevent abuse and ensure fair usage.',
      'Integrate email service for notifications and transactional emails.',
      'Implement OAuth 2.0 authentication with Google, GitHub, and Microsoft.',
      'Add dark mode theme toggle with system preference detection.',
    ];

    const randomIndex = Math.floor(Math.random() * featureNames.length);

    const placeholder = await db.placeholder.create({
      data: {
        externalId: `FEAT-${randomUUID().slice(0, 8).toUpperCase()}`,
        name: featureNames[randomIndex],
        description: descriptions[randomIndex],
        completed: false,
        dependencies: [],
      },
    });

    return NextResponse.json({
      ...placeholder,
      dependencies: JSON.parse(placeholder.dependencies),
    });
  } catch (error) {
    console.error('Generate error:', error);
    return NextResponse.json({ error: 'Failed to generate feature' }, { status: 500 });
  }
}
