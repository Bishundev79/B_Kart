'use client';

import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useCartStore, useCartInitialized } from '@/stores/cartStore';
import { CartItem } from './CartItem';
import { CartEmpty } from './CartEmpty';
import { CartSummary } from './CartSummary';
import { useIsAuthenticated } from '@/stores/authStore';
import { useCartNotifications } from '@/hooks/use-cart-notifications';

export function CartSheet() {
  const { 
    items, 
    isOpen, 
    isLoading, 
    error, 
    closeCart, 
    fetchCart, 
    getSummary,
    clearCart,
    clearError
  } = useCartStore();
  const isAuthenticated = useIsAuthenticated();
  const cartInitialized = useCartInitialized();
  useCartNotifications();
  
  const summary = getSummary();
  
  return (
    <Sheet open={isOpen} onOpenChange={(open) => {
      if (!open) {
        closeCart();
        clearError();
      }
    }}>
      <SheetContent className="flex flex-col w-full sm:max-w-lg">
        <SheetHeader className="space-y-2.5 pr-6">
          <SheetTitle className="flex items-center justify-between">
            <span>Shopping Cart</span>
            {items.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground hover:text-destructive"
                onClick={() => clearCart()}
              >
                Clear all
              </Button>
            )}
          </SheetTitle>
        </SheetHeader>
        
        {!cartInitialized || isLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <p className="text-sm text-destructive mb-4">{error}</p>
            <Button variant="outline" onClick={() => fetchCart()}>
              Try again
            </Button>
          </div>
        ) : !isAuthenticated ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center px-4">
            <p className="text-sm text-muted-foreground mb-4">
              Please sign in to view your cart
            </p>
            <Button asChild onClick={closeCart}>
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        ) : items.length === 0 ? (
          <CartEmpty onClose={closeCart} />
        ) : (
          <>
            {/* Cart Items */}
            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="space-y-0">
                {items.map((item) => (
                  <CartItem key={item.id} item={item} />
                ))}
              </div>
            </ScrollArea>
            
            {/* Cart Footer */}
            <div className="space-y-4 pt-4">
              <Separator />
              
              <CartSummary summary={summary} showDetails />
              
              <div className="space-y-2">
                <Button asChild className="w-full" size="lg" onClick={closeCart}>
                  <Link href="/checkout">Proceed to Checkout</Link>
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={closeCart}
                  asChild
                >
                  <Link href="/products">Continue Shopping</Link>
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
