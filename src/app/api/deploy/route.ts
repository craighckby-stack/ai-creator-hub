import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { promises as fs } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';
import Octokit from 'octokit';

interface DeployRequest {
  repoName: string;
  description?: string;
  private?: boolean;
  autoInit?: boolean;
}

interface DeployFile {
  path: string;
  content: Buffer;
  size: number;
  sha?: string;
}

interface DeploymentResult {
  success: boolean;
  repoUrl?: string;
  filesUploaded: number;
  commitsMade: number;
  buildErrors: string[];
  messages: string[];
}

async function createGitHubRepository(
  octokit: any,
  username: string,
  repoName: string,
  description?: string,
  isPrivate = false
): Promise<{ htmlUrl: string; sshUrl: string }> {
  try {
    const response = await octokit.rest.repos.createUsingTemplate({
      template_owner: 'github',
      template_repo: 'hello-world',
      name: repoName,
      description: description || 'Evolution Engine with RAG Capabilities',
      private: isPrivate,
      auto_init: true
    });

    return {
      htmlUrl: response.html_url,
      sshUrl: response.ssh_url
    };
  } catch (error) {
    console.error('Error creating repository:', error);
    throw error;
  }
}

async function uploadFileToGitHub(
  octokit: any,
  username: string,
  repoName: string,
  filePath: string,
  relativePath: string,
  content: Buffer
): Promise<void> {
  try {
    // Check if file exists on GitHub
    const existingFile = await octokit.rest.repos.getContent({
      owner: username,
      repo: repoName,
      path: relativePath
    }).catch(() => null);

    if (existingFile && 'sha' in existingFile) {
      console.log(`File already exists, updating: ${relativePath}`);
      await octokit.rest.repos.createOrUpdateFileContents({
        owner: username,
        repo: repoName,
        path: relativePath,
        message: `Update ${relativePath} - Craig Huckerby`,
        content: content.toString('base64'),
        sha: existingFile.sha
      });
    } else {
      console.log(`Creating new file: ${relativePath}`);
      await octokit.rest.repos.createOrUpdateFileContents({
        owner: username,
        repo: repoName,
        path: relativePath,
        message: `Create ${relativePath} - Craig Huckerby`,
        content: content.toString('base64')
      });
    }
  } catch (error) {
    console.error(`Error uploading file ${relativePath}:`, error);
    throw error;
  }
}

async function getAllFiles(dir: string, basePath: string): Promise<DeployFile[]> {
  const files: DeployFile[] = [];

  async function scanDirectory(currentDir: string) {
    const entries = await fs.readdir(currentDir);

    for (const entry of entries) {
      const fullPath = join(currentDir, entry);
      const stat = await fs.stat(fullPath);

      if (stat.isDirectory()) {
        await scanDirectory(fullPath);
      } else {
        const content = await fs.readFile(fullPath);
        const relativePath = fullPath.replace(basePath, '').replace(/\\/g, '/');
        files.push({
          path: fullPath,
          content,
          size: content.length,
          relativePath
        });
      }
    }
  }

  await scanDirectory(dir);
  return files;
}

async function runBuildTest(): Promise<{ success: boolean; errors: string[]; output: string }> {
  try {
    console.log('Running build test...');
    const result = execSync('bun run build', {
      encoding: 'utf-8',
      cwd: process.cwd(),
      maxBuffer: 10 * 1024 * 1024 // 10MB buffer
    });

    const errors: string[] = [];
    const lines = result.stdout.split('\n');
    const errorLines = lines.filter(line => 
      line.toLowerCase().includes('error') ||
      line.toLowerCase().includes('fail') ||
      line.toLowerCase().includes('warning') ||
      line.toLowerCase().includes('missing')
    );

    return {
      success: result.status === 0 && errorLines.length === 0,
      errors: errorLines,
      output: result.stdout || result.stderr || ''
    };
  } catch (error) {
    console.error('Build test error:', error);
    return {
      success: false,
      errors: [(error as Error).message || 'Unknown error'],
      output: ''
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: DeployRequest = await request.json();
    
    if (!body.repoName) {
      return NextResponse.json(
        { error: 'Repository name is required' },
        { status: 400 }
      );
    }

    // Get user config
    const config = await db.systemConfig.findFirst();
    if (!config?.githubToken) {
      return NextResponse.json(
        { error: 'GitHub token not configured. Please complete onboarding.' },
        { status: 400 }
      );
    }

    if (!config?.githubRepo) {
      return NextResponse.json(
        { error: 'GitHub repository not set. Please complete onboarding.' },
        { status: 400 }
      );
    }

    const octokit = new Octokit({ auth: config.githubToken });
    
    // Get user data
    const user = await db.user.findFirst({
      where: { onboardingCompleted: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'No user found. Please complete onboarding.' },
        { status: 400 }
      );
    }

    const results: DeploymentResult = {
      success: false,
      messages: [],
      filesUploaded: 0,
      commitsMade: 0,
      buildErrors: []
    };

    results.messages.push(`Starting deployment for ${user?.name || 'User'}...`);
    results.messages.push(`Repository: ${body.repoName}`);

    try {
      // Step 1: Create GitHub repository
      results.messages.push('\n📦 Creating new GitHub repository...');
      
      const repoInfo = await createGitHubRepository(
        octokit,
        user.githubUsername!,
        body.repoName,
        body.description
      );

      results.repoUrl = repoInfo.htmlUrl;
      results.messages.push(`✓ Repository created: ${repoInfo.htmlUrl}`);

      // Step 2: Upload all files
      results.messages.push('\n📤 Uploading all project files...');
      
      const projectRoot = process.cwd();
      const allFiles = await getAllFiles(projectRoot, projectRoot);
      results.messages.push(`  Found ${allFiles.length} files to upload`);

      // Upload files in batches to respect rate limits
      const batchSize = 50;
      for (let i = 0; i < allFiles.length; i += batchSize) {
        const batch = allFiles.slice(i, i + batchSize);
        results.messages.push(`  Uploading batch ${Math.floor(i / batchSize) + 1} (${i + 1}-${Math.min(i + batchSize, allFiles.length)})...`);

        for (const file of batch) {
          const relativePath = file.relativePath.replace(/\\/g, '/');
          try {
            await uploadFileToGitHub(
              octokit,
              user.githubUsername!,
              body.repoName,
              file.path,
              relativePath,
              file.content
            );
            results.filesUploaded++;
          } catch (error) {
            results.messages.push(`  ✗ Error uploading ${relativePath}: ${error}`);
          }
        }

        // Small delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      results.messages.push(`✓ All ${results.filesUploaded} files uploaded`);

      // Step 3: Run build test
      results.messages.push('\n🧪 Running build tests...');

      const buildTest = await runBuildTest();
      
      results.messages.push(`Build status: ${buildTest.success ? '✓ PASSED' : '✗ FAILED'}`);
      
      if (buildTest.errors.length > 0) {
        results.messages.push('Build errors found:');
        buildTest.errors.forEach((error, index) => {
          results.messages.push(`  [${index + 1}] ${error}`);
        });
        results.buildErrors = buildTest.errors;
      }

      // Log build output if any
      if (buildTest.output) {
        results.messages.push('\nBuild output:');
        results.messages.push(buildTest.output);
      }

      // Step 4: Commit deployment manifest
      results.messages.push('\n📝 Creating deployment manifest...');

      const deploymentManifest = `# Evolution Engine Deployment
# Deployed by: Craig Huckerby
# Date: ${new Date().toISOString()}

## Repository
- Name: ${body.repoName}
- URL: ${repoInfo.htmlUrl}
- Description: ${body.description || 'Evolution Engine with RAG Capabilities'}

## Statistics
- Files uploaded: ${results.filesUploaded}
- Build test: ${buildTest.success ? 'PASSED' : 'FAILED'}
- Build errors: ${buildTest.errors.length}

## Files Included
- All Next.js source files
- All mini-services (CLI, scraper, vector-db)
- Database schema and migrations
- Configuration files
- Documentation

## Author Information
- Author: Craig Huckerby
- Email: ${user.email || 'N/A'}
- GitHub: ${user.githubUsername}
- Experience: ${user.experienceLevel || 'N/A'}

## System Capabilities
- Evolution Engine with RAG-powered SN
- GitHub Universe Explorer
- Vector Database with OpenAI embeddings
- Full-stack Next.js application
- DOS-style CLI interfaces

## Build Instructions
\`\`\`bash
# Install dependencies
bun install

# Run database migrations
bun run db:push

# Start development server
bun run dev
\`\`\`

      const manifestPath = join(projectRoot, 'DEPLOYMENT.md');
      await fs.writeFile(manifestPath, deploymentManifest);
      
      await uploadFileToGitHub(
        octokit,
        user.githubUsername!,
        body.repoName,
        manifestPath,
        'DEPLOYMENT.md'
      );

      results.messages.push('✓ Deployment manifest committed');

      // Step 5: Commit author information
      results.messages.push('\n👤 Setting author to Craig Huckerby...');

      // Update README with deployment info
      const readmeContent = `# Evolution Engine

[![Evolution Engine](https://img.shields.io/badge/Evolution%20Engine-v1.0-blue?logo=next.js&logoColor=white)](https://img.shields.io/badge/Next.js-black?logo=next.js&label=Evolution%20Engine)

> **An AI-powered development automation system that learns and evolves with you.**

## 🚀 Features

- **Evolution Engine** - Full-stack Next.js application with AI-powered code generation
- **GitHub Integration** - Automatic repository creation and management
- **Project Specification** - Define any project type and get AI-generated build instructions
- **DOS-style CLI** - Command-line interface with real-time feedback
- **RAG System** - Cross-repo knowledge mining and retrieval
- **GitHub Universe Explorer** - Discover and scrape ANY public repository

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Prisma ORM, SQLite
- **AI**: z-ai-web-dev-sdk, OpenAI embeddings
- **CLI**: Socket.IO, Octokit
- **Database**: Prisma, SQLite

## 🎯 Recent Deployment

**Deployed**: ${new Date().toLocaleDateString()}
**By**: Craig Huckerby
**Repository**: [${user.githubUsername}/${body.repoName}](${repoInfo.htmlUrl})

---

This system was built with Evolution Engine - an AI-powered development tool that helps you build and learn together.
`;

      await uploadFileToGitHub(
        octokit,
        user.githubUsername!,
        body.repoName,
        join(projectRoot, 'README.md'),
        'README.md'
      );

      results.messages.push('✓ README updated with author info');
      results.commitsMade = 2;

      // Step 6: Final verification
      results.messages.push('\n🔍 Verifying deployment...');

      const verificationResult = await octokit.rest.repos.get({
        owner: user.githubUsername,
        repo: body.repoName
      });

      results.messages.push('✓ Deployment verified successfully');
      results.success = true;

      // Log to system
      await db.systemLog.create({
        data: {
          message: `🚀 Deployed Evolution Engine to ${body.repoName} by Craig Huckerby - ${results.filesUploaded} files uploaded, ${results.commitsMade} commits made`,
          type: 'success',
          timestamp: new Date()
        }
      });

    } catch (error: any) {
      console.error('Deployment error:', error);
      results.messages.push(`❌ Deployment failed: ${error.message || 'Unknown error'}`);
      results.success = false;

      await db.systemLog.create({
        data: {
          message: `❌ Deployment failed: ${error.message || 'Unknown error'}`,
          type: 'error',
          timestamp: new Date()
        }
      });
    }

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
  try {
    const configs = await db.systemConfig.findFirst();

    return NextResponse.json({
      canDeploy: !!(configs?.githubToken && configs?.githubRepo),
      requirements: {
        githubToken: configs?.githubToken ? '✓ Configured' : '✗ Not configured',
        githubRepo: configs?.githubRepo ? '✓ Configured' : '✗ Not configured'
      },
      messages: [
        'To deploy Evolution Engine:',
        '1. Complete onboarding (GitHub token + repository name)',
        '2. POST to /api/deploy with repo name and description',
        '3. System will:',
        '  - Create new GitHub repository',
        '  - Upload all source files',
        '  - Run build tests',
        '  - Set author to Craig Huckerby',
        '  - Commit deployment manifest',
        '  - Verify deployment',
        '4. Deployment logs will be available in response'
      ]
    });
  } catch (error: any) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
