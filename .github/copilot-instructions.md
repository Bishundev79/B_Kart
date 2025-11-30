# B_Kart - Multi-Vendor Marketplace

A full-stack e-commerce marketplace demonstrating modern web development patterns with Next.js 13.5, Supabase, and Stripe.

## Architecture Overview

Next.js 13.5 App Router marketplace with **three user roles**: customer, vendor, admin. Uses Supabase for auth/database, Stripe for payments, and Zustand for client state.

### Key Layers
- **Route Groups**: `(auth)`, `(customer)`, `(vendor)`, `(admin)` - role-based layouts
- **State**: Zustand stores with `'use client'` directive (see `stores/authStore.ts`, `stores/profileStore.ts`)
- **Database**: Supabase with RLS policies enforcing role-based access (see `db/rls_policies.sql`)
- **Validation**: Zod schemas in `lib/validations/` paired with `react-hook-form`

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 13.5 (App Router) |
| Database | Supabase (PostgreSQL + RLS) |
| Auth | Supabase Auth |
| Payments | Stripe |
| State | Zustand |
| Forms | React Hook Form + Zod |
| UI | shadcn/ui + Tailwind CSS |
| Icons | Lucide React |

## Critical Patterns

### Supabase Client Usage
```typescript
// Server Components/API Routes - async, uses cookies()
import { createClient } from '@/lib/supabase/server';
const supabase = await createClient();

// Client Components - synchronous
import { createClient } from '@/lib/supabase/client';
const supabase = createClient();

// Admin operations (service role) - server only
import { createAdminClient } from '@/lib/supabase/admin';
```

### Form Components Pattern
Forms use this stack: `react-hook-form` + `zodResolver` + shadcn/ui `Form` components. See `components/auth/LoginForm.tsx` for reference:
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginFormData } from '@/lib/validations/auth';

const form = useForm<LoginFormData>({
  resolver: zodResolver(loginSchema),
});
```

### API Route Structure
All routes follow this pattern (`app/api/*/route.ts`):
```typescript
export async function POST(request: Request) {
  const supabase = await createClient();
  
  // 1. Authenticate
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  // 2. Validate with Zod
  const result = schema.safeParse(await request.json());
  if (!result.success) return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 });
  
  // 3. Business logic + response
  return NextResponse.json({ data });
}
```

### Zustand Stores
Stores export action functions and selector hooks:
```typescript
// stores/authStore.ts pattern
useAuthStore()        // Full store access
useUser()             // Selector hook for user
useIsAuthenticated()  // Boolean selector
useIsVendor()         // Role check selector
```

## Database Conventions

- **17 tables** defined in `db/schema.sql` with PostgreSQL enums
- **RLS enabled** on all tables - see `db/rls_policies.sql` for helper functions:
  - `is_admin()`, `is_vendor()`, `get_user_vendor_id()`
- **Auto-triggers** in `db/functions.sql`: profile creation, rating updates, inventory management

### Key Enums
`user_role`, `vendor_status`, `product_status`, `order_status`, `payment_status`

## UI Components

Using **shadcn/ui** in `components/ui/`. Style utilities:
```typescript
import { cn } from '@/lib/utils';  // clsx + tailwind-merge
```

Colors use CSS variables: `hsl(var(--primary))`, `hsl(var(--destructive))`, etc.

## File Organization

| Directory | Purpose |
|-----------|---------|
| `app/(auth)/` | Auth pages (login, signup, forgot-password, etc.) |
| `app/(customer)/` | Customer dashboard, orders, wishlist |
| `app/(vendor)/` | Vendor dashboard, product management, payouts |
| `app/(admin)/` | Admin dashboard, user/vendor management |
| `app/api/` | API routes following REST patterns |
| `components/` | Feature-organized components with barrel exports |
| `lib/validations/` | Zod schemas - create alongside new forms |
| `stores/` | Zustand stores - one per domain (auth, profile, etc.) |
| `types/` | TypeScript types, `database.ts` for Supabase types |
| `db/` | SQL schema, RLS policies, functions, migrations |

## Commands

```bash
npm run dev          # Development server (http://localhost:3000)
npm run build        # Production build
npm run typecheck    # TypeScript check only
npm run lint         # ESLint
```

## Auth Flow

1. `AuthProvider` in root layout calls `useAuthStore().initialize()`
2. `middleware.ts` protects routes and enforces role access
3. Protected routes: `/account`, `/checkout`, `/vendor/*`, `/admin/*`
4. Vendors require `onboarding` after signup to create store

### Role-Based Access
| Role | Access |
|------|--------|
| Customer | Browse, cart, checkout, order history, reviews |
| Vendor | All customer + product management, order fulfillment, payouts |
| Admin | Full access + user management, vendor approval, platform settings |

## Environment Setup

Required in `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_pk
STRIPE_SECRET_KEY=your_stripe_sk
STRIPE_WEBHOOK_SECRET=your_webhook_secret
```

## When Adding Features

1. **New form**: Create Zod schema in `lib/validations/`, component in appropriate `components/` subfolder
2. **New API**: Add `route.ts` in `app/api/`, validate with Zod, check auth first
3. **New page**: Place in correct route group, use appropriate layout
4. **State management**: Add to existing store or create new Zustand store in `stores/`
5. **Database changes**: Update `db/schema.sql`, add RLS in `db/rls_policies.sql`

## Development Status

- ✅ Phase 0: Project setup, dependencies, folder structure
- ✅ Phase 1: Database schema, auth system, user profiles
- 🔄 Phase 2: Product catalog, categories, search (in progress)
- ⏳ Phase 3: Cart, checkout, Stripe integration
- ⏳ Phase 4: Vendor dashboard, order management
- ⏳ Phase 5: Admin panel, analytics, notifications
