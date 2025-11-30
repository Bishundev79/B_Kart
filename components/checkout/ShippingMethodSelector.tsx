'use client';

import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { SHIPPING_METHODS, type ShippingMethod } from '@/types/checkout';
import { formatPrice } from '@/lib/stripe/client';
import { Truck, Zap, Rocket } from 'lucide-react';

interface ShippingMethodSelectorProps {
  selectedId: string | null;
  onSelect: (method: ShippingMethod) => void;
  subtotal: number;
}

const icons: Record<string, React.ReactNode> = {
  standard: <Truck className="h-5 w-5" />,
  express: <Zap className="h-5 w-5" />,
  overnight: <Rocket className="h-5 w-5" />,
};

export function ShippingMethodSelector({
  selectedId,
  onSelect,
  subtotal,
}: ShippingMethodSelectorProps) {
  const freeShippingEligible = subtotal >= 100;
  
  return (
    <div className="space-y-4">
      <h3 className="font-medium">Shipping method</h3>
      
      {freeShippingEligible && (
        <p className="text-sm text-green-600">
          🎉 You qualify for free standard shipping!
        </p>
      )}
      
      <RadioGroup
        value={selectedId || undefined}
        onValueChange={(value) => {
          const method = SHIPPING_METHODS.find(m => m.id === value);
          if (method) {
            onSelect(method);
          }
        }}
        className="space-y-3"
      >
        {SHIPPING_METHODS.map((method) => {
          const isFree = method.id === 'standard' && freeShippingEligible;
          const displayPrice = isFree ? 0 : method.price;
          
          return (
            <div
              key={method.id}
              className={`relative flex items-center space-x-4 rounded-lg border p-4 cursor-pointer transition-colors ${
                selectedId === method.id
                  ? 'border-primary bg-primary/5'
                  : 'hover:border-muted-foreground/50'
              }`}
            >
              <RadioGroupItem value={method.id} id={method.id} />
              <div className="flex-shrink-0 text-muted-foreground">
                {icons[method.id]}
              </div>
              <Label
                htmlFor={method.id}
                className="flex-1 cursor-pointer space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{method.name}</span>
                  <span className={isFree ? 'text-green-600 font-medium' : ''}>
                    {isFree ? 'FREE' : formatPrice(displayPrice)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {method.description}
                </p>
              </Label>
            </div>
          );
        })}
      </RadioGroup>
    </div>
  );
}
