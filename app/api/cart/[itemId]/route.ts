import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updateCartItemSchema } from '@/lib/validations/cart';

interface RouteParams {
  params: Promise<{ itemId: string }>;
}

// PATCH /api/cart/[itemId] - Update cart item quantity
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { itemId } = await params;
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse and validate request body
    const body = await request.json();
    console.log('[API] PATCH cart item - body received:', body, 'itemId:', itemId);
    
    const result = updateCartItemSchema.safeParse(body);
    
    if (!result.success) {
      console.error('[API] Validation failed:', result.error.errors);
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }
    
    const { quantity } = result.data;
    
    // Get cart item and verify ownership
    const { data: cartItem, error: fetchError } = await supabase
      .from('cart_items')
      .select(`
        id,
        user_id,
        product_id,
        variant_id,
        product:products (
          id,
          quantity,
          status
        ),
        variant:product_variants (
          id,
          quantity,
          is_active
        )
      `)
      .eq('id', itemId)
      .single();
    
    if (fetchError || !cartItem) {
      return NextResponse.json({ error: 'Cart item not found' }, { status: 404 });
    }
    
    if (cartItem.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    // Check product availability
    const productArray = cartItem.product as unknown as { status: string; quantity: number }[] | null;
    const product = productArray?.[0];
    if (!product || product.status !== 'active') {
      return NextResponse.json({ error: 'Product is no longer available' }, { status: 400 });
    }
    
    // Check inventory
    let availableQuantity = product.quantity;
    
    if (cartItem.variant_id) {
      const variantArray = cartItem.variant as unknown as { quantity: number; is_active: boolean }[] | null;
      const variant = variantArray?.[0];
      if (!variant || !variant.is_active) {
        return NextResponse.json({ error: 'Variant is no longer available' }, { status: 400 });
      }
      availableQuantity = variant.quantity;
    }
    
    if (quantity > availableQuantity) {
      return NextResponse.json(
        { error: `Only ${availableQuantity} items available` },
        { status: 400 }
      );
    }
    
    // Update quantity
    const { data, error: updateError } = await supabase
      .from('cart_items')
      .update({ quantity, updated_at: new Date().toISOString() })
      .eq('id', itemId)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error updating cart item:', updateError);
      return NextResponse.json({ error: 'Failed to update cart item' }, { status: 500 });
    }
    
    return NextResponse.json({ item: data, message: 'Quantity updated' });
  } catch (error) {
    console.error('Cart PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/cart/[itemId] - Remove item from cart
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { itemId } = await params;
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get cart item and verify ownership
    const { data: cartItem, error: fetchError } = await supabase
      .from('cart_items')
      .select('id, user_id')
      .eq('id', itemId)
      .single();
    
    if (fetchError || !cartItem) {
      return NextResponse.json({ error: 'Cart item not found' }, { status: 404 });
    }
    
    if (cartItem.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    // Delete cart item
    const { error: deleteError } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', itemId);
    
    if (deleteError) {
      console.error('Error deleting cart item:', deleteError);
      return NextResponse.json({ error: 'Failed to remove item' }, { status: 500 });
    }
    
    return NextResponse.json({ message: 'Item removed from cart' });
  } catch (error) {
    console.error('Cart DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
