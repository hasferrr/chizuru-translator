# Chizuru-Translator

**Chizuru-Translator** is an AI Subtitle Translator for SRT/ASS subtitle files. It uses custom AI model endpoints to provide high-quality and context-aware translations that fit your needs. Suitable for videos, films, or anime episodes, it offers a quick and easy solution. Let’s be honest—it’s a lifesaver for leecher moe weebs who just want their subs fast and accurate.

## Setup

1. Add the required environment variables:

   ```env
   OPENAI_API_KEY=
   ```

2. Install dependencies:

   ```bash
   bun install
   ```

3. Run the project:

   As a Script:

   ```bash
   bun run index.ts               # Translate subtitle
   bun run extract-context.ts     # Extract context from subtitle
   ```

   As an API Server:

   ```bash
   bun dev
   ```

This project was created using `bun init` in bun v1.2.2. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
