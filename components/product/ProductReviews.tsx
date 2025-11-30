'use client';

import { useState } from 'react';
import { ReviewForm, ReviewList, RatingDistribution } from '@/components/review';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface ProductReviewsProps {
  productSlug: string;
}

export function ProductReviews({ productSlug }: ProductReviewsProps) {
  const [filterRating, setFilterRating] = useState<number | undefined>();
  const [totalReviews, setTotalReviews] = useState(0);
  const [ratingDistribution, setRatingDistribution] = useState({
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  });
  const [refreshKey, setRefreshKey] = useState(0);
  const user = useAuthStore((state) => state.user);
  const router = useRouter();

  const handleReviewSubmitSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleReviewsLoad = (
    total: number,
    distribution?: { 1: number; 2: number; 3: number; 4: number; 5: number }
  ) => {
    setTotalReviews(total);
    if (distribution) {
      setRatingDistribution(distribution);
    }
  };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">Customer Reviews</h2>

      {totalReviews > 0 && (
        <Card>
          <CardContent className="pt-6">
            <RatingDistribution
              distribution={ratingDistribution}
              totalReviews={totalReviews}
              onFilterRating={setFilterRating}
              selectedRating={filterRating}
            />
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="reviews" className="w-full">
        <TabsList>
          <TabsTrigger value="reviews">All Reviews</TabsTrigger>
          <TabsTrigger value="write">Write a Review</TabsTrigger>
        </TabsList>

        <TabsContent value="reviews" className="mt-6">
          <ReviewList
            key={refreshKey}
            productSlug={productSlug}
            filterRating={filterRating}
            onReviewsLoad={(total) => handleReviewsLoad(total, ratingDistribution)}
          />
        </TabsContent>

        <TabsContent value="write" className="mt-6">
          {user ? (
            <Card>
              <CardHeader>
                <CardTitle>Share Your Experience</CardTitle>
              </CardHeader>
              <CardContent>
                <ReviewForm
                  productSlug={productSlug}
                  onSuccess={handleReviewSubmitSuccess}
                />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground mb-4">
                  You need to be logged in to write a review.
                </p>
                <Button onClick={() => router.push('/login')}>Sign In</Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
