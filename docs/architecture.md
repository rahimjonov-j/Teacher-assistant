# Architecture Notes

## Monorepo layout

- `apps/web`
  Public marketing pages, teacher app, and admin analytics panel.
- `apps/api`
  Shared backend for web and Telegram with generation, credits, analytics, and PDF services.
- `packages/shared`
  Feature metadata, plan definitions, model strategy, and shared domain types.
- `supabase`
  SQL schema and storage bucket setup for Postgres and Storage.

## Request flow

1. Teacher authenticates with Supabase Auth from the web app.
2. The frontend sends the bearer token to the Express API.
3. The API verifies the token with Supabase, syncs the teacher profile, and applies route guards.
4. Generation requests go through a single `generationService`, which:
   - chooses the model based on feature
   - calls OpenAI
   - deducts credits
   - saves generated content
   - logs analytics usage
5. Telegram uses the same generation and credit services through bot handlers, keeping behavior consistent.

## Core domain tables

- `profiles`
  Teacher identity, role, profile data, and Telegram handle.
- `plans`
  Editable plan catalog with credits and pricing.
- `subscriptions`
  Credit balances, plan state, and renewal timing.
- `generated_contents`
  Saved AI outputs, prompts, model names, and PDF pointers.
- `file_assets`
  Storage metadata for PDFs and future files.
- `usage_logs`
  Per-request usage tracking for analytics.
- `event_logs`
  Product telemetry and behavior analysis foundation.
- `telegram_links`
  Mapping between teacher accounts and Telegram users.
- `admin_roles`
  Admin access layer for analytics and operations.

## Storage buckets

- `generated-pdfs`
  PDF exports generated from teacher content.

Future-ready buckets:

- `teacher-uploads`
  Uploaded student files or teacher source documents.
- `export-assets`
  Branded templates, future image assets, and supporting files.

## Product principles in the codebase

- Teachers should reach their primary task in one screen.
- Credits and plan logic live in shared constants so costs are easy to maintain.
- Analytics tables are request-based rather than page-decoration-only, so admin views can answer real usage questions.
- Telegram and web share the same business logic to avoid drift between channels.
