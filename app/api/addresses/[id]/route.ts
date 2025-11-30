import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { addressUpdateSchema } from '@/lib/validations/profile';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/addresses/[id] - Get a specific address
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

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

    const { data: address, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Address not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching address:', error);
      return NextResponse.json(
        { error: 'Failed to fetch address' },
        { status: 500 }
      );
    }

    return NextResponse.json({ address });
  } catch (error) {
    console.error('Address GET error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// PATCH /api/addresses/[id] - Update an address
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

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

    const body = await request.json();

    // Validate request body
    const validationResult = addressUpdateSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const updateData = validationResult.data;

    // If setting as default, unset other defaults of same type
    if (updateData.is_default && updateData.type) {
      await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', user.id)
        .eq('type', updateData.type)
        .neq('id', id);
    }

    const { data: address, error } = await supabase
      .from('addresses')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Address not found' },
          { status: 404 }
        );
      }
      console.error('Error updating address:', error);
      return NextResponse.json(
        { error: 'Failed to update address' },
        { status: 500 }
      );
    }

    return NextResponse.json({ address });
  } catch (error) {
    console.error('Address PATCH error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// DELETE /api/addresses/[id] - Delete an address
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

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

    const { error } = await supabase
      .from('addresses')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting address:', error);
      return NextResponse.json(
        { error: 'Failed to delete address' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Address DELETE error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
