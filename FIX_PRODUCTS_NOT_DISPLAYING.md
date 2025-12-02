# Root Cause Analysis: Products and Images Not Displaying

## Summary
Products and product images are not displaying on the frontend because of **missing RLS (Row Level Security) policies** on the `vendors` table in Supabase. The products exist in the database, but the API joins fail silently because anonymous users cannot access vendor data.

---

## Root Cause

**Primary Issue:** Missing RLS Policy on `vendors` Table

The `vendors` table has RLS enabled but **no SELECT policy for anonymous users**. When the products API tries to join products with vendors using:

```sql
vendor:vendors!inner(id, store_name, store_slug, status)
```

The join returns NULL for vendor data because RLS blocks anonymous access. This causes:
1. The `!inner` join syntax to return 0 products (inner joins exclude rows with NULL)
2. Without `!inner`, vendor field is NULL, breaking the frontend display

**Secondary Issue:** Middleware Configuration

The middleware was initially blocking API routes with a file system error (`prerender-manifest.js`), which has been fixed by excluding `/api/*` routes from middleware processing.

---

## Files & Lines to Fix

### 1. **Database: Add Vendor RLS Policy**
**File:** Supabase SQL Editor (or migration file)
**Issue:** No public read policy for vendors table
**Line:** After line 545 in `db/complete-setup.sql`

### 2. **Middleware Configuration** ✅ FIXED
**File:** `middleware.ts`
**Line:** 196-207
**Issue:** Middleware was processing API routes, causing crashes

---

## Patch/Fix Code

### Fix 1: Add Vendor RLS Policies (CRITICAL)

Execute this SQL in your **Supabase SQL Editor**:

```sql
-- Allow anonymous users to view approved vendors (needed for product listings)
CREATE POLICY "Approved vendors are viewable by everyone" 
ON vendors 
FOR SELECT 
USING (status = 'approved');

-- Allow vendors to view their own profile (even if pending/suspended)
CREATE POLICY "Vendors can view own profile" 
ON vendors 
FOR SELECT 
USING (user_id = auth.uid());

-- Allow vendors to update their own profile
CREATE POLICY "Vendors can update own profile" 
ON vendors 
FOR UPDATE 
USING (user_id = auth.uid());

-- Allow admins full access to vendors
CREATE POLICY "Admins can manage all vendors" 
ON vendors 
FOR ALL 
USING (is_admin());
```

### Fix 2: Middleware Configuration ✅ ALREADY APPLIED

**File:** `middleware.ts` (Line 196-207)

```typescript
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)  ← ADDED THIS
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
```

### Fix 3: Update complete-setup.sql for Future Deployments

Add the vendor policies after line 583 in `db/complete-setup.sql`:

```sql
-- Vendors policies (ADD THIS SECTION)
CREATE POLICY "Approved vendors are viewable by everyone" ON vendors FOR SELECT USING (status = 'approved');
CREATE POLICY "Vendors can view own profile" ON vendors FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Vendors can update own profile" ON vendors FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Admins can manage all vendors" ON vendors FOR ALL USING (is_admin());

-- Categories policies (public read)
CREATE POLICY "Categories are viewable by everyone" ON categories FOR SELECT USING (is_active = true);
```

---

## Verification Steps

### 1. Apply the SQL Fix

```bash
# Go to Supabase Dashboard → SQL Editor → New Query
# Paste the vendor RLS policies SQL above
# Click "Run" or press Cmd+Enter
```

### 2. Verify Database Access

```bash
cd /Users/bishun/Desktop/Projects/B_Kart
npx tsx scripts/test-vendor-access.ts
```

**Expected Output:**
```
Vendors (anon): 1 Error: None
Sample: { id: '...', store_name: 'Premium Electronics & More', status: 'approved' }
```

### 3. Test API Endpoint

```bash
# Start dev server
npm run dev

# In another terminal, test the API
curl -s "http://localhost:3000/api/products?perPage=5" | python3 -m json.tool
```

**Expected Output:**
```json
{
  "products": [
    {
      "id": "...",
      "name": "Premium Wireless Earbuds Pro",
      "slug": "premium-wireless-earbuds-pro",
      "price": 149.99,
      "vendor": {
        "id": "...",
        "store_name": "Premium Electronics & More",
        "slug": "premium-electronics-more"
      },
      "primary_image": {
        "url": "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&q=80",
        "is_primary": true
      }
    },
    ...
  ],
  "pagination": {
    "page": 1,
    "perPage": 5,
    "total": 10,
    "totalPages": 2
  }
}
```

### 4. Test Frontend

```bash
# Visit in browser:
http://localhost:3000/products
```

**Expected Result:**
- Product grid displays 10 products
- Each product card shows:
  - Product image from Unsplash
  - Product name
  - Price
  - Vendor name
  - Rating (if applicable)
  - "Add to Cart" button

---

## Technical Explanation

### Data Flow Breakdown

```
1. Browser → GET /products page
2. Server Component fetches: supabase.from('products').select(...)
3. Supabase PostgREST attempts join: products ⟗ vendors
4. RLS Check on vendors table:
   ❌ BEFORE FIX: No policy → RLS blocks → vendor = NULL
   ✅ AFTER FIX: Public policy exists → RLS allows → vendor = {data}
5. Response sent to ProductGrid component
6. ProductCard renders with vendor.store_name and primary_image.url
```

### Why Inner Join Failed

```typescript
// With !inner syntax
vendor:vendors!inner(id, store_name)
// PostgREST translates to:
// INNER JOIN vendors ON products.vendor_id = vendors.id
// WHERE vendors.* passes RLS

// When RLS blocks vendors:
// - Join succeeds but RLS filters out vendor rows
// - INNER JOIN excludes products with no matching vendor
// - Result: 0 products returned
```

### Why Regular Join Returned NULL

```typescript
// Without !inner
vendor:vendors(id, store_name)
// PostgREST translates to:
// LEFT JOIN vendors ON products.vendor_id = vendors.id
// WHERE vendors.* passes RLS

// When RLS blocks vendors:
// - Join succeeds but vendor data is filtered by RLS
// - LEFT JOIN includes products but vendor = NULL
// - Result: Products returned but vendor.store_name crashes frontend
```

---

## Suggested Improvements

### 1. **Database: Add RLS Policies During Setup**

**File:** `db/complete-setup.sql`

Add a comment section for each table's RLS policies:

```sql
-- ============================================
-- RLS POLICIES
-- ============================================

-- Profiles policies
CREATE POLICY...

-- Addresses policies  
CREATE POLICY...

-- Vendors policies ← ADD THIS SECTION
CREATE POLICY...
```

### 2. **Add RLS Policy Checker Script**

**File:** `scripts/check-rls-policies.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

// Script to verify all tables have proper RLS policies
async function checkRLS() {
  const tables = ['profiles', 'vendors', 'products', 'product_images', ...];
  
  for (const table of tables) {
    // Check if anon can read
    const { data, error } = await anonClient.from(table).select('*').limit(1);
    console.log(`${table}: ${error ? '❌ BLOCKED' : '✅ READABLE'}`);
  }
}
```

### 3. **Add Type-Safe RLS Testing**

**File:** `tests/rls-policies.test.ts`

```typescript
describe('RLS Policies', () => {
  it('should allow anon users to read approved vendors', async () => {
    const { data, error } = await anonClient
      .from('vendors')
      .select('*')
      .eq('status', 'approved');
    
    expect(error).toBeNull();
    expect(data).not.toBeNull();
  });
  
  it('should block anon users from pending vendors', async () => {
    const { data } = await anonClient
      .from('vendors')
      .select('*')
      .eq('status', 'pending');
    
    expect(data).toEqual([]);
  });
});
```

### 4. **API Error Handling**

**File:** `app/api/products/route.ts`

Add better error logging:

```typescript
const { data: products, error, count } = await query;

if (error) {
  console.error('Products API Error:', {
    message: error.message,
    code: error.code,
    details: error.details,
    hint: error.hint
  });
  
  return NextResponse.json(
    { 
      error: 'Failed to fetch products',
      debug: process.env.NODE_ENV === 'development' ? error.message : undefined
    },
    { status: 500 }
  );
}
```

### 5. **Frontend: Add Loading States**

**File:** `app/(store)/products/page.tsx`

```typescript
if (!products || products.length === 0) {
  return (
    <div className="text-center py-12">
      <Package className="mx-auto h-12 w-12 text-muted-foreground" />
      <p className="mt-4 text-lg">No products found</p>
      <p className="text-sm text-muted-foreground">
        Try adjusting your filters or check back later
      </p>
    </div>
  );
}
```

### 6. **Documentation: RLS Policy Template**

**File:** `docs/rls-policy-template.md`

```markdown
# RLS Policy Template

For each new table, add these policies:

## Public Tables (e.g., products, categories, vendors)
- Allow anon SELECT where status = 'active'/'approved'
- Allow authenticated users full CRUD on own rows
- Allow admins full access

## Private Tables (e.g., cart, orders, wishlists)
- Allow authenticated users CRUD on own rows only
- Allow admins full access
- No anon access
```

### 7. **CI/CD: Add RLS Validation**

**File:** `.github/workflows/test.yml`

```yaml
- name: Validate RLS Policies
  run: |
    npm run test:rls
    npm run check:rls-coverage
```

---

## Prevention Checklist

- [ ] Run `scripts/check-rls-policies.ts` after database changes
- [ ] Add RLS policies in same commit as table creation
- [ ] Test API endpoints with anon key before deploying
- [ ] Add integration tests for public data access
- [ ] Document required RLS policies in migration files
- [ ] Use service role key only in backend, never expose to client
- [ ] Monitor Supabase logs for RLS violations
- [ ] Add error boundaries in frontend for missing data

---

## Additional Notes

### Why Images Load from Unsplash

The seed script uses Unsplash URLs which are publicly accessible CDN links. No additional configuration needed for images - they work immediately after seeding.

### Database Seed Data

Current state:
- ✅ 10 products seeded
- ✅ 12 product images linked
- ✅ 1 approved vendor
- ✅ 6 main categories + subcategories

### Performance Considerations

Once RLS is fixed, consider:
1. Add database indexes on frequently joined columns
2. Implement cursor-based pagination for large datasets
3. Cache vendor data in Redis/Vercel KV
4. Use CDN for product images (already using Unsplash CDN)

---

## Success Criteria

After applying the fix, verify:

- [x] Middleware excludes API routes
- [ ] Vendor RLS policy added to database
- [ ] `curl /api/products` returns products with vendor data
- [ ] Products page displays product grid with images
- [ ] Each card shows vendor name
- [ ] Images load from Unsplash
- [ ] "Add to Cart" buttons are functional
- [ ] No console errors in browser
- [ ] No 500 errors in server logs

---

**Date:** 2025-12-02  
**Status:** Ready to apply SQL fix  
**Priority:** CRITICAL - Blocks all product display functionality
