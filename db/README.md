# Database

This folder contains database-related files for B_Kart marketplace.

## Structure

- `schema.sql` - Main database schema definition (to be created in Phase 1)
- `migrations/` - Database migration files
- `seeds/` - Seed data for development and testing

## Setup

Database schema will be created in Phase 1 using Supabase.

### Tables to be created:
- profiles (user profiles)
- vendors (vendor stores)
- categories (product categories)
- products (product catalog)
- product_images (product images)
- product_variants (product variants)
- cart_items (shopping cart)
- orders (order management)
- order_items (order line items)
- order_tracking (order status tracking)
- product_reviews (customer reviews)
- wishlists (customer wishlists)
- payments (payment records)
- vendor_payouts (vendor payouts)
- platform_settings (platform configuration)
- notifications (user notifications)
- addresses (customer addresses)

## Notes

- All tables will have Row Level Security (RLS) policies
- Timestamps (created_at, updated_at) will be automatic
- Foreign key constraints will be enforced
