'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface ProductSearchProps {
  value?: string;
  onSearch?: (query: string) => void;
  placeholder?: string;
}

export function ProductSearch({
  value,
  onSearch,
  placeholder = 'Search products...',
}: ProductSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialValue = value ?? searchParams.get('search') ?? '';
  const [query, setQuery] = useState(initialValue);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(query);
    } else {
      // URL-based navigation for Server Components
      const params = new URLSearchParams(searchParams.toString());
      if (query) {
        params.set('search', query);
      } else {
        params.delete('search');
      }
      params.delete('page'); // Reset to page 1
      router.push(`?${params.toString()}`);
    }
  };

  const handleClear = () => {
    setQuery('');
    if (onSearch) {
      onSearch('');
    } else {
      const params = new URLSearchParams(searchParams.toString());
      params.delete('search');
      params.delete('page');
      router.push(`?${params.toString()}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative flex w-full max-w-md">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="pl-10 pr-10"
        />
        {query && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2"
            onClick={handleClear}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      <Button type="submit" className="ml-2">
        Search
      </Button>
    </form>
  );
}
