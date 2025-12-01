import { createClient } from '@/lib/supabase/server';
import { ProductGrid } from '@/components/product/ProductGrid';

export const metadata = {
  title: 'Deals & Discounts - B_Kart',
  description: 'Find the best deals and discounted products',
};

export default async function DealsPage() {
  const supabase = await createClient();

  // Get products with discounts (compare_at_price > price)
  const { data: products, error } = await supabase
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
    .not('compare_at_price', 'is', null)
    .order('created_at', { ascending: false })
    .limit(24);

  if (error) {
    console.error('Error fetching deals:', error);
    return (
      <div className="container py-12">
        <p className="text-center text-muted-foreground">Failed to load deals.</p>
      </div>
    );
  }

  // Filter products where compare_at_price > price (actual deals)
  const dealsProducts = (products || [])
    .filter((p: any) => p.compare_at_price && p.compare_at_price > p.price)
    .map((product: any) => ({
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

  return (
    <div className="container py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Deals & Discounts</h1>
        <p className="text-muted-foreground">
          Save big on your favorite products - limited time offers!
        </p>
      </div>

      {dealsProducts.length > 0 ? (
        <ProductGrid products={dealsProducts} />
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No deals available at the moment.</p>
        </div>
      )}
    </div>
  );
}
