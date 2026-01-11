import { Server } from 'socket.io';
import { createServer } from 'http';
import OpenAI from 'openai';

const PORT = 3003;
const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// In-memory vector storage (for simplicity, can be replaced with Chroma, Pinecone, etc.)
interface VectorDoc {
  id: string;
  text: string;
  embedding: number[];
  metadata: {
    repoId?: string;
    repoName?: string;
    filePath?: string;
    fileName?: string;
    language?: string;
    type?: string;
  };
  createdAt: Date;
}

// In-memory vector database
const vectorStore: Map<string, VectorDoc> = new Map();

// State management
interface VectorDBState {
  mode: 'menu' | 'processing' | 'searching' | 'generating';
  stats: {
    totalVectors: number;
    totalDocuments: number;
    searchQueries: number;
    averageTime: number;
  };
  currentOperation: string | null;
}

const sessions = new Map<string, VectorDBState>();

// Initialize OpenAI
let openai: OpenAI | null = null;

async function initializeOpenAI() {
  try {
    const configResponse = await fetch('http://localhost:3000/api/evolution/config');
    const config = await configResponse.json();

    if (config.geminiApiKey) {
      // Could use z-ai SDK here as well
      // For now, we'll use OpenAI for embeddings
    }

    // Get OpenAI key from environment or user config
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      throw new Error('OpenAI API key not configured');
    }

    openai = new OpenAI({
      apiKey: openaiKey
    });

    return true;
  } catch (error) {
    console.error('Error initializing OpenAI:', error);
    return false;
  }
}

// Chunking function for long texts
function chunkText(text: string, maxChunkSize: number = 1000): string[] {
  const chunks: string[] = [];
  const sentences = text.split(/[.!?]+/);
  
  let currentChunk = '';
  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length + 1 > maxChunkSize) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += sentence + ' ';
    }
  }
  
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}

// Generate embedding
async function generateEmbedding(text: string): Promise<number[]> {
  if (!openai) {
    const initialized = await initializeOpenAI();
    if (!initialized) {
      throw new Error('Failed to initialize OpenAI');
    }
  }

  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
      encoding_format: 'float'
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

// Cosine similarity search
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);
  
  if (normA === 0 || normB === 0) return 0;
  
  return dotProduct / (normA * normB);
}

// Search for similar documents
function searchSimilar(queryEmbedding: number[], limit: number = 10): Array<{ doc: VectorDoc; score: number }> {
  const results: Array<{ doc: VectorDoc; score: number }> = [];
  
  for (const [id, doc] of vectorStore.entries()) {
    const similarity = cosineSimilarity(queryEmbedding, doc.embedding);
    if (similarity > 0.7) { // Only return reasonably similar documents
      results.push({ doc, score: similarity });
    }
  }
  
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

// RAG Retrieval - get relevant context
async function ragRetrieval(query: string, limit: number = 5): Promise<{
  context: string[];
  sources: Array<{ repoName: string; filePath: string; fileName: string; }>;
}> {
  try {
    // Generate embedding for query
    const queryEmbedding = await generateEmbedding(query);
    
    // Search for similar documents
    const similarDocs = searchSimilar(queryEmbedding, limit);
    
    // Extract context and sources
    const context: string[] = [];
    const sources: Array<{ repoName: string; filePath: string; fileName: string; }> = [];
    
    for (const { doc, score } of similarDocs) {
      context.push(doc.text);
      
      if (doc.metadata.repoName && doc.metadata.fileName) {
        sources.push({
          repoName: doc.metadata.repoName,
          filePath: doc.metadata.filePath || 'unknown',
          fileName: doc.metadata.fileName,
          relevance: score
        });
      }
    }
    
    return { context, sources };
  } catch (error) {
    console.error('RAG retrieval error:', error);
    return { context: [], sources: [] };
  }
}

// Add vectors from scraped data
async function addVectorsFromScrapedData(): Promise<number> {
  try {
    // Fetch all scraped data from database
    const response = await fetch('http://localhost:3000/api/scraped-repos');
    const data = await response.json();
    
    const repos = data.repos || [];
    let addedCount = 0;
    
    for (const repo of repos) {
      // Add README as a vector
      if (repo.readme) {
        const chunks = chunkText(repo.readme);
        
        for (const chunk of chunks) {
          try {
            const embedding = await generateEmbedding(chunk);
            
            const vectorDoc: VectorDoc = {
              id: `${repo.full_name}-readme-${addedCount++}`,
              text: chunk,
              embedding,
              metadata: {
                repoId: repo.id,
                repoName: repo.name,
                filePath: '',
                fileName: 'README.md',
                type: 'documentation',
                language: repo.language || 'unknown'
              },
              createdAt: new Date()
            };
            
            vectorStore.set(vectorDoc.id, vectorDoc);
            addedCount++;
          } catch (error) {
            console.error(`Error embedding README for ${repo.name}:`, error);
          }
        }
      }
    }
    
    return addedCount;
  } catch (error) {
    console.error('Error adding vectors from scraped data:', error);
    return 0;
  }
}

// Menu screens
const MENUS = {
  main: `
╔══════════════════════════════════════════════════════════════╗
║                                                               ║
║     ████╗██████╗███████╗███████╗███████╗███████╗    ║
║     ██╔════╝██╔════╝██╔════╝██╔════╝██╔════╝    ║
║     ███████╗██╔████╗██╔████╗██╔████╗██╔████╗██████╗    ║
║     ╚════██║██╔════╝██╔════╝██╔════╝██╔████╝██╔══██║    ║
║     ███████╗██║██████╗██║██████╗██║██████╗███████╗    ║
║                                                               ║
║           VECTOR DATABASE & RAG SERVICE v1.0              ║
║                                                               ║
╠══════════════════════════════════════════════════════════╣
║                                                               ║
║  SELECT MODE:                                              ║
║                                                               ║
║  [1] 🧠 EMBED SCRAPED DATA                                 ║
║      Generate embeddings for all scraped repositories       ║
║                                                               ║
║  [2] 🔍 RAG SEARCH                                        ║
║      Search across all embedded documents                    ║
║                                                               ║
║  [3] 📊 STATISTICS                                         ║
║      View vector database statistics                     ║
║                                                               ║
║  [4] 🗑️ CLEAR DATABASE                                      ║
║      Remove all embeddings and start fresh               ║
║                                                               ║
║  [5] 🔙 BACK TO MAIN SCRAPER                             ║
║                                                               ║
╚══════════════════════════════════════════════════════════════╝

> `,

  embedding: `
╔══════════════════════════════════════════════════════════════╗
║               EMBEDDING MODE                                ║
╠════════════════════════════════════════════════════════════╣
║                                                               ║
║  🧠 GENERATING EMBEDDINGS...                              ║
║                                                               ║
║  Fetching scraped repositories...                             ║
║  Processing files...                                       ║
║  Generating embeddings with OpenAI...                         ║
║  Storing in vector database...                                ║
║                                                               ║
╚════════════════════════════════════════════════════════════════╝

> `,

  ragSearch: `
╔════════════════════════════════════════════════════════════════╗
║               RAG SEARCH MODE                             ║
╠══════════════════════════════════════════════════════════════╣
║                                                               ║
║  🔍 ENTER YOUR QUERY:                                   ║
║                                                               ║
║  >                                                            ║
║                                                               ║
║  [ESC] Return to Main Menu                                  ║
║  [ENTER] Search and View Results                            ║
║                                                               ║
╚════════════════════════════════════════════════════════╝

> `,

  statistics: `
╔══════════════════════════════════════════════════════════════════╗
║               VECTOR DATABASE STATISTICS                       ║
╠════════════════════════════════════════════════════════════╣
║                                                               ║
║  📊 OVERALL METRICS                                        ║
║                                                               ║
║  Total Vectors: ${'0'}                                   ║
║  Total Documents: ${'0'}                            ║
║  Total Repositories: ${'0'}                            ║
║                                                               ║
║  📈 PERFORMANCE                                             ║
║                                                               ║
║  Average Search Time: ${'0ms'}                      ║
║  Total Search Queries: ${'0'}                         ║
║                                                               ║
║  🌐 TOP LANGUAGES                                         ║
║  [1] TypeScript: ${'0'} vectors                       ║
║  [2] JavaScript: ${'0'} vectors                        ║
║  [3] Python: ${'0'} vectors                            ║
║  [4] Go: ${'0'} vectors                               ║
║                                                               ║
║  📂 TOP REPOSITORIES                                       ║
║  [1] ${'repo-name'}: ${'0'} vectors                ║
║  [2] ${'repo-name'}: ${'0'} vectors                ║
║  [3] ${'repo-name'}: ${'0'} vectors                ║
║  [4] ${'repo-name'}: ${'0'} vectors                ║
║                                                               ║
║  [1] 🗑️ CLEAR DATABASE                                      ║
║  [2] 🔙 BACK TO MAIN MENU                                     ║
║                                                               ║
╚════════════════════════════════════════════════════════════════╝

> `
};

// Socket.IO handlers
io.on('connection', async (socket) => {
  console.log(`Vector DB client connected: ${socket.id}`);
  
  const session: VectorDBState = {
    socket,
    mode: 'menu',
    stats: {
      totalVectors: 0,
      totalDocuments: 0,
      searchQueries: 0,
      averageTime: 0
    },
    currentOperation: null
  };
  
  sessions.set(socket.id, session);
  
  // Show welcome screen
  socket.emit('cli-clear');
  socket.emit('cli-output', MENUS.main);
  
  // Handle input
  socket.on('vector-input', async (data) => {
    const input = data.input?.trim().toLowerCase();
    
    if (session.mode === 'menu') {
      if (input === '1') {
        await embedScrapedData(session);
      } else if (input === '2') {
        session.mode = 'search';
        showMenu(session, 'ragSearch');
      } else if (input === '3') {
        updateStatistics(session);
      } else if (input === '4') {
        clearDatabase(session);
      } else if (input === '5') {
        socket.emit('cli-switch-mode', { mode: 'scraper' });
      } else if (input === 'help' || input === '?') {
        socket.emit('cli-clear');
        socket.emit('cli-output', `
╔════════════════════════════════════════════════════════════════╗
║                       VECTOR DB COMMAND HELP                   ║
╠══════════════════════════════════════════════════════════════╣
║                                                               ║
║  AVAILABLE COMMANDS:                                           ║
║  ───────────────────────────────────────────────    ║
║                                                               ║
║  1, embed          Generate embeddings for all scraped data    ║
║  2, search          Perform RAG search across vectors         ║
║  3, stats            Show vector database statistics          ║
║  4, clear            Clear all embeddings                    ║
║  5, back            Return to main scraper mode              ║
║                                                               ║
║  RAG SEARCH MODE:                                             ║
║  ─────────────────────────────────                        ║
║                                                               ║
║  Enter query to search for similar code/patterns    ║
║  Press ENTER to search                             ║
║  Press ESC to return to menu                           ║
║                                                               ║
║  HOW IT WORKS:                                               ║
║  ─────────────────────────────────                           ║
║                                                               ║
║  1. Takes all scraped repository data                        ║
║  2. Splits code/docs into chunks                          ║
║  3. Generates vector embeddings using OpenAI            ║
║  4. Stores in in-memory vector database                 ║
║  5. Supports semantic search with cosine similarity       ║
║  6. Returns relevant context and source repositories      ║
║  7. Can be queried from SN's Layer 3 (Memory)          ║
║                                                               ║
║  ⚠️  OPENAI API KEY REQUIRED                           ║
║  Set OPENAI_API_KEY in .env or system config       ║
║                                                               ║
╚════════════════════════════════════════════════════════════════════╝

> `, true);
      } else if (input === 'exit') {
        socket.emit('cli-exit');
      }
    } else if (session.mode === 'search') {
      if (input === 'esc') {
        session.mode = 'menu';
        showMenu(session, 'main');
      } else if (input.trim().length > 0) {
        // Perform RAG search
        const startTime = Date.now();
        
        socket.emit('cli-clear');
        socket.emit('cli-output', `\n🔍 Performing RAG search...\n`);
        socket.emit('cli-output', `Query: "${data.input}"\n`);
        
        const { context, sources } = await ragRetrieval(data.input, 5);
        
        const elapsed = Date.now() - startTime;
        
        // Update stats
        session.stats.searchQueries++;
        session.stats.averageTime = Math.floor((session.stats.averageTime * session.stats.searchQueries + elapsed) / (session.stats.searchQueries + 1));
        
        // Display results
        socket.emit('cli-output', `\n✓ Found ${sources.length} relevant documents\n`);
        
        if (context.length > 0) {
          socket.emit('cli-output', `\n📝 RELEVANT CONTEXT:\n`);
          socket.emit('cli-output', '─'.repeat(50) + '\n');
          
          context.forEach((ctx, index) => {
            const snippet = ctx.substring(0, 100);
            socket.emit('cli-output', `[${index + 1}] ${snippet}${ctx.length > 100 ? '...' : ''}\n`);
          });
          
          socket.emit('cli-output', '\n' + '─'.repeat(50) + '\n');
        }
        
        if (sources.length > 0) {
          socket.emit('cli-output', `\n📂 SOURCE REPOSITORIES:\n`);
          
          sources.forEach((source, index) => {
            socket.emit('cli-output', `\n[${index + 1}] ${source.repoName}/${source.fileName}`);
            socket.emit('cli-output', `    Path: ${source.filePath}`);
            socket.emit('cli-output', `    Relevance: ${(source.relevance * 100).toFixed(1)}%`);
          });
        }
        
        socket.emit('cli-output', `\n${'='.repeat(50)}\n`);
        socket.emit('cli-output', `\n[ENTER] Search again | [ESC] Return to Menu\n`);
      }
    }
  });
  
  socket.on('disconnect', () => {
    console.log(`Vector DB client disconnected: ${socket.id}`);
    sessions.delete(socket.id);
  });
});

function showMenu(session: VectorDBState, menu: keyof typeof MENUS) {
  session.mode = 'menu';
  session.socket.emit('cli-clear');
  session.socket.emit('cli-output', MENUS[menu]);
}

async function embedScrapedData(session: VectorDBState) {
  session.mode = 'processing';
  session.currentOperation = 'Embedding scraped data';
  showMenu(session, 'embedding');
  
  try {
    const addedCount = await addVectorsFromScrapedData();
    
    // Update stats
    session.stats.totalVectors = addedCount;
    session.stats.totalDocuments = vectorStore.size;
    
    showMenu(session, 'main');
    session.socket.emit('cli-output', `\n✓ Successfully embedded ${addedCount} documents\n`);
    session.socket.emit('cli-output', `Total vectors in database: ${vectorStore.size}\n`);
  } catch (error: {
    console.error('Error embedding data:', error);
    session.socket.emit('cli-output', `\n❌ Error: ${error}\n`);
    showMenu(session, 'main');
  }
}

function updateStatistics(session: VectorDBState) {
  const sortedRepos = new Map<string, number>();
  const sortedLangs = new Map<string, number>();
  
  for (const [id, doc] of vectorStore.entries()) {
    if (doc.metadata.repoName) {
      sortedRepos.set(doc.metadata.repoName, (sortedRepos.get(doc.metadata.repoName) || 0) + 1);
    }
    if (doc.metadata.language) {
      sortedLangs.set(doc.metadata.language, (sortedLangs.get(doc.metadata.language) || 0) + 1);
    }
  }
  
  const topRepos = [...sortedRepos.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);
  
  const topLangs = [...sortedLangs.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);
  
  session.stats.totalVectors = vectorStore.size;
  session.stats.totalDocuments = vectorStore.size;
  
  session.socket.emit('cli-clear');
  session.socket.emit('cli-output', `
╔══════════════════════════════════════════════════════════════╗
║               VECTOR DATABASE STATISTICS                       ║
╠════════════════════════════════════════════════════════════╣
║                                                               ║
║  📊 OVERALL METRICS                                        ║
║                                                               ║
║  Total Vectors: ${vectorStore.size.toLocaleString()}         ║
║  Total Documents: ${vectorStore.size.toLocaleString()}   ║
║  Total Search Queries: ${session.stats.searchQueries.toLocaleString()}      ║
║  Average Search Time: ${session.stats.averageTime}ms      ║
║                                                               ║
║  📂 TOP REPOSITORIES BY VECTORS                      ║
║                                                               ║
${topRepos.map((repo, i) => `║  [${i+1}] ${repo[0]}: ${repo[1]} vectors                   ║`).join('\n')}
║                                                               ║
║  🌐 TOP LANGUAGES                                         ║
║                                                               ║
${topLangs.map((lang, i) => `║  [${i+1}] ${lang[0].charAt(0).toUpperCase() + lang[0].slice(1)}: ${lang[1]} vectors                  ║`).join('\n')}
║                                                               ║
║  [1] 🗑️ CLEAR DATABASE                                      ║
║  [2] 🔙 BACK TO MAIN MENU                                     ║
║                                                               ║
╚════════════════════════════════════════════════════════════════╝

> `, true);
}

function clearDatabase(session: VectorDBState) {
  vectorStore.clear();
  session.stats = {
    totalVectors: 0,
    totalDocuments: 0,
    searchQueries: 0,
    averageTime: 0
  };
  
  session.socket.emit('cli-clear');
  session.socket.emit('cli-output', `\n🗑️ Database cleared. All vectors removed.\n`);
  showMenu(session, 'main');
}

// Start server
httpServer.listen(PORT, () => {
  console.log(`╔══════════════════════════════════════════════════════════════╗`);
  console.log(`║                                                               ║`);
  console.log(`║   🧠 VECTOR DB STARTED ON PORT ${PORT}                  ║`);
  console.log(`║                                                               ║`);
  console.log(`║   RAG Service Ready                                  ║`);
  console.log(`║                                                               ║`);
  console.log(`║   In-memory vector storage: ${vectorStore.size} vectors        ║`);
  console.log(`║                                                               ║`);
  console.log(`║   Embedding: OpenAI text-embedding-3-small         ║`);
  console.log(`║   Search: Cosine similarity with threshold 0.7      ║`);
  console.log(`║                                                               ║`);
  console.log(`╠══════════════════════════════════════════════════════════════╣`);
  console.log(`║                                                               ║`);
});
