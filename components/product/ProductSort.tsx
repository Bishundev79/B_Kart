'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ProductSortOption } from '@/types/product';

interface ProductSortProps {
  sort?: ProductSortOption;
  order?: 'asc' | 'desc';
  onSortChange?: (sort: ProductSortOption, order: 'asc' | 'desc') => void;
}

const sortOptions = [
  { value: 'created_at-desc', label: 'Newest' },
  { value: 'created_at-asc', label: 'Oldest' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'name-asc', label: 'Name: A-Z' },
  { value: 'name-desc', label: 'Name: Z-A' },
  { value: 'rating-desc', label: 'Highest Rated' },
  { value: 'total_sales-desc', label: 'Best Selling' },
];

export function ProductSort({ sort, order, onSortChange }: ProductSortProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get from URL if not provided via props
  const currentSort = sort ?? (searchParams.get('sort') as ProductSortOption) ?? 'created_at';
  const currentOrder = order ?? (searchParams.get('order') as 'asc' | 'desc') ?? 'desc';
  const currentValue = `${currentSort}-${currentOrder}`;

  const handleChange = (value: string) => {
    const [newSort, newOrder] = value.split('-') as [ProductSortOption, 'asc' | 'desc'];
    
    if (onSortChange) {
      onSortChange(newSort, newOrder);
    } else {
      // URL-based navigation for Server Components
      const params = new URLSearchParams(searchParams.toString());
      params.set('sort', value);
      params.delete('page'); // Reset to page 1
      router.push(`?${params.toString()}`);
    }
  };

  return (
    <Select value={currentValue} onValueChange={handleChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Sort by" />
      </SelectTrigger>
      <SelectContent>
        {sortOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
