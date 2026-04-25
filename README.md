# Teacher Assistant Platform

**Teacher Assistant** is an intelligent, AI-powered platform designed to supercharge educators' daily workflows. By leveraging advanced AI models, it helps teachers save hours of preparation time by automatically generating educational content, grading materials, and providing actionable feedback for their students.

## What is this platform?

The platform serves as a virtual co-pilot for teachers. Instead of manually creating quizzes, lesson plans, or writing prompts from scratch, teachers can input their requirements, and the AI will generate high-quality, tailored content in seconds. 

The system operates on a credit-based model, ensuring fair usage of AI resources, and provides seamless access through both a modern Web Application and a convenient Telegram Bot.

## Key Features

### For Teachers
- **Lesson Plans**: Create structured, curriculum-aligned lesson plans instantly.
- **Quizzes & Tests**: Generate multiple-choice or open-ended quizzes based on specific topics or reading materials.
- **Writing & Speaking Prompts**: Create engaging prompts for student practice.
- **Feedback & Grading**: Automate the review process for student submissions.
- **PDF Export**: Seamlessly export generated content to PDF for printing or sharing.
- **History & Organization**: Keep track of all generated materials in one centralized dashboard.

### Cross-Platform Access
- **Web Application**: A premium, mobile-responsive dashboard for teachers to manage their generated content and account.
- **Telegram Bot**: On-the-go access to all AI generation tools directly from Telegram. The bot shares the same account and credit balance as the web application.

### For Administrators
- **Usage Monitoring**: Track platform usage, credit burn rates, and active teachers.
- **Feature Analytics**: Identify the most popular AI tools and generation features.
- **User Management**: Monitor top teachers and recent platform activity.

## Technology Stack

The platform is built as a scalable monorepo, separating concerns while maintaining shared logic:

- **Frontend (`apps/web`)**: 
  - React, Vite, TypeScript
  - Tailwind CSS & Radix UI (shadcn-style) for a modern, minimalist interface
  - React Query & React Router
- **Backend (`apps/api`)**:
  - Node.js & Express
  - OpenAI API for generative features
  - Telegraf for Telegram Bot integration
  - PDFKit for generating downloadable resources
- **Database & Auth (`supabase/`)**:
  - Supabase Auth for secure user management
  - PostgreSQL for robust relational data storage
  - Supabase Storage for saving generated assets
- **Shared Code (`packages/shared`)**:
  - Shared domain constants, types, and feature metadata used across both web and API.

## Who is this for?

- **Teachers & Educators** who want to reduce administrative overhead and focus more on teaching.
- **Tutors** who need a quick way to generate tailored materials for individual students.
- **Educational Institutions** looking to provide their staff with cutting-edge AI tools to improve productivity.
