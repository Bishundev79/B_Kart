import { createClient } from '@/lib/supabase/server';
import { createOrderSchema } from '@/lib/validations/checkout';
import { SHIPPING_METHODS } from '@/types/checkout';
import {
  successResponse,
  validationErrorResponse,
  unauthorizedResponse,
  serverErrorResponse,
  errorResponse,
} from '@/lib/utils/api-response';

// Helper to generate order number
function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `BK-${timestamp}-${random}`;
}

// POST /api/checkout - Create order from cart
export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return unauthorizedResponse();
    }

    const body = await request.json();
    const result = createOrderSchema.safeParse(body);

    if (!result.success) {
      return validationErrorResponse(
        result.error.errors[0]?.message || 'Invalid checkout data',
        result.error.errors
      );
    }

    const {
      shippingAddressId,
      billingAddressId,
      shippingMethodId,
      paymentIntentId,
      notes,
    } = result.data;

    const shippingMethod = SHIPPING_METHODS.find(m => m.id === shippingMethodId);
    if (!shippingMethod) {
      return validationErrorResponse('Invalid shipping method');
    }

    const { data: shippingAddress, error: shippingAddressError } = await supabase
      .from('addresses')
      .select('*')
      .eq('id', shippingAddressId)
      .eq('user_id', user.id)
      .single();

    if (shippingAddressError) {
      return serverErrorResponse('Failed to verify shipping address');
    }

    if (!shippingAddress) {
      return validationErrorResponse('Invalid shipping address');
    }

    const { data: billingAddress, error: billingAddressError } = await supabase
      .from('addresses')
      .select('*')
      .eq('id', billingAddressId)
      .eq('user_id', user.id)
      .single();

    if (billingAddressError) {
      return serverErrorResponse('Failed to verify billing address');
    }

    if (!billingAddress) {
      return validationErrorResponse('Invalid billing address');
    }

    const { data: cartItems, error: cartError } = await supabase
      .from('cart_items')
      .select(`
        id,
        product_id,
        variant_id,
        quantity,
        price_at_add,
        product:products (
          id,
          name,
          price,
          quantity,
          status,
          vendor_id,
          vendor:vendors (
            id,
            commission_rate
          )
        ),
        variant:product_variants (
          id,
          name,
          price,
          quantity,
          is_active
        )
      `)
      .eq('user_id', user.id);
    
    if (cartError) {
      return serverErrorResponse('Failed to load cart');
    }

    if (!cartItems || cartItems.length === 0) {
      return validationErrorResponse('Cart is empty');
    }
    
    // Validate all items are available and calculate totals
    let subtotal = 0;
    const orderItems: {
      vendor_id: string;
      product_id: string;
      variant_id: string | null;
      product_name: string;
      variant_name: string | null;
      quantity: number;
      price: number;
      subtotal: number;
      commission_rate: number;
      commission_amount: number;
    }[] = [];
    
    for (const item of cartItems) {
      const product = item.product as unknown as {
        id: string;
        name: string;
        price: number;
        quantity: number;
        status: string;
        vendor_id: string;
        vendor: { id: string; commission_rate: number } | null;
      };
      
      if (!product || product.status !== 'active') {
        return validationErrorResponse('Product is no longer available', {
          productId: product?.id,
        });
      }
      
      let price = product.price;
      let availableQuantity = product.quantity;
      let variantName: string | null = null;
      
      if (item.variant_id) {
        const variant = item.variant as unknown as {
          id: string;
          name: string;
          price: number;
          quantity: number;
          is_active: boolean;
        };
        
        if (!variant || !variant.is_active) {
          return validationErrorResponse('Product variant is no longer available', {
            productId: product.id,
            variantId: item.variant_id,
          });
        }
        
        price = variant.price;
        availableQuantity = variant.quantity;
        variantName = variant.name;
      }
      
      if (item.quantity > availableQuantity) {
        return validationErrorResponse(`Insufficient stock for ${product.name}`, {
          productId: product.id,
          available: availableQuantity,
        });
      }
      
      const itemSubtotal = price * item.quantity;
      const commissionRate = product.vendor?.commission_rate || 15;
      const commissionAmount = (itemSubtotal * commissionRate) / 100;
      
      subtotal += itemSubtotal;
      
      orderItems.push({
        vendor_id: product.vendor_id,
        product_id: product.id,
        variant_id: item.variant_id,
        product_name: product.name,
        variant_name: variantName,
        quantity: item.quantity,
        price,
        subtotal: itemSubtotal,
        commission_rate: commissionRate,
        commission_amount: commissionAmount,
      });
    }
    
    // Calculate totals
    const tax = subtotal * 0.08; // 8% tax
    const shippingCost = subtotal >= 100 ? 0 : shippingMethod.price;
    const total = subtotal + tax + shippingCost;
    
    // Create order
    const orderNumber = generateOrderNumber();
    
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        user_id: user.id,
        status: 'pending',
        subtotal,
        tax,
        shipping_cost: shippingCost,
        discount: 0,
        total,
        currency: 'USD',
        payment_status: 'pending',
        payment_method: 'card',
        shipping_address: shippingAddress,
        billing_address: billingAddress,
        notes: notes || null,
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error('Error creating order:', orderError);
      return serverErrorResponse('Failed to create order');
    }

    const createdOrderId = order.id;
    
    // Create order items
    const orderItemsToInsert = orderItems.map(item => ({
      order_id: order.id,
      ...item,
    }));
    
    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItemsToInsert);

    if (itemsError) {
      console.error('Error creating order items:', itemsError);
      await supabase.from('orders').delete().eq('id', createdOrderId);
      return serverErrorResponse('Failed to create order items');
    }
    
    // Create payment record
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        order_id: order.id,
        stripe_payment_intent_id: paymentIntentId,
        amount: total,
        currency: 'USD',
        status: 'pending',
        payment_method: 'card',
      });
    
    if (paymentError) {
      console.error('Error creating payment record:', paymentError);
      await Promise.all([
        supabase.from('order_items').delete().eq('order_id', createdOrderId),
        supabase.from('orders').delete().eq('id', createdOrderId),
      ]);
      return serverErrorResponse('Failed to create payment record');
    }
    
    // Inventory is automatically updated via database triggers
    // when order_items are inserted
    
    // Clear cart
    const { error: cartClearError } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', user.id);

    if (cartClearError) {
      console.error('Error clearing cart:', cartClearError);
      return errorResponse('Order created but failed to clear cart', 202);
    }

    return successResponse(
      {
        orderId: order.id,
        orderNumber: order.order_number,
        total: order.total,
      },
      'Order created successfully',
      201
    );
  } catch (error) {
    console.error('Checkout error:', error);
    return serverErrorResponse();
  }
}
