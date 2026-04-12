# SmartAssess Backend

Express + TypeScript API for SmartAssess.

## Required environment variables

Create `backend/.env` from `backend/.env.example` and fill in the values:

- `DATABASE_URL`: PostgreSQL connection string used by Prisma.
- `CLERK_PUBLISHABLE_KEY`: Clerk publishable key used by `@clerk/express` middleware config.
- `CLERK_SECRET_KEY`: Clerk secret key used by `@clerk/express` middleware config.
- `CLERK_WEBHOOK_SECRET`: Svix secret used to verify Clerk webhook signatures on `/api/auth/webhook`.
- `FRONTEND_URL`: Frontend origin allowed by CORS (for local dev: `http://localhost:3000`).
- `PORT`: Backend port (default in this project: `4000`).
- `NODE_ENV`: Runtime environment (`development`, `test`, or `production`).
- `JUDGE0_API_URL`: Judge0 base URL (`https://ce.judge0.com` by default).
- `JUDGE0_LANGUAGE_ID`: Judge0 numeric language id (`63` = JavaScript/Node.js).
- `JUDGE0_API_KEY`: Judge0/RapidAPI key (leave empty when using public Judge0 CE without auth).
- `JUDGE0_API_HOST`: RapidAPI host header value when using RapidAPI.

## Local setup

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Copy and edit env file:

   ```bash
   cp .env.example .env
   ```

3. Ensure PostgreSQL is running and `DATABASE_URL` points to your DB.

4. Push Prisma schema:

   ```bash
   npx prisma db push
   ```

5. Start the API:

   ```bash
   pnpm dev
   ```

6. Verify health endpoint:

   - `GET http://localhost:4000/api/health`
