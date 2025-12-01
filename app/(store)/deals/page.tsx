import { createClient } from '@/lib/supabase/server';
import { Header, Footer, Breadcrumb } from '@/components/layout';
import { ProductGrid } from '@/components/product/ProductGrid';
import { Badge } from '@/components/ui/badge';
import { Zap, Percent, Clock, TrendingDown } from 'lucide-react';

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

  // Calculate average discount
  const avgDiscount = dealsProducts.length > 0
    ? Math.round(
        dealsProducts.reduce((acc: number, p: any) => {
          const discount = ((p.compare_at_price - p.price) / p.compare_at_price) * 100;
          return acc + discount;
        }, 0) / dealsProducts.length
      )
    : 0;

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-destructive/5 via-orange-500/5 to-yellow-500/5 py-12 md:py-16 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-mesh opacity-30" />
          <div className="absolute top-10 right-10 w-72 h-72 bg-destructive/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-10 left-10 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
          
          <div className="container relative">
            <Breadcrumb className="mb-6" />
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-destructive/20 to-orange-500/20 animate-pulse-glow">
                  <Zap className="h-8 w-8 text-destructive" />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                      Hot Deals
                    </h1>
                    <Badge className="bg-gradient-to-r from-destructive to-orange-500 text-white animate-pulse-glow">
                      <Percent className="mr-1 h-3 w-3" />
                      Limited Time
                </Badge>
              </div>
              <p className="text-lg text-muted-foreground">
                Save big on your favorite products - Don&apos;t miss out!
              </p>
            </div>
          </div>              {/* Stats */}
              <div className="flex gap-4">
                <div className="p-4 rounded-xl bg-background/50 backdrop-blur-sm border border-border/50">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <TrendingDown className="h-4 w-4" />
                    Avg. Discount
                  </div>
                  <div className="text-2xl font-bold bg-gradient-to-r from-destructive to-orange-500 bg-clip-text text-transparent">
                    {avgDiscount}%
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-background/50 backdrop-blur-sm border border-border/50">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Zap className="h-4 w-4" />
                    Active Deals
                  </div>
                  <div className="text-2xl font-bold bg-gradient-to-r from-destructive to-orange-500 bg-clip-text text-transparent">
                    {dealsProducts.length}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Deals Grid */}
        <section className="container py-12">
          {error ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Failed to load deals.</p>
            </div>
          ) : dealsProducts.length > 0 ? (
            <>
              <div className="mb-8 p-6 rounded-xl bg-gradient-to-r from-destructive/10 via-orange-500/10 to-yellow-500/10 border-2 border-destructive/20">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-destructive animate-pulse" />
                  <p className="text-sm font-medium">
                    <span className="text-destructive font-bold">Flash Sale Alert!</span> These deals won&apos;t last long. Grab them before they&apos;re gone!
                  </p>
                </div>
              </div>
              <ProductGrid products={dealsProducts} />
            </>
          ) : (
            <div className="text-center py-16">
              <div className="inline-block p-4 rounded-full bg-muted mb-4">
                <Percent className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No Active Deals</h3>
              <p className="text-muted-foreground">Check back soon for amazing discounts!</p>
            </div>
          )}
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
