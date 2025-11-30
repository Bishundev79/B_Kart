import { z } from 'zod';

// ============================================================================
// REVIEW STATUS ENUM
// ============================================================================

export const reviewStatusEnum = z.enum(['pending', 'approved', 'rejected']);
export type ReviewStatusEnum = z.infer<typeof reviewStatusEnum>;

// ============================================================================
// CREATE REVIEW SCHEMA
// ============================================================================

export const createReviewSchema = z.object({
  product_id: z
    .string()
    .uuid('Invalid product ID'),
  
  rating: z
    .number()
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating must be at most 5')
    .int('Rating must be a whole number'),
  
  title: z
    .string()
    .max(200, 'Title must be less than 200 characters')
    .optional()
    .or(z.literal('')),
  
  comment: z
    .string()
    .max(5000, 'Comment must be less than 5,000 characters')
    .optional()
    .or(z.literal('')),
  
  images: z
    .array(z.string().url('Invalid image URL'))
    .max(5, 'Maximum 5 images allowed')
    .optional()
    .default([]),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;

// ============================================================================
// UPDATE REVIEW SCHEMA
// ============================================================================

export const updateReviewSchema = z.object({
  rating: z
    .number()
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating must be at most 5')
    .int('Rating must be a whole number')
    .optional(),
  
  title: z
    .string()
    .max(200, 'Title must be less than 200 characters')
    .optional()
    .nullable(),
  
  comment: z
    .string()
    .max(5000, 'Comment must be less than 5,000 characters')
    .optional()
    .nullable(),
  
  images: z
    .array(z.string().url('Invalid image URL'))
    .max(5, 'Maximum 5 images allowed')
    .optional(),
  
  status: reviewStatusEnum.optional(),
});

export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;

// ============================================================================
// REVIEW MODERATION SCHEMA (Admin)
// ============================================================================

export const moderateReviewSchema = z.object({
  status: reviewStatusEnum,
  rejection_reason: z
    .string()
    .max(500, 'Rejection reason must be less than 500 characters')
    .optional(),
});

export type ModerateReviewInput = z.infer<typeof moderateReviewSchema>;

// ============================================================================
// REVIEW QUERY SCHEMA
// ============================================================================

export const reviewQuerySchema = z.object({
  product_id: z.string().uuid().optional(),
  user_id: z.string().uuid().optional(),
  status: reviewStatusEnum.optional(),
  rating: z.coerce.number().min(1).max(5).optional(),
  verified_only: z.coerce.boolean().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(10),
  sort_by: z.enum(['created_at', 'rating', 'helpful_count']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

export type ReviewQueryInput = z.infer<typeof reviewQuerySchema>;

// ============================================================================
// HELPFUL VOTE SCHEMA
// ============================================================================

export const helpfulVoteSchema = z.object({
  review_id: z.string().uuid('Invalid review ID'),
  helpful: z.boolean(),
});

export type HelpfulVoteInput = z.infer<typeof helpfulVoteSchema>;
