'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, Loader2, SlidersHorizontal, SearchX, Package } from 'lucide-react';
import { Header, Footer, Breadcrumb } from '@/components/layout';
import { ProductGrid } from '@/components/product';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';

interface SearchResult {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  price: number;
  compare_at_price: number | null;
  quantity: number;
  rating_avg: number | null;
  rating_count: number;
  category: { id: string; name: string; slug: string } | null;
  vendor: { id: string; store_name: string; store_slug: string } | null;
  image: string | null;
}

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [searchInput, setSearchInput] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sort, setSort] = useState('relevance');
  const [showFilters, setShowFilters] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery, page, sort]);

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        q: searchQuery,
        page: page.toString(),
        sort,
      });

      if (minPrice) params.append('minPrice', minPrice);
      if (maxPrice) params.append('maxPrice', maxPrice);

      const response = await fetch(`/api/search?${params}`);
      const data = await response.json();

      if (response.ok) {
        setResults(data.results);
        setTotalPages(data.pagination.totalPages);
      } else {
        console.error('Search failed:', data.error);
        setResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setQuery(searchInput);
      setPage(1);
      router.push(`/search?q=${encodeURIComponent(searchInput)}`);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 py-12 md:py-16">
          <div className="absolute inset-0 bg-gradient-mesh opacity-30" />
          <div className="container relative">
            <Breadcrumb className="mb-6" />
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20">
                <Search className="h-8 w-8 text-primary" />
              </div>
              <div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              Search Products
            </h1>
            <p className="mt-2 text-lg text-muted-foreground">
              Find exactly what you&apos;re looking for
            </p>
          </div>
        </div>            {/* Search Form */}
            <form onSubmit={handleSearch} className="max-w-4xl">
              <Card className="border-2 bg-background/50 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        type="search"
                        placeholder="Search for products..."
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        className="pl-12 h-12 text-lg"
                      />
                    </div>
                    <Button type="submit" disabled={isLoading} size="lg" className="bg-gradient-to-r from-primary to-secondary">
                      {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Search'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      onClick={() => setShowFilters(!showFilters)}
                    >
                      <SlidersHorizontal className="h-5 w-5 mr-2" />
                      Filters
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </form>
          </div>
        </section>

        <div className="container py-8">
          {/* Filters */}
          {showFilters && (
            <Card className="mb-8 border-2 animate-slide-up">
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">Refine Your Search</h3>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <Label htmlFor="minPrice" className="text-sm font-medium">Min Price ($)</Label>
                    <Input
                      id="minPrice"
                      type="number"
                      placeholder="0"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxPrice" className="text-sm font-medium">Max Price ($)</Label>
                    <Input
                      id="maxPrice"
                      type="number"
                      placeholder="10000"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      className="mt-2"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={() => {
                        setPage(1);
                        performSearch(query);
                      }}
                      className="w-full bg-gradient-to-r from-primary to-secondary"
                    >
                      Apply Filters
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results Header */}
          {query && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 p-4 rounded-xl bg-muted/50">
              <div className="flex items-center gap-3">
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                ) : (
                  <Package className="h-5 w-5 text-primary" />
                )}
                <div>
                  <p className="font-semibold">
                    {isLoading ? 'Searching...' : `${results.length} Results`}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    for &ldquo;{query}&rdquo;
                  </p>
                </div>
              </div>
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">Relevance</SelectItem>
                  <SelectItem value="price_asc">Price: Low to High</SelectItem>
                  <SelectItem value="price_desc">Price: High to Low</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Results */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Searching for products...</p>
            </div>
          ) : results.length > 0 ? (
            <>
              <ProductGrid products={results} />

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-3 mt-12">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1 || isLoading}
                  >
                    Previous
                  </Button>
                  <div className="flex items-center px-6 rounded-lg border-2 bg-muted/50">
                    <span className="text-sm font-medium">
                      Page {page} of {totalPages}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages || isLoading}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          ) : query ? (
            <div className="text-center py-16">
              <div className="inline-block p-4 rounded-full bg-muted mb-4">
                <SearchX className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No Results Found</h3>
              <p className="text-muted-foreground mb-6">
                We couldn&apos;t find any products matching &ldquo;{query}&rdquo;
              </p>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={() => { setSearchInput(''); setQuery(''); }}>
                  Clear Search
                </Button>
                <Button onClick={() => router.push('/products')}>
                  Browse All Products
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="inline-block p-4 rounded-full bg-gradient-to-br from-primary/10 to-secondary/10 mb-4">
                <Search className="h-12 w-12 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Start Your Search</h3>
              <p className="text-muted-foreground">
                Enter a search term above to find products
              </p>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
