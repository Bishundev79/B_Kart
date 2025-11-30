import Link from 'next/link';
import { Heart, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function WishlistPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">My Wishlist</h2>
        <p className="text-muted-foreground">
          Products you&apos;ve saved for later.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Saved Items</CardTitle>
          <CardDescription>
            Items you&apos;ve added to your wishlist.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Heart className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Your wishlist is empty</h3>
            <p className="text-muted-foreground mb-6">
              Save items you love by clicking the heart icon on products.
            </p>
            <Button asChild>
              <Link href="/products">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Browse Products
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
