# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

UIGen is an AI-powered React component generator with live preview. Users describe components in a chat interface, and the AI generates React code that renders in real-time.

## Commands

```bash
# Initial setup (install deps, generate Prisma client, run migrations)
npm run setup

# Development server (uses Turbopack)
npm run dev

# Run tests
npm test

# Run a single test file
npx vitest src/lib/__tests__/file-system.test.ts

# Lint
npm run lint

# Database operations
npm run db:reset    # Reset database
npx prisma studio   # Open Prisma Studio
```

## Architecture

### Core Flow
1. User sends message via ChatInterface → API route `/api/chat/route.ts`
2. AI (Claude or mock provider) generates tool calls to create/modify files
3. Tool calls update VirtualFileSystem (in-memory, no disk writes)
4. FileSystemContext propagates changes to UI
5. PreviewFrame transforms JSX via Babel and renders in sandboxed iframe

### Key Components

**Virtual File System** (`src/lib/file-system.ts`)
- In-memory file system with Map-based storage
- Supports create, read, update, delete, rename operations
- Serializable for persistence to database

**JSX Transformer** (`src/lib/transform/jsx-transformer.ts`)
- Transforms JSX/TSX to JavaScript using Babel standalone
- Creates import maps with blob URLs for browser execution
- Third-party packages resolved via esm.sh CDN
- Generates complete HTML for iframe preview

**AI Tools** (`src/lib/tools/`)
- `str_replace_editor`: File creation, string replacement, line insertion
- `file_manager`: File rename and delete operations

**Contexts**
- `FileSystemProvider`: Manages virtual file state, handles tool calls
- `ChatProvider`: Manages chat messages, streams AI responses

### Preview System
The preview renders generated components by:
1. Transforming all JSX/TSX files to ES modules
2. Creating blob URLs for each transformed file
3. Building an import map that includes local files and CDN dependencies
4. Injecting into a sandboxed iframe with Tailwind CSS

### Database
SQLite via Prisma with two models:
- `User`: Authentication (email/password with bcrypt)
- `Project`: Stores messages and file system state as JSON

### Provider System
`src/lib/provider.ts` returns either:
- Real Anthropic Claude model (if `ANTHROPIC_API_KEY` is set)
- MockLanguageModel (returns static component code for testing without API key)
