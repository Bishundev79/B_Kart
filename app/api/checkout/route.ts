import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createOrderSchema } from '@/lib/validations/checkout';
import { SHIPPING_METHODS } from '@/types/checkout';

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
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse and validate request body
    const body = await request.json();
    const result = createOrderSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }
    
    const { shippingAddressId, billingAddressId, shippingMethodId, paymentIntentId, notes } = result.data;
    
    // Get shipping method
    const shippingMethod = SHIPPING_METHODS.find(m => m.id === shippingMethodId);
    if (!shippingMethod) {
      return NextResponse.json({ error: 'Invalid shipping method' }, { status: 400 });
    }
    
    // Verify addresses belong to user
    const { data: shippingAddress } = await supabase
      .from('addresses')
      .select('*')
      .eq('id', shippingAddressId)
      .eq('user_id', user.id)
      .single();
    
    if (!shippingAddress) {
      return NextResponse.json({ error: 'Invalid shipping address' }, { status: 400 });
    }
    
    const { data: billingAddress } = await supabase
      .from('addresses')
      .select('*')
      .eq('id', billingAddressId)
      .eq('user_id', user.id)
      .single();
    
    if (!billingAddress) {
      return NextResponse.json({ error: 'Invalid billing address' }, { status: 400 });
    }
    
    // Get cart items with product details
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
    
    if (cartError || !cartItems || cartItems.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
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
        return NextResponse.json(
          { error: `Product is no longer available` },
          { status: 400 }
        );
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
          return NextResponse.json(
            { error: `Product variant is no longer available` },
            { status: 400 }
          );
        }
        
        price = variant.price;
        availableQuantity = variant.quantity;
        variantName = variant.name;
      }
      
      if (item.quantity > availableQuantity) {
        return NextResponse.json(
          { error: `Insufficient stock for ${product.name}` },
          { status: 400 }
        );
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
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }
    
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
      // Rollback order
      await supabase.from('orders').delete().eq('id', order.id);
      return NextResponse.json({ error: 'Failed to create order items' }, { status: 500 });
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
    }
    
    // Inventory is automatically updated via database triggers
    // when order_items are inserted
    
    // Clear cart
    await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', user.id);
    
    return NextResponse.json({
      orderId: order.id,
      orderNumber: order.order_number,
      total: order.total,
      message: 'Order created successfully',
    });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
