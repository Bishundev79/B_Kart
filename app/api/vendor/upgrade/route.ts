import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user already has a vendor role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('[Vendor Upgrade] Profile fetch error:', profileError);
      return NextResponse.json(
        { error: 'Failed to fetch user profile' },
        { status: 500 }
      );
    }

    if (profile.role === 'vendor') {
      return NextResponse.json(
        { error: 'User is already a vendor' },
        { status: 400 }
      );
    }

    if (profile.role === 'admin') {
      return NextResponse.json(
        { error: 'Admins cannot become vendors' },
        { status: 400 }
      );
    }

    // Upgrade user to vendor role
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ role: 'vendor' })
      .eq('id', user.id);

    if (updateError) {
      console.error('[Vendor Upgrade] Role update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to upgrade to vendor' },
        { status: 500 }
      );
    }

    console.log('[Vendor Upgrade] User upgraded to vendor:', user.id);

    return NextResponse.json({
      success: true,
      message: 'Successfully upgraded to vendor',
    });
  } catch (error: any) {
    console.error('[Vendor Upgrade] Unexpected error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
