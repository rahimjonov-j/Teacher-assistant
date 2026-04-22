# Teacher Assistant Platform

A production-minded MVP starter for an AI teacher assistant with:

- `apps/web`: React + Vite teacher app, marketing site, and admin panel
- `apps/api`: Express API for AI generation, credits, analytics, Telegram, and PDF export
- `packages/shared`: shared domain constants, plan logic, types, and feature metadata
- `supabase/`: Postgres schema and storage guidance

## Stack

- Frontend: React, Vite, Tailwind CSS, shadcn-style UI primitives, React Router, React Query
- Backend: Node.js, Express, Supabase, OpenAI, Telegraf, PDFKit
- Database: Supabase Postgres
- Storage: Supabase Storage

## Quick Start

1. Copy `.env.example` into:
   - root `.env`
   - `apps/web/.env`
   - `apps/api/.env`
2. Fill in your Supabase, OpenAI, and Telegram credentials.
3. Install dependencies:

```bash
npm install
```

4. Start the platform:

```bash
npm run dev
```

5. Apply the SQL in `supabase/schema.sql` to your Supabase project, then create the storage bucket and policies in `supabase/storage.sql`.

## Product Areas

- Teachers can generate quizzes, lesson plans, speaking prompts, writing feedback, export PDFs, and review history.
- Telegram shares the same generation and credit logic as the web app.
- Admins can monitor usage, feature popularity, credit burn, top teachers, and recent activity.

## Notes

- The codebase is integration-ready and uses real service boundaries instead of mock-only plumbing.
- Authentication is designed around Supabase Auth. The frontend signs users in directly with Supabase, and the API verifies bearer tokens for protected routes.
