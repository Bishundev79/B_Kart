'use client';

import { Star } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface RatingDistributionProps {
  distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  totalReviews: number;
  onFilterRating?: (rating: number | undefined) => void;
  selectedRating?: number;
}

export function RatingDistribution({
  distribution,
  totalReviews,
  onFilterRating,
  selectedRating,
}: RatingDistributionProps) {
  const averageRating =
    totalReviews > 0
      ? (
          ([5, 4, 3, 2, 1].reduce((sum, rating) => sum + rating * distribution[rating as keyof typeof distribution], 0)) /
          totalReviews
        ).toFixed(1)
      : '0.0';

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="text-center">
          <div className="text-4xl font-bold">{averageRating}</div>
          <div className="flex items-center gap-1 mt-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-4 w-4 ${
                  star <= Math.round(parseFloat(averageRating))
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
          </div>
        </div>

        <div className="flex-1 space-y-2">
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = distribution[rating as keyof typeof distribution];
            const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;

            return (
              <button
                key={rating}
                onClick={() => onFilterRating?.(selectedRating === rating ? undefined : rating)}
                className={`w-full flex items-center gap-2 text-sm hover:bg-gray-50 p-1 rounded transition-colors ${
                  selectedRating === rating ? 'bg-gray-100' : ''
                }`}
              >
                <div className="flex items-center gap-1 w-12">
                  <span className="font-medium">{rating}</span>
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                </div>
                <Progress value={percentage} className="h-2 flex-1" />
                <span className="text-muted-foreground w-12 text-right">{count}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
