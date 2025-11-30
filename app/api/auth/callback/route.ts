import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.session) {
      // Check if user has a profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.session.user.id)
        .single();

      // Redirect based on user role
      if (profile?.role === 'vendor') {
        // Check if vendor profile exists
        const { data: vendor } = await supabase
          .from('vendors')
          .select('id, status')
          .eq('user_id', data.session.user.id)
          .single();

        if (!vendor) {
          // Redirect to vendor onboarding
          return NextResponse.redirect(`${origin}/onboarding`);
        }

        if (vendor.status === 'pending') {
          // Redirect to pending approval page
          return NextResponse.redirect(`${origin}/vendor/pending`);
        }

        // Redirect to vendor dashboard
        return NextResponse.redirect(`${origin}/vendor/dashboard`);
      }

      // Redirect to the specified next page or home
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
