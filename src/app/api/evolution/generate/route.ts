import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import ZAI from 'z-ai-web-dev-sdk';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { currentCycle } = body;

    // Get current placeholders for context
    const placeholders = await db.placeholder.findMany({
      orderBy: { createdAt: 'asc' }
    });

    // Get config for Gemini API key
    const config = await db.systemConfig.findFirst();

    if (!config || !config.geminiApiKey) {
      return NextResponse.json(
        { error: 'Gemini API Key not configured' },
        { status: 400 }
      );
    }

    // Create system prompt for feature generation
    const systemPrompt = `You are a software architect designing the next evolution of a fullstack application.
Your task is to analyze the current state and suggest the next logical feature to implement.
Return your response as a JSON object with the following structure:
{
  "id": "feature-unique-id",
  "name": "Feature Name (concise)",
  "description": "Brief description of what this feature does",
  "dependencies": ["existing-feature-id-or-empty-array"]
}

Rules:
1. Suggest features that build upon existing completed features
2. Dependencies should reference the externalId of existing features
3. Keep names concise but descriptive
4. Only suggest features that are technically feasible`;

    const userPrompt = `Current evolution cycle: ${currentCycle}
Current features (completed/total): ${placeholders.filter(p => p.completed).length}/${placeholders.length}

Existing features:
${placeholders.map(p => `- ${p.externalId}: ${p.name} (${p.completed ? 'completed' : 'pending'})`).join('\n')}

Completed features:
${placeholders.filter(p => p.completed).map(p => p.externalId).join(', ')}

Suggest the next feature to implement. Return only a JSON object.`;

    // Use LLM to generate next feature
    const zai = await ZAI.create();

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

    const response = completion.choices[0]?.message?.content;

    if (!response) {
      throw new Error('No response from LLM');
    }

    // Parse the JSON response
    let nextFeature;
    try {
      // Try to extract JSON from the response (in case there's additional text)
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        nextFeature = JSON.parse(jsonMatch[0]);
      } else {
        nextFeature = JSON.parse(response);
      }
    } catch (e) {
      console.error('Failed to parse LLM response:', response);
      // Fallback to a default feature
      nextFeature = {
        id: `feature-${currentCycle}`,
        name: 'Advanced Search & Data Filtering',
        description: 'Implement advanced search with filtering capabilities',
        dependencies: ['crud-feature']
      };
    }

    return NextResponse.json(nextFeature);
  } catch (error) {
    console.error('Error generating next feature:', error);

    // Return a fallback feature
    return NextResponse.json({
      id: `feature-${Date.now()}`,
      name: 'Advanced Search & Data Filtering',
      description: 'Implement advanced search with filtering capabilities',
      dependencies: ['crud-feature']
    });
  }
}
