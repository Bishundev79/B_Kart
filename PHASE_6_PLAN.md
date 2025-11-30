# Phase 6 Plan: Vendor & Customer Experience Completion

## Scope Overview
We have completed Phases 0-5 (foundation, auth, catalog, checkout, admin, notifications). Phase 6 focuses on finishing all customer and vendor-facing workflows and polishing the overall UX.

## Problems To Resolve
1. **Vendors lack fulfillment tools**
   - No UI/APIs for viewing orders, updating statuses, or adding tracking.
   - No payout history or earnings visibility.
2. **Customers lack self-service dashboard**
   - No pages for profile updates, order history, addresses, or saved items.
   - Wishlist icon is non-functional; no wishlist API/store.
3. **Engagement features missing**
   - Product review system not exposed in UI.
   - Email notifications folder empty; no transactional emails.
4. **Search & discovery limitations**
   - No dedicated search results page or autocomplete; current filters are basic.
5. **SEO & marketing gaps**
   - SEO component folder empty; no structured data or sitemap.
6. **Payment lifecycle gaps**
   - Order cancellation lacks Stripe refund trigger.
   - No payout components or vendor Stripe Connect flow.
7. **Notification UX inconsistencies**
   - Bell/list components exist only for admin; customers/vendors lack notification surfaces.

## Implementation Plan
### 1. Vendor Fulfillment Suite
- API: `/api/vendor/orders` (list/detail/update) and `/api/vendor/orders/[id]/tracking`.
- Zustand: extend/create `vendorStore` with `fetchOrders`, `updateOrderStatus`, `addTracking`.
- UI: `app/vendor/dashboard/orders` list + detail pages with status pills, timeline, tracking form.

### 2. Vendor Payout Tracking & Stripe Connect
- API: `/api/vendor/payouts` (list) + `/api/vendor/payouts/initiate` for onboarding.
- UI: payout summary cards, table with status, Stripe onboarding banner.
- Component folder `components/payout/` populated with graph + history components.

### 3. Customer Dashboard & Wishlist
- Routes: `/account/profile`, `/account/orders`, `/account/addresses`, `/account/wishlist`.
- API: `/api/account/orders`, `/api/account/profile`, `/api/wishlist` (CRUD).
- Zustand: `wishlistStore` for optimistic add/remove.
- UI: Use existing AddressForm/order card components; add wishlist empty state & grid.

### 4. Product Reviews & Engagement
- API: `/api/products/[slug]/reviews` (GET/POST) + `/api/vendor/reviews` moderation.
- Components: `components/review/ReviewList`, `ReviewForm`, rating distribution bars.
- Integrate into product page and vendor dashboard.

### 5. Email Notifications
- Implement `lib/email/transport.ts` (Resend/SendGrid) and template helpers.
- Hook into checkout, vendor approval, order status updates, and notifications broadcast.

### 6. Advanced Search & SEO
- API: `/api/search` with Postgres `to_tsvector` and filters.
- Page: `/search` featuring query builder, chips, infinite scroll.
- Build `components/seo/Seo.tsx`, add JSON-LD to `app/products/[slug]`, generate `app/sitemap.ts`.

### 7. Payment Lifecycle Enhancements
- Implement Stripe refund in `/app/api/orders/[id]/route.ts` (existing TODO).
- Add saved payment method UI (components/payment/) and vendor payout components.

### 8. Cross-Role Notification UI
- Reuse notification store to render bell & panel in customer/vendor layouts.
- Add `/notifications` page with filters (order, system, vendor).

### 9. QA & Polish
- Finish TODOs (set primary product image, wishlist heart action).
- Add loading/error states to new pages.
- Run `npm run lint`, `npm run typecheck`, smoke tests after each milestone.

## Acceptance Criteria
- Vendors can manage orders and payouts entirely from the dashboard.
- Customers can manage profile, addresses, orders, wishlist without admin help.
- Reviews, wishlist, notifications, and emails improve engagement.
- Search + SEO boost discoverability.
- Stripe flows cover charge, refund, and vendor payout lifecycle.
