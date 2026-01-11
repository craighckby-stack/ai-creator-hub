import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.repoName) {
      return NextResponse.json(
        { error: 'Repository name is required' },
        { status: 400 }
      );
    }

    const results = {
      success: false,
      repoUrl: body.repoName,
      messages: ['Deployment API endpoint - Use git commands directly for deployment']
    };

    return NextResponse.json(results);

  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    canDeploy: false,
    message: 'Use git commands for deployment. See DEPLOYMENT.md for instructions.',
    instructions: [
      '1. git init',
      '2. git add -A',
      '3. git commit -m "Initial deployment by Craig Huckerby"',
      '4. git remote add origin https://github.com/YOUR_USERNAME/evolution-engine-rag.git',
      '5. git branch -M main',
      '6. git push -u origin main'
    ]
  });
}
