import { createClient } from '@/lib/supabase/server';
import { addToCartSchema } from '@/lib/validations/cart';
import {
  unauthorizedResponse,
  serverErrorResponse,
  validationErrorResponse,
  successResponse,
  notFoundResponse,
} from '@/lib/utils/api-response';

// Define types for Supabase query results
interface ProductData {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_at_price: number | null;
  quantity: number;
  status: string;
  vendor_id: string;
  vendor: { id: string; store_name: string; store_slug: string } | null;
  images: { id: string; url: string; alt_text: string | null; is_primary: boolean }[];
}

interface VariantData {
  id: string;
  name: string;
  price: number;
  compare_at_price: number | null;
  quantity: number;
  options: Record<string, string> | null;
  is_active: boolean;
}

// GET /api/cart - Fetch user's cart with products
export async function GET() {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return unauthorizedResponse('Please sign in to view your cart');
    }
    
    // Fetch cart items with product and variant details
    const { data: items, error } = await supabase
      .from('cart_items')
      .select(`
        id,
        user_id,
        product_id,
        variant_id,
        quantity,
        price_at_add,
        created_at,
        updated_at,
        product:products (
          id,
          name,
          slug,
          price,
          compare_at_price,
          quantity,
          status,
          vendor_id,
          vendor:vendors (
            id,
            store_name,
            store_slug
          ),
          images:product_images (
            id,
            url,
            alt_text,
            is_primary
          )
        ),
        variant:product_variants (
          id,
          name,
          price,
          compare_at_price,
          quantity,
          options,
          is_active
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching cart:', error);
      return serverErrorResponse('Failed to fetch cart items');
    }
    
    // Transform and filter out items with unavailable products
    const validItems = (items || []).filter((item) => {
      const product = item.product as unknown as ProductData | null;
      return product && product.status === 'active';
    }).map((item) => {
      const productData = item.product as unknown as ProductData;
      const variantData = item.variant as unknown as VariantData | null;
      
      return {
        ...item,
        product: {
          ...productData,
          inventory_quantity: productData?.quantity || 0,
        },
        variant: variantData ? {
          ...variantData,
          inventory_quantity: variantData.quantity || 0,
        } : null,
      };
    });
    
    // Calculate summary
    const summary = {
      subtotal: validItems.reduce((total, item) => {
        const price = item.variant?.price || item.product.price;
        return total + price * item.quantity;
      }, 0),
      itemCount: validItems.reduce((total, item) => total + item.quantity, 0),
      estimatedTax: 0,
      estimatedShipping: 0,
      total: 0,
    };
    summary.estimatedTax = summary.subtotal * 0.08;
    summary.estimatedShipping = summary.subtotal >= 100 ? 0 : 9.99;
    summary.total = summary.subtotal + summary.estimatedTax + summary.estimatedShipping;
    
    return successResponse({ items: validItems, summary });
  } catch (error) {
    console.error('Cart GET error:', error);
    return serverErrorResponse();
  }
}

// POST /api/cart - Add item to cart
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return unauthorizedResponse('Please sign in to add items to cart');
    }
    
    // Parse and validate request body
    const body = await request.json();
    const result = addToCartSchema.safeParse(body);
    
    if (!result.success) {
      return validationErrorResponse(
        result.error.errors[0].message,
        result.error.errors
      );
    }
    
    const { productId, variantId, quantity } = result.data;
    
    // Check if product exists and is active
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, price, quantity, status')
      .eq('id', productId)
      .single();
    
    if (productError || !product) {
      return notFoundResponse('Product not found');
    }
    
    if (product.status !== 'active') {
      return validationErrorResponse('Product is not available');
    }
    
    // Get price and check inventory
    let price = product.price;
    let availableQuantity = product.quantity;
    
    if (variantId) {
      const { data: variant, error: variantError } = await supabase
        .from('product_variants')
        .select('id, price, quantity, is_active')
        .eq('id', variantId)
        .eq('product_id', productId)
        .single();
      
      if (variantError || !variant) {
        return notFoundResponse('Variant not found');
      }
      
      if (!variant.is_active) {
        return validationErrorResponse('Variant is not available');
      }
      
      price = variant.price;
      availableQuantity = variant.quantity;
    }
    
    // Check if item already exists in cart
    const { data: existingItem } = await supabase
      .from('cart_items')
      .select('id, quantity')
      .eq('user_id', user.id)
      .eq('product_id', productId)
      .eq('variant_id', variantId || null)
      .maybeSingle();
    
    const newQuantity = existingItem ? existingItem.quantity + quantity : quantity;
    
    // Check inventory
    if (newQuantity > availableQuantity) {
      return validationErrorResponse(
        `Only ${availableQuantity} items available`
      );
    }
    
    let cartItem;
    
    if (existingItem) {
      // Update existing cart item
      const { data, error } = await supabase
        .from('cart_items')
        .update({ quantity: newQuantity, updated_at: new Date().toISOString() })
        .eq('id', existingItem.id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating cart item:', error);
        return serverErrorResponse('Failed to update cart');
      }
      
      cartItem = data;
    } else {
      // Create new cart item
      const { data, error } = await supabase
        .from('cart_items')
        .insert({
          user_id: user.id,
          product_id: productId,
          variant_id: variantId || null,
          quantity,
          price_at_add: price,
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error creating cart item:', error);
        return serverErrorResponse('Failed to add to cart');
      }
      
      cartItem = data;
    }
    
    // Fetch full cart item with product details
    const { data: fullItem, error: fetchError } = await supabase
      .from('cart_items')
      .select(`
        id,
        user_id,
        product_id,
        variant_id,
        quantity,
        price_at_add,
        created_at,
        updated_at,
        product:products (
          id,
          name,
          slug,
          price,
          compare_at_price,
          quantity,
          status,
          vendor_id,
          vendor:vendors (
            id,
            store_name,
            store_slug
          ),
          images:product_images (
            id,
            url,
            alt_text,
            is_primary
          )
        ),
        variant:product_variants (
          id,
          name,
          price,
          compare_at_price,
          quantity,
          options,
          is_active
        )
      `)
      .eq('id', cartItem.id)
      .single();
    
    if (fetchError) {
      console.error('Error fetching cart item:', fetchError);
      return serverErrorResponse('Failed to fetch cart item');
    }
    
    // Transform response
    const productData = fullItem.product as unknown as ProductData;
    const variantData = fullItem.variant as unknown as VariantData | null;
    
    const responseItem = {
      ...fullItem,
      product: {
        ...productData,
        inventory_quantity: productData?.quantity || 0,
      },
      variant: variantData ? {
        ...variantData,
        inventory_quantity: variantData.quantity || 0,
      } : null,
    };
    
    return successResponse(
      { item: responseItem },
      existingItem ? 'Cart updated' : 'Item added to cart'
    );
  } catch (error) {
    console.error('Cart POST error:', error);
    return serverErrorResponse();
  }
}

// DELETE /api/cart - Clear entire cart
export async function DELETE() {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return unauthorizedResponse('Please sign in to manage your cart');
    }
    
    // Delete all cart items for user
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', user.id);
    
    if (error) {
      console.error('Error clearing cart:', error);
      return serverErrorResponse('Failed to clear cart');
    }
    
    return successResponse(undefined, 'Cart cleared');
  } catch (error) {
    console.error('Cart DELETE error:', error);
    return serverErrorResponse();
  }
}
