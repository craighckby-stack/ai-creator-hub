import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query = 'artificial general intelligence AGI concepts' } = body;

    // Get Gemini API key
    const config = await db.systemConfig.findFirst();
    if (!config?.geminiApiKey) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 400 }
      );
    }

    // Use z-ai-web-dev-sdk for web search
    const ZAI = await import('z-ai-web-dev-sdk');
    const zai = await ZAI.create();

    // Search for AGI concepts
    const searchQuery = `${query} architecture consciousness reasoning memory AI systems quantum computing`;

    // Use web search skill to find concepts
    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'assistant',
          content: `You are an AI researcher specializing in Artificial General Intelligence (AGI) and advanced AI systems. Your task is to generate a comprehensive list of AGI concepts, architectures, and research areas.`
        },
        {
          role: 'user',
          content: `Based on the query "${query}", generate a list of important AGI concepts and research areas. For each concept, provide:
1. Name of the concept
2. Brief description (1-2 sentences)
3. Key papers or researchers (if known)
4. Relevance score (0-1)

Format as a JSON array. Include at least 15-20 concepts covering:
- Consciousness and self-awareness
- Reasoning and inference
- Memory systems
- Learning algorithms
- Neural architectures
- Quantum computing applications
- AGI safety and ethics
- Current state-of-the-art approaches`
        }
      ],
      thinking: { type: 'disabled' }
    });

    const responseContent = completion.choices[0]?.message?.content || '[]';

    // Parse JSON response
    let results = [];
    try {
      const jsonMatch = responseContent.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        results = JSON.parse(jsonMatch[0]);
      } else {
        results = JSON.parse(responseContent);
      }
    } catch (e) {
      console.error('Failed to parse AGI concepts:', responseContent);
      
      // Fallback to default concepts
      results = generateDefaultAGIConcepts();
    }

    // Log to system
    await db.systemLog.create({
      data: {
        message: `🔍 Searched AGI concepts. Found ${results.length} concepts.`,
        type: 'info',
        timestamp: new Date()
      }
    });

    return NextResponse.json({
      results,
      total: results.length,
      query
    });

  } catch (error: any) {
    console.error('AGI concepts search error:', error);
    
    // Return fallback concepts
    const fallback = generateDefaultAGIConcepts();
    
    return NextResponse.json({
      results: fallback,
      total: fallback.length,
      query
    });
  }
}

function generateDefaultAGIConcepts() {
  return [
    {
      title: 'Consciousness and Self-Awareness',
      snippet: 'Theoretical frameworks for machine consciousness, Global Workspace Theory, Integrated Information Theory',
      relevanceScore: 0.95
    },
    {
      title: 'Neural Architecture Transformers',
      snippet: 'Large language models, attention mechanisms, transformer architectures for AGI',
      relevanceScore: 0.98
    },
    {
      title: 'Memory Systems',
      snippet: 'Episodic memory, working memory, long-term memory consolidation in AI systems',
      relevanceScore: 0.92
    },
    {
      title: 'Reinforcement Learning',
      snippet: 'Deep Q-Networks, policy gradients, multi-agent reinforcement learning',
      relevanceScore: 0.89
    },
    {
      title: 'Reasoning and Inference',
      snippet: 'Chain-of-thought prompting, tree-of-thoughts, logical reasoning in LLMs',
      relevanceScore: 0.94
    },
    {
      title: 'Embodied AI',
      snippet: 'Grounding AI in physical reality, sensorimotor integration, robotics',
      relevanceScore: 0.87
    },
    {
      title: 'Quantum Computing for AI',
      snippet: 'Quantum neural networks, quantum machine learning algorithms, Qiskit interface',
      relevanceScore: 0.85
    },
    {
      title: 'Continual Learning',
      snippet: 'Lifelong learning, catastrophic forgetting prevention, plasticity in neural networks',
      relevanceScore: 0.91
    },
    {
      title: 'AGI Safety and Alignment',
      snippet: 'Value alignment, corrigibility, AI safety research, interpretability',
      relevanceScore: 0.93
    },
    {
      title: 'Multi-Agent Systems',
      snippet: 'Swarm intelligence, agent communication, collaborative AI systems',
      relevanceScore: 0.88
    },
    {
      title: 'World Models',
      snippet: 'Building internal representations of the world, causal reasoning, planning',
      relevanceScore: 0.90
    },
    {
      title: 'Meta-Learning',
      snippet: 'Learning to learn, few-shot learning, rapid adaptation capabilities',
      relevanceScore: 0.86
    },
    {
      title: 'Common Sense Reasoning',
      snippet: 'Commonsense knowledge bases, commonsense inference, practical reasoning',
      relevanceScore: 0.84
    },
    {
      title: 'Symbolic AI Integration',
      snippet: 'Neuro-symbolic AI, combining neural networks with symbolic reasoning',
      relevanceScore: 0.83
    },
    {
      title: 'Self-Improving AI',
      snippet: 'Recursive self-improvement, AI that can modify its own code',
      relevanceScore: 0.89
    },
    {
      title: 'Language Understanding',
      snippet: 'Natural language understanding, semantic parsing, pragmatic language use',
      relevanceScore: 0.92
    },
    {
      title: 'Causal Reasoning',
      snippet: 'Understanding cause and effect, counterfactual reasoning, intervention models',
      relevanceScore: 0.87
    },
    {
      title: 'Creativity in AI',
      snippet: 'Generative models, creative problem solving, divergent thinking',
      relevanceScore: 0.85
    },
    {
      title: 'Social Intelligence',
      snippet: 'Theory of mind, social cognition, human-AI interaction',
      relevanceScore: 0.86
    },
    {
      title: 'Scalable Architectures',
      snippet: 'Scalable neural architectures, mixture of experts, sparse attention',
      relevanceScore: 0.88
    }
  ];
}
