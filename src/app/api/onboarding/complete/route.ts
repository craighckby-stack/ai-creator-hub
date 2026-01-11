import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      company,
      role,
      experienceLevel,
      githubUsername,
      githubToken,
      repoName,
      consentAccepted
    } = body;

    // Validate required fields
    if (!name || !email || !githubUsername || !githubToken || !repoName || !consentAccepted) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create or update user
    const user = await db.user.upsert({
      where: { email },
      create: {
        email,
        name,
        company: company || null,
        role: role || null,
        experienceLevel,
        consentAccepted,
        consentVersion: '1.0',
        onboardingCompleted: true,
        githubUsername
      },
      update: {
        name,
        company: company || null,
        role: role || null,
        experienceLevel,
        consentAccepted,
        onboardingCompleted: true,
        githubUsername
      }
    });

    // Create GitHub repository record
    const githubRepo = await db.gitHubRepository.create({
      data: {
        userId: user.id,
        repoName,
        description: `Evolution Engine Learning Repository for ${name}`,
        isPrivate: false,
        status: 'creating'
      }
    });

    // Update system config with GitHub token and repo info
    const existingConfig = await db.systemConfig.findFirst();

    if (existingConfig) {
      await db.systemConfig.update({
        where: { id: existingConfig.id },
        data: {
          githubToken,
          githubRepo: repoName
        }
      });
    } else {
      await db.systemConfig.create({
        data: {
          githubToken,
          githubRepo: repoName,
          evolutionCycle: 1
        }
      });
    }

    // Create GitHub repository asynchronously
    let repoCreated = false;
    let repoUrl = '';
    let githubRepoId = '';

    try {
      const createRepoResponse = await fetch('https://api.github.com/user/repos', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: repoName,
          description: 'Evolution Engine Learning Repository - AI and human learning together',
          private: false,
          auto_init: true,
          gitignore_template: 'node',
          license_template: 'mit'
        })
      });

      if (createRepoResponse.ok) {
        const repoData = await createRepoResponse.json();
        repoUrl = repoData.html_url;
        githubRepoId = String(repoData.id);
        repoCreated = true;

        // Update GitHub repository record
        await db.gitHubRepository.update({
          where: { id: githubRepo.id },
          data: {
            repoUrl,
            status: 'created',
            githubRepoId
          }
        });

        // Create initial files in the repository
        await initializeRepositoryContent(githubToken, repoName, user);
      } else {
        const errorData = await createRepoResponse.json();
        throw new Error(errorData.message || 'Failed to create GitHub repository');
      }
    } catch (error: any) {
      console.error('GitHub repository creation error:', error);
      await db.gitHubRepository.update({
        where: { id: githubRepo.id },
        data: { status: 'failed' }
      });
    }

    // Create initial system log
    await db.systemLog.create({
      data: {
        message: `🚀 Onboarding completed for ${name}. Repository ${repoName} ${repoCreated ? 'created successfully' : 'creation failed'}`,
        type: repoCreated ? 'success' : 'error',
        timestamp: new Date()
      }
    });

    // Create initial placeholders based on user experience level
    await createInitialPlaceholders(user.id, experienceLevel);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      },
      repository: {
        id: githubRepo.id,
        name: repoName,
        url: repoUrl,
        status: repoCreated ? 'created' : 'failed'
      }
    });

  } catch (error: any) {
    console.error('Onboarding error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to complete onboarding' },
      { status: 500 }
    );
  }
}

async function initializeRepositoryContent(token: string, repoName: string, user: any) {
  const owner = user.githubUsername;

  try {
    // Create README.md
    const readmeContent = `# Evolution Engine Learning Repository

This repository represents the learning journey of **${user.name}** with Evolution Engine.

## 🤖 About Evolution Engine

Evolution Engine is an AI-powered system that learns and evolves alongside developers.
Together, humans and AI build better software through intelligent automation.

## 📊 Learning Progress

- **Started**: ${new Date().toISOString().split('T')[0]}
- **Experience Level**: ${user.experienceLevel}
- **Current Cycle**: 1

## 📝 What You'll Find Here

- AI-generated code and components
- Evolution history and learning milestones
- System logs and performance metrics
- Your collaborative work with AI

## 🎯 Learning Together

This repository is a living record of how AI and humans can work together
to create amazing software. Every commit tells a story of learning, improvement,
and evolution.

---

*Generated by Evolution Engine*
`;

    await createFileInRepo(token, owner, repoName, 'README.md', readmeContent, 'Initial commit: Evolution Engine setup');

    // Create LEARNING.md
    const learningContent = `# Learning Journey

This document tracks the learning evolution of both the user and the AI system.

## Milestones

### Cycle 1
- Repository created
- Onboarding completed
- Initial placeholders defined

## Achievements

*Your achievements will be tracked here as you progress.*

---

*Last updated: ${new Date().toISOString()}*
`;

    await createFileInRepo(token, owner, repoName, 'LEARNING.md', learningContent, 'Add learning journey documentation');

  } catch (error) {
    console.error('Error initializing repository content:', error);
  }
}

async function createFileInRepo(token: string, owner: string, repo: string, path: string, content: string, message: string) {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

  // Get the file's SHA (if it exists)
  const getFileResponse = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json'
    }
  });

  const contentBase64 = Buffer.from(content).toString('base64');

  if (getFileResponse.ok) {
    const fileData = await getFileResponse.json();
    // File exists, update it
    await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message,
        content: contentBase64,
        sha: fileData.sha
      })
    });
  } else {
    // File doesn't exist, create it
    await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message,
        content: contentBase64
      })
    });
  }
}

async function createInitialPlaceholders(userId: string, experienceLevel: string) {
  const basePlaceholders = [
    { externalId: 'auth-layer', name: 'User Authentication', description: 'Implement authentication system', completed: false, dependencies: [] },
    { externalId: 'db-schema', name: 'Database Schema Design', description: 'Create database models and relationships', completed: false, dependencies: [] },
    { externalId: 'ui-kit', name: 'UI Components Setup', description: 'Set up basic UI components', completed: false, dependencies: [] }
  ];

  // Add additional placeholders based on experience level
  if (experienceLevel === 'beginner') {
    basePlaceholders.push(
      { externalId: 'basic-crud', name: 'Basic CRUD Operations', description: 'Create simple create, read, update, delete operations', completed: false, dependencies: ['db-schema', 'ui-kit'] },
      { externalId: 'form-validation', name: 'Form Validation', description: 'Add form validation and error handling', completed: false, dependencies: ['ui-kit'] }
    );
  } else if (experienceLevel === 'intermediate') {
    basePlaceholders.push(
      { externalId: 'advanced-crud', name: 'Advanced CRUD with Filters', description: 'Implement CRUD with advanced filtering and pagination', completed: false, dependencies: ['db-schema', 'ui-kit'] },
      { externalId: 'api-integration', name: 'External API Integration', description: 'Integrate with external APIs and services', completed: false, dependencies: ['auth-layer'] }
    );
  } else {
    basePlaceholders.push(
      { externalId: 'full-stack-architecture', name: 'Full Stack Architecture', description: 'Implement complete frontend and backend architecture', completed: false, dependencies: [] },
      { externalId: 'performance-optimization', name: 'Performance Optimization', description: 'Optimize application performance and caching', completed: false, dependencies: ['db-schema'] },
      { externalId: 'advanced-features', name: 'Advanced Features', description: 'Implement advanced features like real-time updates, websockets', completed: false, dependencies: ['auth-layer', 'ui-kit'] }
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
