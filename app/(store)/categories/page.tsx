import { createClient } from '@/lib/supabase/server';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import Image from 'next/image';

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
    return (
      <div className="container py-12">
        <p className="text-center text-muted-foreground">Failed to load categories.</p>
      </div>
    );
  }

  return (
    <div className="container py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">All Categories</h1>
        <p className="text-muted-foreground">Browse products by category</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {categories?.map((category) => (
          <Link key={category.id} href={`/categories/${category.slug}`}>
            <Card className="hover:shadow-lg transition-shadow h-full">
              <CardContent className="p-6">
                {category.image_url && (
                  <div className="relative w-full h-40 mb-4 rounded-lg overflow-hidden">
                    <Image
                      src={category.image_url}
                      alt={category.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <h3 className="text-xl font-semibold mb-2">{category.name}</h3>
                {category.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {category.description}
                  </p>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {(!categories || categories.length === 0) && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No categories found.</p>
        </div>
      )}
    </div>
  );
}
