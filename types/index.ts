// Base type definitions for B_Kart marketplace

// User Roles
export type UserRole = 'customer' | 'vendor' | 'admin';

// User and Profile Types
export interface User {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

// Auth Types
export interface AuthSession {
  user: User;
  profile: Profile;
  accessToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials extends LoginCredentials {
  full_name: string;
  role: UserRole;
}

// API Response Types
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

// Common Status Types
export type Status = 'active' | 'inactive' | 'pending' | 'suspended' | 'archived';

// Filter and Sort Types
export interface FilterParams {
  [key: string]: string | number | boolean | string[] | number[] | undefined;
}

export interface SortParams {
  field: string;
  direction: 'asc' | 'desc';
}

// Image Type
export interface Image {
  id: string;
  url: string;
  alt_text?: string;
  sort_order?: number;
}

// Address Type
export interface Address {
  id: string;
  user_id: string;
  type: 'shipping' | 'billing';
  full_name: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone: string;
  is_default: boolean;
}

// Database Types (will be extended in specific type files)
export type { Database } from './database';
