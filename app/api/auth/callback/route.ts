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
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  try {
    const supabase = await createClient();
    
    // Step 1: Exchange authorization code for session
    console.log('[OAuth Callback] Exchanging code for session...');
    const { data: { session }, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);
    
    if (sessionError) {
      console.error('[OAuth Callback] Session exchange failed:', sessionError);
      return NextResponse.redirect(`${origin}/login?error=session_exchange_failed&message=${encodeURIComponent(sessionError.message)}`);
    }

    if (!session?.user) {
      console.error('[OAuth Callback] No user in session after exchange');
      return NextResponse.redirect(`${origin}/login?error=no_session_user`);
    }

    const user = session.user;
    console.log('[OAuth Callback] Session established for user:', user.id);
    console.log('[OAuth Callback] User metadata:', user.user_metadata);

    // Step 2: Check if profile exists
    const { data: existingProfile, error: profileFetchError } = await supabase
      .from('profiles')
      .select('id, role, full_name, avatar_url')
      .eq('id', user.id)
      .single();

    if (profileFetchError && profileFetchError.code !== 'PGRST116') {
      console.error('[OAuth Callback] Profile fetch error:', profileFetchError);
    }

    let userRole: UserRole = 'customer';
    let profileCreated = false;

    // Step 3: Create profile if it doesn't exist (fallback if trigger failed)
    if (!existingProfile) {
      console.log('[OAuth Callback] Profile not found, creating new profile...');
      
      // Extract user metadata from OAuth provider
      const fullName = user.user_metadata?.full_name || 
                      user.user_metadata?.name || 
                      user.user_metadata?.full_name ||
                      user.email?.split('@')[0] || 
                      'User';
      
      const avatarUrl = user.user_metadata?.avatar_url || 
                       user.user_metadata?.picture || 
                       user.user_metadata?.avatar_url ||
                       null;

      // Check if role was stored in localStorage (via state parameter)
      const intendedRole = user.user_metadata?.intended_role as UserRole | undefined;
      userRole = intendedRole || 'customer';

      console.log('[OAuth Callback] Creating profile with:', { 
        userId: user.id, 
        fullName, 
        avatarUrl, 
        role: userRole 
      });

      // Use admin client to create profile (bypasses RLS)
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
          }
        } else {
          console.error('[OAuth Callback] Profile creation failed:', profileError);
          return NextResponse.redirect(`${origin}/login?error=profile_creation_failed&message=${encodeURIComponent(profileError.message)}`);
        }
      } else {
        profileCreated = true;
        console.log('[OAuth Callback] Profile created successfully');
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
    
    // Customer goes to account page
    return NextResponse.redirect(`${origin}/account`);
    
  } catch (error: any) {
    console.error('[OAuth Callback] Unexpected error:', error);
    return NextResponse.redirect(`${origin}/login?error=oauth_callback_failed&message=${encodeURIComponent(error?.message || 'Unknown error')}`);
  }
}
