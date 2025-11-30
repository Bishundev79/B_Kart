'use client';

import { useEffect } from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWishlistStore } from '@/stores/wishlistStore';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface WishlistButtonProps {
  productId: string;
  productName: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showText?: boolean;
  className?: string;
}

export function WishlistButton({
  productId,
  productName,
  variant = 'ghost',
  size = 'icon',
  showText = false,
  className,
}: WishlistButtonProps) {
  const { user } = useAuthStore();
  const { isInWishlist, addToWishlist, removeFromWishlist, fetchWishlist } = useWishlistStore();
  const { toast } = useToast();
  const inWishlist = isInWishlist(productId);

  useEffect(() => {
    if (user) {
      fetchWishlist();
    }
  }, [user, fetchWishlist]);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to save items to your wishlist.',
        variant: 'destructive',
      });
      return;
    }

    if (inWishlist) {
      const success = await removeFromWishlist(productId);
      if (success) {
        toast({
          title: 'Removed from wishlist',
          description: `${productName} has been removed from your wishlist.`,
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to remove from wishlist.',
          variant: 'destructive',
        });
      }
    } else {
      const success = await addToWishlist(productId);
      if (success) {
        toast({
          title: 'Added to wishlist',
          description: `${productName} has been saved to your wishlist.`,
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to add to wishlist.',
          variant: 'destructive',
        });
      }
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      className={cn(className)}
      aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      <Heart
        className={cn('h-4 w-4', showText && 'mr-2', inWishlist && 'fill-current text-red-500')}
      />
      {showText && (inWishlist ? 'Saved' : 'Save')}
    </Button>
  );
}
