'use client';

import { useState } from 'react';
import { useCartStore } from '@/stores/cartStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Tag, X } from 'lucide-react';
import { toast } from 'sonner';

export function CouponInput() {
  const [code, setCode] = useState('');
  const { applyCoupon, removeCoupon, coupon, isUpdating } = useCartStore();

  const handleApply = async () => {
    if (!code.trim()) return;
    
    try {
      await applyCoupon(code);
      toast.success('Coupon applied successfully!');
      setCode('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to apply coupon');
    }
  };

  const handleRemove = () => {
    removeCoupon();
    toast.success('Coupon removed');
  };

  if (coupon) {
    return (
      <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-md">
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-green-600" />
          <div>
            <p className="text-sm font-medium text-green-900">{coupon.code}</p>
            <p className="text-xs text-green-700">
              {coupon.discount_type === 'PERCENTAGE' 
                ? `${coupon.discount_value}% off` 
                : `$${coupon.discount_value} off`}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRemove}
          className="h-8 w-8 p-0 hover:bg-green-100 text-green-700"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <Input
        placeholder="Promo code"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleApply()}
        className="bg-background"
      />
      <Button 
        variant="outline" 
        onClick={handleApply}
        disabled={isUpdating || !code.trim()}
      >
        {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
      </Button>
    </div>
  );
}
