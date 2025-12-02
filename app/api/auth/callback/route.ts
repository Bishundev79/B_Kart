import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';
import type { UserRole } from '@/types/auth';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');
  const origin = requestUrl.origin;

  console.log('[OAuth Callback] Started', { code: !!code, error, errorDescription });

  // Handle OAuth errors from provider
  if (error) {
    console.error('[OAuth Callback] Provider error:', error, errorDescription);
    return NextResponse.redirect(`${origin}/login?error=oauth_provider_error&message=${encodeURIComponent(errorDescription || error)}`);
  }

  // Require authorization code
  if (!code) {
    console.error('[OAuth Callback] No authorization code provided');
    return NextResponse.redirect(`${origin}/login?error=missing_code&message=${encodeURIComponent('No authorization code received from provider')}`);
  }

  try {
    // Validate environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('[OAuth Callback] Missing Supabase environment variables');
      return NextResponse.redirect(`${origin}/login?error=configuration_error&message=${encodeURIComponent('Server configuration error. Please contact support.')}`);
    }

    const supabase = await createClient();
    
    // Step 1: Exchange authorization code for session
    console.log('[OAuth Callback] Exchanging code for session...');
    const { data: { session }, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);
    
    if (sessionError) {
      console.error('[OAuth Callback] Session exchange failed:', sessionError);
      // Provide more specific error messages based on error type
      let errorMessage = sessionError.message;
      if (sessionError.message.includes('expired') || sessionError.message.includes('invalid')) {
        errorMessage = 'Authentication session expired. Please try signing in again.';
      } else if (sessionError.message.includes('PKCE')) {
        errorMessage = 'Authentication verification failed. Please clear your browser cache and try again.';
      }
      return NextResponse.redirect(`${origin}/login?error=session_exchange_failed&message=${encodeURIComponent(errorMessage)}`);
    }

    if (!session?.user) {
      console.error('[OAuth Callback] No user in session after exchange');
      return NextResponse.redirect(`${origin}/login?error=no_session_user&message=${encodeURIComponent('No user session created. Please try signing in again.')}`);
    }

    const user = session.user;
    console.log('[OAuth Callback] Session established for user:', user.id);
    console.log('[OAuth Callback] User email:', user.email);
    console.log('[OAuth Callback] User metadata:', JSON.stringify(user.user_metadata));

    // Step 2: Check if profile exists with retry logic
    let existingProfile = null;
    let profileFetchError = null;
    
    // Retry a few times in case the trigger is still creating the profile
    for (let attempt = 0; attempt < 3; attempt++) {
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('id, role, full_name, avatar_url')
        .eq('id', user.id)
        .single();
      
      if (profile) {
        existingProfile = profile;
        console.log('[OAuth Callback] Profile found on attempt', attempt + 1);
        break;
      }
      
      if (fetchError && fetchError.code !== 'PGRST116') {
        profileFetchError = fetchError;
        console.error('[OAuth Callback] Profile fetch error:', fetchError);
        break;
      }
      
      // Wait before retry (trigger might still be running)
      if (attempt < 2) {
        console.log('[OAuth Callback] Profile not found, waiting before retry...');
        await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
      }
    }

    let userRole: UserRole = 'customer';
    let profileCreated = false;

    // Step 3: Create profile if it doesn't exist (fallback if trigger failed)
    if (!existingProfile) {
      console.log('[OAuth Callback] Profile not found after retries, creating new profile...');
      
      // Extract user metadata from OAuth provider
      const fullName = user.user_metadata?.full_name || 
                      user.user_metadata?.name || 
                      user.email?.split('@')[0] || 
                      'User';
      
      const avatarUrl = user.user_metadata?.avatar_url || 
                       user.user_metadata?.picture || 
                       null;

      // Check if role was stored in user metadata
      const intendedRole = user.user_metadata?.intended_role as UserRole | undefined;
      userRole = intendedRole || 'customer';

      console.log('[OAuth Callback] Creating profile with:', { 
        userId: user.id, 
        fullName, 
        avatarUrl, 
        role: userRole 
      });

      // Check if admin client is properly configured
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.warn('[OAuth Callback] Service role key not configured, trying with regular client');
        // Try with regular client first (will work if RLS allows it)
        const { error: regularError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            full_name: fullName,
            avatar_url: avatarUrl,
            role: userRole,
          });
        
        if (regularError) {
          console.error('[OAuth Callback] Profile creation with regular client failed:', regularError);
          // Continue to admin client attempt
        } else {
          profileCreated = true;
          console.log('[OAuth Callback] Profile created successfully with regular client');
        }
      }
      
      // Use admin client to create profile (bypasses RLS)
      if (!profileCreated) {
        try {
          const adminClient = createAdminClient();
          const { error: profileError } = await adminClient
            .from('profiles')
            .insert({
              id: user.id,
              full_name: fullName,
              avatar_url: avatarUrl,
              role: userRole,
            });

          if (profileError) {
            // Check if it's a duplicate key error (profile was created by trigger in race condition)
            if (profileError.code === '23505') {
              console.log('[OAuth Callback] Profile already exists (race condition), fetching...');
              const { data: raceProfile } = await supabase
                .from('profiles')
                .select('id, role')
                .eq('id', user.id)
                .single();
              
              if (raceProfile) {
                userRole = raceProfile.role;
                existingProfile = raceProfile;
              }
            } else {
              console.error('[OAuth Callback] Profile creation failed:', profileError);
              // Don't fail the login completely - user is authenticated, just missing profile
              // Redirect to a page where they can complete their profile
              console.log('[OAuth Callback] Proceeding despite profile creation error');
            }
          } else {
            profileCreated = true;
            console.log('[OAuth Callback] Profile created successfully with admin client');
          }
        } catch (adminError: any) {
          console.error('[OAuth Callback] Admin client error:', adminError);
          // Check if this is due to missing service role key
          if (adminError?.message?.includes('supabaseKey')) {
            console.error('[OAuth Callback] Service role key is missing or invalid');
          }
        }
      }
    } else {
      userRole = existingProfile.role;
      console.log('[OAuth Callback] Existing profile found with role:', userRole);
    }

    // Step 4: For new OAuth users, redirect to role selection if role is customer (default)
    // This allows them to choose vendor if they want
    if (profileCreated && userRole === 'customer') {
      console.log('[OAuth Callback] New OAuth user, redirecting to role selection');
      return NextResponse.redirect(`${origin}/select-role`);
    }

    // Step 5: Redirect based on user role
    console.log('[OAuth Callback] Redirecting user based on role:', userRole);
    
    if (userRole === 'admin') {
      return NextResponse.redirect(`${origin}/admin/dashboard`);
    } else if (userRole === 'vendor') {
      // Check if vendor has completed onboarding
      const { data: vendor } = await supabase
        .from('vendors')
        .select('id, store_name')
        .eq('user_id', user.id)
        .single();
      
      if (!vendor || !vendor.store_name) {
        console.log('[OAuth Callback] Vendor needs onboarding');
        return NextResponse.redirect(`${origin}/onboarding`);
      }
      
      return NextResponse.redirect(`${origin}/vendor/dashboard`);
    }
    
    // Customer goes to home page (was account page, but let's redirect to home for better UX)
    return NextResponse.redirect(`${origin}/`);
    
  } catch (error: any) {
    console.error('[OAuth Callback] Unexpected error:', error);
    console.error('[OAuth Callback] Error stack:', error?.stack);
    return NextResponse.redirect(`${origin}/login?error=oauth_callback_failed&message=${encodeURIComponent(error?.message || 'An unexpected error occurred during authentication')}`);
  }
}
