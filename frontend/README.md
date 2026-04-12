# SmartAssess Frontend

Next.js frontend for SmartAssess.

## Required environment variables

Create `frontend/.env.local` (or `.env`) from `frontend/.env.example` and set:

- `NEXT_PUBLIC_API_URL`: Base URL for backend API requests from `src/lib/api.ts`.
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Clerk publishable key used by `@clerk/nextjs` (`<ClerkProvider />`).

## Local setup

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Copy env example and add your real values:

   ```bash
   cp .env.example .env.local
   ```

3. Start the dev server:

   ```bash
   pnpm dev
   ```

4. Open:

   - `http://localhost:3000`

## Notes

- For local development, `NEXT_PUBLIC_API_URL` should usually be `http://localhost:4000`.
- Use Clerk keys from the same Clerk application configured for your backend.
