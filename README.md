# Evolution Engine + RAG + GitHub Universe Explorer

> **An AI-powered development automation system that learns and evolves with you.**

[![Evolution Engine](https://img.shields.io/badge/Evolution%20Engine-v1.0-blue?logo=next.js&logoColor=white)](https://img.shields.io/badge/Next.js-black?logo=next.js&label=Evolution%20Engine)

**Deployed by**: Craig Huckerby
**Repository**: [craighckby-stack/evolution-engine-rag](https://github.com/craighckby-stack/evolution-engine-rag)
**Date**: January 11, 2026

---

## 🚀 Features

- **Evolution Engine** - Full-stack Next.js application with AI-powered code generation
- **GitHub Integration** - Automatic repository creation and management
- **Project Specification** - Define any project type and get AI-generated build instructions
- **DOS-style CLI** - Command-line interface with real-time feedback
- **RAG System** - Cross-repo knowledge mining and retrieval
- **GitHub Universe Explorer** - Discover and scrape ANY public repository
- **Vector Database** - In-memory vector storage with OpenAI embeddings
- **Deployment System** - Automatic repo creation, file upload, build testing

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Prisma ORM, SQLite
- **AI**: z-ai-web-dev-sdk, OpenAI embeddings
- **CLI**: Socket.IO, Octokit
- **Database**: Prisma, SQLite

---

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/craighckby-stack/evolution-engine-rag.git
cd evolution-engine-rag

# Install dependencies
bun install

# Run database migrations
bun run db:push

# Start development server
bun run dev
```

---

## 🎯 Quick Start

### 1. Start Main Application
```bash
bun run dev
```
Application will be available at: `http://localhost:3000`

### 2. Start DOS CLI Service
```bash
cd mini-services/cli-service
bun run dev
```
CLI will be available at: `http://localhost:3000/cli`

### 3. Start GitHub Scraper Service
```bash
cd mini-services/repo-scraper
bun run dev
```
Scraper service runs on: `Port 3002`

### 4. Start Vector Database Service
```bash
cd mini-services/vector-db
bun run dev
```
Vector DB service runs on: `Port 3003`

---

## 🌐 System Architecture

```
┌─────────────────────────────────────────────┐
│  Evolution Engine (Next.js App)        │
└─────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────┐
│  DOS-style CLI (Port 3001)        │
└─────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────┐
│  GitHub Scraper (Port 3002)       │
└─────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────┐
│  Vector Database (Port 3003)      │
└─────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────┐
│  Database (SQLite)                │
└─────────────────────────────────────────────┘
```

---

## 📚 Documentation

- **DEPLOYMENT.md** - Complete deployment information
- **worklog.md** - Detailed development log
- **API Documentation** - All API endpoints documented in code

---

## 🔧 Configuration

### Required Environment Variables

```bash
# Database
DATABASE_URL="file:./db/dev.db"

# GitHub (optional - for features)
GITHUB_TOKEN="your_github_token_here"

# OpenAI (optional - for embeddings)
OPENAI_API_KEY="your_openai_key_here"
```

---

## 🧪 Testing

```bash
# Run build tests
bun run build

# Run linting
bun run lint

# Run database migrations
bun run db:push
```

---

## 📊 Available Commands

```bash
# Development
bun dev              # Start development server
bun build            # Build for production
bun start            # Start production server

# Database
bun run db:push     # Push schema to database
bun run db:generate # Generate Prisma client
bun run db:migrate   # Run database migrations

# CLI Services
bun run cli          # Start CLI service
bun run scraper      # Start scraper service
bun run vector-db    # Start vector DB service

# Deployment
bun run deploy      # Run deployment script
```

---

## 🎉 Deployment Success

This repository was successfully deployed to GitHub on January 11, 2026.

**All commits are attributed to Craig Huckerby**

**No build errors detected**

---

## 👤 Author

**Craig Huckerby**
- GitHub: [craighckby-stack](https://github.com/craighckby-stack)
- Email: craig.huckerby@example.com

---

## 📄 License

This project is private and proprietary. All rights reserved.

---

## 🙏 Acknowledgments

- Built with Evolution Engine - An AI-powered development tool
- Next.js for the full-stack framework
- shadcn/ui for UI components
- Prisma for database management
- Socket.IO for real-time communication
- OpenAI for embeddings and AI capabilities

---

**Built by**: Craig Huckerby
**System**: Evolution Engine + RAG + GitHub Universe Explorer
**Version**: 1.0.0
**Status**: ✅ Production Ready
