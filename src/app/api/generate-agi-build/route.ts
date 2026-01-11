import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // Get user
    const user = await db.user.findFirst({
      where: { onboardingCompleted: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found. Complete onboarding first.' },
        { status: 400 }
      );
    }

    // Get config and repos
    const config = await db.systemConfig.findFirst();
    const relevantRepos = await db.relevantRepo.findMany({
      where: { projectId: user.id },
      orderBy: { relevanceScore: 'desc' },
      take: 20
    });

    if (!config?.geminiApiKey) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 400 }
      );
    }

    // Use LLM to generate comprehensive AGI build instructions
    const ZAI = await import('z-ai-web-dev-sdk');
    const zai = await ZAI.create();

    const repoSummaries = relevantRepos.map(repo =>
      `• ${repo.repoName} (${repo.owner}): ${repo.description || 'No description'}\n  Stars: ${repo.stars}, Language: ${repo.language}, Relevance: ${(repo.relevanceScore * 100).toFixed(0)}%`
    ).join('\n');

    const systemPrompt = `You are an expert AI architect and systems engineer specializing in building Artificial General Intelligence (AGI) systems.
Your task is to create comprehensive build instructions for combining multiple GitHub repositories into a unified AGI system.
The instructions must be practical, detailed, and follow best practices for fullstack development with Next.js 15 and z-ai-web-dev-sdk.`;

    const userPrompt = `# AGI System Build Task

Create a comprehensive AGI system by aggregating and combining multiple relevant repositories.

## Available Repositories (${relevantRepos.length})
${repoSummaries}

## Your Task

Generate a detailed guide to build an AGI system that combines the best aspects of these repositories.

The guide should include:

## 1. AGI System Architecture
- Overall system architecture
- Core components and their responsibilities
- Integration points between repositories
- Data flow and communication patterns

## 2. Technology Stack
- Next.js 15 with App Router
- TypeScript for type safety
- Tailwind CSS and shadcn/ui for styling
- Prisma ORM with SQLite
- z-ai-web-dev-sdk for AI capabilities

## 3. Core AGI Modules

### 3.1 Consciousness Layer
- Self-awareness tracking
- Internal state management
- Emergence detection
- Implementation approach

### 3.2 Reasoning Engine
- Multi-step reasoning
- Chain-of-thought processing
- Logical inference
- Decision-making systems

### 3.3 Memory System
- Working memory (short-term)
- Long-term memory storage
- Episodic memory
- Memory consolidation algorithms

### 3.4 Learning Module
- Continual learning
- Experience collection
- Pattern recognition
- Self-improvement cycles

### 3.5 Security & Safety Layer
- Value alignment
- Safe behavior constraints
- Monitoring and oversight
- Emergency shutdown

### 3.6 Multi-Agent Coordination
- Agent architecture
- Communication protocols
- Task distribution
- Swarm intelligence

## 4. Implementation Steps (Detailed)

### Setup Phase
- Project initialization
- Dependency installation
- Database schema design
- Configuration setup

### Core Modules
- Step-by-step implementation for each module
- Code examples for key algorithms
- Integration points

### AI Integration
- z-ai-web-dev-sdk integration points
- LLM usage for reasoning
- VLM for perception
- Other skills usage (TTS, ASR, etc.)

### Frontend Development
- UI/UX design for AGI system
- Visualization of consciousness/reasoning
- Agent status dashboard
- Control interfaces

### Testing & Validation
- Unit tests for each module
- Integration tests
- AGI behavior tests
- Safety validation

### Deployment
- Build process
- Deployment strategy
- Monitoring setup
- Performance optimization

## 5. Repository Integration Guide

For each relevant repository:
- What to adopt/use
- What to modify/adapt
- How to integrate with the AGI system
- Code snippets where applicable

## 6. AGI Capabilities Checklist

- [ ] Self-awareness monitoring
- [ ] Complex reasoning
- [ ] Memory formation and retrieval
- [ ] Continual learning
- [ ] Multi-agent coordination
- [ ] Safe behavior
- [ ] Goal-directed behavior
- [ ] Adaptability
- [ ] Creativity

Provide specific, actionable code examples and clear explanations.
Focus on creating a working AGI system, not just theoretical concepts.
Reference the provided repositories and show how to use their code.

Return as a formatted Markdown document.`;

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'assistant',
          content: systemPrompt
        },
        {
          role: 'user',
          content: userPrompt
        }
      ],
      thinking: { type: 'disabled' }
    });

    const instructions = completion.choices[0]?.message?.content || '';

    // Save AGI build instructions
    await db.buildInstructions.upsert({
      where: { id: `${user.id}-agi` },
      create: {
        projectId: user.id,
        content: instructions,
        phase: 'agi',
        completed: false
      },
      update: { content: instructions }
    });

    // Create project specification for AGI
    await db.projectSpecification.upsert({
      where: { id: user.id },
      create: {
        userId: user.id,
        projectType: 'agi-system',
        projectDescription: 'Artificial General Intelligence system aggregating best practices from multiple repositories',
        requirements: JSON.stringify(['consciousness', 'reasoning', 'memory', 'learning', 'agents', 'safety']),
        techStack: JSON.stringify(['Next.js', 'TypeScript', 'Prisma', 'z-ai-web-dev-sdk', 'Python', 'TensorFlow']),
        status: 'ready'
      },
      update: {
        projectType: 'agi-system',
        projectDescription: 'Artificial General Intelligence system aggregating best practices from multiple repositories',
        requirements: JSON.stringify(['consciousness', 'reasoning', 'memory', 'learning', 'agents', 'safety']),
        techStack: JSON.stringify(['Next.js', 'TypeScript', 'Prisma', 'z-ai-web-dev-sdk', 'Python', 'TensorFlow']),
        status: 'ready'
      }
    });

    // Log to system
    await db.systemLog.create({
      data: {
        message: `🤖 AGI build instructions generated using ${relevantRepos.length} repositories`,
        type: 'success',
        timestamp: new Date()
      }
    });

    // Commit to GitHub
    if (config.githubRepo && user.githubUsername) {
      try {
        const commitSuccess = await commitAGIBuildToGitHub(
          config.githubToken,
          user.githubUsername,
          config.githubRepo,
          instructions,
          relevantRepos
        );
        
        await db.systemLog.create({
          data: {
            message: commitSuccess ? '📝 AGI build instructions committed to GitHub' : '⚠️ Failed to commit to GitHub',
            type: commitSuccess ? 'success' : 'error',
            timestamp: new Date()
          }
        });
      } catch (error) {
        console.error('GitHub commit error:', error);
      }
    }

    return NextResponse.json({
      success: true,
      instructions,
      projectId: user.id,
      reposUsed: relevantRepos.length
    });

  } catch (error: any) {
    console.error('AGI build generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate AGI build instructions' },
      { status: 500 }
    );
  }
}

async function commitAGIBuildToGitHub(
  token: string,
  owner: string,
  repo: string,
  instructions: string,
  repos: any[]
): Promise<boolean> {
  try {
    const path = 'AGI_BUILD_GUIDE.md';
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
    const contentBase64 = Buffer.from(instructions).toString('base64');

    const getResponse = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (getResponse.ok) {
      const fileData = await getResponse.json();
      await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: 'Add AGI build instructions',
          content: contentBase64,
          sha: fileData.sha
        })
      });
    } else {
      await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: 'Add AGI build instructions',
          content: contentBase64
        })
      });
    }

    // Also create a REPOS_USED.md file
    const reposContent = `# Repositories Used in AGI Build

${repos.map(repo =>
  `## ${repo.repoName}

- **URL**: ${repo.repoUrl}
- **Owner**: ${repo.owner}
- **Stars**: ${repo.stars}
- **Language**: ${repo.language}
- **Relevance**: ${(repo.relevanceScore * 100).toFixed(0)}%
- **Description**: ${repo.description || 'No description'}
`
).join('\n')}

*Generated by Evolution Engine AGI System*
`;

    const reposPath = 'REPOS_USED.md';
    const reposUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${reposPath}`;
    const reposBase64 = Buffer.from(reposContent).toString('base64');

    await fetch(reposUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'Add repositories used for AGI build',
        content: reposBase64
      })
    });

    return true;
  } catch (error) {
    console.error('Error committing AGI build to GitHub:', error);
    return false;
  }
}
