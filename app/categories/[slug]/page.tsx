import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import {
  ProductGrid,
  ProductSearch,
  ProductFilters,
  ProductSort,
} from '@/components/product';
import { Skeleton } from '@/components/ui/skeleton';

interface CategoryPageProps {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    search?: string;
    minPrice?: string;
    maxPrice?: string;
    inStock?: string;
    sort?: string;
    page?: string;
  }>;
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: category } = await supabase
    .from('categories')
    .select('name, description')
    .eq('slug', slug)
    .single();

  if (!category) {
    return {
      title: 'Category Not Found | B_Kart',
    };
  }

  return {
    title: `${category.name} | B_Kart`,
    description: category.description || `Browse ${category.name} products on B_Kart.`,
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: CategoryPageProps) {
  const { slug } = await params;
  const searchParamsResolved = await searchParams;
  const supabase = await createClient();

  // Fetch category
  const { data: category, error: categoryError } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .single();

  if (categoryError || !category) {
    notFound();
  }

  // Get parent category for breadcrumb if exists
  let parentCategory = null;
  if (category.parent_id) {
    const { data: parent } = await supabase
      .from('categories')
      .select('id, name, slug')
      .eq('id', category.parent_id)
      .single();
    parentCategory = parent;
  }

  // Get subcategories
  const { data: subcategories } = await supabase
    .from('categories')
    .select('id, name, slug, product_count')
    .eq('parent_id', category.id)
    .order('name');

  return (
    <div className="container py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>
        <ChevronRight className="mx-2 h-4 w-4" />
        <Link href="/products" className="hover:text-foreground">
          Products
        </Link>
        {parentCategory && (
          <>
            <ChevronRight className="mx-2 h-4 w-4" />
            <Link
              href={`/categories/${parentCategory.slug}`}
              className="hover:text-foreground"
            >
              {parentCategory.name}
            </Link>
          </>
        )}
        <ChevronRight className="mx-2 h-4 w-4" />
        <span className="text-foreground">{category.name}</span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">{category.name}</h1>
        {category.description && (
          <p className="mt-2 text-muted-foreground">{category.description}</p>
        )}
      </div>

      {/* Subcategories */}
      {subcategories && subcategories.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-4 text-lg font-semibold">Subcategories</h2>
          <div className="flex flex-wrap gap-2">
            {subcategories.map((sub) => (
              <Link
                key={sub.id}
                href={`/categories/${sub.slug}`}
                className="rounded-full border px-4 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                {sub.name}
                {sub.product_count !== null && sub.product_count > 0 && (
                  <span className="ml-1 text-muted-foreground">
                    ({sub.product_count})
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Search and Sort Bar */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:max-w-md">
          <ProductSearch />
        </div>
        <div className="flex items-center gap-4">
          <ProductSort />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Sidebar Filters */}
        <aside className="w-full lg:w-72 lg:shrink-0">
          <ProductFilters />
        </aside>

        {/* Product Grid */}
        <main className="flex-1">
          <Suspense fallback={<ProductGridSkeleton />}>
            <CategoryProductsWrapper
              categoryId={category.id}
              searchParams={searchParamsResolved}
            />
          </Suspense>
        </main>
      </div>
    </div>
  );
}

async function CategoryProductsWrapper({
  categoryId,
  searchParams,
}: {
  categoryId: string;
  searchParams: {
    search?: string;
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
    .eq('status', 'active')
    .eq('category_id', categoryId);

  // Apply search
  if (searchParams.search) {
    query = query.ilike('name', `%${searchParams.search}%`);
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
    vendor: product.vendor ? {
      id: product.vendor.id,
      store_name: product.vendor.store_name,
      slug: product.vendor.store_slug,
    } : null,
    primary_image: product.images?.find((img: any) => img.is_primary) || product.images?.[0],
  }));

  if (productCards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-lg font-medium">No products found</p>
        <p className="text-muted-foreground">
          Try adjusting your filters or search terms.
        </p>
      </div>
    );
  }

  return <ProductGrid products={productCards} />;
}

function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="space-y-4">
          <Skeleton className="aspect-square rounded-lg" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  );
}
