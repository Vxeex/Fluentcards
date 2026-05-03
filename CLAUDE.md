# CLAUDE.md — Universal Guide

## About me
- I'm learning English and Japanese. Use simple, clear English in your responses.
- I build websites and web apps, and I want to earn money from them (e.g. AdSense).
- I have built apps with AI tools before (Anki flashcards, Japanese vocab apps) but I'm still learning how things work under the hood.
- I work on Windows (PowerShell).

## How you should help me

### Communication
- Use clear, simple English. Short sentences. Explain important concepts briefly.
- When you introduce a technical term, give a one-line explanation of what it means.
- Don't assume I know advanced concepts — but don't treat me like a complete beginner either. I learn fast.
- Give reasoning, not just the answer. Tell me *why* something works, not just *what* to do.

### Building & coding
- When starting a new project, help me plan the structure before writing code.
- Show me best practices, but don't over-engineer. Simple working code is better than perfect code.
- When you suggest a tool or library, explain what problem it solves and a quick alternative.
- Prioritize getting a working prototype first. We can polish later.
- Keep AdSense/monetization in mind: good SEO, fast load times, clean content, privacy policy pages.

### Teaching
- When I make a mistake, explain what went wrong and how to fix it.
- If there are multiple ways to do something, show me the simplest one first.
- Encourage me to understand the code, not just copy-paste it.
- Point me to good resources if relevant.

### Workflow
- Before writing more than a few files, ask if I want a quick plan first.
- When debugging, start with the most likely cause, not the most unlikely one.
- Use `npm` or `npx` for JavaScript/TypeScript projects.
- Use PowerShell commands when running things locally.

## Current project structure

### vxeex (Astro + Cloudflare)
This project has two parts:

**Main site** — Astro pages served at `/`:
- `src/pages/index.astro` — home page
- `src/pages/api/health.ts` — health check endpoint
- `src/pages/api/tts.ts` — TTS (text-to-speech) API for Japanese audio pronunciation. Uses Microsoft Edge TTS via WebSocket (Cloudflare Worker compatible).

**FluentCards (React SPA)** — served at `/fluentcards/*`:
- `src/fluentcards/` — React app source (migrated from Google Cloud)
- `src/pages/fluentcards/[...path].astro` — catch-all route that renders the React app
- Uses Firebase (Firestore + Auth) for data and authentication
- Features: Anki-style flashcards with FSRS scheduling, TTS pronunciation, furigana support, marketplace for shared decks, Gemini AI integration

### Key scripts
- `npm run dev` — start dev server
- `npm run build` — build for Cloudflare deployment
- `npm run preview` — preview the built site

### Env vars needed
- `GEMINI_API_KEY` — for Gemini AI features
- Firebase config in `firebase-applet-config.json` (already set up)

### Tech stack
- Framework: Astro with React integration
- Styling: Tailwind CSS v4
- Hosting: Cloudflare Pages + Workers (via `@astrojs/cloudflare`)
- Database: Firebase Firestore
- Auth: Firebase Auth (Google sign-in)
- Runtime: Node.js (dev), Cloudflare Workers (production)
