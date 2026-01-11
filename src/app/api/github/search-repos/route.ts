import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, projectType, techStack = [] } = body;

    // Get GitHub token from config
    const config = await db.systemConfig.findFirst();

    if (!config?.githubToken) {
      return NextResponse.json(
        { error: 'GitHub token not configured' },
        { status: 400 }
      );
    }

    // Build search keywords based on project type and description
    const keywords = extractKeywords(query, projectType, techStack);

    const allRepos: any[] = [];

    // Search GitHub for each keyword
    for (const keyword of keywords) {
      try {
        const searchResponse = await fetch(
          `https://api.github.com/search/repositories?q=${encodeURIComponent(keyword)}&sort=stars&order=desc&per_page=5`,
          {
            headers: {
              'Authorization': `Bearer ${config.githubToken}`,
              'Accept': 'application/vnd.github.v3+json'
            }
          }
        );

        if (searchResponse.ok) {
          const searchData = await searchResponse.json();
          if (searchData.items) {
            allRepos.push(...searchData.items);
          }
        }
      } catch (error) {
        console.error(`Error searching for keyword "${keyword}":`, error);
      }
    }

    // Remove duplicates and calculate relevance
    const uniqueRepos = removeDuplicates(allRepos);
    const reposWithRelevance = calculateRelevance(uniqueRepos, keywords, techStack, projectType);

    // Save relevant repos to database
    const user = await db.user.findFirst({
      where: { onboardingCompleted: true }
    });

    if (user) {
      // Create project specification if not exists
      const projectSpec = await db.projectSpecification.findFirst({
        where: { userId: user.id }
      });

      if (projectSpec) {
        // Clear old repos and save new ones
        await db.relevantRepo.deleteMany({
          where: { projectId: projectSpec.id }
        });

        for (const repo of reposWithRelevance.slice(0, 20)) {
          await db.relevantRepo.create({
            data: {
              projectId: projectSpec.id,
              repoName: repo.name,
              repoUrl: repo.html_url,
              owner: repo.owner.login,
              description: repo.description,
              stars: repo.stargazers_count,
              language: repo.language,
              topics: JSON.stringify(repo.topics || []),
              relevanceScore: repo.relevanceScore
            }
          });
        }
      }
    }

    return NextResponse.json({
      repos: reposWithRelevance.slice(0, 20),
      total: reposWithRelevance.length
    });

  } catch (error: any) {
    console.error('GitHub search error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to search repositories' },
      { status: 500 }
    );
  }
}

function extractKeywords(query: string, projectType: string, techStack: string[]): string[] {
  const keywords: string[] = [];

  // Add tech stack keywords
  keywords.push(...techStack);

  // Add project-specific keywords
  const projectKeywords: Record<string, string[]> = {
    'quantum-os': ['quantum computing', 'quantum simulation', 'quantum circuits', 'Qiskit', 'quantum algorithms', 'quantum machine learning', 'ibm quantum', 'quantum development'],
    'book-writer': ['writing assistant', 'book generation', 'AI writing', 'text generation', 'editor', 'markdown', 'document processing', 'content creation'],
    'ai-chatbot': ['chatbot', 'AI assistant', 'conversational AI', 'LLM', 'language model', 'chat interface', 'RAG'],
    'e-commerce': ['ecommerce', 'shopify', 'stripe', 'payment', 'inventory', 'product catalog', 'shopping cart'],
    'dashboard': ['analytics', 'dashboard', 'charts', 'visualization', 'data visualization', 'metrics', 'reporting'],
    'custom': []
  };

  keywords.push(...(projectKeywords[projectType] || []));

  // Extract keywords from description
  const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  keywords.push(...words.slice(0, 5));

  // Add general keywords for Next.js/Fullstack
  keywords.push('nextjs', 'fullstack', 'typescript', 'react', 'tailwind', 'prisma');

  return [...new Set(keywords)].filter(k => k.length > 0);
}

function removeDuplicates(repos: any[]): any[] {
  const seen = new Set();
  return repos.filter(repo => {
    const key = repo.id;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function calculateRelevance(repos: any[], keywords: string[], techStack: string[], projectType: string): any[] {
  return repos.map(repo => {
    let score = 0;

    const repoName = repo.name?.toLowerCase() || '';
    const description = repo.description?.toLowerCase() || '';
    const language = repo.language?.toLowerCase() || '';
    const topics = (repo.topics || []).map((t: string) => t.toLowerCase());

    // Tech stack match (highest weight)
    techStack.forEach(tech => {
      const techLower = tech.toLowerCase();
      if (repoName.includes(techLower)) score += 0.3;
      if (description.includes(techLower)) score += 0.2;
      if (language === techLower) score += 0.25;
      if (topics.some(t => t.includes(techLower))) score += 0.15;
    });

    // Keyword match
    keywords.forEach(keyword => {
      const keywordLower = keyword.toLowerCase();
      if (repoName.includes(keywordLower)) score += 0.1;
      if (description.includes(keywordLower)) score += 0.08;
    });

    // Star count (normalized)
    score += Math.min(repo.stargazers_count / 10000, 0.2);

    // Recent activity (updated within 6 months)
    const lastUpdated = new Date(repo.updated_at);
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    if (lastUpdated > sixMonthsAgo) {
      score += 0.1;
    }

    // Cap score at 1.0
    score = Math.min(score, 1.0);

    return {
      ...repo,
      relevanceScore: score
    };
  }).sort((a, b) => b.relevanceScore - a.relevanceScore);
}
