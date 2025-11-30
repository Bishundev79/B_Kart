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

          // Get current session
          const {
            data: { session },
            error: sessionError,
          } = await supabase.auth.getSession();

          if (sessionError) throw sessionError;

          if (session?.user) {
            // Fetch profile
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (profileError && profileError.code !== 'PGRST116') {
              console.error('Error fetching profile:', profileError);
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
            if (event === 'SIGNED_IN' && session?.user) {
              // Fetch profile
              const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();

              set({
                user: session.user as User,
                session,
                profile: profile || null,
                error: null,
              });
            } else if (event === 'SIGNED_OUT') {
              set({
                user: null,
                session: null,
                profile: null,
                error: null,
              });
            } else if (event === 'TOKEN_REFRESHED' && session) {
              set({ session });
            }
          });
        } catch (error) {
          console.error('Error initializing auth:', error);
          set({
            user: null,
            session: null,
            profile: null,
            initialized: true,
            loading: false,
            error: 'Failed to initialize authentication',
          });
        }
      },

      // Sign in with email and password
      signIn: async (credentials: LoginCredentials) => {
        const supabase = createClient();

        try {
          set({ loading: true, error: null });

          const { data, error } = await supabase.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
          });

          if (error) throw error;

          if (data.session?.user) {
            // Fetch profile
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', data.session.user.id)
              .single();

            if (profileError && profileError.code !== 'PGRST116') {
              console.error('Error fetching profile:', profileError);
            }

            set({
              user: data.session.user as User,
              session: data.session,
              profile: profile || null,
              loading: false,
              error: null,
            });
          }

          return { error: null };
        } catch (error: any) {
          const errorMessage = error?.message || 'Failed to sign in';
          set({ loading: false, error: errorMessage });
          return { error: errorMessage };
        }
      },

      // Sign up with email and password
      signUp: async (credentials: SignupCredentials) => {
        const supabase = createClient();

        try {
          set({ loading: true, error: null });

          const { data, error } = await supabase.auth.signUp({
            email: credentials.email,
            password: credentials.password,
            options: {
              data: {
                full_name: credentials.full_name,
                role: credentials.role,
              },
              emailRedirectTo: `${window.location.origin}/api/auth/callback`,
            },
          });

          if (error) throw error;

          set({ loading: false, error: null });

          return { error: null };
        } catch (error: any) {
          const errorMessage = error?.message || 'Failed to sign up';
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
