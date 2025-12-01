import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const updateRoleSchema = z.object({
  role: z.enum(['customer', 'vendor'], {
    required_error: 'Role is required',
  }),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('[Update Role API] Received request:', body);

    // Validate input
    const validationResult = updateRoleSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors[0].message },
        { status: 400 }
      );
    }

    const { role } = validationResult.data;

    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('[Update Role API] Auth error:', authError);
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    console.log('[Update Role API] Updating role for user:', user.id, 'to', role);

    // Update user profile with selected role
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('[Update Role API] Update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update role' },
        { status: 500 }
      );
    }

    console.log('[Update Role API] Role updated successfully:', updatedProfile);

    return NextResponse.json({
      message: 'Role updated successfully',
      profile: updatedProfile,
    });
  } catch (error: any) {
    console.error('[Update Role API] Unexpected error:', error);
    return NextResponse.json(
      { error: error?.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
