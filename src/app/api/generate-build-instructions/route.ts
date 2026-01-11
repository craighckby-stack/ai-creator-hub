import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import ZAI from 'z-ai-web-dev-sdk';
import { writeFile } from 'fs/promises';
import { join } from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const projectType = formData.get('projectType') as string;
    const projectDescription = formData.get('projectDescription') as string;
    const techStack = formData.get('techStack') as string;
    const files = formData.getAll('files') as File[];

    // Get user
    const user = await db.user.findFirst({
      where: { onboardingCompleted: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found. Please complete onboarding.' },
        { status: 400 }
      );
    }

    // Get GitHub token
    const config = await db.systemConfig.findFirst();
    if (!config?.githubToken) {
      return NextResponse.json(
        { error: 'GitHub token not configured' },
        { status: 400 }
      );
    }

    // Create/update project specification
    const projectSpec = await db.projectSpecification.upsert({
      where: { id: user.id },
      create: {
        userId: user.id,
        projectType,
        projectDescription,
        requirements: JSON.stringify([]),
        techStack: JSON.stringify(techStack.split(',').map(s => s.trim()).filter(s => s)),
        status: 'generating'
      },
      update: {
        projectType,
        projectDescription,
        techStack: JSON.stringify(techStack.split(',').map(s => s.trim()).filter(s => s)),
        status: 'generating'
      }
    });

    // Save uploaded files
    const uploadsDir = join(process.cwd(), 'uploads', projectSpec.id);
    const uploadedFiles: any[] = [];

    for (const file of files) {
      if (file.size > 0) {
        const fileName = `${Date.now()}-${file.name}`;
        const filePath = join(uploadsDir, fileName);

        await writeFile(filePath, Buffer.from(await file.arrayBuffer()));

        const fileType = file.name.split('.').pop() || 'unknown';

        const uploadedFile = await db.uploadedFile.create({
          data: {
            projectId: projectSpec.id,
            fileName: file.name,
            fileType,
            fileSize: file.size,
            filePath,
            description: `Uploaded by user during project specification`
          }
        });

        uploadedFiles.push({
          name: file.name,
          type: fileType,
          size: file.size
        });
      }
    }

    // Get relevant repos
    const relevantRepos = await db.relevantRepo.findMany({
      where: { projectId: projectSpec.id },
      orderBy: { relevanceScore: 'desc' },
      take: 10
    });

    // Generate build instructions using LLM
    const instructions = await generateBuildInstructions(
      projectType,
      projectDescription,
      techStack,
      relevantRepos,
      uploadedFiles
    );

    // Save build instructions
    await db.buildInstructions.upsert({
      where: { id: projectSpec.id },
      create: {
        projectId: projectSpec.id,
        content: instructions,
        phase: 'setup',
        completed: false
      },
      update: { content: instructions }
    });

    // Update project status
    await db.projectSpecification.update({
      where: { id: projectSpec.id },
      data: { status: 'ready' }
    });

    return NextResponse.json({
      instructions,
      projectId: projectSpec.id,
      filesUploaded: uploadedFiles.length,
      reposFound: relevantRepos.length
    });

  } catch (error: any) {
    console.error('Build instructions generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate build instructions' },
      { status: 500 }
    );
  }
}

async function generateBuildInstructions(
  projectType: string,
  projectDescription: string,
  techStack: string,
  relevantRepos: any[],
  uploadedFiles: any[]
): Promise<string> {
  const zai = await ZAI.create();

  const techStackArray = techStack.split(',').map(s => s.trim()).filter(s => s);

  const repoReferences = relevantRepos.slice(0, 5).map(repo =>
    `- ${repo.repoName} by ${repo.owner} (${repo.stars} stars, ${repo.language}): ${repo.repoUrl}`
  ).join('\n');

  const fileReferences = uploadedFiles.map(file =>
    `- ${file.name} (${(file.size / 1024).toFixed(2)} KB, ${file.type})`
  ).join('\n');

  const systemPrompt = `You are an expert software architect and fullstack developer specializing in building applications with z.ai SDK and Next.js 15.
Your task is to generate comprehensive build instructions for a fullstack application.
Use the z.ai SDK skills where applicable: LLM, VLM, TTS, ASR, Image Generation, Video Generation, Web Search, Web Reader, PDF, PPTX, DOCX, XLSX.
Instructions should be practical, detailed, and follow best practices.
Format your response as a Markdown document with clear sections.`;

  const userPrompt = `# Project Specification

## Project Type: ${projectType}
${projectDescription}

## Technology Stack
${techStackArray.length > 0 ? techStackArray.map(t => `- ${t}`).join('\n') : 'To be determined by AI based on requirements'}

## Relevant GitHub Repositories
${relevantRepos.length > 0 ? repoReferences : 'No repositories found'}

## User Uploaded Files
${uploadedFiles.length > 0 ? fileReferences : 'No files uploaded'}

---

# Task

Generate a comprehensive guide to build this fullstack application using:
- **Next.js 15** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** and **shadcn/ui** for styling
- **Prisma ORM** with SQLite for database
- **z-ai-web-dev-sdk** for AI capabilities

Your guide should include:

## 1. Project Architecture
- Overall system architecture
- Key components and their responsibilities
- Data flow between components
- AI integration points (which z.ai skills to use where)

## 2. Database Schema
- Prisma schema design
- Models and relationships
- Database indices if needed

## 3. Backend Implementation
- API routes structure
- Server-side logic
- AI SDK integration points
- Database operations
- Authentication/authorization if needed

## 4. Frontend Implementation
- Page structure
- Component hierarchy
- UI/UX considerations
- State management approach
- API integration

## 5. AI Integration Details
- Which z.ai skills to use (LLM, VLM, TTS, ASR, Image Generation, Video Generation, Web Search, Web Reader, PDF, PPTX, DOCX, XLSX)
- Where and how to integrate each skill
- Example code snippets for AI integration
- Best practices for using z-ai SDK

## 6. Implementation Steps (Detailed)
- Step-by-step guide to build the application
- Code examples for each step
- Order of implementation
- Dependencies between steps

## 7. Testing Strategy
- Unit testing approach
- Integration testing
- E2E testing
- Testing AI components

## 8. Deployment
- Build process
- Deployment considerations
- Environment configuration
- Post-deployment setup

## 9. References from GitHub Repos
- How to leverage relevant repos
- Which patterns to adopt
- Code snippets or concepts to reuse

Please provide specific, actionable code examples and clear explanations.
Focus on production-ready code following best practices.
Reference the uploaded files and relevant repositories where applicable.`;

  try {
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

    return completion.choices[0]?.message?.content || 'Failed to generate instructions';
  } catch (error) {
    console.error('LLM generation error:', error);

    // Fallback to template if LLM fails
    return generateFallbackInstructions(projectType, projectDescription, techStackArray);
  }
}

function generateFallbackInstructions(projectType: string, description: string, techStack: string[]): string {
  return `# Build Instructions: ${projectType.charAt(0).toUpperCase() + projectType.slice(1)}

## Project Overview
${description}

## Technology Stack
${techStack.length > 0 ? techStack.map(t => `- ${t}`).join('\n') : '- Next.js 15\n- TypeScript\n- Tailwind CSS\n- shadcn/ui\n- Prisma ORM\n- z-ai-web-dev-sdk'}

## 1. Project Setup

\`\`\`bash
# Create new Next.js project
npx create-next-app@latest my-project --typescript --tailwind --eslint
cd my-project

# Install dependencies
bun add prisma @prisma/client z-ai-web-dev-sdk
bun add -D prisma

# Initialize shadcn/ui
npx shadcn@latest init
\`\`\`

## 2. Database Schema

Create \`prisma/schema.prisma\`:

\`\`\`prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
}
\`\`\`

Push schema to database:

\`\`\`bash
bun run db:push
\`\`\`

## 3. AI Integration

Use z-ai-web-dev-sdk for AI capabilities:

\`\`\`typescript
import ZAI from 'z-ai-web-dev-sdk';

async function useAI() {
  const zai = await ZAI.create();

  // Text generation
  const completion = await zai.chat.completions.create({
    messages: [{ role: 'user', content: 'Hello!' }]
  });

  // Image generation
  const image = await zai.image.generate({ prompt: 'A beautiful landscape' });

  // Text to speech
  const audio = await zai.tts.synthesize({ text: 'Hello world' });

  return completion.choices[0]?.message?.content;
}
\`\`\`

## 4. Implementation Steps

1. **Set up project structure**
2. **Configure database with Prisma**
3. **Create API routes**
4. **Build UI components with shadcn/ui**
5. **Integrate z-ai SDK for AI features**
6. **Add authentication if needed**
7. **Test all features**
8. **Deploy application**

## 5. Deployment

\`\`\`bash
# Build for production
bun run build

# Start production server
bun run start
\`\`\`

---

*Note: This is a basic template. For detailed, project-specific instructions, ensure your Gemini API key is configured correctly.*
`;
}
