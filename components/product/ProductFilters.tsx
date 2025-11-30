'use client';

import { useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { useProductStore, useCategories } from '@/stores/productStore';
import type { ProductFilters as ProductFiltersType, CategoryTree } from '@/types/product';

interface ProductFiltersProps {
  filters?: ProductFiltersType;
  onFilterChange?: (filters: Partial<ProductFiltersType>) => void;
  onReset?: () => void;
}

export function ProductFiltersComponent({
  filters: propFilters,
  onFilterChange: propOnFilterChange,
  onReset: propOnReset,
}: ProductFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { fetchCategories } = useProductStore();
  const categories = useCategories();

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Build filters from URL if not provided
  const filters: ProductFiltersType = useMemo(() => {
    if (propFilters) return propFilters;
    return {
      category: searchParams.get('category') || undefined,
      minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
      maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
      in_stock: searchParams.get('inStock') === 'true',
      rating: searchParams.get('rating') ? Number(searchParams.get('rating')) : undefined,
    };
  }, [propFilters, searchParams]);

  const onFilterChange = (newFilters: Partial<ProductFiltersType>) => {
    if (propOnFilterChange) {
      propOnFilterChange(newFilters);
    } else {
      // URL-based navigation
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(newFilters).forEach(([key, value]) => {
        const paramKey = key === 'in_stock' ? 'inStock' : key;
        if (value === undefined || value === '' || value === false) {
          params.delete(paramKey);
        } else {
          params.set(paramKey, String(value));
        }
      });
      params.delete('page');
      router.push(`?${params.toString()}`);
    }
  };

  const onReset = () => {
    if (propOnReset) {
      propOnReset();
    } else {
      // Clear all filter params
      const params = new URLSearchParams(searchParams.toString());
      ['category', 'minPrice', 'maxPrice', 'inStock', 'rating'].forEach((key) => {
        params.delete(key);
      });
      params.delete('page');
      router.push(`?${params.toString()}`);
    }
  };

  const activeFiltersCount = Object.values(filters).filter(
    (v) => v !== undefined && v !== '' && v !== false
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Filters</h3>
        {activeFiltersCount > 0 && (
          <Button variant="ghost" size="sm" onClick={onReset}>
            Clear all
          </Button>
        )}
      </div>

      {/* Active filters */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.category && (
            <Badge variant="secondary" className="gap-1">
              Category: {filters.category}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => onFilterChange({ category: undefined })}
              />
            </Badge>
          )}
          {filters.minPrice !== undefined && (
            <Badge variant="secondary" className="gap-1">
              Min: ${filters.minPrice}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => onFilterChange({ minPrice: undefined })}
              />
            </Badge>
          )}
          {filters.maxPrice !== undefined && (
            <Badge variant="secondary" className="gap-1">
              Max: ${filters.maxPrice}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => onFilterChange({ maxPrice: undefined })}
              />
            </Badge>
          )}
          {filters.in_stock && (
            <Badge variant="secondary" className="gap-1">
              In stock
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => onFilterChange({ in_stock: undefined })}
              />
            </Badge>
          )}
          {filters.rating !== undefined && (
            <Badge variant="secondary" className="gap-1">
              {filters.rating}+ stars
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => onFilterChange({ rating: undefined })}
              />
            </Badge>
          )}
        </div>
      )}

      <Separator />

      <Accordion type="multiple" defaultValue={['categories', 'price', 'availability']}>
        {/* Categories */}
        <AccordionItem value="categories">
          <AccordionTrigger>Categories</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              {categories.map((category) => (
                <CategoryItem
                  key={category.id}
                  category={category}
                  selectedCategory={filters.category}
                  onSelect={(slug) => onFilterChange({ category: slug })}
                />
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Price range */}
        <AccordionItem value="price">
          <AccordionTrigger>Price Range</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Label htmlFor="minPrice" className="text-xs">
                    Min
                  </Label>
                  <input
                    id="minPrice"
                    type="number"
                    min="0"
                    value={filters.minPrice || ''}
                    onChange={(e) =>
                      onFilterChange({
                        minPrice: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                    placeholder="0"
                  />
                </div>
                <span className="mt-5">-</span>
                <div className="flex-1">
                  <Label htmlFor="maxPrice" className="text-xs">
                    Max
                  </Label>
                  <input
                    id="maxPrice"
                    type="number"
                    min="0"
                    value={filters.maxPrice || ''}
                    onChange={(e) =>
                      onFilterChange({
                        maxPrice: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                    placeholder="Any"
                  />
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Availability */}
        <AccordionItem value="availability">
          <AccordionTrigger>Availability</AccordionTrigger>
          <AccordionContent>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="inStock"
                checked={filters.in_stock || false}
                onCheckedChange={(checked) =>
                  onFilterChange({ in_stock: checked ? true : undefined })
                }
              />
              <label
                htmlFor="inStock"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                In stock only
              </label>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Rating */}
        <AccordionItem value="rating">
          <AccordionTrigger>Rating</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              {[4, 3, 2, 1].map((rating) => (
                <div key={rating} className="flex items-center space-x-2">
                  <Checkbox
                    id={`rating-${rating}`}
                    checked={filters.rating === rating}
                    onCheckedChange={(checked) =>
                      onFilterChange({ rating: checked ? rating : undefined })
                    }
                  />
                  <label
                    htmlFor={`rating-${rating}`}
                    className="flex items-center text-sm font-medium leading-none"
                  >
                    {rating}+ stars
                  </label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

interface CategoryItemProps {
  category: CategoryTree;
  selectedCategory?: string;
  onSelect: (slug: string | undefined) => void;
  level?: number;
}

function CategoryItem({
  category,
  selectedCategory,
  onSelect,
  level = 0,
}: CategoryItemProps) {
  const isSelected = selectedCategory === category.slug;

  return (
    <div style={{ paddingLeft: `${level * 12}px` }}>
      <button
        className={`w-full rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted ${
          isSelected ? 'bg-primary/10 font-medium text-primary' : ''
        }`}
        onClick={() => onSelect(isSelected ? undefined : category.slug)}
      >
        {category.name}
        {category.product_count !== undefined && (
          <span className="ml-1 text-xs text-muted-foreground">
            ({category.product_count})
          </span>
        )}
      </button>
      {category.children?.map((child) => (
        <CategoryItem
          key={child.id}
          category={child}
          selectedCategory={selectedCategory}
          onSelect={onSelect}
          level={level + 1}
        />
      ))}
    </div>
  );
}

export { ProductFiltersComponent as ProductFilters };
