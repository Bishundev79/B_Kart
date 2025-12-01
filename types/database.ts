// Auto-generated types from database schema
// These types match the Supabase database structure defined in db/schema.sql

// ============================================================================
// ENUMS
// ============================================================================

export type UserRole = 'customer' | 'vendor' | 'admin';
export type VendorStatus = 'pending' | 'approved' | 'suspended' | 'rejected';
export type ProductStatus = 'draft' | 'active' | 'inactive' | 'out_of_stock' | 'archived';
export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type OrderItemStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
export type ReviewStatus = 'pending' | 'approved' | 'rejected';
export type AddressType = 'billing' | 'shipping';
export type NotificationType = 'order' | 'promotion' | 'system' | 'vendor';
export type PayoutStatus = 'pending' | 'processing' | 'completed' | 'failed';

// ============================================================================
// TABLE TYPES
// ============================================================================

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Vendor {
  id: string;
  user_id: string;
  store_name: string;
  store_slug: string;
  store_description: string | null;
  store_logo: string | null;
  store_banner: string | null;
  business_email: string | null;
  business_phone: string | null;
  business_address: string | null;
  commission_rate: number;
  status: VendorStatus;
  rating: number;
  total_reviews: number;
  total_sales: number;
  balance: number;
  stripe_account_id: string | null;
  stripe_onboarding_complete: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  parent_id: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  vendor_id: string;
  category_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  price: number;
  compare_at_price: number | null;
  cost_price: number | null;
  sku: string | null;
  barcode: string | null;
  quantity: number;
  low_stock_threshold: number;
  weight: number | null;
  weight_unit: string;
  status: ProductStatus;
  is_featured: boolean;
  is_digital: boolean;
  rating_avg: number;
  rating_count: number;
  total_sales: number;
  meta_title: string | null;
  meta_description: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  alt_text: string | null;
  sort_order: number;
  is_primary: boolean;
  created_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  sku: string | null;
  price: number;
  compare_at_price: number | null;
  quantity: number;
  options: Record<string, string>;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  variant_id: string | null;
  quantity: number;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string;
  status: OrderStatus;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  shipping_amount: number;
  total: number;
  currency: string;
  shipping_address: Record<string, unknown>;
  billing_address: Record<string, unknown>;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  variant_id: string | null;
  vendor_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total: number;
  status: OrderItemStatus;
  product_snapshot: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface OrderTracking {
  id: string;
  order_id: string;
  order_item_id: string | null;
  carrier: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  status: string;
  status_details: string | null;
  location: string | null;
  estimated_delivery: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductReview {
  id: string;
  product_id: string;
  user_id: string;
  order_item_id: string | null;
  rating: number;
  title: string | null;
  comment: string | null;
  images: string[];
  status: ReviewStatus;
  helpful_count: number;
  verified_purchase: boolean;
  created_at: string;
  updated_at: string;
}

export interface Wishlist {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
}

export interface Payment {
  id: string;
  order_id: string;
  stripe_payment_intent_id: string | null;
  stripe_charge_id: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  payment_method: string | null;
  payment_method_details: Record<string, unknown>;
  failure_reason: string | null;
  refunded_amount: number;
  created_at: string;
  updated_at: string;
}

export interface VendorPayout {
  id: string;
  vendor_id: string;
  amount: number;
  currency: string;
  status: PayoutStatus;
  stripe_transfer_id: string | null;
  stripe_payout_id: string | null;
  period_start: string;
  period_end: string;
  items_count: number;
  commission_amount: number;
  notes: string | null;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlatformSettings {
  id: string;
  key: string;
  value: Record<string, unknown>;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, unknown>;
  read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface Address {
  id: string;
  user_id: string;
  type: AddressType;
  is_default: boolean;
  full_name: string;
  phone: string | null;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string | null;
  postal_code: string;
  country: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// EXTENDED TYPES (with relations)
// ============================================================================

export interface ProductWithImages extends Product {
  images: ProductImage[];
}

export interface ProductWithVendor extends Product {
  vendor: Vendor;
}

export interface ProductWithCategory extends Product {
  category: Category | null;
}

export interface ProductFull extends Product {
  vendor: Vendor;
  category: Category | null;
  images: ProductImage[];
  variants: ProductVariant[];
}

export interface OrderWithItems extends Order {
  items: OrderItem[];
}

export interface OrderItemWithProduct extends OrderItem {
  product: Product;
  variant: ProductVariant | null;
}

export interface OrderFull extends Order {
  items: (OrderItem & { product: Product; variant: ProductVariant | null })[];
  tracking: OrderTracking[];
  payment: Payment | null;
}

export interface CartItemWithProduct extends CartItem {
  product: Product;
  variant: ProductVariant | null;
}

export interface ReviewWithUser extends ProductReview {
  user: Pick<Profile, 'id' | 'full_name' | 'avatar_url'>;
}

export interface VendorWithProfile extends Vendor {
  profile: Profile;
}

export interface CategoryWithChildren extends Category {
  children: Category[];
}

export interface CategoryWithParent extends Category {
  parent: Category | null;
}

// ============================================================================
// INSERT/UPDATE TYPES
// ============================================================================

export type ProfileInsert = Omit<Profile, 'created_at' | 'updated_at'>;
export type ProfileUpdate = Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>;

export type VendorInsert = Omit<Vendor, 'id' | 'rating' | 'total_reviews' | 'total_sales' | 'balance' | 'created_at' | 'updated_at'>;
export type VendorUpdate = Partial<Omit<Vendor, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;

export type CategoryInsert = Omit<Category, 'id' | 'created_at' | 'updated_at'>;
export type CategoryUpdate = Partial<Omit<Category, 'id' | 'created_at' | 'updated_at'>>;

export type ProductInsert = Omit<Product, 'id' | 'rating' | 'total_reviews' | 'total_sales' | 'created_at' | 'updated_at'>;
export type ProductUpdate = Partial<Omit<Product, 'id' | 'vendor_id' | 'created_at' | 'updated_at'>>;

export type ProductImageInsert = Omit<ProductImage, 'id' | 'created_at'>;
export type ProductVariantInsert = Omit<ProductVariant, 'id' | 'created_at' | 'updated_at'>;
export type ProductVariantUpdate = Partial<Omit<ProductVariant, 'id' | 'product_id' | 'created_at' | 'updated_at'>>;

export type CartItemInsert = Omit<CartItem, 'id' | 'created_at' | 'updated_at'>;
export type CartItemUpdate = Pick<CartItem, 'quantity'>;

export type OrderInsert = Omit<Order, 'id' | 'order_number' | 'created_at' | 'updated_at'>;
export type OrderUpdate = Partial<Pick<Order, 'status' | 'notes'>>;

export type OrderItemInsert = Omit<OrderItem, 'id' | 'created_at' | 'updated_at'>;
export type OrderItemUpdate = Partial<Pick<OrderItem, 'status'>>;

export type OrderTrackingInsert = Omit<OrderTracking, 'id' | 'created_at' | 'updated_at'>;
export type OrderTrackingUpdate = Partial<Omit<OrderTracking, 'id' | 'order_id' | 'created_at' | 'updated_at'>>;

export type ProductReviewInsert = Omit<ProductReview, 'id' | 'helpful_count' | 'created_at' | 'updated_at'>;
export type ProductReviewUpdate = Partial<Pick<ProductReview, 'rating' | 'title' | 'comment' | 'images' | 'status'>>;

export type WishlistInsert = Omit<Wishlist, 'id' | 'created_at'>;

export type PaymentInsert = Omit<Payment, 'id' | 'created_at' | 'updated_at'>;
export type PaymentUpdate = Partial<Omit<Payment, 'id' | 'order_id' | 'created_at' | 'updated_at'>>;

export type VendorPayoutInsert = Omit<VendorPayout, 'id' | 'created_at' | 'updated_at'>;
export type VendorPayoutUpdate = Partial<Pick<VendorPayout, 'status' | 'stripe_transfer_id' | 'stripe_payout_id' | 'processed_at' | 'notes'>>;

export type NotificationInsert = Omit<Notification, 'id' | 'read' | 'read_at' | 'created_at'>;

export type AddressInsert = Omit<Address, 'id' | 'created_at' | 'updated_at'>;
export type AddressUpdate = Partial<Omit<Address, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;

// ============================================================================
// SUPABASE DATABASE TYPE (for client)
// ============================================================================

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
      };
      vendors: {
        Row: Vendor;
        Insert: VendorInsert;
        Update: VendorUpdate;
      };
      categories: {
        Row: Category;
        Insert: CategoryInsert;
        Update: CategoryUpdate;
      };
      products: {
        Row: Product;
        Insert: ProductInsert;
        Update: ProductUpdate;
      };
      product_images: {
        Row: ProductImage;
        Insert: ProductImageInsert;
        Update: Partial<ProductImage>;
      };
      product_variants: {
        Row: ProductVariant;
        Insert: ProductVariantInsert;
        Update: ProductVariantUpdate;
      };
      cart_items: {
        Row: CartItem;
        Insert: CartItemInsert;
        Update: CartItemUpdate;
      };
      orders: {
        Row: Order;
        Insert: OrderInsert;
        Update: OrderUpdate;
      };
      order_items: {
        Row: OrderItem;
        Insert: OrderItemInsert;
        Update: OrderItemUpdate;
      };
      order_tracking: {
        Row: OrderTracking;
        Insert: OrderTrackingInsert;
        Update: OrderTrackingUpdate;
      };
      product_reviews: {
        Row: ProductReview;
        Insert: ProductReviewInsert;
        Update: ProductReviewUpdate;
      };
      wishlists: {
        Row: Wishlist;
        Insert: WishlistInsert;
        Update: never;
      };
      payments: {
        Row: Payment;
        Insert: PaymentInsert;
        Update: PaymentUpdate;
      };
      vendor_payouts: {
        Row: VendorPayout;
        Insert: VendorPayoutInsert;
        Update: VendorPayoutUpdate;
      };
      platform_settings: {
        Row: PlatformSettings;
        Insert: Omit<PlatformSettings, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Pick<PlatformSettings, 'value' | 'description'>>;
      };
      notifications: {
        Row: Notification;
        Insert: NotificationInsert;
        Update: Partial<Pick<Notification, 'read' | 'read_at'>>;
      };
      addresses: {
        Row: Address;
        Insert: AddressInsert;
        Update: AddressUpdate;
      };
    };
    Views: {};
    Functions: {
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      is_vendor: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      get_user_vendor_id: {
        Args: Record<string, never>;
        Returns: string | null;
      };
      generate_order_number: {
        Args: Record<string, never>;
        Returns: string;
      };
      search_products: {
        Args: { search_query: string; category_slug?: string; min_price?: number; max_price?: number; sort_by?: string; sort_order?: string; page_size?: number; page_number?: number };
        Returns: Product[];
      };
    };
    Enums: {
      user_role: UserRole;
      vendor_status: VendorStatus;
      product_status: ProductStatus;
      order_status: OrderStatus;
      payment_status: PaymentStatus;
      order_item_status: OrderItemStatus;
      review_status: ReviewStatus;
      address_type: AddressType;
      notification_type: NotificationType;
      payout_status: PayoutStatus;
    };
  };
}
