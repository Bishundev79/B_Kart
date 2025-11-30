import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe, formatAmountForStripe, MIN_AMOUNT, MAX_AMOUNT } from '@/lib/stripe/config';
import { createPaymentIntentSchema } from '@/lib/validations/checkout';
import { SHIPPING_METHODS } from '@/types/checkout';

// POST /api/checkout/payment-intent - Create Stripe PaymentIntent
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
    const result = createPaymentIntentSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }
    
    const { shippingAddressId, shippingMethodId } = result.data;
    
    // Get shipping method
    const shippingMethod = SHIPPING_METHODS.find(m => m.id === shippingMethodId);
    if (!shippingMethod) {
      return NextResponse.json({ error: 'Invalid shipping method' }, { status: 400 });
    }
    
    // Verify shipping address
    const { data: address } = await supabase
      .from('addresses')
      .select('*')
      .eq('id', shippingAddressId)
      .eq('user_id', user.id)
      .single();
    
    if (!address) {
      return NextResponse.json({ error: 'Invalid shipping address' }, { status: 400 });
    }
    
    // Get cart items and calculate total
    const { data: cartItems, error: cartError } = await supabase
      .from('cart_items')
      .select(`
        id,
        quantity,
        product:products (
          id,
          name,
          price,
          status
        ),
        variant:product_variants (
          id,
          price,
          is_active
        )
      `)
      .eq('user_id', user.id);
    
    if (cartError || !cartItems || cartItems.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }
    
    // Calculate subtotal
    let subtotal = 0;
    for (const item of cartItems) {
      const product = item.product as unknown as { price: number; status: string } | null;
      const variant = item.variant as unknown as { price: number; is_active: boolean } | null;
      
      if (!product || product.status !== 'active') {
        return NextResponse.json({ error: 'Some items are no longer available' }, { status: 400 });
      }
      
      const price = variant?.price || product.price;
      subtotal += price * item.quantity;
    }
    
    // Calculate totals
    const tax = subtotal * 0.08; // 8% tax
    const shippingCost = subtotal >= 100 ? 0 : shippingMethod.price;
    const total = subtotal + tax + shippingCost;
    
    // Convert to cents for Stripe
    const amountInCents = formatAmountForStripe(total, 'USD');
    
    // Validate amount
    if (amountInCents < MIN_AMOUNT) {
      return NextResponse.json(
        { error: `Minimum order amount is $${MIN_AMOUNT / 100}` },
        { status: 400 }
      );
    }
    
    if (amountInCents > MAX_AMOUNT) {
      return NextResponse.json(
        { error: 'Order amount exceeds maximum limit' },
        { status: 400 }
      );
    }
    
    // Get or create Stripe customer
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();
    
    // Create PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        userId: user.id,
        shippingAddressId,
        shippingMethodId,
      },
      receipt_email: user.email,
      shipping: {
        name: address.full_name,
        phone: address.phone || '',
        address: {
          line1: address.address_line1,
          line2: address.address_line2 || '',
          city: address.city,
          state: address.state,
          postal_code: address.postal_code,
          country: address.country,
        },
      },
    });
    
    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: total,
      currency: 'USD',
    });
  } catch (error) {
    console.error('Payment intent error:', error);
    
    if (error instanceof Error && error.message.includes('Stripe')) {
      return NextResponse.json(
        { error: 'Payment service error. Please try again.' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
