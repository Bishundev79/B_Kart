'use client';

import { ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface CartEmptyProps {
  onClose?: () => void;
}

export function CartEmpty({ onClose }: CartEmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-muted p-6 mb-4">
        <ShoppingBag className="h-10 w-10 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">Your cart is empty</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-[200px]">
        Looks like you haven&apos;t added anything to your cart yet.
      </p>
      <Button asChild onClick={onClose}>
        <Link href="/products">Continue Shopping</Link>
      </Button>
    </div>
  );
}
