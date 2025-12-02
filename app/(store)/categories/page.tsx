import { createClient } from '@/lib/supabase/server';
import { Header, Footer, Breadcrumb } from '@/components/layout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import Image from 'next/image';
import { Grid3x3, ArrowRight, Sparkles } from 'lucide-react';

export const metadata = {
  title: 'Categories - B_Kart',
  description: 'Browse all product categories',
};

export default async function CategoriesPage() {
  const supabase = await createClient();

  const { data: categories, error } = await supabase
    .from('categories')
    .select('id, name, slug, description, image_url')
    .is('parent_id', null)
    .order('sort_order');

  // Map category images to Unsplash placeholders
  const categoryImageMap: Record<string, string> = {
    'electronics': 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800&q=80',
    'fashion': 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&q=80',
    'home-garden': 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80',
    'sports-outdoors': 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&q=80',
    'beauty-health': 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&q=80',
    'toys-games': 'https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=800&q=80',
  };

  if (error) {
    console.error('Error fetching categories:', error);
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 py-12 md:py-16 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-mesh opacity-30" />
          <div className="absolute top-10 right-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-10 left-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
          
          <div className="container relative">
            <Breadcrumb className="mb-6" />
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20">
                <Grid3x3 className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                  Browse by{' '}
                  <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                    Category
                  </span>
                </h1>
                <p className="mt-2 text-lg text-muted-foreground">
                  Explore our organized collection of products
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Categories Grid */}
        <section className="container py-12">
          {error ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Failed to load categories.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories?.map((category, index) => {
                // Get image from map or fallback to original
                const imageUrl = categoryImageMap[category.slug] || category.image_url;
                
                return (
                <Link 
                  key={category.id} 
                  href={`/categories/${category.slug}`}
                  className="group block"
                >
                  <Card className="h-full overflow-hidden border-2 transition-all duration-300 hover:border-primary/50 hover:shadow-xl hover:-translate-y-1 animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                    <CardContent className="p-0">
                      <div className="relative w-full aspect-[4/3] overflow-hidden bg-gradient-to-br from-muted to-muted/50">
                        {imageUrl ? (
                          <Image
                            src={imageUrl}
                            alt={category.name}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            className="object-cover transition-all duration-500 group-hover:scale-110"
                            placeholder="blur"
                            blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2YzZjRmNiIvPjwvc3ZnPg=="
                            priority={index < 3}
                          />
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 flex items-center justify-center">
                            <Grid3x3 className="h-16 w-16 text-muted-foreground/30" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                        
                        {/* Shine effect */}
                        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                      </div>
                      
                      <div className="p-5">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h3 className="text-lg font-bold group-hover:text-primary transition-colors leading-tight">
                            {category.name}
                          </h3>
                          <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0 mt-0.5" />
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
                          {category.description || 'Explore our collection'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
              })}
            </div>
          )}

          {(!categories || categories.length === 0) && !error && (
            <div className="text-center py-16">
              <div className="inline-block p-4 rounded-full bg-muted mb-4">
                <Grid3x3 className="h-12 w-12 text-muted-foreground" />
              </div>
              <p className="text-lg text-muted-foreground">No categories found.</p>
            </div>
          )}
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
