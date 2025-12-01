'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createClient } from '@/lib/supabase/client';
import type {
  AuthStore,
  LoginCredentials,
  SignupCredentials,
  ProfileUpdateData,
  Profile,
  User,
} from '@/types/auth';

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      session: null,
      profile: null,
      loading: false,
      initialized: false,
      error: null,

      // Initialize auth state
      initialize: async () => {
        const supabase = createClient();

        try {
          set({ loading: true });
          console.log('[Auth Store] Initializing auth state...');

          // Get current session
          const {
            data: { session },
            error: sessionError,
          } = await supabase.auth.getSession();

          if (sessionError) {
            console.error('[Auth Store] Session error:', sessionError);
            throw sessionError;
          }

          if (session?.user) {
            console.log('[Auth Store] Session found for user:', session.user.id);

            // Fetch profile with retry logic
            let profile = null;
            let retryCount = 0;
            const maxRetries = 3;

            while (retryCount < maxRetries) {
              const { data: fetchedProfile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();

              if (fetchedProfile) {
                profile = fetchedProfile;
                console.log('[Auth Store] Profile loaded:', profile.role);
                break;
              }

              if (profileError && profileError.code !== 'PGRST116') {
                console.error('[Auth Store] Profile fetch error:', profileError);
              }

              // If profile not found, wait and retry (may be race condition with trigger)
              if (profileError?.code === 'PGRST116' && retryCount < maxRetries - 1) {
                console.log('[Auth Store] Profile not found, retrying...', retryCount + 1);
                await new Promise(resolve => setTimeout(resolve, 1000));
                retryCount++;
              } else {
                break;
              }
            }

            set({
              user: session.user as User,
              session,
              profile: profile || null,
              initialized: true,
              loading: false,
              error: null,
            });
          } else {
            console.log('[Auth Store] No active session');
            set({
              user: null,
              session: null,
              profile: null,
              initialized: true,
              loading: false,
              error: null,
            });
          }

          // Listen for auth changes
          supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('[Auth Store] Auth state changed:', event);

            if (event === 'SIGNED_IN' && session?.user) {
              // Fetch profile with delay to allow trigger to complete
              await new Promise(resolve => setTimeout(resolve, 500));
              
              const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();

              console.log('[Auth Store] User signed in, profile:', profile?.role);

              set({
                user: session.user as User,
                session,
                profile: profile || null,
                error: null,
              });
            } else if (event === 'SIGNED_OUT') {
              console.log('[Auth Store] User signed out');
              set({
                user: null,
                session: null,
                profile: null,
                error: null,
              });
            } else if (event === 'TOKEN_REFRESHED' && session) {
              console.log('[Auth Store] Token refreshed');
              set({ session });
            } else if (event === 'USER_UPDATED' && session) {
              console.log('[Auth Store] User updated');
              // Refetch profile on user update
              const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();
              
              set({
                user: session.user as User,
                session,
                profile: profile || null,
              });
            }
          });
        } catch (error: any) {
          console.error('[Auth Store] Initialization error:', error);
          set({
            user: null,
            session: null,
            profile: null,
            initialized: true,
            loading: false,
            error: error?.message || 'Failed to initialize authentication',
          });
        }
      },

      // Sign in with email and password
      signIn: async (credentials: LoginCredentials) => {
        const supabase = createClient();

        try {
          set({ loading: true, error: null });
          console.log('[Auth Store] Signing in with email:', credentials.email);

          const { data, error } = await supabase.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
          });

          if (error) {
            console.error('[Auth Store] Sign in error:', error);
            
            // Provide user-friendly error messages
            let errorMessage = 'Failed to sign in';
            if (error.message.includes('Invalid login credentials')) {
              errorMessage = 'Invalid email or password';
            } else if (error.message.includes('Email not confirmed')) {
              errorMessage = 'Please confirm your email address before signing in';
            } else {
              errorMessage = error.message;
            }
            
            throw new Error(errorMessage);
          }

          if (data.session?.user) {
            console.log('[Auth Store] Sign in successful, fetching profile...');

            // Fetch profile
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', data.session.user.id)
              .single();

            if (profileError && profileError.code !== 'PGRST116') {
              console.error('[Auth Store] Profile fetch error:', profileError);
            }

            if (!profile) {
              console.warn('[Auth Store] No profile found for user');
            }

            set({
              user: data.session.user as User,
              session: data.session,
              profile: profile || null,
              loading: false,
              error: null,
            });

            console.log('[Auth Store] User signed in successfully, role:', profile?.role);
          }

          return { error: null };
        } catch (error: any) {
          const errorMessage = error?.message || 'Failed to sign in';
          console.error('[Auth Store] Sign in failed:', errorMessage);
          set({ loading: false, error: errorMessage });
          return { error: errorMessage };
        }
      },

      // Sign in with Google
      signInWithGoogle: async () => {
        const supabase = createClient();

        try {
          set({ loading: true, error: null });
          console.log('[Auth Store] Initiating Google OAuth sign in...');

          const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
              redirectTo: `${window.location.origin}/api/auth/callback`,
              queryParams: {
                access_type: 'offline',
                prompt: 'consent',
              },
            },
          });

          if (error) {
            console.error('[Auth Store] Google OAuth error:', error);
            throw error;
          }

          // OAuth redirect initiated - loading state will persist until redirect
          console.log('[Auth Store] OAuth redirect initiated');
          return { error: null };
        } catch (error: any) {
          const errorMessage = error?.message || 'Failed to sign in with Google';
          console.error('[Auth Store] Google sign in failed:', errorMessage);
          set({ loading: false, error: errorMessage });
          return { error: errorMessage };
        }
      },

      // Sign up with email and password
      signUp: async (credentials: SignupCredentials) => {
        try {
          set({ loading: true, error: null });
          console.log('[Auth Store] Signing up user:', credentials.email, 'as', credentials.role);

          // Call our API instead of directly calling Supabase
          const response = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials),
          });

          const data = await response.json();

          if (!response.ok) {
            console.error('[Auth Store] Signup error:', data.error);
            
            // Provide user-friendly error messages
            let errorMessage = data.error || 'Failed to sign up';
            if (errorMessage.includes('already registered')) {
              errorMessage = 'An account with this email already exists';
            } else if (errorMessage.includes('Password should be')) {
              errorMessage = 'Password must be at least 6 characters long';
            }
            
            throw new Error(errorMessage);
          }

          console.log('[Auth Store] Signup successful:', data);
          set({ loading: false, error: null });

          return { 
            error: null, 
            requiresConfirmation: data.requiresConfirmation,
            redirectTo: data.redirectTo 
          };
        } catch (error: any) {
          const errorMessage = error?.message || 'Failed to sign up';
          console.error('[Auth Store] Signup failed:', errorMessage);
          set({ loading: false, error: errorMessage });
          return { error: errorMessage };
        }
      },

      // Sign out
      signOut: async () => {
        const supabase = createClient();

        try {
          set({ loading: true, error: null });

          const { error } = await supabase.auth.signOut();

          if (error) throw error;

          set({
            user: null,
            session: null,
            profile: null,
            loading: false,
            error: null,
          });
        } catch (error: any) {
          console.error('Error signing out:', error);
          set({
            user: null,
            session: null,
            profile: null,
            loading: false,
            error: null,
          });
        }
      },

      // Update profile
      updateProfile: async (data: ProfileUpdateData) => {
        const supabase = createClient();
        const { user } = get();

        if (!user) {
          return { error: 'Not authenticated' };
        }

        try {
          set({ loading: true, error: null });

          const { data: updatedProfile, error } = await supabase
            .from('profiles')
            .update({
              full_name: data.full_name,
              avatar_url: data.avatar_url,
              phone: data.phone,
            })
            .eq('id', user.id)
            .select()
            .single();

          if (error) throw error;

          set({
            profile: updatedProfile,
            loading: false,
            error: null,
          });

          return { error: null };
        } catch (error: any) {
          const errorMessage = error?.message || 'Failed to update profile';
          set({ loading: false, error: errorMessage });
          return { error: errorMessage };
        }
      },

      // Request password reset
      resetPassword: async (email: string) => {
        const supabase = createClient();

        try {
          set({ loading: true, error: null });

          const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
          });

          if (error) throw error;

          set({ loading: false, error: null });

          return { error: null };
        } catch (error: any) {
          const errorMessage = error?.message || 'Failed to send reset email';
          set({ loading: false, error: errorMessage });
          return { error: errorMessage };
        }
      },

      // Update password
      updatePassword: async (password: string) => {
        const supabase = createClient();

        try {
          set({ loading: true, error: null });

          const { error } = await supabase.auth.updateUser({
            password,
          });

          if (error) throw error;

          set({ loading: false, error: null });

          return { error: null };
        } catch (error: any) {
          const errorMessage = error?.message || 'Failed to update password';
          set({ loading: false, error: errorMessage });
          return { error: errorMessage };
        }
      },

      // Clear error
      clearError: () => {
        set({ error: null });
      },

      // Set profile (used after onboarding)
      setProfile: (profile: Profile) => {
        set({ profile });
      },
    }),
    {
      name: 'b-kart-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist non-sensitive data
        initialized: state.initialized,
      }),
    }
  )
);

// Selector hooks for common use cases
export const useUser = () => useAuthStore((state) => state.user);
export const useProfile = () => useAuthStore((state) => state.profile);
export const useSession = () => useAuthStore((state) => state.session);
export const useAuthLoading = () => useAuthStore((state) => state.loading);
export const useAuthError = () => useAuthStore((state) => state.error);
export const useIsAuthenticated = () => useAuthStore((state) => !!state.user);
export const useUserRole = () => useAuthStore((state) => state.profile?.role);
export const useIsVendor = () =>
  useAuthStore((state) => state.profile?.role === 'vendor');
export const useIsAdmin = () =>
  useAuthStore((state) => state.profile?.role === 'admin');
