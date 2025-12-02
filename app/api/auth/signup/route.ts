import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';
import { signupSchema } from '@/lib/validations/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('[Signup API] Received signup request for:', body.email);

    // Validate input with Zod schema
    const validationResult = signupSchema.safeParse(body);
    if (!validationResult.success) {
      console.error('[Signup API] Validation failed:', validationResult.error);
      return NextResponse.json(
        { error: validationResult.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email, password, full_name, role } = validationResult.data;

    // Check for required environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('[Signup API] Missing Supabase environment variables');
      return NextResponse.json(
        { error: 'Server configuration error. Please contact support.' },
        { status: 500 }
      );
    }

    const supabase = await createClient();

    // Create user with Supabase Auth
    console.log('[Signup API] Creating user with role:', role);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name,
          role,
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/callback`,
      },
    });

    if (error) {
      console.error('[Signup API] Supabase signup error:', error);
      
      // Provide user-friendly error messages
      let errorMessage = error.message;
      if (error.message.includes('already registered')) {
        errorMessage = 'An account with this email already exists';
      } else if (error.message.includes('Password should be')) {
        errorMessage = 'Password must be at least 6 characters long';
      } else if (error.message.includes('invalid email')) {
        errorMessage = 'Please provide a valid email address';
      } else if (error.message.includes('rate limit')) {
        errorMessage = 'Too many signup attempts. Please try again later.';
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      );
    }

    if (!data.user) {
      console.error('[Signup API] No user data returned');
      return NextResponse.json(
        { error: 'Failed to create user account' },
        { status: 500 }
      );
    }

    console.log('[Signup API] User created:', data.user.id);

    // Verify profile was created by trigger
    // Add retry logic for race condition
    let profile = null;
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries && !profile) {
      await new Promise(resolve => setTimeout(resolve, retryCount * 500)); // Exponential backoff
      
      const { data: fetchedProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (fetchedProfile) {
        profile = fetchedProfile;
        console.log('[Signup API] Profile verified:', profile.role);
        break;
      }

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('[Signup API] Profile fetch error:', profileError);
      }

      retryCount++;
      console.log('[Signup API] Profile not found, retry:', retryCount);
    }

    // Fallback: Create profile manually if trigger failed
    if (!profile) {
      console.warn('[Signup API] Profile not created by trigger, creating manually...');
      
      try {
        const adminClient = createAdminClient();
        const { data: manualProfile, error: manualCreateError } = await adminClient
          .from('profiles')
          .insert({
            id: data.user.id,
            full_name,
            role,
            avatar_url: null,
            phone: null,
          })
          .select()
          .single();

        if (manualCreateError) {
          // Check if it's a duplicate (race condition)
          if (manualCreateError.code === '23505') {
            console.log('[Signup API] Profile created in race condition, fetching...');
            const { data: raceProfile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', data.user.id)
              .single();
            
            if (raceProfile) {
              profile = raceProfile;
            }
          } else {
            console.error('[Signup API] Manual profile creation failed:', manualCreateError);
            // Don't fail the signup - user account is created, profile can be fixed later
            console.log('[Signup API] Continuing despite profile creation failure');
          }
        } else {
          profile = manualProfile;
          console.log('[Signup API] Profile created manually');
        }
      } catch (adminError: any) {
        console.error('[Signup API] Admin client error:', adminError);
        // Continue without failing - the user is created
      }
    }

    // Check if email confirmation is required
    const requiresConfirmation = !data.session;
    
    if (requiresConfirmation) {
      console.log('[Signup API] Email confirmation required');
      return NextResponse.json({
        message: 'Please check your email to confirm your account',
        requiresConfirmation: true,
        user: {
          id: data.user.id,
          email: data.user.email,
        },
      });
    }

    // User is auto-confirmed (email confirmation disabled in Supabase)
    console.log('[Signup API] User auto-confirmed, session created');
    
    // Determine redirect based on role
    const redirectTo = role === 'vendor' ? '/onboarding' : '/account';
    
    return NextResponse.json({
      message: 'Account created successfully',
      requiresConfirmation: false,
      user: {
        id: data.user.id,
        email: data.user.email,
        role: profile?.role,
      },
      redirectTo,
    });
  } catch (error: any) {
    console.error('[Signup API] Unexpected error:', error);
    console.error('[Signup API] Error stack:', error?.stack);
    return NextResponse.json(
      { error: error?.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
