# Evolution Engine + RAG + GitHub Universe Explorer

## 🚀 Complete Deployment System

This is the complete Evolution Engine system with AI-powered RAG capabilities and universal GitHub scraping.

---

## 📦 System Architecture

```
┌─────────────────────────────────────────────┐
│                  Evolution Engine               │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│            DOS-style CLI (3001)        │
├─────────────────────────────────────────────┤
│  Main Command Interface               │
│  • Evolution Engine control             │
│  • GitHub integration                   │
│  • Project management                 │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│        GitHub Scraper (3002)            │
├─────────────────────────────────────────────┤
│  • Universal GitHub scraping              │
│  • Token-based authentication            │
│  • Batch processing (10 repos)         │
│  • Real-time progress bars            │
│  • Rate limit awareness                │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│        Vector Database (3003)           │
├─────────────────────────────────────────────┤
│  • In-memory vector storage            │
│  • OpenAI embeddings (text-3-small)   │
│  • Cosine similarity search           │
│  • RAG retrieval engine               │
│  • Real-time statistics                 │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│              Database (SQLite)            │
├─────────────────────────────────────────────┤
│  • User profiles                     │
│  • System config                      │
│  • Project specifications              │
│  • Scraped repositories               │
│  • RAG vectors                       │
│  • Evolution engine data              │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│              Next.js App (3000)           │
├─────────────────────────────────────────────┤
│  • Web interface                     │
│  • API routes (20+)                │
│  • React components                 │
│  • Socket.IO clients                 │
└─────────────────────────────────────────────┘
```

---

## 🎯 Services

### 1. DOS-Style CLI Interface (Port 3001)
- **Main CLI** - Commands: help, menu, clear, status, reset, exit
- **Configure Mode** - User profile, API keys, GitHub repo, tech stack
- **Search Mode** - AGI concepts, GitHub repos, user repos
- **Build Mode** - View instructions, start build, project status, reset
- **AGI Mode** - Find repos, aggregate, generate build, back
- **RAG Integration** - Connect to vector DB service

### 2. GitHub Universe Explorer (Port 3002) 🌌
- **Trending Repos** - Hot repos right now
- **Most Popular** - Legendary repos with most stars
- **Newly Created** - Fresh repos created recently
- **Advanced Search** - Filter by language, stars, topics, date range
- **Universal Scraper** - Scrape ANY public repository
- **Token Input System** - Enter GitHub token and start scraping
- **Progress Bars** - Real-time visual feedback `[████████░░░░░░░] 40%`
- **Batch Processing** - 10 repos at a time with rate limit awareness
- **"HUGE RAG" Mode** - Create massive knowledge base

**Scrapes:**
- README.md files
- Source code (up to 100 files per repo for deep scrape)
- Commit history (last 100 commits)
- Issues and discussions (paginated, all)
- All branches
- Detects file types and programming languages

**Statistics Dashboard:**
- Total repos scraped
- Files collected
- Commits indexed
- Issues processed
- Total stars and forks
- Top languages by usage
- Top topics discovered
- Scraper performance metrics
- Export capabilities

### 3. Vector Database Service (Port 3003) 🧠
- **In-memory vector storage** (can be upgraded to Chroma, Pinecone, etc.)
- **OpenAI text-embedding-3-small** for embeddings
- **Cosine similarity search** for finding relevant documents
- **Context extraction** from similar documents
- **Source repository tracking** - Know which repo contributed what
- **Chunking support** - Handle long texts (max 1000 chars)
- **Real-time statistics** - Vectors, documents, search queries, avg time
- **Multiple search modes** - Code, documentation, architecture, knowledge mining
- **Export functionality** - Save all data for offline analysis

**RAG Retrieval:**
1. Takes user query
2. Generates embedding using OpenAI
3. Searches vector database for similar documents
4. Returns relevant context and source repositories
5. Can be queried from SN's Layer 3 (Memory)

### 4. Evolution Engine Main App (Port 3000) 🎮
- **Onboarding System** - Multi-step flow with GitHub integration
- **Project Specification** - File upload, repo search, AI build instructions
- **System Reset** - Clear all data and start fresh
- **AGI System Builder** - Aggregate repos and generate AGI build guide
- **CLI Web Interface** - Terminal-style interface with Socket.IO
- **GitHub Integration** - Repository creation, file uploads, commit tracking
- **AI-Powered Features** - Feature generation using z-ai-web-dev-sdk
- **Dashboard UI** - Real-time metrics, system logs, build progress

### 5. Deployment System (NEW!) 🚀
- **Endpoint**: `POST /api/deploy`
- **Creates new GitHub repository**
- **Uploads ALL source files** (recursively)
- **Runs build tests** - `bun run build`
- **Sets author to "Craig Huckerby"** in commits
- **Creates deployment manifest** - Complete deployment log
- **Verifies deployment** - Checks repository creation
- **No build errors guarantee** - Tests before deployment

---

## 🗄️ Database Schema

### Core Models
- **User** - Profile, experience level, GitHub username
- **SystemConfig** - GitHub token, Gemini API key, repository settings
- **Placeholder** - Task/feature items with dependencies
- **SystemLog** - System events and messages
- **ImplementationResult** - Generated files and metadata

### Scraping Models
- **ScrapedRepository** - Repository metadata and statistics
- **ScrapedFile** - Individual code files with embedding status
- **ScrapedCommit** - Commit history tracking
- **ScrapedIssue** - Issues and discussions

### Project Models
- **ProjectSpecification** - Project type, description, requirements, tech stack
- **UploadedFile** - File metadata and storage
- **RelevantRepo** - GitHub repos with relevance scores
- **BuildInstructions** - AI-generated build instructions by phase

---

## 🚀 How to Deploy

### Option 1: API Deployment (Recommended)
```bash
# 1. Start all services
cd mini-services/cli-service && bun run dev &
cd mini-services/repo-scraper && bun run dev &
cd mini-services/vector-db && bun run dev &
cd .. && bun run dev

# 2. Deploy to new GitHub repository
curl -X POST http://localhost:3000/api/deploy \
  -H "Content-Type: application/json" \
  -d '{
    "repoName": "evolution-engine-rag",
    "description": "Evolution Engine with RAG capabilities and GitHub Universe Explorer"
  }'

# 3. System will:
# - Create new GitHub repository
# - Upload ALL source files
# - Run build tests
# - Set author to "Craig Huckerby"
# - Commit deployment manifest
# - Verify no build errors
```

### Option 2: Manual Deployment
```bash
# 1. Build the application
bun run build

# 2. Test for errors (should show no errors)
bun run test

# 3. Create new GitHub repository manually
# Name: evolution-engine-rag
# Description: Evolution Engine with RAG capabilities

# 4. Initialize git
git init
git add .
git commit -m "Initial deployment by Craig Huckerby"

# 5. Add remote and push
git remote add origin https://github.com/YOUR_USERNAME/evolution-engine-rag.git
git branch -M main
git push -u origin main

# Set author in package.json or git config
git config user.name "Craig Huckerby"
git config user.email "your-email@example.com"
```

---

## 📊 Deployment Checklist

Before deploying, verify:

- [ ] GitHub token configured in onboarding
- [ ] All dependencies installed (`bun install`)
- [ ] Database schema pushed (`bun run db:push`)
- [ ] Build passes without errors (`bun run build`)
- [ ] All tests pass (`bun run test`)
- [ ] Author information updated to "Craig Huckerby"
- [ ] README.md updated with deployment info
- [ ] No sensitive data in commits
- [ ] Environment variables properly set
- [ ] All mini-services can connect

---

## 🔍 Testing the Deployment

After deploying, test:

### 1. Repository Verification
```bash
# Clone the deployed repository
git clone https://github.com/YOUR_USERNAME/evolution-engine-rag.git
cd evolution-engine-rag

# Verify files exist
ls -la src/
ls -la mini-services/
ls -la prisma/

# Check README exists
cat README.md

# Check deployment manifest exists
cat DEPLOYMENT.md
```

### 2. Service Testing
```bash
# Test main app
curl http://localhost:3000/

# Test API endpoints
curl http://localhost:3000/api/evolution/config
curl http://localhost:3000/api/scraped-repos

# Test CLI services
curl -X POST http://localhost:3001/cli-service/input \
  -H "Content-Type: application/json" \
  -d '{"input": "help"}'
```

### 3. Build Testing
```bash
# Build and check for errors
bun run build

# Look for TypeScript errors
# Look for missing dependencies
# Check for ESLint warnings
# Verify all imports resolve
```

### 4. GitHub API Testing
```bash
# Test GitHub token
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://api.github.com/user

# Test repository creation (should show your new repo)
curl https://api.github.com/repos/YOUR_USERNAME/evolution-engine-rag

# Verify files were uploaded
curl https://raw.githubusercontent.com/YOUR_USERNAME/evolution-engine-rag/main/README.md
```

---

## 📈 Performance Expectations

### Repository Size
- **Source files**: ~500-1000 files (recursively scanned)
- **Total size**: ~10-50 MB (depending on dependencies)
- **Upload time**: 5-15 minutes (depending on network)

### GitHub Rate Limits
- **5000 requests/hour** - Standard GitHub limit
- **10 files/batch** - With small delays between batches
- **Estimated completion**: 20-100 files per batch
- **Rate limit awareness** - Pauses when limit approached

### Vector Database
- **In-memory storage** - Fast, but limited by RAM
- **Embedding API**: OpenAI (cost-based, $0.0001 per 1K tokens)
- **Document chunking**: Splits long texts into 1000-char chunks
- **Search speed**: <100ms for similarity search

### Scraper Performance
- **Small projects** (<10 repos): ~5-10 minutes
- **Medium projects** (10-50 repos): ~15-20 minutes  
- **Large projects** (50-100 repos): ~30-60 minutes
- **Huge projects** (100+ repos): ~1-3 hours

---

## 🎯 Author Attribution

**All code and deployments are attributed to:**

```
Author: Craig Huckerby
GitHub: craighckby-stack
Email: [Set in onboarding]
```

**All commits include proper author metadata:**

```
{
  "author": {
    "name": "Craig Huckerby",
    "email": "user-email@example.com",
    "github": "craighckby-stack"
  }
}
```

---

## 🚀 Deployment Commands

### Quick Deploy
```bash
# Deploy with default settings
curl -X POST http://localhost:3000/api/deploy \
  -H "Content-Type: application/json" \
  -d '{"repoName": "evolution-engine-rag"}'
```

### Deploy with Custom Settings
```bash
# Custom repository name and description
curl -X POST http://localhost:3000/api/deploy \
  -H "Content-Type: application/json" \
  -d '{
    "repoName": "my-evolution-engine",
    "description": "Custom Evolution Engine with RAG",
    "private": false
  }'
```

### Deploy with Auto-Init
```bash
# Create repo with GitHub actions enabled
curl -X POST http://localhost:3000/api/deploy \
  -H "Content-Type: application/json" \
  -d '{
    "repoName": "evolution-engine-auto",
    "autoInit": true
  }'
```

---

## 📝 Post-Deployment Verification

After deployment, verify:

1. ✅ **Repository exists** on GitHub
2. ✅ **All files uploaded** (check file count in DEPLOYMENT.md)
3. ✅ **README.md** contains correct info
4. ✅ **Author set** to "Craig Huckerby" (check git log)
5. ✅ **No build errors** (check deployment manifest)
6. ✅ **Deployment manifest** committed with author info
7. ✅ **All services** connect and run correctly

---

## 🔧 Troubleshooting

### Deployment Fails
```bash
# Check GitHub token is valid
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://api.github.com/user

# Verify token has proper scopes (repo, workflow)
# Check token isn't expired
```

### Build Errors
```bash
# Check TypeScript compilation
bun run build

# Check for type errors
# Verify all dependencies resolve

# Run ESLint
bun run lint
```

### File Upload Issues
```bash
# Check file sizes (GitHub limit 100MB per file)
# Verify files exist before uploading
# Check encoding (use base64 for content)
```

### API Issues
```bash
# Check services are running
# Verify ports: 3000, 3001, 3002, 3003
# Check Socket.IO connections
# Check CORS configuration
```

---

## 📊 System Monitoring

### Health Checks
```bash
# Check all services
curl http://localhost:3000/api/health
curl http://localhost:3001/api/health
curl http://localhost:3002/api/health
curl http://localhost:3003/api/health
```

### Logs
```bash
# View system logs
curl http://localhost:3000/api/evolution/logs

# View scraping logs
curl http://localhost:3000/api/scraped-repos/logs
```

---

## 🎉 Success Criteria

Deployment is considered successful when:

- [x] New GitHub repository created
- [x] All source files uploaded (verified in DEPLOYMENT.md)
- [x] Build tests pass (no errors in deployment manifest)
- [x] Author set to "Craig Huckerby" (verified in commits)
- [x] README.md updated with deployment info
- [x] DEPLOYMENT.md committed with full deployment log
- [x] Repository verified accessible
- [x] No rate limit errors during upload
- [x] All services operational after deployment

---

## 📞 Support & Contact

For deployment issues:
- Check GitHub token permissions (repo, workflow, user:email)
- Verify network connectivity
- Check disk space for large projects
- Review deployment manifest for error details

**Built by**: Craig Huckerby
**System**: Evolution Engine + RAG + GitHub Universe Explorer
**Version**: 1.0.0

---

## 🚀 Quick Start

1. **Start all services**:
   ```bash
   # Terminal 1
   cd mini-services/cli-service && bun run dev &

   # Terminal 2 (or web interface)
   cd mini-services/repo-scraper && bun run dev &

   # Terminal 3
   cd mini-services/vector-db && bun run dev &

   # Main application
   cd .. && bun run dev
   ```

2. **Access CLI** (optional - web interface available):
   - Open: `http://localhost:3000/cli`
   - Use DOS-style commands
   - Configure, search, deploy options

3. **Deploy to GitHub**:
   - Go to: `http://localhost:3000/project-spec`
   - Complete onboarding with GitHub token
   - Use deployment API to create repo and push all files
   - Verify deployment

4. **Create HUGE RAG**:
   - Use GitHub scraper to discover repositories
   - Generate embeddings with vector DB service
   - Search across all code with RAG
   - Build knowledge base from your work

**Happy developing!** 🎉
