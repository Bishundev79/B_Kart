# B_Kart

B_Kart is a multi-vendor e-commerce marketplace built with Next.js 13 App Router, TypeScript, Tailwind CSS, Supabase, and Stripe.

## Tech Stack

- Next.js 13 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- Supabase (Postgres, Auth, RLS)
- Stripe (payments & webhooks)

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a `.env.local` file in the project root based on `.env.example` and fill in the values for:

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

### 3. Run database migrations & seed data

Follow the instructions in `db/README.md` to set up the database schema and RLS policies. Then you can seed sample data with:

```bash
npm run seed
```

### 4. Start the development server

```bash
npm run dev
```

The app will be available at http://localhost:3000.

## Scripts

- `npm run dev` - Start dev server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking
- `npm run seed` - Seed the database with sample data

## Project Structure (high level)

- `app/` - Next.js App Router routes, layouts, and API routes
- `components/` - Shared UI and domain components
- `db/` - SQL schema, migrations, and seed helpers
- `lib/` - Supabase, Stripe, validation, and other helpers
- `stores/` - Zustand stores
- `types/` - Shared TypeScript types

## License

TODO: Add a LICENSE file or specify the license once decided.
