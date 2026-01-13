import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(req: Request) {
  try {
    const { codebasePath } = await req.json();

    const files = await fs.readdir(codebasePath, { recursive: true });
    const sourceFiles = files.filter((f: string) =>
      f.endsWith('.ts') || f.endsWith('.tsx') || f.endsWith('.js') || f.endsWith('.jsx')
    );

    const improvements = [
      {
        id: '1',
        title: 'Add Input Validation',
        description: 'Implement proper input validation on all API endpoints to prevent injection attacks.',
        impact: 'High' as const,
      },
      {
        id: '2',
        title: 'Optimize Database Queries',
        description: 'Add proper indexing to frequently queried fields and implement query caching.',
        impact: 'Medium' as const,
      },
      {
        id: '3',
        title: 'Improve Error Handling',
        description: 'Centralize error handling and implement proper logging for debugging.',
        impact: 'Medium' as const,
      },
    ];

    const analysis = {
      scores: {
        security: 75,
        performance: 68,
        cleanCode: 72,
      },
      improvements,
      fileCount: sourceFiles.length,
    };

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error('System Analysis Error:', error);
    return NextResponse.json({ error: 'Failed to analyze system' }, { status: 500 });
  }
}
