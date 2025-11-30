import Link from 'next/link';
import { ArrowRight, ShoppingBag, Store, Shield, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Header, Footer } from '@/components/layout';
import { ProductCard } from '@/components/product';
import { createClient } from '@/lib/supabase/server';
import type { ProductCardData } from '@/types/product';

const features = [
  {
    icon: ShoppingBag,
    title: 'Wide Selection',
    description: 'Browse thousands of products from verified vendors across multiple categories.',
  },
  {
    icon: Store,
    title: 'Trusted Vendors',
    description: 'All sellers are verified to ensure quality products and reliable service.',
  },
  {
    icon: Shield,
    title: 'Secure Payments',
    description: 'Shop with confidence using our secure payment processing powered by Stripe.',
  },
  {
    icon: Truck,
    title: 'Fast Delivery',
    description: 'Track your orders in real-time with our integrated shipping system.',
  },
];

const categories = [
  { name: 'Electronics', image: '/categories/electronics.jpg', href: '/categories/electronics' },
  { name: 'Fashion', image: '/categories/fashion.jpg', href: '/categories/fashion' },
  { name: 'Home & Garden', image: '/categories/home.jpg', href: '/categories/home-garden' },
  { name: 'Sports', image: '/categories/sports.jpg', href: '/categories/sports' },
];

async function getFeaturedProducts(): Promise<ProductCardData[]> {
  const supabase = await createClient();

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
      is_featured,
      rating_avg,
      rating_count,
      category:categories(id, name, slug),
      vendor:vendors(id, store_name, store_slug),
      images:product_images(id, url, alt_text, is_primary)
    `
    )
    .eq('status', 'active')
    .eq('is_featured', true)
    .order('created_at', { ascending: false })
    .limit(8);

  if (error || !products) {
    return [];
  }

  return products.map((product: any) => ({
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
}

async function getLatestProducts(): Promise<ProductCardData[]> {
  const supabase = await createClient();

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
      is_featured,
      rating_avg,
      rating_count,
      category:categories(id, name, slug),
      vendor:vendors(id, store_name, store_slug),
      images:product_images(id, url, alt_text, is_primary)
    `
    )
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(4);

  if (error || !products) {
    return [];
  }

  return products.map((product: any) => ({
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
}

export default async function Home() {
  const [featuredProducts, latestProducts] = await Promise.all([
    getFeaturedProducts(),
    getLatestProducts(),
  ]);
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 md:py-32 bg-gradient-to-br from-primary/10 via-background to-background">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
                Your One-Stop{' '}
                <span className="text-primary">Multi-Vendor</span>{' '}
                Marketplace
              </h1>
              <p className="mt-6 text-lg md:text-xl text-muted-foreground">
                Discover amazing products from verified sellers worldwide. Shop with confidence, 
                sell with ease, and join our growing community of buyers and vendors.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button size="lg" asChild>
                  <Link href="/products">
                    Start Shopping
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/signup">
                    Become a Vendor
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 md:py-24">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold">Why Choose B_Kart?</h2>
              <p className="mt-4 text-muted-foreground">
                We make online shopping and selling simple, secure, and rewarding.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature) => (
                <Card key={feature.title} className="text-center">
                  <CardHeader>
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section className="py-16 md:py-24 bg-muted/50">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold">Shop by Category</h2>
              <p className="mt-4 text-muted-foreground">
                Explore our wide range of product categories.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {categories.map((category) => (
                <Link
                  key={category.name}
                  href={category.href}
                  className="group relative overflow-hidden rounded-lg aspect-square bg-muted"
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-lg font-semibold text-white group-hover:text-primary transition-colors">
                      {category.name}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
            <div className="text-center mt-8">
              <Button variant="outline" asChild>
                <Link href="/categories">
                  View All Categories
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Featured Products Section */}
        {featuredProducts.length > 0 && (
          <section className="py-16 md:py-24">
            <div className="container">
              <div className="flex items-center justify-between mb-12">
                <div>
                  <h2 className="text-3xl font-bold">Featured Products</h2>
                  <p className="mt-2 text-muted-foreground">
                    Handpicked products from our top vendors.
                  </p>
                </div>
                <Button variant="outline" asChild>
                  <Link href="/products?featured=true">
                    View All
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {featuredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Latest Products Section */}
        {latestProducts.length > 0 && (
          <section className="py-16 md:py-24 bg-muted/50">
            <div className="container">
              <div className="flex items-center justify-between mb-12">
                <div>
                  <h2 className="text-3xl font-bold">New Arrivals</h2>
                  <p className="mt-2 text-muted-foreground">
                    Check out the latest products added to our store.
                  </p>
                </div>
                <Button variant="outline" asChild>
                  <Link href="/products?sort=newest">
                    View All
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {latestProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA Section */}
        <section className="py-16 md:py-24">
          <div className="container">
            <Card className="bg-primary text-primary-foreground">
              <CardContent className="p-8 md:p-12">
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  <div>
                    <h2 className="text-3xl font-bold">Ready to Start Selling?</h2>
                    <p className="mt-4 text-primary-foreground/80">
                      Join thousands of vendors already growing their business on B_Kart. 
                      Low fees, powerful tools, and a global customer base await.
                    </p>
                  </div>
                  <div className="flex justify-center md:justify-end">
                    <Button size="lg" variant="secondary" asChild>
                      <Link href="/signup?role=vendor">
                        Create Vendor Account
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
