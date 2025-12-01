import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  try {
    // Get user session
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error('[Middleware] Auth error:', userError);
    }

    // Protected routes that require authentication
    const protectedRoutes = ['/account', '/checkout', '/vendor', '/admin'];
    const isProtectedRoute = protectedRoutes.some((route) =>
      request.nextUrl.pathname.startsWith(route)
    );

    // Allow access to select-role page for authenticated users
    if (request.nextUrl.pathname.startsWith('/select-role')) {
      if (!user) {
        return NextResponse.redirect(new URL('/login', request.url));
      }
      return response;
    }

    // Redirect to login if accessing protected route without authentication
    if (isProtectedRoute && !user) {
      console.log('[Middleware] Unauthenticated access to protected route, redirecting to login');
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('redirectTo', request.nextUrl.pathname);
      return NextResponse.redirect(url);
    }

    // Role-based access control
    if (user) {
      try {
        // Fetch user profile with error handling
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        // Handle missing profile
        if (profileError) {
          console.error('[Middleware] Profile fetch error:', profileError);
          
          if (profileError.code === 'PGRST116') {
            // Profile doesn't exist - redirect to select-role for new OAuth users
            console.log('[Middleware] Profile not found, redirecting to select-role');
            
            // Don't redirect if already on auth pages
            if (!request.nextUrl.pathname.startsWith('/select-role') && 
                !request.nextUrl.pathname.startsWith('/login') && 
                !request.nextUrl.pathname.startsWith('/signup')) {
              return NextResponse.redirect(new URL('/select-role', request.url));
            }
            return response;
          }
          
          // Other profile errors - allow through but log
          console.warn('[Middleware] Profile error, allowing request:', profileError);
          return response;
        }

        if (!profile) {
          console.warn('[Middleware] No profile found for authenticated user');
          
          // Redirect to select-role if not already there
          if (!request.nextUrl.pathname.startsWith('/select-role') && 
              !request.nextUrl.pathname.startsWith('/login')) {
            return NextResponse.redirect(new URL('/select-role', request.url));
          }
          return response;
        }

        console.log('[Middleware] User authenticated with role:', profile.role);

        // Admin routes - require admin role
        if (
          request.nextUrl.pathname.startsWith('/admin') &&
          profile.role !== 'admin'
        ) {
          console.log('[Middleware] Non-admin trying to access admin routes');
          return NextResponse.redirect(new URL('/', request.url));
        }

        // Vendor routes - require vendor or admin role
        if (request.nextUrl.pathname.startsWith('/vendor')) {
          if (profile.role !== 'vendor' && profile.role !== 'admin') {
            console.log('[Middleware] Non-vendor trying to access vendor routes');
            return NextResponse.redirect(new URL('/', request.url));
          }

          // Check if vendor has completed onboarding
          if (profile.role === 'vendor' && !request.nextUrl.pathname.startsWith('/vendor/onboarding')) {
            const { data: vendor, error: vendorError } = await supabase
              .from('vendors')
              .select('id, status, store_name')
              .eq('user_id', user.id)
              .single();

            if (vendorError) {
              console.error('[Middleware] Vendor fetch error:', vendorError);
            }

            // Redirect to onboarding if vendor profile doesn't exist or isn't complete
            if (!vendor || !vendor.store_name) {
              console.log('[Middleware] Vendor needs onboarding');
              return NextResponse.redirect(new URL('/onboarding', request.url));
            }
          }
        }

        // Prevent non-vendors from accessing onboarding
        if (
          request.nextUrl.pathname.startsWith('/onboarding') &&
          profile.role !== 'vendor'
        ) {
          console.log('[Middleware] Non-vendor trying to access onboarding');
          return NextResponse.redirect(new URL('/', request.url));
        }
      } catch (error) {
        console.error('[Middleware] Unexpected error in role check:', error);
        // Allow request through on unexpected errors to avoid blocking users
        return response;
      }
    }

    return response;
  } catch (error) {
    console.error('[Middleware] Unexpected error:', error);
    // On critical errors, allow the request through to avoid blocking
    return response;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
