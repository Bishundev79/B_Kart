# Phase 4: Vendor Dashboard & Order Management

## Pre-Implementation Checklist

### ✅ Foundation Already Built

| Component | Location | Status |
|-----------|----------|--------|
| **Database Tables** | `db/schema.sql` | ✅ |
| - `orders` | Lines 240-270 | Order with status, payment info |
| - `order_items` | Lines 273-290 | Per-vendor line items with commission |
| - `order_tracking` | Lines 298-312 | Shipping tracking entries |
| - `vendor_payouts` | Lines 385-402 | Payout records |
| **RLS Policies** | `db/rls_policies.sql` | ✅ |
| - Vendors can view order items for their products | Lines 320-335 |
| - Vendors can update order item status | Lines 337-342 |
| - Vendors can add tracking | Lines 354-365 |
| - Vendors can view own payouts | Lines 477-478 |
| **Helper Functions** | `db/rls_policies.sql` | ✅ |
| - `get_user_vendor_id()` | Lines 53-59 |
| - `is_vendor()` | Lines 44-50 |
| **DB Triggers** | `db/functions.sql` | ✅ |
| - `decrease_inventory_on_order` | Auto-decrement stock |
| - `restore_inventory_on_cancel` | Auto-restore on cancel |
| - `update_vendor_sales_trigger` | Track vendor total sales |
| - `calculate_commission_trigger` | Auto-calculate commission |
| **Middleware** | `middleware.ts` | ✅ |
| - `/vendor/*` routes protected | Lines 81-87 |
| - Requires `vendor` or `admin` role | |
| **TypeScript Types** | `types/database.ts` | ✅ |
| - `OrderItem` | Lines 153-169 |
| - `OrderTracking` | Lines 171-185 |
| - `VendorPayout` | Lines 226-242 |
| - `OrderItemStatus` enum | Line 13 |
| **Vendor Product APIs** | `app/api/vendor/products/` | ✅ |
| - GET/POST products | `route.ts` |
| - GET/PATCH/DELETE product | `[id]/route.ts` |
| - Product images | `[id]/images/` |
| - Product variants | `[id]/variants/` |
| **Vendor Components** | `components/vendor/` | ✅ |
| - `ProductForm.tsx` | 636 lines, full CRUD |
| - `ProductList.tsx` | 381 lines, with stats |
| - `ProductImageUpload.tsx` | Image management |
| - `VariantManager.tsx` | Variant CRUD |
| **Product Store** | `stores/productStore.ts` | ✅ |
| - `fetchVendorProducts()` | |
| - `createProduct()` | |
| - `updateProduct()` | |
| - `deleteProduct()` | |

### ✅ EXISTING Vendor Dashboard (Already Built!)

| Component | Location | Status |
|-----------|----------|--------|
| **Vendor Layout** | `app/vendor/dashboard/layout.tsx` | ✅ Complete |
| - Sidebar with navigation | 6 links defined |
| - Store info header | Shows store name, status |
| - Auth check | Redirects if not vendor |
| - Onboarding check | Redirects if not onboarded |
| **Dashboard Page** | `app/vendor/dashboard/page.tsx` | ✅ Partial |
| - Stats cards | 4 cards (products, orders, revenue, alerts) |
| - Product stats | Real data from DB |
| - Order stats | **PLACEHOLDER** (hardcoded 0) |
| **Products Pages** | `app/vendor/dashboard/products/` | ✅ Complete |
| - List page | `page.tsx` |
| - New product | `new/page.tsx` |
| - Edit product | `[id]/page.tsx` |

### ❌ What Needs to Be Built

| Component | Gap |
|-----------|-----|
| Vendor Order APIs | No `/api/vendor/orders` |
| Vendor Payout APIs | No `/api/vendor/payouts` |
| Vendor Analytics API | No `/api/vendor/analytics` |
| Vendor Store (Zustand) | No `stores/vendorStore.ts` |
| Order Pages | No `/vendor/dashboard/orders/*` |
| Payout Pages | No `/vendor/dashboard/payouts/*` |
| Settings Page | No `/vendor/dashboard/settings/page.tsx` |
| Order Components | No fulfillment components |

---

## Implementation Steps (Revised - 7 Steps)

### Step 1: Vendor Types & Validation (2 files)

#### 1.1 Create `types/vendor.ts`

```typescript
// VendorDashboardStats - for dashboard overview
export interface VendorDashboardStats {
  totalProducts: number;
  activeProducts: number;
  totalOrders: number;
  pendingOrders: number;
  processingOrders: number;
  totalRevenue: number;
  monthlyRevenue: number;
  pendingPayout: number;
  lowStockProducts: number;
  outOfStockProducts: number;
}

// VendorOrderItem - order item with customer/order info
export interface VendorOrderItem {
  id: string;
  order_id: string;
  order_number: string;
  product_id: string;
  product_name: string;
  variant_id: string | null;
  variant_name: string | null;
  quantity: number;
  price: number;
  subtotal: number;
  commission_rate: number;
  commission_amount: number;
  status: OrderItemStatus;
  created_at: string;
  updated_at: string;
  // From order join
  customer_name: string;
  customer_email: string;
  shipping_address: Record<string, unknown>;
  order_created_at: string;
  // From product join
  product_slug: string;
  product_image: string | null;
}

// VendorOrderFilters - for filtering orders list
export interface VendorOrderFilters {
  status?: OrderItemStatus;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  perPage?: number;
}

// VendorAnalytics - for charts
export interface VendorAnalytics {
  period: '7d' | '30d' | '90d' | '1y';
  dailyStats: {
    date: string;
    orders: number;
    revenue: number;
    commission: number;
  }[];
  topProducts: {
    id: string;
    name: string;
    slug: string;
    quantity: number;
    revenue: number;
  }[];
  summary: {
    totalOrders: number;
    totalRevenue: number;
    totalCommission: number;
    averageOrderValue: number;
  };
}
```

#### 1.2 Create `lib/validations/vendor.ts`

```typescript
import { z } from 'zod';

// Update order item status
export const updateOrderItemStatusSchema = z.object({
  status: z.enum(['processing', 'shipped', 'delivered']),
});

// Add tracking information
export const addTrackingSchema = z.object({
  carrier: z.string().min(1, 'Carrier is required'),
  tracking_number: z.string().min(1, 'Tracking number is required'),
  tracking_url: z.string().url().optional().or(z.literal('')),
  status: z.string().optional().default('in_transit'),
  description: z.string().optional(),
});

// Vendor settings update
export const vendorSettingsSchema = z.object({
  store_name: z.string().min(2).max(100),
  description: z.string().max(1000).optional(),
  logo_url: z.string().url().optional().or(z.literal('')),
  banner_url: z.string().url().optional().or(z.literal('')),
});

export type UpdateOrderItemStatusData = z.infer<typeof updateOrderItemStatusSchema>;
export type AddTrackingData = z.infer<typeof addTrackingSchema>;
export type VendorSettingsData = z.infer<typeof vendorSettingsSchema>;
```

---

### Step 2: Vendor Zustand Store (1 file)

#### 2.1 Create `stores/vendorStore.ts`

```typescript
'use client';

import { create } from 'zustand';
import type { 
  VendorDashboardStats, 
  VendorOrderItem, 
  VendorOrderFilters,
  VendorAnalytics 
} from '@/types/vendor';
import type { VendorPayout } from '@/types/database';

interface VendorState {
  // Dashboard
  stats: VendorDashboardStats | null;
  statsLoading: boolean;
  
  // Orders
  orders: VendorOrderItem[];
  currentOrder: VendorOrderItem | null;
  ordersLoading: boolean;
  ordersPagination: { page: number; perPage: number; total: number; totalPages: number };
  
  // Payouts
  payouts: VendorPayout[];
  payoutsLoading: boolean;
  
  // Analytics
  analytics: VendorAnalytics | null;
  analyticsLoading: boolean;
  
  // Error
  error: string | null;
}

interface VendorActions {
  // Dashboard
  fetchDashboardStats: () => Promise<void>;
  
  // Orders
  fetchOrders: (filters?: VendorOrderFilters) => Promise<void>;
  fetchOrder: (id: string) => Promise<void>;
  updateOrderStatus: (id: string, status: string) => Promise<boolean>;
  addTracking: (orderId: string, data: any) => Promise<boolean>;
  
  // Payouts
  fetchPayouts: () => Promise<void>;
  
  // Analytics
  fetchAnalytics: (period: '7d' | '30d' | '90d' | '1y') => Promise<void>;
  
  // Reset
  clearError: () => void;
}

// Implementation with fetch calls to /api/vendor/* endpoints
```

---

### Step 3: Vendor Order APIs (3 files)

#### 3.1 Create `app/api/vendor/orders/route.ts`

```typescript
// GET /api/vendor/orders
// Query params: status, page, perPage, search, dateFrom, dateTo

// SQL Query Pattern:
SELECT 
  oi.*,
  o.order_number,
  o.shipping_address,
  o.created_at as order_created_at,
  p.full_name as customer_name,
  (SELECT email FROM auth.users WHERE id = o.user_id) as customer_email,
  prod.name as product_name,
  prod.slug as product_slug,
  (SELECT url FROM product_images WHERE product_id = oi.product_id AND is_primary = true LIMIT 1) as product_image
FROM order_items oi
JOIN orders o ON oi.order_id = o.id
JOIN profiles p ON o.user_id = p.id
JOIN products prod ON oi.product_id = prod.id
WHERE oi.vendor_id = $vendor_id
ORDER BY oi.created_at DESC
```

#### 3.2 Create `app/api/vendor/orders/[id]/route.ts`

```typescript
// GET /api/vendor/orders/[id]
// Returns: Full order item with tracking history

// PATCH /api/vendor/orders/[id]
// Body: { status: 'processing' | 'shipped' | 'delivered' }
// Validation:
// - pending -> processing ✓
// - processing -> shipped ✓
// - shipped -> delivered ✓
// - Cannot go backwards
// Side effect: Create notification for customer
```

#### 3.3 Create `app/api/vendor/orders/[id]/tracking/route.ts`

```typescript
// POST /api/vendor/orders/[id]/tracking
// Body: { carrier, tracking_number, tracking_url?, status?, description? }

// Insert into order_tracking table
// Auto-update order_item status to 'shipped' if not already
// Create notification for customer
```

---

### Step 4: Vendor Payout & Analytics APIs (2 files)

#### 4.1 Create `app/api/vendor/payouts/route.ts`

```typescript
// GET /api/vendor/payouts
// Returns paginated vendor_payouts for current vendor
// Includes summary: pending_amount, total_paid
```

#### 4.2 Create `app/api/vendor/analytics/route.ts`

```typescript
// GET /api/vendor/analytics?period=7d|30d|90d|1y

// Queries:
// 1. Daily stats (orders, revenue, commission)
// 2. Top 5 products by revenue
// 3. Summary totals
```

---

### Step 5: Vendor Order Pages (3 files)

#### 5.1 Create `app/vendor/dashboard/orders/page.tsx`

Orders list page with:
- Status filter tabs (All, Pending, Processing, Shipped, Delivered)
- Search by order number
- Date range filter
- Paginated table
- Quick actions (View, Update Status)

#### 5.2 Create `app/vendor/dashboard/orders/[id]/page.tsx`

Order detail page with:
- Order header (number, date, status badge)
- Customer info card
- Product details with image
- Shipping address
- Status timeline
- Fulfillment form (update status, add tracking)
- Tracking history

#### 5.3 Create `app/vendor/dashboard/payouts/page.tsx`

Payouts page with:
- Summary cards (pending, processing, paid this month)
- Payouts history table
- Payout detail modal

---

### Step 6: Vendor Order Components (6 files)

#### 6.1 Create `components/vendor/VendorOrderList.tsx`

Table component with columns:
- Order # | Product | Customer | Qty | Total | Status | Date | Actions

#### 6.2 Create `components/vendor/VendorOrderDetail.tsx`

Full order view with all sections

#### 6.3 Create `components/vendor/FulfillmentForm.tsx`

Form with:
- Status dropdown
- Carrier input
- Tracking number input
- Notes textarea
- Submit button

#### 6.4 Create `components/vendor/StatusTimeline.tsx`

Visual timeline showing order progression

#### 6.5 Create `components/vendor/SalesChart.tsx`

Line chart for revenue over time (uses Recharts)

#### 6.6 Create `components/vendor/PayoutHistory.tsx`

Table for payout records

---

### Step 7: Update Dashboard & Settings (3 files)

#### 7.1 Update `app/vendor/dashboard/page.tsx`

Replace hardcoded stats with real data:
- Fetch from `/api/vendor/analytics`
- Show recent orders
- Show sales chart

#### 7.2 Create `app/vendor/dashboard/settings/page.tsx`

Vendor settings page with:
- Store info form
- Logo/banner upload (can reuse image upload pattern)
- Save button

#### 7.3 Update `components/vendor/index.ts`

Add new exports:
```typescript
export { VendorOrderList } from './VendorOrderList';
export { VendorOrderDetail } from './VendorOrderDetail';
export { FulfillmentForm } from './FulfillmentForm';
export { StatusTimeline } from './StatusTimeline';
export { SalesChart } from './SalesChart';
export { PayoutHistory } from './PayoutHistory';
```

---

## File Summary (Revised)

| Step | New Files | Update Files | Description |
|------|-----------|--------------|-------------|
| 1 | 2 | 0 | Types & Validation |
| 2 | 1 | 0 | Zustand Store |
| 3 | 3 | 0 | Order APIs |
| 4 | 2 | 0 | Payout & Analytics APIs |
| 5 | 3 | 0 | Order & Payout Pages |
| 6 | 6 | 0 | UI Components |
| 7 | 1 | 2 | Dashboard update, Settings, Exports |
| **Total** | **18 files** | **2 files** | |

---

## Order Status Flow

```
pending → confirmed → processing → shipped → delivered
                  ↘ cancelled
                  ↘ refunded
```

**Vendor can update to:**
- `processing` (when starting fulfillment)
- `shipped` (when adding tracking)
- `delivered` (manual override if needed)

**System updates to:**
- `confirmed` (via webhook on payment success)
- `cancelled` (customer cancels before shipping)
- `refunded` (admin processes refund)

---

## API Authentication Pattern

All vendor APIs follow this pattern:
```typescript
// 1. Authenticate user
const { data: { user } } = await supabase.auth.getUser();
if (!user) return 401;

// 2. Get vendor ID
const { data: vendor } = await supabase
  .from('vendors')
  .select('id, status')
  .eq('user_id', user.id)
  .single();

if (!vendor) return 403 "Vendor not found";
if (vendor.status !== 'approved') return 403 "Not approved";

// 3. Business logic using vendor.id
```

---

## Key Database Queries

### Get Vendor's Order Items
```sql
SELECT 
  oi.*,
  o.order_number,
  o.user_id,
  o.shipping_address,
  p.name as customer_name,
  prod.name as product_name,
  prod.slug as product_slug
FROM order_items oi
JOIN orders o ON oi.order_id = o.id
JOIN profiles p ON o.user_id = p.id
JOIN products prod ON oi.product_id = prod.id
WHERE oi.vendor_id = $vendor_id
ORDER BY oi.created_at DESC
```

### Get Vendor Analytics
```sql
SELECT 
  DATE(oi.created_at) as date,
  COUNT(*) as order_count,
  SUM(oi.subtotal) as revenue,
  SUM(oi.commission_amount) as commission
FROM order_items oi
JOIN orders o ON oi.order_id = o.id
WHERE oi.vendor_id = $vendor_id
  AND o.payment_status = 'paid'
  AND oi.created_at >= $start_date
GROUP BY DATE(oi.created_at)
ORDER BY date DESC
```

### Get Pending Payout Amount
```sql
SELECT 
  SUM(oi.subtotal - oi.commission_amount) as pending_amount
FROM order_items oi
JOIN orders o ON oi.order_id = o.id
WHERE oi.vendor_id = $vendor_id
  AND o.payment_status = 'paid'
  AND oi.status = 'delivered'
  AND NOT EXISTS (
    SELECT 1 FROM vendor_payouts vp
    WHERE vp.vendor_id = $vendor_id
      AND oi.created_at BETWEEN vp.period_start AND vp.period_end
  )
```

---

## Dependencies

No new npm packages required. Using:
- `recharts` (via shadcn/ui chart component) - Already installed
- `lucide-react` - Already installed
- `date-fns` - Already installed

---

## Testing Checklist

After implementation, test:
- [ ] Vendor can view dashboard stats
- [ ] Vendor can see their order items only (not other vendors')
- [ ] Vendor can update order item status
- [ ] Vendor can add tracking information
- [ ] Order tracking timeline updates correctly
- [ ] Customer receives notification on status change
- [ ] Vendor can view payouts history
- [ ] Analytics chart displays correctly
- [ ] Products page works (already built)
- [ ] Sidebar navigation works
- [ ] Mobile responsive layout
- [ ] Unauthorized users redirected

---

## Notes for Implementation

1. **Start with APIs first** - Ensure data flows before building UI
2. **Use existing patterns** - Follow `/api/vendor/products` pattern for orders
3. **Leverage RLS** - Database policies handle authorization
4. **Reuse components** - Use existing shadcn/ui components
5. **Test incrementally** - Run `npm run build` after each step
6. **Handle edge cases** - Empty states, loading states, errors

---

## Quick Start Commands

```bash
# Verify build before starting
npm run build

# Development server
npm run dev

# Type check
npm run typecheck
```

---

## Estimated Effort

| Step | Complexity | Time |
|------|------------|------|
| Step 1 | Low | 15 min |
| Step 2 | Medium | 30 min |
| Step 3 | Medium | 45 min |
| Step 4 | Medium | 30 min |
| Step 5 | Low | 20 min |
| Step 6 | High | 60 min |
| Step 7 | High | 60 min |
| Step 8 | Medium | 30 min |
| Step 9 | Low | 10 min |
| **Total** | | ~5 hours |

---

## Success Criteria

Phase 4 is complete when:
1. Vendor dashboard loads with real stats
2. Vendor can manage orders (view, update status, add tracking)
3. Vendor can view payout history
4. Sales analytics chart works
5. All pages are responsive
6. Build passes with no errors
