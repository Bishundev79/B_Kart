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

    // Public routes - accessible to everyone
    const publicRoutes = [
      '/',
      '/products',
      '/categories',
      '/search',
      '/deals',
      '/about',
      '/contact',
      '/privacy',
      '/terms',
      '/sell-with-us',
    ];

    const isPublicRoute = publicRoutes.some((route) => 
      request.nextUrl.pathname === route || 
      request.nextUrl.pathname.startsWith(route + '/')
    );

    // Allow public routes without authentication
    if (isPublicRoute) {
      return response;
    }

    // Protected routes that require authentication
    const protectedRoutes = ['/account', '/checkout', '/orders', '/notifications', '/wishlist'];
    const isProtectedRoute = protectedRoutes.some((route) =>
      request.nextUrl.pathname.startsWith(route)
    );

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
            // Profile doesn't exist - this should be handled by the trigger, but as fallback:
            console.warn('[Middleware] Profile not found for user, allowing through (will be created on next action)');
          }
          
          // Allow through - profile will be created by trigger or upsert
          return response;
        }

        if (!profile) {
          console.warn('[Middleware] No profile found for authenticated user, allowing through');
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
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
