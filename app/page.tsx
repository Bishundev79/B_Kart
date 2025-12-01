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
        <section className="relative overflow-hidden py-20 md:py-32 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
          {/* Animated background mesh */}
          <div className="absolute inset-0 bg-gradient-mesh opacity-50 animate-pulse-glow" />
          
          {/* Decorative elements */}
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
          
          <div className="container relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-block mb-6 px-4 py-2 bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 rounded-full border border-primary/20 backdrop-blur-sm animate-fade-in">
                <p className="text-sm font-medium bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                  Welcome to the Future of Shopping
                </p>
              </div>
              
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 animate-slide-up">
                Your One-Stop{' '}
                <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent animate-pulse-glow">
                  Multi-Vendor
                </span>{' '}
                Marketplace
              </h1>
              
              <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '0.1s' }}>
                Discover amazing products from verified sellers worldwide. Shop with confidence, 
                sell with ease, and join our growing community of buyers and vendors.
              </p>
              
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <Button size="lg" className="group bg-gradient-to-r from-primary to-secondary hover:shadow-colored text-white px-8" asChild>
                  <Link href="/products">
                    Start Shopping
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="border-2 hover:border-primary hover:bg-primary/5" asChild>
                  <Link href="/signup">
                    Become a Vendor
                  </Link>
                </Button>
              </div>

              {/* Stats */}
              <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 animate-fade-in" style={{ animationDelay: '0.3s' }}>
                {[
                  { label: 'Active Products', value: '10K+' },
                  { label: 'Verified Vendors', value: '500+' },
                  { label: 'Happy Customers', value: '50K+' },
                  { label: 'Countries', value: '30+' },
                ].map((stat, index) => (
                  <div key={index} className="group p-4 rounded-xl bg-background/50 backdrop-blur-sm border border-border/50 hover:border-primary/50 transition-all hover:shadow-glow">
                    <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                      {stat.value}
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 md:py-24">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold">Why Choose B_Kart?</h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                We make online shopping and selling simple, secure, and rewarding.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <Card 
                  key={feature.title} 
                  className="group text-center border-2 transition-all duration-300 hover:border-primary/50 hover:shadow-glow hover:-translate-y-2"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <CardHeader>
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 transition-transform group-hover:scale-110 group-hover:rotate-3">
                      <feature.icon className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section className="py-16 md:py-24 bg-muted/30">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold">Shop by Category</h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Explore our wide range of product categories.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {categories.map((category, index) => (
                <Link
                  key={category.name}
                  href={category.href}
                  className="group relative overflow-hidden rounded-2xl aspect-square bg-gradient-to-br from-muted to-muted/50 border-2 border-transparent hover:border-primary/50 transition-all duration-300 hover:shadow-glow hover:-translate-y-2"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                  
                  {/* Shine effect */}
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                  
                  {/* Content */}
                  <div className="absolute inset-0 flex items-end p-6">
                    <div>
                      <h3 className="text-xl font-bold text-white group-hover:text-primary transition-colors">
                        {category.name}
                      </h3>
                      <p className="mt-1 text-sm text-white/70 opacity-0 group-hover:opacity-100 transition-opacity">
                        Browse collection
                      </p>
                    </div>
                  </div>
                  
                  {/* Arrow icon */}
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                    <div className="p-2 rounded-full bg-primary/20 backdrop-blur-sm">
                      <ArrowRight className="h-5 w-5 text-white" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <div className="text-center mt-10">
              <Button size="lg" variant="outline" className="border-2 hover:border-primary hover:bg-primary/5 group" asChild>
                <Link href="/categories">
                  View All Categories
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Featured Products Section */}
        {featuredProducts.length > 0 && (
          <section className="py-16 md:py-24">
            <div className="container">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-4">
                <div>
                  <h2 className="text-4xl font-bold">Featured Products</h2>
                  <p className="mt-2 text-lg text-muted-foreground">
                    Handpicked products from our top vendors.
                  </p>
                </div>
                <Button size="lg" variant="outline" className="border-2 hover:border-primary hover:bg-primary/5 group" asChild>
                  <Link href="/products?featured=true">
                    View All
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
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
          <section className="py-16 md:py-24 bg-muted/30">
            <div className="container">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-4">
                <div>
                  <h2 className="text-4xl font-bold">New Arrivals</h2>
                  <p className="mt-2 text-lg text-muted-foreground">
                    Check out the latest products added to our store.
                  </p>
                </div>
                <Button size="lg" variant="outline" className="border-2 hover:border-primary hover:bg-primary/5 group" asChild>
                  <Link href="/products?sort=newest">
                    View All
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
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
        <section className="py-16 md:py-24 relative overflow-hidden">
          <div className="container relative z-10">
            <Card className="relative overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-primary via-secondary to-accent shadow-2xl">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-float" />
              <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
              
              <CardContent className="relative p-8 md:p-16">
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  <div className="text-white">
                    <div className="inline-block mb-4 px-4 py-1.5 bg-white/20 backdrop-blur-sm rounded-full">
                      <p className="text-sm font-medium">🚀 Join Our Platform</p>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold leading-tight">
                      Ready to Start Selling?
                    </h2>
                    <p className="mt-4 text-lg text-white/90 leading-relaxed">
                      Join thousands of vendors already growing their business on B_Kart. 
                      Low fees, powerful tools, and a global customer base await.
                    </p>
                    <ul className="mt-6 space-y-3">
                      {['Zero setup fees', 'Global reach', '24/7 support'].map((feature, i) => (
                        <li key={i} className="flex items-center text-white/90">
                          <div className="mr-3 flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
                            <ArrowRight className="h-3 w-3" />
                          </div>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex justify-center md:justify-end">
                    <Button 
                      size="lg" 
                      className="bg-white text-primary hover:bg-white/90 hover:scale-105 transition-all px-8 py-6 text-lg font-semibold shadow-xl group" 
                      asChild
                    >
                      <Link href="/signup?role=vendor">
                        Create Vendor Account
                        <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
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
