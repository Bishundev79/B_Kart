import { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/server';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://bkart.com';
  const supabase = await createClient();

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/products`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/categories`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/deals`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
  ];

  // Fetch products
  const { data: products } = await supabase
    .from('products')
    .select('slug, updated_at')
    .eq('status', 'active')
    .limit(1000);

  const productPages: MetadataRoute.Sitemap = (products || []).map((product: any) => ({
    url: `${baseUrl}/products/${product.slug}`,
    lastModified: new Date(product.updated_at),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  // Fetch categories
  const { data: categories } = await supabase
    .from('categories')
    .select('slug, updated_at')
    .eq('is_active', true);

  const categoryPages: MetadataRoute.Sitemap = (categories || []).map((category: any) => ({
    url: `${baseUrl}/categories/${category.slug}`,
    lastModified: new Date(category.updated_at),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  // Fetch vendors
  const { data: vendors } = await supabase
    .from('vendors')
    .select('store_slug, updated_at')
    .eq('status', 'active');

  const vendorPages: MetadataRoute.Sitemap = (vendors || []).map((vendor: any) => ({
    url: `${baseUrl}/vendors/${vendor.store_slug}`,
    lastModified: new Date(vendor.updated_at),
    changeFrequency: 'weekly' as const,
    priority: 0.5,
  }));

  return [...staticPages, ...productPages, ...categoryPages, ...vendorPages];
}
