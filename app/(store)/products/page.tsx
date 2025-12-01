import { Suspense } from 'react';
import { Metadata } from 'next';
import { Header, Footer, Breadcrumb } from '@/components/layout';
import {
  ProductGrid,
  ProductSearch,
  ProductFilters,
  ProductSort,
} from '@/components/product';
import { ProductGridSkeleton } from '@/components/loading/ProductSkeleton';
import { Package } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Products | B_Kart',
  description: 'Browse our wide selection of products from multiple vendors.',
};

interface ProductsPageProps {
  searchParams: Promise<{
    search?: string;
    category?: string;
    minPrice?: string;
    maxPrice?: string;
    inStock?: string;
    sort?: string;
    page?: string;
  }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1">
        {/* Hero Banner */}
        <section className="relative bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 py-12 md:py-16">
          <div className="absolute inset-0 bg-gradient-mesh opacity-30" />
          <div className="container relative">
            <Breadcrumb className="mb-6" />
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20">
                <Package className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight">All Products</h1>
                <p className="mt-2 text-lg text-muted-foreground">
                  Discover amazing products from verified vendors worldwide
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="container py-8">
          {/* Search and Sort Bar */}
          <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between p-6 rounded-xl border-2 bg-card">
            <div className="w-full lg:max-w-md">
              <ProductSearch />
            </div>
            <div className="flex items-center gap-4">
              <ProductSort />
            </div>
          </div>

          {/* Main Content */}
          <div className="flex flex-col gap-8 lg:flex-row">
            {/* Sidebar Filters */}
            <aside className="w-full lg:w-80 lg:shrink-0">
              <div className="sticky top-24">
                <ProductFilters />
              </div>
            </aside>

            {/* Product Grid */}
            <main className="flex-1">
              <Suspense fallback={<ProductGridSkeleton />}>
                <ProductGridWrapper searchParams={params} />
              </Suspense>
            </main>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}

async function ProductGridWrapper({
  searchParams,
}: {
  searchParams: {
    search?: string;
    category?: string;
    minPrice?: string;
    maxPrice?: string;
    inStock?: string;
    sort?: string;
    page?: string;
  };
}) {
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();

  // Build query
  let query = supabase
    .from('products')
    .select(
      `
      id,
      name,
      slug,
      price,
      compare_at_price,
      quantity,
      status,
      is_featured,
      rating_avg,
      rating_count,
      category:categories(id, name, slug),
      vendor:vendors(id, store_name, store_slug),
      images:product_images(id, url, alt_text, is_primary)
    `
    )
    .eq('status', 'active');

  // Apply search
  if (searchParams.search) {
    query = query.ilike('name', `%${searchParams.search}%`);
  }

  // Apply category filter
  if (searchParams.category) {
    const { data: category } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', searchParams.category)
      .single();

    if (category) {
      query = query.eq('category_id', category.id);
    }
  }

  // Apply price filters
  if (searchParams.minPrice) {
    query = query.gte('price', parseFloat(searchParams.minPrice));
  }
  if (searchParams.maxPrice) {
    query = query.lte('price', parseFloat(searchParams.maxPrice));
  }

  // Apply stock filter
  if (searchParams.inStock === 'true') {
    query = query.gt('quantity', 0);
  }

  // Apply sorting
  const sort = searchParams.sort || 'newest';
  switch (sort) {
    case 'price-asc':
      query = query.order('price', { ascending: true });
      break;
    case 'price-desc':
      query = query.order('price', { ascending: false });
      break;
    case 'name-asc':
      query = query.order('name', { ascending: true });
      break;
    case 'name-desc':
      query = query.order('name', { ascending: false });
      break;
    case 'rating':
      query = query.order('rating_avg', { ascending: false, nullsFirst: false });
      break;
    case 'popular':
      query = query.order('rating_count', { ascending: false });
      break;
    case 'oldest':
      query = query.order('created_at', { ascending: true });
      break;
    default:
      query = query.order('created_at', { ascending: false });
  }

  // Pagination
  const page = parseInt(searchParams.page || '1');
  const limit = 12;
  const offset = (page - 1) * limit;

  query = query.range(offset, offset + limit - 1);

  const { data: products, error } = await query;

  if (error) {
    console.error('Error fetching products:', error);
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground">Failed to load products.</p>
      </div>
    );
  }

  // Transform to ProductCardData format
  const productCards = (products || []).map((product: any) => ({
    id: product.id,
    name: product.name,
    slug: product.slug,
    price: product.price,
    compare_at_price: product.compare_at_price,
    quantity: product.quantity,
    is_featured: product.is_featured,
    rating_avg: product.rating_avg,
    rating_count: product.rating_count,
    category: product.category,
    vendor: product.vendor,
    primary_image: product.images?.find((img: any) => img.is_primary) || product.images?.[0],
  }));

  return <ProductGrid products={productCards} />;
}
