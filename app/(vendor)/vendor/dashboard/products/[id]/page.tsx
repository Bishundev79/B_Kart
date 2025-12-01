'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { ProductForm, ProductImageUpload, VariantManager } from '@/components/vendor';
import { createClient } from '@/lib/supabase/client';
import type { Product, ProductImage, ProductVariant } from '@/types/database';

interface EditProductPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditProductPage({ params }: EditProductPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProduct = async () => {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('products')
      .select(
        `
        *,
        images:product_images(*),
        variants:product_variants(*)
      `
      )
      .eq('id', id)
      .single();

    if (error || !data) {
      toast({
        title: 'Error',
        description: 'Failed to load product.',
        variant: 'destructive',
      });
      router.push('/vendor/dashboard/products');
      return;
    }

    setProduct(data);
    setImages(data.images || []);
    setVariants(data.variants || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchProduct();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleImagesChange = () => {
    fetchProduct();
  };

  const handleVariantsChange = () => {
    fetchProduct();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!product) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Product</h1>
          <p className="text-muted-foreground">{product.name}</p>
        </div>
      </div>

      <Tabs defaultValue="details" className="space-y-6">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="images">Images ({images.length})</TabsTrigger>
          <TabsTrigger value="variants">Variants ({variants.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Product Details</CardTitle>
            </CardHeader>
            <CardContent>
              <ProductForm
                product={product}
                onSuccess={() => {
                  fetchProduct();
                  toast({
                    title: 'Success',
                    description: 'Product updated successfully.',
                  });
                }}
                onCancel={() => router.back()}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="images">
          <Card>
            <CardHeader>
              <CardTitle>Product Images</CardTitle>
            </CardHeader>
            <CardContent>
              <ProductImageUpload
                productId={product.id}
                images={images}
                onImagesChange={handleImagesChange}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="variants">
          <VariantManager
            productId={product.id}
            variants={variants}
            onVariantsChange={handleVariantsChange}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
