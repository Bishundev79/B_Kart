export type DiscountType = 'PERCENTAGE' | 'FLAT';

export interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discount_type: DiscountType;
  discount_value: number;
  min_order_value: number | null;
  max_discount_amount: number | null;
  starts_at: string;
  expires_at: string | null;
  max_uses: number | null;
  used_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CouponValidationResult {
  isValid: boolean;
  coupon?: Coupon;
  discountAmount: number;
  error?: string;
}

export interface CreateCouponInput {
  code: string;
  description?: string;
  discount_type: DiscountType;
  discount_value: number;
  min_order_value?: number;
  max_discount_amount?: number;
  starts_at: string;
  expires_at?: string;
  max_uses?: number;
  is_active?: boolean;
}

export interface UpdateCouponInput extends Partial<CreateCouponInput> {}
