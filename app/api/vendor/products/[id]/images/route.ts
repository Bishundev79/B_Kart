import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createProductImageSchema, updateProductImageSchema } from '@/lib/validations/product';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/vendor/products/[id]/images - Get product images
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

    // Fetch images
    const { data: images, error } = await supabase
      .from('product_images')
      .select('*')
      .eq('product_id', id)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching images:', error);
      return NextResponse.json({ error: 'Failed to fetch images' }, { status: 500 });
    }

    return NextResponse.json({ images });
  } catch (error) {
    console.error('Get images API error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

// POST /api/vendor/products/[id]/images - Add product image
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
    const validationResult = createProductImageSchema.safeParse({ ...body, product_id: id });

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const imageData = validationResult.data;

    // If setting as primary, unset other primary images
    if (imageData.is_primary) {
      await supabase
        .from('product_images')
        .update({ is_primary: false })
        .eq('product_id', id);
    }

    // Get next sort order
    const { data: lastImage } = await supabase
      .from('product_images')
      .select('sort_order')
      .eq('product_id', id)
      .order('sort_order', { ascending: false })
      .limit(1)
      .single();

    const sortOrder = imageData.sort_order ?? (lastImage ? lastImage.sort_order + 1 : 0);

    // Create image
    const { data: image, error } = await supabase
      .from('product_images')
      .insert({
        product_id: id,
        url: imageData.url,
        alt_text: imageData.alt_text,
        sort_order: sortOrder,
        is_primary: imageData.is_primary,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating image:', error);
      return NextResponse.json({ error: 'Failed to add image' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Image added successfully', image }, { status: 201 });
  } catch (error) {
    console.error('Add image API error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

// PATCH /api/vendor/products/[id]/images - Update image (expects image_id in body)
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
    const validationResult = updateProductImageSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const { id: imageId, ...updateData } = validationResult.data;

    // If setting as primary, unset other primary images
    if (updateData.is_primary) {
      await supabase
        .from('product_images')
        .update({ is_primary: false })
        .eq('product_id', id);
    }

    // Update image
    const { data: image, error } = await supabase
      .from('product_images')
      .update(updateData)
      .eq('id', imageId)
      .eq('product_id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating image:', error);
      return NextResponse.json({ error: 'Failed to update image' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Image updated successfully', image });
  } catch (error) {
    console.error('Update image API error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

// DELETE /api/vendor/products/[id]/images - Delete image (expects image_id in query)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const imageId = request.nextUrl.searchParams.get('image_id');

    if (!imageId) {
      return NextResponse.json({ error: 'Image ID is required' }, { status: 400 });
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

    // Delete image
    const { error } = await supabase
      .from('product_images')
      .delete()
      .eq('id', imageId)
      .eq('product_id', id);

    if (error) {
      console.error('Error deleting image:', error);
      return NextResponse.json({ error: 'Failed to delete image' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Delete image API error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
