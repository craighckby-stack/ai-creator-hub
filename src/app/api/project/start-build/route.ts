import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectType, projectDescription, techStack, instructions } = body;

    // Get user
    const user = await db.user.findFirst({
      where: { onboardingCompleted: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 400 }
      );
    }

    // Create project specification
    await db.projectSpecification.upsert({
      where: { id: user.id },
      create: {
        userId: user.id,
        projectType,
        projectDescription,
        techStack,
        status: 'building'
      },
      update: {
        status: 'building'
      }
    });

    // Save full build instructions
    const phases = ['setup', 'frontend', 'backend', 'integration', 'testing', 'deployment'];

    for (const phase of phases) {
      await db.buildInstructions.upsert({
        where: { id: `${user.id}-${phase}` },
        create: {
          projectId: user.id,
          content: extractPhase(instructions, phase),
          phase,
          completed: false
        },
        update: {
          content: extractPhase(instructions, phase),
          completed: false
        }
      });
    }

    // Create initial placeholders based on project
    await createProjectPlaceholders(user.id, projectType, techStack);

    // Log to system
    await db.systemLog.create({
      data: {
        message: `🚀 Starting build for ${projectType} project`,
        type: 'info',
        timestamp: new Date()
      }
    });

    await db.systemLog.create({
      data: {
        message: `📋 Build instructions generated. Ready to begin implementation.`,
        type: 'success',
        timestamp: new Date()
      }
    });

    // Commit build instructions to GitHub repository
    const config = await db.systemConfig.findFirst();
    if (config?.githubRepo) {
      await commitToGitHub(config.githubToken, user.githubUsername || '', config.githubRepo, instructions);
    }

    return NextResponse.json({
      success: true,
      message: 'Build started successfully',
      projectId: user.id
    });

  } catch (error: any) {
    console.error('Start build error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to start build' },
      { status: 500 }
    );
  }
}

function extractPhase(instructions: string, phase: string): string {
  const phasePatterns: Record<string, RegExp> = {
    setup: /##\s*[1-9][\s.]*[Pp]roject\s+[Ss]etup|(?:^|\n)##\s*[Ss]etup/,
    frontend: /##\s*[1-9][\s.]*[Ff]rontend\s*[Ii]mplementation|(?:^|\n)##\s*[Ff]rontend/,
    backend: /##\s*[1-9][\s.]*[Bb]ackend\s*[Ii]mplementation|(?:^|\n)##\s*[Bb]ackend/,
    integration: /##\s*[1-9][\s.]*[Aa][Ii]\s*[Ii]ntegration|(?:^|\n)##\s*[Ii]ntegration/,
    testing: /##\s*[1-9][\s.]*[Tt]esting\s*[Ss]trategy|(?:^|\n)##\s*[Tt]esting/,
    deployment: /##\s*[1-9][\s.]*[Dd]eployment|(?:^|\n)##\s*[Dd]eployment/
  };

  const pattern = phasePatterns[phase];
  if (!pattern) return '';

  const match = instructions.match(pattern);
  if (!match) return '';

  const startIndex = match.index || 0;
  const nextMatch = instructions.slice(startIndex + 1).match(/^##\s/m);
  const endIndex = nextMatch ? startIndex + 1 + (nextMatch.index || 0) : instructions.length;

  return instructions.slice(startIndex, endIndex);
}

async function commitToGitHub(token: string, owner: string, repo: string, content: string) {
  try {
    const path = 'BUILD_INSTRUCTIONS.md';
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
    const contentBase64 = Buffer.from(content).toString('base64');

    // Get file's SHA if it exists
    const getResponse = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (getResponse.ok) {
      const fileData = await getResponse.json();
      // Update file
      await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: 'Update build instructions',
          content: contentBase64,
          sha: fileData.sha
        })
      });
    } else {
      // Create file
      await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: 'Add build instructions',
          content: contentBase64
        })
      });
    }
  } catch (error) {
    console.error('Error committing to GitHub:', error);
  }
}

async function createProjectPlaceholders(userId: string, projectType: string, techStackStr: string) {
  const techStack = JSON.parse(techStackStr || '[]');

  const basePlaceholders = [
    { externalId: 'project-setup', name: 'Project Setup', description: 'Initialize Next.js project with dependencies', completed: false, dependencies: [] },
    { externalId: 'database-setup', name: 'Database Setup', description: 'Configure Prisma and create schema', completed: false, dependencies: ['project-setup'] },
    { externalId: 'ui-components', name: 'UI Components', description: 'Set up shadcn/ui components', completed: false, dependencies: ['project-setup'] }
  ];

  // Add project-specific placeholders
  if (projectType === 'quantum-os') {
    basePlaceholders.push(
      { externalId: 'quantum-simulation', name: 'Quantum Circuit Simulation', description: 'Implement quantum circuit simulation with IBM Qiskit', completed: false, dependencies: ['database-setup', 'ui-components'] },
      { externalId: 'quantum-visualizer', name: 'Quantum Circuit Visualizer', description: 'Create visual interface for quantum circuits', completed: false, dependencies: ['quantum-simulation'] }
    );
  } else if (projectType === 'book-writer') {
    basePlaceholders.push(
      { externalId: 'ai-writing-engine', name: 'AI Writing Engine', description: 'Integrate LLM for content generation', completed: false, dependencies: ['database-setup', 'ui-components'] },
      { externalId: 'document-editor', name: 'Document Editor', description: 'Build markdown document editor', completed: false, dependencies: ['ui-components'] },
      { externalId: 'export-system', name: 'Export System', description: 'Add PDF, DOCX export capabilities', completed: false, dependencies: ['document-editor'] }
    );
  } else if (projectType === 'ai-chatbot') {
    basePlaceholders.push(
      { externalId: 'chat-interface', name: 'Chat Interface', description: 'Build conversational UI', completed: false, dependencies: ['ui-components'] },
      { externalId: 'llm-integration', name: 'LLM Integration', description: 'Integrate language model for responses', completed: false, dependencies: ['chat-interface', 'database-setup'] },
      { externalId: 'rag-system', name: 'RAG System', description: 'Implement retrieval-augmented generation', completed: false, dependencies: ['llm-integration'] }
    );
  }

  // Add tech stack specific placeholders
  if (techStack.includes('TypeScript')) {
    basePlaceholders.push(
      { externalId: 'typescript-config', name: 'TypeScript Configuration', description: 'Configure strict TypeScript types', completed: false, dependencies: ['project-setup'] }
    );
  }

  if (techStack.includes('Prisma') || techStack.includes('prisma')) {
    basePlaceholders.push(
      { externalId: 'prisma-migrations', name: 'Prisma Migrations', description: 'Create and run database migrations', completed: false, dependencies: ['database-setup'] }
    );
  }

  for (const placeholder of basePlaceholders) {
    await db.placeholder.upsert({
      where: { externalId: placeholder.externalId },
      create: {
        externalId: placeholder.externalId,
        name: placeholder.name,
        description: placeholder.description,
        completed: placeholder.completed,
        dependencies: JSON.stringify(placeholder.dependencies)
      },
      update: {}
    });
  }
}
