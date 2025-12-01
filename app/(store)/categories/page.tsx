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
    .order('name');

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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {categories?.map((category, index) => (
                <Link 
                  key={category.id} 
                  href={`/categories/${category.slug}`}
                  className="group"
                >
                  <Card className="h-full overflow-hidden border-2 transition-all duration-300 hover:border-primary/50 hover:shadow-glow hover:-translate-y-2 animate-fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
                    <CardContent className="p-0">
                      {category.image_url ? (
                        <div className="relative w-full h-48 overflow-hidden bg-gradient-to-br from-muted to-muted/50">
                          <Image
                            src={category.image_url}
                            alt={category.name}
                            fill
                            className="object-cover transition-all duration-500 group-hover:scale-110 group-hover:rotate-1"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                          
                          {/* Shine effect */}
                          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                        </div>
                      ) : (
                        <div className="relative w-full h-48 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 flex items-center justify-center">
                          <Grid3x3 className="h-16 w-16 text-muted-foreground/30" />
                        </div>
                      )}
                      
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-xl font-bold group-hover:text-primary transition-colors">
                            {category.name}
                          </h3>
                          <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                        </div>
                        {category.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {category.description}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
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
