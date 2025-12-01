// Auth type definitions for B_Kart marketplace

import { User as SupabaseUser, Session } from '@supabase/supabase-js';

// User Roles
export type UserRole = 'customer' | 'vendor' | 'admin';

// Profile from database
export interface Profile {
  id: string;
  role: UserRole;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

// Extended user with profile
export interface User extends SupabaseUser {
  profile?: Profile;
}

// Auth session with profile
export interface AuthSession {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
}

// Login credentials
export interface LoginCredentials {
  email: string;
  password: string;
}

// Signup credentials
export interface SignupCredentials {
  email: string;
  password: string;
  full_name: string;
  role: UserRole;
}

// Password reset request
export interface ForgotPasswordRequest {
  email: string;
}

// Password reset
export interface ResetPasswordRequest {
  password: string;
  confirmPassword: string;
}

// Profile update data
export interface ProfileUpdateData {
  full_name?: string;
  avatar_url?: string;
  phone?: string;
}

// Auth state for Zustand store
export interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  initialized: boolean;
  error: string | null;
}

// Auth actions for Zustand store
export interface AuthActions {
  initialize: () => Promise<void>;
  signIn: (credentials: LoginCredentials) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signUp: (credentials: SignupCredentials) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  updateProfile: (data: ProfileUpdateData) => Promise<{ error: string | null }>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (password: string) => Promise<{ error: string | null }>;
  clearError: () => void;
  setProfile: (profile: Profile) => void;
}

// Combined store type
export type AuthStore = AuthState & AuthActions;

// Auth form states
export type AuthFormState = 'idle' | 'loading' | 'success' | 'error';

// OAuth providers
export type OAuthProvider = 'google' | 'github' | 'facebook';

// Auth redirect options
export interface AuthRedirectOptions {
  redirectTo?: string;
  shouldCreateUser?: boolean;
}
