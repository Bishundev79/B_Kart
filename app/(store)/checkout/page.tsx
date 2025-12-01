import { Metadata } from 'next';
import { CheckoutForm } from '@/components/checkout';

export const metadata: Metadata = {
  title: 'Checkout | B_Kart',
  description: 'Complete your purchase',
};

export default function CheckoutPage() {
  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-8">Checkout</h1>
      <CheckoutForm />
    </div>
  );
}
