import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { ProductImages, ProductInfo } from '@/components/product';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface ProductPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: product } = await supabase
    .from('products')
    .select('name, short_description, meta_title, meta_description')
    .eq('slug', slug)
    .eq('status', 'active')
    .single();

  if (!product) {
    return {
      title: 'Product Not Found | B_Kart',
    };
  }

  return {
    title: product.meta_title || `${product.name} | B_Kart`,
    description: product.meta_description || product.short_description || undefined,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  // Fetch product with all relations
  const { data: product, error } = await supabase
    .from('products')
    .select(
      `
      *,
      category:categories(id, name, slug),
      vendor:vendors(
        id,
        store_name,
        store_slug,
        logo_url,
        description,
        rating_avg,
        rating_count
      ),
      images:product_images(id, url, alt_text, is_primary, sort_order),
      variants:product_variants(id, name, sku, price, quantity, options)
    `
    )
    .eq('slug', slug)
    .eq('status', 'active')
    .single();

  if (error || !product) {
    notFound();
  }

  // Sort images: primary first, then by sort_order
  const sortedImages = (product.images || []).sort((a: any, b: any) => {
    if (a.is_primary) return -1;
    if (b.is_primary) return 1;
    return a.sort_order - b.sort_order;
  });

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
        {product.category && (
          <>
            <ChevronRight className="mx-2 h-4 w-4" />
            <Link
              href={`/products?category=${product.category.slug}`}
              className="hover:text-foreground"
            >
              {product.category.name}
            </Link>
          </>
        )}
        <ChevronRight className="mx-2 h-4 w-4" />
        <span className="text-foreground">{product.name}</span>
      </nav>

      {/* Main Product Section */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Images */}
        <ProductImages images={sortedImages} productName={product.name} />

        {/* Product Info */}
        <ProductInfo
          product={{
            id: product.id,
            name: product.name,
            slug: product.slug,
            description: product.description,
            short_description: product.short_description,
            price: product.price,
            compare_at_price: product.compare_at_price,
            quantity: product.quantity,
            sku: product.sku,
            rating_avg: product.rating_avg,
            rating_count: product.rating_count,
            is_featured: product.is_featured,
            tags: product.tags,
            vendor: product.vendor,
            category: product.category,
            variants: product.variants,
          }}
        />
      </div>

      <Separator className="my-12" />

      {/* Additional Details */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Full Description */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Product Description</CardTitle>
            </CardHeader>
            <CardContent>
              {product.description ? (
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  {product.description.split('\n').map((paragraph: string, i: number) => (
                    <p key={i}>{paragraph}</p>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No description available.</p>
              )}
            </CardContent>
          </Card>

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag: string) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Vendor Info */}
        {product.vendor && (
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Sold By</CardTitle>
              </CardHeader>
              <CardContent>
                <Link
                  href={`/vendors/${product.vendor.store_slug}`}
                  className="group flex items-center gap-4"
                >
                  <Avatar className="h-12 w-12">
                    <AvatarImage
                      src={product.vendor.logo_url || undefined}
                      alt={product.vendor.store_name}
                    />
                    <AvatarFallback>
                      {product.vendor.store_name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium group-hover:underline">
                      {product.vendor.store_name}
                    </p>
                    {product.vendor.rating_avg !== null && (
                      <p className="text-sm text-muted-foreground">
                        ★ {product.vendor.rating_avg.toFixed(1)} (
                        {product.vendor.rating_count} reviews)
                      </p>
                    )}
                  </div>
                </Link>
                {product.vendor.description && (
                  <p className="mt-4 text-sm text-muted-foreground line-clamp-3">
                    {product.vendor.description}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
