'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Elements } from '@stripe/react-stripe-js';
import { Loader2, ChevronLeft, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { getStripe } from '@/lib/stripe/client';
import { useCartStore } from '@/stores/cartStore';
import { useIsAuthenticated, useUser } from '@/stores/authStore';
import { ShippingAddressForm } from './ShippingAddressForm';
import { ShippingMethodSelector } from './ShippingMethodSelector';
import { CheckoutOrderSummary } from './CheckoutOrderSummary';
import { PaymentForm } from './PaymentForm';
import { SHIPPING_METHODS, type ShippingMethod, type CheckoutStep } from '@/types/checkout';

interface Address {
  id: string;
  full_name: string;
  phone: string | null;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
  type: string;
}

const STEPS: CheckoutStep[] = ['shipping', 'payment', 'review'];

export function CheckoutForm() {
  const router = useRouter();
  const { items, getSummary, clearCart } = useCartStore();
  const isAuthenticated = useIsAuthenticated();
  const user = useUser();
  
  // State
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('shipping');
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);
  
  const [shippingAddressId, setShippingAddressId] = useState<string | null>(null);
  const [billingAddressId, setBillingAddressId] = useState<string | null>(null);
  const [sameAsBilling, setSameAsBilling] = useState(true);
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod | null>(null);
  
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [isCreatingPaymentIntent, setIsCreatingPaymentIntent] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Calculate summary
  const cartSummary = getSummary();
  const shippingCost = shippingMethod 
    ? (cartSummary.subtotal >= 100 && shippingMethod.id === 'standard' ? 0 : shippingMethod.price)
    : 0;
  const tax = cartSummary.subtotal * 0.08;
  const orderSummary = {
    subtotal: cartSummary.subtotal,
    shipping: shippingCost,
    tax,
    discount: 0,
    total: cartSummary.subtotal + shippingCost + tax,
    itemCount: cartSummary.itemCount,
  };
  
  // Fetch addresses
  useEffect(() => {
    const fetchAddresses = async () => {
      if (!isAuthenticated) return;
      
      try {
        const response = await fetch('/api/addresses');
        if (response.ok) {
          const data = await response.json();
          setAddresses(data.addresses || []);
        }
      } catch (err) {
        console.error('Failed to fetch addresses:', err);
      } finally {
        setIsLoadingAddresses(false);
      }
    };
    
    fetchAddresses();
  }, [isAuthenticated]);
  
  // Create payment intent when moving to payment step
  const createPaymentIntent = useCallback(async () => {
    if (!shippingAddressId || !shippingMethod) return;
    
    setIsCreatingPaymentIntent(true);
    setError(null);
    
    try {
      const response = await fetch('/api/checkout/payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: orderSummary.total,
          shippingAddressId,
          shippingMethodId: shippingMethod.id,
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create payment intent');
      }
      
      const data = await response.json();
      setClientSecret(data.clientSecret);
      setPaymentIntentId(data.paymentIntentId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize payment');
    } finally {
      setIsCreatingPaymentIntent(false);
    }
  }, [shippingAddressId, shippingMethod, orderSummary.total]);
  
  // Handlers
  const handleShippingAddressSubmit = (addressId: string) => {
    setShippingAddressId(addressId);
    if (sameAsBilling) {
      setBillingAddressId(addressId);
    }
  };
  
  const handleShippingMethodSelect = (method: ShippingMethod) => {
    setShippingMethod(method);
  };
  
  const handleContinueToPayment = async () => {
    if (!shippingAddressId || !shippingMethod) {
      setError('Please complete shipping information');
      return;
    }
    
    await createPaymentIntent();
    setCurrentStep('payment');
  };
  
  const handlePaymentSuccess = async (intentId: string) => {
    // Create order
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shippingAddressId,
          billingAddressId: sameAsBilling ? shippingAddressId : billingAddressId,
          shippingMethodId: shippingMethod?.id,
          paymentIntentId: intentId,
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create order');
      }
      
      const data = await response.json();
      
      // Clear cart and redirect to success page
      await clearCart();
      router.push(`/checkout/success?order=${data.orderNumber}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete order');
      setIsProcessing(false);
    }
  };
  
  const handlePaymentError = (errorMessage: string) => {
    setError(errorMessage);
    setIsProcessing(false);
  };
  
  // Check if user can proceed
  const canContinue = shippingAddressId && shippingMethod;
  
  // Get current step index
  const currentStepIndex = STEPS.indexOf(currentStep);
  
  // Stripe options
  const stripeOptions = clientSecret ? {
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: 'hsl(var(--primary))',
      },
    },
  } : undefined;
  
  if (!isAuthenticated) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">Please sign in to checkout</p>
        <Button onClick={() => router.push('/login?redirect=/checkout')}>
          Sign in
        </Button>
      </div>
    );
  }
  
  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">Your cart is empty</p>
        <Button onClick={() => router.push('/products')}>
          Continue Shopping
        </Button>
      </div>
    );
  }
  
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr,400px]">
      {/* Main Content */}
      <div className="space-y-6">
        {/* Progress Steps */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((step, index) => (
            <div key={step} className="flex items-center">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                  index < currentStepIndex
                    ? 'bg-primary border-primary text-primary-foreground'
                    : index === currentStepIndex
                    ? 'border-primary text-primary'
                    : 'border-muted-foreground/30 text-muted-foreground/50'
                }`}
              >
                {index < currentStepIndex ? (
                  <Check className="h-4 w-4" />
                ) : (
                  index + 1
                )}
              </div>
              <span
                className={`ml-2 text-sm capitalize ${
                  index <= currentStepIndex
                    ? 'text-foreground'
                    : 'text-muted-foreground/50'
                }`}
              >
                {step}
              </span>
              {index < STEPS.length - 1 && (
                <div
                  className={`w-12 h-0.5 mx-2 ${
                    index < currentStepIndex
                      ? 'bg-primary'
                      : 'bg-muted-foreground/30'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        
        {/* Error Alert */}
        {error && (
          <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md">
            {error}
          </div>
        )}
        
        {/* Shipping Step */}
        {currentStep === 'shipping' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Shipping Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {isLoadingAddresses ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <>
                    <ShippingAddressForm
                      savedAddresses={addresses.filter(a => a.type === 'shipping')}
                      onSubmit={handleShippingAddressSubmit}
                    />
                    
                    {shippingAddressId && (
                      <>
                        <Separator />
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="sameAsBilling"
                            checked={sameAsBilling}
                            onCheckedChange={(checked) => {
                              setSameAsBilling(checked === true);
                              if (checked && shippingAddressId) {
                                setBillingAddressId(shippingAddressId);
                              }
                            }}
                          />
                          <Label htmlFor="sameAsBilling">
                            Billing address same as shipping
                          </Label>
                        </div>
                        
                        {!sameAsBilling && (
                          <ShippingAddressForm
                            savedAddresses={addresses.filter(a => a.type === 'billing')}
                            onSubmit={setBillingAddressId}
                          />
                        )}
                        
                        <Separator />
                        
                        <ShippingMethodSelector
                          selectedId={shippingMethod?.id || null}
                          onSelect={handleShippingMethodSelect}
                          subtotal={cartSummary.subtotal}
                        />
                      </>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
            
            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => router.push('/products')}>
                <ChevronLeft className="mr-2 h-4 w-4" />
                Continue Shopping
              </Button>
              <Button
                onClick={handleContinueToPayment}
                disabled={!canContinue || isCreatingPaymentIntent}
              >
                {isCreatingPaymentIntent ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Continue to Payment'
                )}
              </Button>
            </div>
          </div>
        )}
        
        {/* Payment Step */}
        {currentStep === 'payment' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment</CardTitle>
              </CardHeader>
              <CardContent>
                {clientSecret && stripeOptions ? (
                  <Elements stripe={getStripe()} options={stripeOptions}>
                    <PaymentForm
                      onSuccess={handlePaymentSuccess}
                      onError={handlePaymentError}
                      isProcessing={isProcessing}
                      setIsProcessing={setIsProcessing}
                    />
                  </Elements>
                ) : (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Button
              variant="ghost"
              onClick={() => setCurrentStep('shipping')}
              disabled={isProcessing}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Shipping
            </Button>
          </div>
        )}
      </div>
      
      {/* Order Summary Sidebar */}
      <div className="lg:sticky lg:top-20 lg:h-fit">
        <CheckoutOrderSummary
          items={items}
          summary={orderSummary}
          shippingMethodName={shippingMethod?.name}
        />
      </div>
    </div>
  );
}
