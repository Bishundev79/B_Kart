import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/config';
import { createAdminClient } from '@/lib/supabase/admin';
import Stripe from 'stripe';

// Disable body parsing for webhook verification
export const runtime = 'nodejs';

// POST /api/webhooks/stripe - Handle Stripe webhook events
export async function POST(request: Request) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');
  
  if (!signature) {
    console.error('Missing stripe-signature header');
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }
  
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }
  
  let event: Stripe.Event;
  
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Webhook signature verification failed:', message);
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 });
  }
  
  const supabase = createAdminClient();
  
  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('Payment succeeded:', paymentIntent.id);
        
        // Update payment record
        const { error: paymentError } = await supabase
          .from('payments')
          .update({
            status: 'paid',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_payment_intent_id', paymentIntent.id);
        
        if (paymentError) {
          console.error('Error updating payment:', paymentError);
        }
        
        // Update order status
        const { data: payment } = await supabase
          .from('payments')
          .select('order_id')
          .eq('stripe_payment_intent_id', paymentIntent.id)
          .single();
        
        if (payment?.order_id) {
          const { error: orderError } = await supabase
            .from('orders')
            .update({
              status: 'confirmed',
              payment_status: 'paid',
              paid_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', payment.order_id);
          
          if (orderError) {
            console.error('Error updating order:', orderError);
          }
          
          // Update order items status
          await supabase
            .from('order_items')
            .update({
              status: 'confirmed',
              updated_at: new Date().toISOString(),
            })
            .eq('order_id', payment.order_id);
          
          // Get order details for notification
          const { data: order } = await supabase
            .from('orders')
            .select('user_id, order_number, total')
            .eq('id', payment.order_id)
            .single();
          
          if (order) {
            // Create notification for customer
            await supabase
              .from('notifications')
              .insert({
                user_id: order.user_id,
                type: 'order',
                title: 'Order Confirmed',
                message: `Your order #${order.order_number} has been confirmed. Total: $${order.total.toFixed(2)}`,
                data: { orderId: payment.order_id, orderNumber: order.order_number },
              });
          }
        }
        
        break;
      }
      
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('Payment failed:', paymentIntent.id);
        
        const failureMessage = paymentIntent.last_payment_error?.message || 'Payment failed';
        
        // Update payment record
        const { error: paymentError } = await supabase
          .from('payments')
          .update({
            status: 'failed',
            metadata: { failure_reason: failureMessage },
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_payment_intent_id', paymentIntent.id);
        
        if (paymentError) {
          console.error('Error updating payment:', paymentError);
        }
        
        // Update order status
        const { data: payment } = await supabase
          .from('payments')
          .select('order_id')
          .eq('stripe_payment_intent_id', paymentIntent.id)
          .single();
        
        if (payment?.order_id) {
          await supabase
            .from('orders')
            .update({
              payment_status: 'failed',
              updated_at: new Date().toISOString(),
            })
            .eq('id', payment.order_id);
          
          // Get order for notification
          const { data: order } = await supabase
            .from('orders')
            .select('user_id, order_number')
            .eq('id', payment.order_id)
            .single();
          
          if (order) {
            // Create notification for customer
            await supabase
              .from('notifications')
              .insert({
                user_id: order.user_id,
                type: 'payment',
                title: 'Payment Failed',
                message: `Payment for order #${order.order_number} failed. Please try again.`,
                data: { orderId: payment.order_id, orderNumber: order.order_number },
              });
          }
        }
        
        break;
      }
      
      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        console.log('Charge refunded:', charge.id);
        
        if (charge.payment_intent) {
          const paymentIntentId = typeof charge.payment_intent === 'string' 
            ? charge.payment_intent 
            : charge.payment_intent.id;
          
          // Update payment record
          await supabase
            .from('payments')
            .update({
              status: 'refunded',
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_payment_intent_id', paymentIntentId);
          
          // Update order status
          const { data: payment } = await supabase
            .from('payments')
            .select('order_id')
            .eq('stripe_payment_intent_id', paymentIntentId)
            .single();
          
          if (payment?.order_id) {
            await supabase
              .from('orders')
              .update({
                status: 'refunded',
                payment_status: 'refunded',
                updated_at: new Date().toISOString(),
              })
              .eq('id', payment.order_id);
            
            // Update order items
            await supabase
              .from('order_items')
              .update({
                status: 'refunded',
                updated_at: new Date().toISOString(),
              })
              .eq('order_id', payment.order_id);
          }
        }
        
        break;
      }
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
    
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
