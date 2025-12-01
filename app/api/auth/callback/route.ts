import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const origin = requestUrl.origin;

  if (code) {
    const supabase = await createClient();

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('OAuth callback error:', error);
      return NextResponse.redirect(`${origin}/login?error=Authentication failed. Please try again.`);
    }

    // Successful authentication - redirect to home
    return NextResponse.redirect(`${origin}/`);
  }

  // No code present
  return NextResponse.redirect(`${origin}/login?error=Authentication failed. Please try again.`);
}
