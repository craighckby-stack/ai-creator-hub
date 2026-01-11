import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Create or update scraped repository
    const repo = await db.scrapedRepository.upsert({
      where: { full_name: body.full_name },
      create: {
        full_name: body.full_name,
        name: body.name,
        description: body.description,
        language: body.language,
        stars: body.stars,
        forks: body.forks,
        url: body.url,
        owner: body.owner,
        readme: body.readme,
        file_count: 0,
        commit_count: 0,
        issue_count: 0,
        branch_count: 0,
        scraped_at: new Date(),
        is_processed: false
      },
      update: {
        file_count: body.file_count || 0,
        commit_count: body.commit_count || 0,
        issue_count: body.issue_count || 0,
        branch_count: body.branch_count || 0
      }
    });
    
    // Save files
    if (body.files && Array.isArray(body.files)) {
      for (const file of body.files) {
        await db.scrapedFile.create({
          data: {
            repo_id: repo.id,
            name: file.name,
            path: file.path,
            size: file.size,
            type: file.type,
            language: file.language,
            content: file.content || null,
            scraped_at: new Date(),
            is_embedded: false
          }
        });
      }
    }
    
    // Save commits
    if (body.commits && Array.isArray(body.commits)) {
      for (const commit of body.commits) {
        await db.scrapedCommit.create({
          data: {
            repo_id: repo.id,
            sha: commit.sha,
            message: commit.message,
            date: commit.date,
            author: commit.author,
            scraped_at: new Date()
          }
        });
      }
    }
    
    // Save issues
    if (body.issues && Array.isArray(body.issues)) {
      for (const issue of body.issues) {
        await db.scrapedIssue.create({
          data: {
            repo_id: repo.id,
            number: issue.number,
            title: issue.title,
            body: issue.body,
            labels: JSON.stringify(issue.labels || []),
            created_at: issue.created_at,
            scraped_at: new Date()
          }
        });
      }
    }
    
    // Log to system
    await db.systemLog.create({
      data: {
        message: `📂 Scraped repository: ${body.name} (${body.file_count || 0} files, ${body.commits?.length || 0} commits)`,
        type: 'info',
        timestamp: new Date()
      }
    });
    
    return NextResponse.json({
      success: true,
      repoId: repo.id,
      message: 'Repository data saved successfully'
    });
    
  } catch (error: any) {
    console.error('Error saving scraped repository:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save scraped repository' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const repos = await db.scrapedRepository.findMany({
      orderBy: { scraped_at: 'desc' },
      take: 50
    });
    
    return NextResponse.json({
      repos,
      total: repos.length
    });
  } catch (error: any) {
    console.error('Error fetching scraped repositories:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch scraped repositories' },
      { status: 500 }
    );
  }
}
