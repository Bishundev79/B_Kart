import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createProductVariantSchema, updateProductVariantSchema } from '@/lib/validations/product';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/vendor/products/[id]/variants - Get product variants
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Authenticate
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify vendor owns the product
    const { data: vendor } = await supabase
      .from('vendors')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor profile not found' }, { status: 403 });
    }

    const { data: product } = await supabase
      .from('products')
      .select('id')
      .eq('id', id)
      .eq('vendor_id', vendor.id)
      .single();

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Fetch variants
    const { data: variants, error } = await supabase
      .from('product_variants')
      .select('*')
      .eq('product_id', id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching variants:', error);
      return NextResponse.json({ error: 'Failed to fetch variants' }, { status: 500 });
    }

    return NextResponse.json({ variants });
  } catch (error) {
    console.error('Get variants API error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

// POST /api/vendor/products/[id]/variants - Add product variant
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Authenticate
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify vendor owns the product
    const { data: vendor } = await supabase
      .from('vendors')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor profile not found' }, { status: 403 });
    }

    const { data: product } = await supabase
      .from('products')
      .select('id')
      .eq('id', id)
      .eq('vendor_id', vendor.id)
      .single();

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Validate request body
    const body = await request.json();
    const validationResult = createProductVariantSchema.safeParse({ ...body, product_id: id });

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const variantData = validationResult.data;

    // Create variant
    const { data: variant, error } = await supabase
      .from('product_variants')
      .insert({
        product_id: id,
        name: variantData.name,
        sku: variantData.sku,
        price: variantData.price,
        compare_at_price: variantData.compare_at_price,
        quantity: variantData.quantity,
        options: variantData.options,
        image_url: variantData.image_url,
        is_active: variantData.is_active,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating variant:', error);
      return NextResponse.json({ error: 'Failed to add variant' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Variant added successfully', variant }, { status: 201 });
  } catch (error) {
    console.error('Add variant API error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

// PATCH /api/vendor/products/[id]/variants - Update variant (expects variant_id in body)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Authenticate
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify vendor owns the product
    const { data: vendor } = await supabase
      .from('vendors')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor profile not found' }, { status: 403 });
    }

    const { data: product } = await supabase
      .from('products')
      .select('id')
      .eq('id', id)
      .eq('vendor_id', vendor.id)
      .single();

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Validate request body
    const body = await request.json();
    const validationResult = updateProductVariantSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const { id: variantId, ...updateData } = validationResult.data;

    // Update variant
    const { data: variant, error } = await supabase
      .from('product_variants')
      .update(updateData)
      .eq('id', variantId)
      .eq('product_id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating variant:', error);
      return NextResponse.json({ error: 'Failed to update variant' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Variant updated successfully', variant });
  } catch (error) {
    console.error('Update variant API error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

// DELETE /api/vendor/products/[id]/variants - Delete variant (expects variant_id in query)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const variantId = request.nextUrl.searchParams.get('variant_id');

    if (!variantId) {
      return NextResponse.json({ error: 'Variant ID is required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Authenticate
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify vendor owns the product
    const { data: vendor } = await supabase
      .from('vendors')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor profile not found' }, { status: 403 });
    }

    const { data: product } = await supabase
      .from('products')
      .select('id')
      .eq('id', id)
      .eq('vendor_id', vendor.id)
      .single();

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Delete variant
    const { error } = await supabase
      .from('product_variants')
      .delete()
      .eq('id', variantId)
      .eq('product_id', id);

    if (error) {
      console.error('Error deleting variant:', error);
      return NextResponse.json({ error: 'Failed to delete variant' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Variant deleted successfully' });
  } catch (error) {
    console.error('Delete variant API error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
